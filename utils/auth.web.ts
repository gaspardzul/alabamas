import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithPopup,
  signOut as firebaseSignOut,
  type Auth,
  type User,
} from 'firebase/auth';
import { doc, onSnapshot, serverTimestamp, setDoc, type Firestore } from 'firebase/firestore';
import { isFirebaseConfigured } from '@/constants/firebaseConfig';
import { initFirebase, USE_EMULATORS } from '@/utils/firebase';
import { migrateLegacyLists } from '@/utils/lists/cloud';
import { SESSION_MODE_KEY, SessionMode, setSession } from '@/utils/session';
import { emitDataReloaded, onLocalChange, SyncedKey } from '@/utils/syncedStorage';
import { CloudData, CloudField, FIELDS_BY_KEY, clearLocal, mergeData, pick, readLocal, writeLocal } from '@/utils/cloudData';

/**
 * Sesión en web: invitado o Google (Firebase Auth) con sincronización en Firestore.
 *
 * Flujo de sincronización (documento users/{uid}):
 *  1. Primer snapshot del servidor → reconciliación:
 *     - sin documento en la nube: se sube lo local;
 *     - primer inicio de sesión en este dispositivo (venía de invitado): se fusiona (mergeData);
 *     - sesión ya existente: gana la nube, salvo cambios locales aún sin subir (PENDING_KEY).
 *  2. Snapshots posteriores de otros dispositivos → se escriben en AsyncStorage y se avisa a los hooks.
 *  3. Cambios locales (syncedSetItem) → se marcan pendientes y se suben con un pequeño retraso.
 */

const PENDING_KEY = 'syncPendingFields';

let auth: Auth | null = null;
let db: Firestore | null = null;

let stopSnapshot: (() => void) | null = null;
let stopLocal: (() => void) | null = null;
let uploadTimer: ReturnType<typeof setTimeout> | null = null;
let initialSyncDone = false;
let currentUid: string | null = null;

async function getPending(): Promise<CloudField[]> {
  try {
    return JSON.parse((await AsyncStorage.getItem(PENDING_KEY)) ?? '[]');
  } catch {
    return [];
  }
}

async function setPending(fields: CloudField[]) {
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify([...new Set(fields)]));
}

async function upload(fields: CloudField[]) {
  if (!db || !currentUid || fields.length === 0) return;
  const data = pick(await readLocal(), fields);
  if (Object.keys(data).length === 0) return;
  await setDoc(doc(db, 'users', currentUid), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

async function flushPending() {
  // 'lists' ya no se sincroniza en users/{uid} (vive en lists/{id}); ignorar pendientes antiguos.
  const fields: CloudField[] = (await getPending()).filter((f) => f !== 'lists');
  if (!initialSyncDone || fields.length === 0) return;
  try {
    await upload(fields);
    // Solo quitar lo que se subió (pudieron llegar cambios nuevos mientras tanto).
    const after = await getPending();
    await setPending(after.filter((f) => f !== 'lists' && !fields.includes(f)));
    setSession({ sync: 'synced' });
  } catch (error) {
    console.error('Error al sincronizar:', error);
    setSession({ sync: navigator.onLine ? 'error' : 'offline' });
  }
}

async function handleLocalChange(key: SyncedKey) {
  await setPending([...(await getPending()), ...FIELDS_BY_KEY[key]]);
  if (uploadTimer) clearTimeout(uploadTimer);
  uploadTimer = setTimeout(flushPending, 800);
}

function stopSync() {
  stopSnapshot?.();
  stopLocal?.();
  stopSnapshot = stopLocal = null;
  if (uploadTimer) clearTimeout(uploadTimer);
  initialSyncDone = false;
  currentUid = null;
}

function startSync(uid: string, mergeWithLocal: boolean) {
  if (!db) return;
  stopSync();
  currentUid = uid;
  setSession({ sync: 'syncing' });
  stopLocal = onLocalChange((key) => {
    handleLocalChange(key);
  });

  stopSnapshot = onSnapshot(
    doc(db, 'users', uid),
    { includeMetadataChanges: false },
    async (snapshot) => {
      // Ignorar ecos de nuestras propias escrituras y datos de caché antes de hablar con el servidor.
      if (snapshot.metadata.hasPendingWrites) return;
      if (!initialSyncDone && snapshot.metadata.fromCache) return;

      const cloud = (snapshot.data() ?? null) as CloudData | null;

      if (!initialSyncDone) {
        const local = await readLocal();
        const pending = await getPending();
        let result: CloudData;
        let toUpload: CloudField[];

        if (!cloud) {
          result = local;
          toUpload = ['settings', 'favorites', 'bible'];
        } else if (mergeWithLocal) {
          result = mergeData(local, cloud);
          toUpload = ['settings', 'favorites', 'bible'];
        } else {
          result = { ...cloud, ...pick(local, pending) };
          toUpload = pending;
        }

        await writeLocal(result);
        emitDataReloaded();
        initialSyncDone = true;
        await setPending(toUpload);
        await flushPending();
        setSession({ sync: 'synced' });

        // Las listas ahora viven en lists/{id} (para poder compartirlas). Migrar las que estaban
        // en users/{uid}.lists o, al venir de invitado, en el dispositivo.
        const legacy = cloud && !mergeWithLocal ? cloud.lists ?? [] : result.lists ?? [];
        migrateLegacyLists(uid, legacy, Array.isArray(cloud?.lists)).catch((error) =>
          console.error('Error al migrar las listas:', error)
        );
        return;
      }

      // Un dispositivo con una versión anterior de la app volvió a escribir listas en users/{uid}.
      if (cloud?.lists?.length) {
        migrateLegacyLists(uid, cloud.lists, true).catch((error) => console.error('Error al migrar las listas:', error));
      }

      // Cambios que vienen de otro dispositivo.
      if (cloud) {
        const pending = await getPending();
        const incoming = { ...cloud };
        for (const f of pending) delete incoming[f]; // no pisar cambios locales sin subir
        await writeLocal(incoming);
        emitDataReloaded();
      }
    },
    (error) => {
      console.error('Error en la sincronización:', error);
      setSession({ sync: error.code === 'unavailable' ? 'offline' : 'error' });
    }
  );
}

const toSessionUser = (user: User) => ({
  uid: user.uid,
  name: user.displayName,
  email: user.email,
  photoURL: user.photoURL,
});

export async function initAuth() {
  const storedMode = (await AsyncStorage.getItem(SESSION_MODE_KEY)) as SessionMode | null;

  if (!isFirebaseConfigured) {
    // Sin configuración de Firebase: solo invitado, sin pantalla de bienvenida.
    setSession({ ready: true, mode: 'guest', googleAvailable: false });
    return;
  }

  const firebase = initFirebase()!;
  auth = firebase.auth;
  db = firebase.db;

  // Pruebas con emuladores: iniciar sesión como un usuario de Google ficticio desde la consola.
  if (USE_EMULATORS && typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>).__alabaTestSignIn = (uid: string, name: string) =>
      signInWithCredential(
        firebase.auth,
        GoogleAuthProvider.credential(JSON.stringify({ sub: uid, email: `${uid}@prueba.dev`, name, email_verified: true }))
      );
  }
  setSession({ googleAvailable: true });

  onAuthStateChanged(auth, async (user) => {
    const mode = (await AsyncStorage.getItem(SESSION_MODE_KEY)) as SessionMode | null;
    if (user) {
      // Si este dispositivo no venía de una sesión de Google, es un inicio nuevo: fusionar.
      const isNewLogin = mode !== 'google';
      await AsyncStorage.setItem(SESSION_MODE_KEY, 'google');
      setSession({ ready: true, mode: 'google', user: toSessionUser(user) });
      startSync(user.uid, isNewLogin);
    } else {
      stopSync();
      // La sesión de Google expiró o se cerró en otro lado → volver a la bienvenida.
      if (mode === 'google') await AsyncStorage.removeItem(SESSION_MODE_KEY);
      setSession({
        ready: true,
        mode: mode === 'guest' ? 'guest' : null,
        user: null,
        sync: 'idle',
      });
    }
  });

  if (storedMode === 'guest') setSession({ mode: 'guest' });
}

export async function signInWithGoogle(): Promise<void> {
  if (!auth) throw new Error('El inicio de sesión no está configurado.');
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return;
    if (code === 'auth/popup-blocked') {
      throw new Error('El navegador bloqueó la ventana de Google. Permite ventanas emergentes para alabamas.org e inténtalo de nuevo.');
    }
    if (code === 'auth/network-request-failed') {
      throw new Error('No hay conexión a internet. Inténtalo de nuevo cuando estés en línea.');
    }
    throw new Error('No se pudo iniciar sesión con Google. Inténtalo de nuevo.');
  }
}

export async function continueAsGuest() {
  await AsyncStorage.setItem(SESSION_MODE_KEY, 'guest');
  setSession({ mode: 'guest' });
}

/**
 * Cierra la sesión y borra del dispositivo los datos de la cuenta (siguen en la nube).
 * Así nadie más ve los favoritos y listas en un dispositivo compartido.
 */
export async function signOut() {
  await flushPending();
  stopSync();
  if (auth) await firebaseSignOut(auth);
  await AsyncStorage.multiRemove([SESSION_MODE_KEY, PENDING_KEY]);
  await clearLocal();
  emitDataReloaded();
  setSession({ mode: null, user: null, sync: 'idle' });
}
