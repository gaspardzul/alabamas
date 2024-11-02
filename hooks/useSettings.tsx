import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Lista } from '../ts/interfaces';

interface Settings {
  fontSize: number;
  order: 'asc' | 'desc' | 'numAsc' | 'numDesc';
  userLists: Lista[];
  // Puedes agregar más configuraciones aquí en el futuro
}


const initialSettings: Settings = {
  fontSize: 16, // Tamaño de fuente predeterminado
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
      await AsyncStorage.setItem('userSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error al guardar las configuraciones:', error);
    }
  };

  // Función para eliminar las configuraciones
  const clearSettings = async () => {
    try {
      await AsyncStorage.removeItem('userSettings');
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
  const updateSettingValue = async <K extends keyof Settings>(key: K, value: Settings[K]) => {
    const newSettings = { ...settings, [key]: value };
    await saveSettings(newSettings);
  };

  useEffect(() => {
    getSettings();
  }, []);

  return { settings, saveSettings, clearSettings, getSettingValue, updateSettingValue };
};
