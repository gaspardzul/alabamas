import AsyncStorage from '@react-native-async-storage/async-storage';
import { onDataReloaded, syncedSetItem, SYNCED_KEYS } from '@/utils/syncedStorage';
import type { HymnList, ListsBackend } from './types';

/**
 * Listas en el dispositivo (modo invitado y app nativa): userSettings.userLists,
 * con el formato histórico { id: number, name, himnos, createdAt, updatedAt }.
 */
interface StoredList {
  id: number | string;
  name: string;
  himnos: string[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

async function readSettings(): Promise<Record<string, unknown>> {
  try {
    const raw = await AsyncStorage.getItem(SYNCED_KEYS.settings);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function readStoredLists(): Promise<StoredList[]> {
  return ((await readSettings()).userLists as StoredList[] | undefined) ?? [];
}

async function writeStoredLists(lists: StoredList[]) {
  const settings = await readSettings();
  await syncedSetItem(SYNCED_KEYS.settings, JSON.stringify({ ...settings, userLists: lists }));
  emit();
}

const iso = (value: string | Date | undefined) => (value ? new Date(value).toISOString() : new Date().toISOString());

const toHymnList = (list: StoredList): HymnList => ({
  id: String(list.id),
  name: list.name,
  himnos: list.himnos ?? [],
  createdAt: iso(list.createdAt),
  updatedAt: iso(list.updatedAt),
  role: 'owner',
  ownerId: null,
  members: {},
  memberInfo: {},
});

async function update(id: string, change: (list: StoredList) => StoredList | null) {
  const lists = await readStoredLists();
  const next = lists
    .map((list) => (String(list.id) === id ? change(list) : list))
    .filter((list): list is StoredList => list !== null);
  await writeStoredLists(next);
}

export const localBackend: ListsBackend = {
  subscribe(callback) {
    const load = async () => callback((await readStoredLists()).map(toHymnList));
    load();
    listeners.add(load);
    const stopReload = onDataReloaded(load);
    return () => {
      listeners.delete(load);
      stopReload();
    };
  },
  async create(name, himnos) {
    const now = new Date().toISOString();
    const id = Date.now();
    await writeStoredLists([...(await readStoredLists()), { id, name: name.trim(), himnos, createdAt: now, updatedAt: now }]);
    return String(id);
  },
  rename: (id, name) => update(id, (list) => ({ ...list, name: name.trim(), updatedAt: new Date().toISOString() })),
  remove: (id) => update(id, () => null),
  setHymns: (id, himnos) => update(id, (list) => ({ ...list, himnos, updatedAt: new Date().toISOString() })),
  async share() {
    throw new Error('Para compartir listas necesitas iniciar sesión con Google.');
  },
  async leave() {
    // Las listas locales siempre son propias.
  },
};
