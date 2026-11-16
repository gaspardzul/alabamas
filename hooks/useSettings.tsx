import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onDataReloaded, syncedRemoveItem, syncedSetItem } from '@/utils/syncedStorage';
import { Lista } from '../ts/interfaces';
import type { ThemePreference } from '@/utils/themePreference';

interface Settings {
  fontSize: number;
  order: 'asc' | 'desc' | 'numAsc' | 'numDesc';
  userLists: Lista[];
  theme?: ThemePreference; // lo administra utils/themePreference.ts
}

export const FONT_SIZE_MIN = 12;
export const FONT_SIZE_MAX = 48;
export const FONT_SIZE_DEFAULT = 20;


const initialSettings: Settings = {
  fontSize: FONT_SIZE_DEFAULT, // Tamaño de fuente predeterminado
  order: 'numAsc', // Orden predeterminado
  userLists: [],  // Valor inicial para las listas
};

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>(initialSettings);

  // Función para obtener las configuraciones
  const getSettings = async () => {
    try {
      const storedSettings = await AsyncStorage.getItem('userSettings');
      if (storedSettings !== null) {
        setSettings(JSON.parse(storedSettings));
      }
    } catch (error) {
      console.error('Error al obtener las configuraciones:', error);
    }
  };

  // Función para guardar las configuraciones
  const saveSettings = async (newSettings: Settings) => {
    try {
      await syncedSetItem('userSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error al guardar las configuraciones:', error);
    }
  };

  // Función para eliminar las configuraciones
  const clearSettings = async () => {
    try {
      await syncedRemoveItem('userSettings');
      setSettings(initialSettings);
    } catch (error) {
      console.error('Error al eliminar las configuraciones:', error);
    }
  };

   // Función para obtener un valor específico de los settings
   const getSettingValue = async <K extends keyof Settings>(key: K): Promise<Settings[K]> => {
    try {
      const storedSettings = await AsyncStorage.getItem('userSettings');
      if (storedSettings !== null) {
        const parsedSettings: Settings = JSON.parse(storedSettings);
        return parsedSettings[key];
      }
      return initialSettings[key];
    } catch (error) {
      console.error('Error al obtener el valor de la configuración:', error);
      return initialSettings[key];
    }
  };

  // Función para actualizar un valor específico de los settings
  // Combina con lo guardado (no con el estado de este hook): varias pantallas usan useSettings
  // y su copia en memoria puede estar desactualizada (p. ej. no conocer el tema recién elegido).
  const updateSettingValue = async <K extends keyof Settings>(key: K, value: Settings[K]) => {
    let current: Partial<Settings> = {};
    try {
      const stored = await AsyncStorage.getItem('userSettings');
      if (stored) current = JSON.parse(stored);
    } catch {}
    await saveSettings({ ...initialSettings, ...current, [key]: value });
  };

  useEffect(() => {
    getSettings();
    return onDataReloaded(() => { getSettings(); });
  }, []);

  return { settings, saveSettings, clearSettings, getSettingValue, updateSettingValue };
};
