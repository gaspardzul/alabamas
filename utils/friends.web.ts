import { useEffect, useState } from 'react';
import Constants from 'expo-constants';
import { collection, deleteDoc, doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { getFirebase } from '@/utils/firebase';
import { getSession, useSession } from '@/utils/session';

/**
 * Amigos por enlace de invitación (web, con cuenta de Google).
 *  - invites/{code}: { uid, name, photoURL } — se lee solo conociendo el código.
 *  - users/{uid}.inviteCode: mi código vigente.
 *  - users/{uid}/friends/{friendUid}: { name, photoURL, since, via }.
 * Al aceptar, el invitado escribe ambas fichas (la regla verifica el código). Ver firestore.rules.
 */
export interface Friend {
  uid: string;
  name: string | null;
  photoURL: string | null;
  since: string;
}

export interface Invite {
  code: string;
  uid: string;
  name: string | null;
  photoURL: string | null;
}

export const friendsAvailable = true;

const db = () => {
  const firebase = getFirebase();
  if (!firebase) throw new Error('Necesitas iniciar sesión con Google.');
  return firebase.db;
};

const me = () => {
  const user = getSession().user;
  if (!user) throw new Error('Necesitas iniciar sesión con Google.');
  return user;
};

export function useFriends() {
  const session = useSession();
  const [friends, setFriends] = useState<Friend[] | null>(null);

  useEffect(() => {
    const uid = session.user?.uid;
    if (session.mode !== 'google' || !uid || !getFirebase()) {
      setFriends([]);
      return;
    }
    return onSnapshot(
      collection(db(), 'users', uid, 'friends'),
      (snapshot) =>
        setFriends(
          snapshot.docs
            .map((d) => ({ uid: d.id, name: d.data().name ?? null, photoURL: d.data().photoURL ?? null, since: d.data().since ?? '' }))
            .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
        ),
      (error) => {
        console.error('Error al cargar amigos:', error);
        setFriends([]);
      }
    );
  }, [session.mode, session.user?.uid]);

  return { friends: friends ?? [], loading: friends === null };
}

const randomCode = () => {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
};

export const inviteUrl = (code: string) => {
  const base = (Constants.expoConfig?.experiments?.baseUrl ?? '').replace(/\/$/, '');
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://alabamas.org';
  return `${origin}${base}/invitar/${code}`;
};

async function createInvite(): Promise<string> {
  const user = me();
  const code = randomCode();
  await setDoc(doc(db(), 'invites', code), {
    uid: user.uid,
    name: user.name,
    photoURL: user.photoURL,
    createdAt: new Date().toISOString(),
  });
  await setDoc(doc(db(), 'users', user.uid), { inviteCode: code }, { merge: true });
  return code;
}

/** Mi enlace de invitación (lo crea la primera vez). */
export async function getInviteLink(): Promise<string> {
  const user = me();
  const code = (await getDoc(doc(db(), 'users', user.uid))).data()?.inviteCode as string | undefined;
  if (code && (await getDoc(doc(db(), 'invites', code))).exists()) return inviteUrl(code);
  return inviteUrl(await createInvite());
}

/** Invalida el enlace actual y crea uno nuevo (las amistades existentes se conservan). */
export async function resetInviteLink(): Promise<string> {
  const user = me();
  const code = (await getDoc(doc(db(), 'users', user.uid))).data()?.inviteCode as string | undefined;
  if (code) await deleteDoc(doc(db(), 'invites', code)).catch(() => {});
  return inviteUrl(await createInvite());
}

export async function getInvite(code: string): Promise<Invite | null> {
  const snapshot = await getDoc(doc(db(), 'invites', code));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return { code, uid: data.uid, name: data.name ?? null, photoURL: data.photoURL ?? null };
}

export async function acceptInvite(code: string): Promise<Invite> {
  const user = me();
  const invite = await getInvite(code);
  if (!invite) throw new Error('Esta invitación no existe o ya fue cambiada por quien te la envió.');
  if (invite.uid === user.uid) throw new Error('Este es tu propio enlace de invitación.');
  const since = new Date().toISOString();
  // Mi ficha en su lista de amigos (permitido por la regla gracias al código) y la suya en la mía.
  await setDoc(doc(db(), 'users', invite.uid, 'friends', user.uid), {
    name: user.name,
    photoURL: user.photoURL,
    since,
    via: code,
  });
  await setDoc(doc(db(), 'users', user.uid, 'friends', invite.uid), {
    name: invite.name,
    photoURL: invite.photoURL,
    since,
    via: code,
  });
  return invite;
}

export async function removeFriend(friendUid: string) {
  const user = me();
  await Promise.all([
    deleteDoc(doc(db(), 'users', user.uid, 'friends', friendUid)),
    deleteDoc(doc(db(), 'users', friendUid, 'friends', user.uid)),
  ]);
}
