import {
  collection,
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  deleteDoc,
  type DocumentData,
} from 'firebase/firestore';
import { getFirebase } from '@/utils/firebase';
import { getSession } from '@/utils/session';
import type { HymnList, ListRole, ListsBackend, MemberInfo } from './types';

/**
 * Listas en Firestore (lists/{id}) para usuarios con cuenta de Google, propias y compartidas.
 * Las escrituras no se esperan (latencia compensada + caché persistente): la UI se actualiza al
 * instante desde onSnapshot y Firestore las envía cuando hay conexión. Reglas: firestore.rules.
 */

const report = (error: unknown) => console.error('Error al guardar la lista:', error);

const me = () => {
  const user = getSession().user;
  if (!user) throw new Error('Necesitas iniciar sesión.');
  return user;
};

const myInfo = (): MemberInfo => {
  const user = me();
  return { name: user.name, photoURL: user.photoURL };
};

/** Último estado conocido de cada lista (para calcular memberIds al compartir o salir). */
const cache = new Map<string, HymnList>();

function fromDoc(id: string, data: DocumentData, uid: string): HymnList {
  const members = (data.members ?? {}) as Record<string, ListRole>;
  return {
    id,
    name: data.name ?? 'Lista',
    himnos: data.himnos ?? [],
    createdAt: data.createdAt ?? new Date(0).toISOString(),
    updatedAt: data.updatedAt ?? data.createdAt ?? new Date(0).toISOString(),
    role: members[uid] ?? 'viewer',
    ownerId: data.ownerId ?? null,
    members,
    memberInfo: data.memberInfo ?? {},
  };
}

let backend: ListsBackend | null = null;

export function createCloudBackend(): ListsBackend | null {
  const firebase = getFirebase();
  if (!firebase) return null;
  if (backend) return backend;
  const { db } = firebase;
  const listRef = (id: string) => doc(db, 'lists', id);

  backend = {
    subscribe(callback) {
      const uid = me().uid;
      return onSnapshot(
        query(collection(db, 'lists'), where('memberIds', 'array-contains', uid)),
        (snapshot) => {
          const lists = snapshot.docs
            .map((d) => fromDoc(d.id, d.data(), uid))
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
          cache.clear();
          lists.forEach((l) => cache.set(l.id, l));
          callback(lists);
        },
        (error) => console.error('Error al cargar las listas:', error)
      );
    },

    async create(name, himnos) {
      const user = me();
      const ref = doc(collection(db, 'lists'));
      const now = new Date().toISOString();
      setDoc(ref, {
        ownerId: user.uid,
        name: name.trim(),
        himnos,
        createdAt: now,
        updatedAt: now,
        members: { [user.uid]: 'owner' },
        memberIds: [user.uid],
        memberInfo: { [user.uid]: myInfo() },
      }).catch(report);
      return ref.id;
    },

    async rename(id, name) {
      updateDoc(listRef(id), { name: name.trim(), updatedAt: new Date().toISOString() }).catch(report);
    },

    async remove(id) {
      deleteDoc(listRef(id)).catch(report);
    },

    async setHymns(id, himnos) {
      updateDoc(listRef(id), { himnos, updatedAt: new Date().toISOString() }).catch(report);
    },

    async share(id, changes, info) {
      const current = cache.get(id);
      if (!current) throw new Error('Lista no encontrada.');
      const members = { ...current.members };
      const update: Record<string, unknown> = { updatedAt: new Date().toISOString() };
      for (const [uid, role] of Object.entries(changes)) {
        if (role === null) {
          delete members[uid];
          update[`members.${uid}`] = deleteField();
          update[`memberInfo.${uid}`] = deleteField();
        } else {
          members[uid] = role;
          update[`members.${uid}`] = role;
          update[`memberInfo.${uid}`] = info[uid] ?? { name: null, photoURL: null };
        }
      }
      update.memberIds = Object.keys(members);
      updateDoc(listRef(id), update).catch(report);
    },

    async leave(id) {
      const uid = me().uid;
      const current = cache.get(id);
      if (!current) return;
      updateDoc(listRef(id), {
        [`members.${uid}`]: deleteField(),
        [`memberInfo.${uid}`]: deleteField(),
        memberIds: Object.keys(current.members).filter((m) => m !== uid),
      }).catch(report);
    },
  };
  return backend;
}

interface LegacyList {
  id: number | string;
  name: string;
  himnos?: string[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

/**
 * Migración única: las listas que vivían dentro de users/{uid} (o en el dispositivo al venir de
 * invitado) pasan a lists/{uid}_{idAnterior}. El id es determinista para no duplicar si se repite.
 */
export async function migrateLegacyLists(uid: string, legacy: LegacyList[], hadCloudField: boolean) {
  const firebase = getFirebase();
  if (!firebase) return;
  const { db } = firebase;
  const user = me();
  for (const list of legacy) {
    const ref = doc(db, 'lists', `${uid}_${list.id}`);
    try {
      if ((await getDoc(ref)).exists()) continue;
    } catch {
      // Sin acceso al documento = no existe aún (las reglas niegan leer listas inexistentes ajenas).
    }
    const iso = (v?: string | Date) => (v ? new Date(v).toISOString() : new Date().toISOString());
    await setDoc(ref, {
      ownerId: uid,
      name: list.name,
      himnos: list.himnos ?? [],
      createdAt: iso(list.createdAt),
      updatedAt: iso(list.updatedAt),
      members: { [uid]: 'owner' },
      memberIds: [uid],
      memberInfo: { [uid]: { name: user.name, photoURL: user.photoURL } },
    });
  }
  if (hadCloudField || legacy.length > 0) {
    await updateDoc(doc(db, 'users', uid), { lists: deleteField(), listsMigrated: true });
  }
}
