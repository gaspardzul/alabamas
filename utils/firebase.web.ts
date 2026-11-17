import { initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth';
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';
import { firebaseConfig, isFirebaseConfigured } from '@/constants/firebaseConfig';

/**
 * Instancias de Firebase (solo web por ahora). La versión nativa (firebase.ts) devuelve null.
 * Firestore usa caché persistente en IndexedDB: listas compartidas y cambios pendientes
 * sobreviven a recargar la página sin conexión.
 */
/**
 * Solo para pruebas locales: EXPO_PUBLIC_FIREBASE_EMULATORS=1 usa los emuladores de Auth y
 * Firestore (npm run emulators) con un proyecto de prueba. Nunca se define en producción.
 */
export const USE_EMULATORS = process.env.EXPO_PUBLIC_FIREBASE_EMULATORS === '1';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export function initFirebase() {
  if (!isFirebaseConfigured) return null;
  if (!app) {
    app = initializeApp(USE_EMULATORS ? { ...firebaseConfig, projectId: 'demo-alabamas' } : firebaseConfig);
    auth = getAuth(app);
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      });
    } catch {
      // Navegadores sin IndexedDB (p. ej. modo privado estricto): caché en memoria.
      db = initializeFirestore(app, {});
    }
    if (USE_EMULATORS) {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
    }
  }
  return { app, auth: auth!, db: db! };
}

export function getFirebase() {
  return app ? { app, auth: auth!, db: db! } : null;
}
