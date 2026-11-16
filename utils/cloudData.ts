import AsyncStorage from '@react-native-async-storage/async-storage';
import { SYNCED_KEYS, SyncedKey } from '@/utils/syncedStorage';
import { sameHymn } from '@/utils/hymnNumber';
import { FONT_SIZE_DEFAULT } from '@/hooks/useSettings';

/**
 * Forma de los datos del usuario en Firestore (documento users/{uid}) y su traducción
 * desde/hacia las claves de AsyncStorage. Sin dependencias de Firebase para poder probarla.
 */
export interface CloudData {
  settings?: { fontSize?: number; order?: string; theme?: string };
  lists?: CloudList[];
  favorites?: CloudFavorite[];
  bible?: { translationId?: string; lastRead?: unknown };
}

interface CloudList {
  id: number;
  name: string;
  himnos: string[];
  createdAt: string;
  updatedAt: string;
}

interface CloudFavorite {
  number: number | string;
  title: string;
  group?: unknown;
}

export type CloudField = keyof CloudData;

/** Qué campos de la nube corresponden a cada clave local. */
export const FIELDS_BY_KEY: Record<SyncedKey, CloudField[]> = {
  [SYNCED_KEYS.settings]: ['settings', 'lists'],
  [SYNCED_KEYS.favorites]: ['favorites'],
  [SYNCED_KEYS.bible]: ['bible'],
};

const parse = async <T>(key: string): Promise<T | null> => {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

/** Quita `undefined` y convierte fechas a texto (Firestore no acepta undefined). */
const clean = <T>(value: T): T => JSON.parse(JSON.stringify(value));

export async function readLocal(): Promise<CloudData> {
  const settings = await parse<{ fontSize?: number; order?: string; theme?: string; userLists?: CloudList[] }>(SYNCED_KEYS.settings);
  const favorites = await parse<CloudFavorite[]>(SYNCED_KEYS.favorites);
  const bible = await parse<CloudData['bible']>(SYNCED_KEYS.bible);
  const data: CloudData = {};
  if (settings) {
    data.settings = { fontSize: settings.fontSize, order: settings.order, theme: settings.theme };
    data.lists = settings.userLists ?? [];
  }
  if (favorites) data.favorites = favorites;
  if (bible) data.bible = bible;
  return clean(data);
}

/** Escribe en AsyncStorage los campos presentes (sin disparar subida a la nube). */
export async function writeLocal(data: CloudData) {
  if (data.settings || data.lists) {
    const current = (await parse<Record<string, unknown>>(SYNCED_KEYS.settings)) ?? {};
    const next = {
      fontSize: FONT_SIZE_DEFAULT,
      order: 'numAsc',
      userLists: [],
      ...current,
      ...(data.settings ?? {}),
      ...(data.lists ? { userLists: data.lists } : {}),
    };
    await AsyncStorage.setItem(SYNCED_KEYS.settings, JSON.stringify(next));
  }
  if (data.favorites) await AsyncStorage.setItem(SYNCED_KEYS.favorites, JSON.stringify(data.favorites));
  if (data.bible) {
    const current = (await parse<Record<string, unknown>>(SYNCED_KEYS.bible)) ?? {};
    await AsyncStorage.setItem(SYNCED_KEYS.bible, JSON.stringify({ ...current, ...data.bible }));
  }
}

export function pick(data: CloudData, fields: CloudField[]): CloudData {
  const out: CloudData = {};
  for (const f of fields) if (data[f] !== undefined) (out as Record<string, unknown>)[f] = data[f];
  return clean(out);
}

const time = (value?: string) => (value ? new Date(value).getTime() || 0 : 0);

/**
 * Fusión al pasar de invitado a cuenta de Google (primera vez en este dispositivo):
 * favoritos y listas se combinan sin duplicados; ajustes y Biblia: gana la cuenta si ya tiene.
 */
export function mergeData(local: CloudData, cloud: CloudData): CloudData {
  const favorites = [...(cloud.favorites ?? [])];
  for (const fav of local.favorites ?? []) {
    if (!favorites.some((f) => sameHymn(f.number, fav.number))) favorites.push(fav);
  }

  const lists = [...(cloud.lists ?? [])];
  for (const list of local.lists ?? []) {
    const i = lists.findIndex((l) => l.id === list.id);
    if (i === -1) lists.push(list);
    else if (time(list.updatedAt) > time(lists[i].updatedAt)) lists[i] = list;
  }

  return clean({
    settings: { ...(local.settings ?? {}), ...(cloud.settings ?? {}) },
    lists,
    favorites,
    bible: { ...(local.bible ?? {}), ...(cloud.bible ?? {}) },
  });
}

export async function clearLocal() {
  await AsyncStorage.multiRemove(Object.values(SYNCED_KEYS));
}
