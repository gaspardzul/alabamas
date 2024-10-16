import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Himno } from '@/ts/interfaces';

const STORAGE_KEY = 'visitedItems';
const MAX_ITEMS = 20;

/**
 * Hook personalizado para gestionar las últimas vistas de himnos.
 * @returns Un objeto con las últimas vistas, y funciones para añadir y limpiar vistas.
 */
export const useVisitedItems = () => {
  const [visitedItems, setVisitedItems] = useState<Himno[]>([]);

  /**
   * Carga los elementos visitados desde el almacenamiento asíncrono.
   */
  const loadVisitedItems = useCallback(async () => {
    try {
      const storedItems = await AsyncStorage.getItem(STORAGE_KEY);
      console.log('Elementos almacenados:', storedItems);
      if (storedItems) {
        setVisitedItems(JSON.parse(storedItems));
      }
    } catch (error) {
      console.error('Error al cargar los elementos visitados:', error);
    }
  }, []);

  useEffect(() => {
    // Cargar los elementos visitados al montar el componente
    loadVisitedItems();
  }, [loadVisitedItems]);

  /**
   * Añade un elemento a los elementos visitados.
   * @param newItem - El elemento a añadir a los elementos visitados.
   */
  const addVisitedItem = async (newItem: Himno) => {
    try {
      await loadVisitedItems();
      console.log('Estado actual:', visitedItems);
      console.log('Nuevo elemento:', newItem);

      const updatedItems = [newItem, ...visitedItems];
      console.log('updatedItems', updatedItems)
      console.log('Lista actualizada:', updatedItems);

      const trimmedItems = updatedItems//.slice(0, MAX_ITEMS);
      console.log('Lista recortada:', trimmedItems);

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedItems));
      
      setVisitedItems(trimmedItems);
      
      // Verificar que el estado se actualizó correctamente
      console.log('Nuevo estado:', await AsyncStorage.getItem(STORAGE_KEY));
    } catch (error) {
      console.error('Error al agregar el elemento visitado:', error);
    }
  };


  const removeAllVisitedItems = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setVisitedItems([]);
  }

  return { visitedItems, addVisitedItem, loadVisitedItems, removeAllVisitedItems };
};
