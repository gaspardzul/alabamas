import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onDataReloaded, syncedSetItem, SYNCED_KEYS } from '@/utils/syncedStorage';

/**
 * Preferencia de tema elegida en Perfil: seguir al sistema, claro u oscuro.
 * Se guarda dentro de userSettings (campo `theme`), así se sincroniza con la cuenta.
 * El tema efectivo lo calcula hooks/useColorScheme.ts; todo color debe salir de ahí.
 */
export type ThemePreference = 'system' | 'light' | 'dark';

let preference: ThemePreference = 'system';
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

async function load() {
  try {
    const raw = await AsyncStorage.getItem(SYNCED_KEYS.settings);
    const theme = raw ? JSON.parse(raw).theme : undefined;
    const next: ThemePreference = theme === 'light' || theme === 'dark' ? theme : 'system';
    if (next !== preference) {
      preference = next;
      emit();
    }
  } catch {}
}

load();
onDataReloaded(() => {
  load();
});

export async function setThemePreference(next: ThemePreference) {
  preference = next;
  emit();
  try {
    const raw = await AsyncStorage.getItem(SYNCED_KEYS.settings);
    const current = raw ? JSON.parse(raw) : {};
    await syncedSetItem(SYNCED_KEYS.settings, JSON.stringify({ ...current, theme: next }));
  } catch (error) {
    console.error('Error al guardar el tema:', error);
  }
}

export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    () => preference
  );
}
