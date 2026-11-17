import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleAuthProvider, reauthenticateWithCredential, reauthenticateWithPopup } from 'firebase/auth';
import { collection, deleteDoc, deleteField, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { getFirebase, USE_EMULATORS } from '@/utils/firebase';
import { SESSION_MODE_KEY, setSession } from '@/utils/session';
import { clearLocal } from '@/utils/cloudData';
import { emitDataReloaded } from '@/utils/syncedStorage';
import { stopAccountSync } from '@/utils/auth';

/**
 * Eliminar la cuenta (Perfil → Eliminar mi cuenta). Orden:
 *  1. Confirmar identidad con Google (Firebase exige un inicio de sesión reciente).
 *  2. Listas propias: se borran. Listas de otros: salgo de ellas.
 *  3. Amistades: se borran en ambos lados. Enlace de invitación: se borra.
 *  4. users/{uid} y, al final, la cuenta de Firebase Auth.
 *  5. Se limpian los datos del dispositivo y se vuelve a la bienvenida.
 * Debe coincidir con lo que promete la política de privacidad (constants/privacyPolicy.json).
 */
export const accountDeletionAvailable = true;

export async function deleteAccount(): Promise<void> {
  const firebase = getFirebase();
  const user = firebase?.auth.currentUser;
  if (!firebase || !user) throw new Error('Necesitas iniciar sesión para eliminar tu cuenta.');
  const { db, auth } = firebase;
  const uid = user.uid;

  // 1) Reautenticación (en pruebas con emuladores, con una credencial ficticia).
  try {
    if (USE_EMULATORS) {
      const sub = user.providerData.find((p) => p.providerId === 'google.com')?.uid ?? uid;
      await reauthenticateWithCredential(
        user,
        GoogleAuthProvider.credential(JSON.stringify({ sub, email: user.email, name: user.displayName, email_verified: true }))
      );
    } else {
      await reauthenticateWithPopup(user, new GoogleAuthProvider());
    }
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      throw new Error('Se canceló la confirmación. Tu cuenta no se eliminó.');
    }
    throw new Error('No se pudo confirmar tu identidad. Tu cuenta no se eliminó.');
  }

  // 2) Listas.
  const lists = await getDocs(query(collection(db, 'lists'), where('memberIds', 'array-contains', uid)));
  for (const list of lists.docs) {
    const data = list.data();
    if (data.ownerId === uid) {
      await deleteDoc(list.ref);
    } else {
      await updateDoc(list.ref, {
        [`members.${uid}`]: deleteField(),
        [`memberInfo.${uid}`]: deleteField(),
        memberIds: (data.memberIds as string[]).filter((m) => m !== uid),
      });
    }
  }

  // 3) Amistades (ambos lados) e invitación.
  const friends = await getDocs(collection(db, 'users', uid, 'friends'));
  for (const friend of friends.docs) {
    await deleteDoc(doc(db, 'users', friend.id, 'friends', uid)).catch(() => {});
    await deleteDoc(friend.ref);
  }
  const userRef = doc(db, 'users', uid);
  const inviteCode = (await getDoc(userRef)).data()?.inviteCode as string | undefined;
  if (inviteCode) await deleteDoc(doc(db, 'invites', inviteCode)).catch(() => {});

  // 4) Datos privados y cuenta.
  stopAccountSync();
  await deleteDoc(userRef);
  await user.delete();
  await auth.signOut().catch(() => {});

  // 5) Dispositivo.
  await AsyncStorage.multiRemove([SESSION_MODE_KEY, 'syncPendingFields']);
  await clearLocal();
  emitDataReloaded();
  setSession({ mode: null, user: null, sync: 'idle' });
}
