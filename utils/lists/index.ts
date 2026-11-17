import { useEffect, useMemo, useState } from 'react';
import { getSession, useSession } from '@/utils/session';
import { createCloudBackend } from './cloud';
import { localBackend } from './local';
import type { HymnList, ListRole, ListsBackend, MemberInfo } from './types';

export * from './types';

/**
 * Punto único de acceso a las listas para las pantallas.
 * Con sesión de Google (web): Firestore, con listas compartidas. Si no: el dispositivo.
 */
function currentBackend(): ListsBackend {
  return (getSession().mode === 'google' && getSession().user && createCloudBackend()) || localBackend;
}

/** ¿Se pueden compartir listas en esta sesión? */
export function useCanShare() {
  const session = useSession();
  return session.mode === 'google' && !!session.user && session.googleAvailable;
}

export function useLists() {
  const session = useSession();
  const [lists, setLists] = useState<HymnList[] | null>(null);

  useEffect(() => {
    setLists(null);
    return currentBackend().subscribe(setLists);
  }, [session.mode, session.user?.uid]);

  return { lists: lists ?? [], loading: lists === null };
}

export function useList(id: string | undefined) {
  const { lists, loading } = useLists();
  const list = useMemo(() => lists.find((l) => l.id === id) ?? null, [lists, id]);
  return { list, loading };
}

/** Lee las listas una vez (para acciones fuera de un componente). */
function getListsOnce(): Promise<HymnList[]> {
  return new Promise((resolve) => {
    let stop: (() => void) | null = null;
    let done = false;
    stop = currentBackend().subscribe((lists) => {
      if (done) return;
      done = true;
      resolve(lists);
      setTimeout(() => stop?.(), 0);
    });
  });
}

export const listsApi = {
  create: (name: string, himnos: string[] = []) => currentBackend().create(name, himnos),
  rename: (id: string, name: string) => currentBackend().rename(id, name),
  remove: (id: string) => currentBackend().remove(id),
  setHymns: (id: string, himnos: string[]) => currentBackend().setHymns(id, himnos),
  share: (id: string, members: Record<string, Exclude<ListRole, 'owner'> | null>, info: Record<string, MemberInfo>) =>
    currentBackend().share(id, members, info),
  leave: (id: string) => currentBackend().leave(id),

  /** Agrega un himno al final. Devuelve false si ya estaba o si no tengo permiso de edición. */
  async addHymn(id: string, number: string | number): Promise<boolean> {
    const list = (await getListsOnce()).find((l) => l.id === id);
    const key = String(number);
    if (!list || list.role === 'viewer' || list.himnos.includes(key)) return false;
    await currentBackend().setHymns(id, [...list.himnos, key]);
    return true;
  },

  async removeHymn(id: string, number: string | number) {
    const list = (await getListsOnce()).find((l) => l.id === id);
    if (!list || list.role === 'viewer') return;
    await currentBackend().setHymns(id, list.himnos.filter((h) => h !== String(number)));
  },
};
