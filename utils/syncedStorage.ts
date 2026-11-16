import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Datos del usuario que se sincronizan con la nube cuando hay sesión de Google.
 * La app SIEMPRE lee y escribe en AsyncStorage (funciona sin conexión y en modo invitado);
 * la sincronización (utils/auth.web.ts) escucha estos cambios y los sube a Firestore.
 *
 * Regla: para estas claves usa syncedSetItem / syncedRemoveItem, nunca AsyncStorage directo.
 */
export const SYNCED_KEYS = {
  settings: 'userSettings', // { fontSize, order, userLists }
  favorites: 'favoritos', // Himno[]
  bible: 'bibleState', // { translationId, lastRead }
} as const;

export type SyncedKey = (typeof SYNCED_KEYS)[keyof typeof SYNCED_KEYS];

const localChangeListeners = new Set<(key: SyncedKey) => void>();
const reloadListeners = new Set<() => void>();

export async function syncedSetItem(key: SyncedKey, value: string) {
  await AsyncStorage.setItem(key, value);
  localChangeListeners.forEach((l) => l(key));
}

export async function syncedRemoveItem(key: SyncedKey) {
  await AsyncStorage.removeItem(key);
  localChangeListeners.forEach((l) => l(key));
}

/** La sincronización se suscribe aquí para subir cambios locales. */
export function onLocalChange(listener: (key: SyncedKey) => void) {
  localChangeListeners.add(listener);
  return () => {
    localChangeListeners.delete(listener);
  };
}

/** Avisar a los hooks que los datos cambiaron desde fuera (otro dispositivo, inicio o cierre de sesión). */
export function emitDataReloaded() {
  reloadListeners.forEach((l) => l());
}

export function onDataReloaded(listener: () => void) {
  reloadListeners.add(listener);
  return () => {
    reloadListeners.delete(listener);
  };
}
