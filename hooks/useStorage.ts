import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Himno } from '@/ts/interfaces';
import { useSettings } from './useSettings';

const useStorage = (key: string) => {
  const [favorites, setFavorites] = useState<Himno[]>([]);
  const { getSettingValue } = useSettings();

  const loadFavorites = async () => {
    try {
      const storedFavorites = await AsyncStorage.getItem(key);
      const order = await getSettingValue('order');
      if (order) {
        let data = Onlysort(order,JSON.parse(storedFavorites || '[]') as Himno[]);
        setFavorites(data);
      }
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    } catch (error) {
      console.error('Error al cargar favoritos:', error);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, [key]);

  const sortFavorites = (option: 'asc' | 'desc' | 'numAsc' | 'numDesc') => {
    let sortedFavorites = [...favorites];
    switch (option) {
      case 'numAsc':
        sortedFavorites = sortedFavorites.sort((a, b) => a.number - b.number);
        setFavorites(sortedFavorites);
        break;
      case 'numDesc':
        sortedFavorites = sortedFavorites.sort((a, b) => b.number - a.number);
        setFavorites(sortedFavorites);
        break;
      case 'asc':
        sortedFavorites = sortedFavorites.sort((a, b) => a.title.localeCompare(b.title));
        setFavorites(sortedFavorites);
        break;
      case 'desc':
        sortedFavorites = sortedFavorites.sort((a, b) => b.title.localeCompare(a.title));
        setFavorites(sortedFavorites);
        break;
    }
  };

  const Onlysort = (option: 'asc' | 'desc' | 'numAsc' | 'numDesc', _favorites: Himno[]) => {
    let sortedFavorites = [..._favorites];
    switch (option) {
      case 'numAsc':
        sortedFavorites = sortedFavorites.sort((a, b) => a.number - b.number);
        return sortedFavorites;
        break;
      case 'numDesc':
        sortedFavorites = sortedFavorites.sort((a, b) => b.number - a.number);
        return sortedFavorites;
        break;
      case 'asc':
        sortedFavorites = sortedFavorites.sort((a, b) => a.title.localeCompare(b.title));
        return sortedFavorites;
        break;
      case 'desc':
        sortedFavorites = sortedFavorites.sort((a, b) => b.title.localeCompare(a.title));
        return sortedFavorites;
        break;
    }
  };



  const addFavorite = async (item: Himno) => {
    try {
      const updatedFavorites = [...favorites, item];
      setFavorites(updatedFavorites);
      console.log("updatedFavorites", updatedFavorites)
      await AsyncStorage.setItem(key, JSON.stringify(updatedFavorites));
    } catch (error) {
      console.error('Error al agregar favorito:', error);
    }
  };

  const getFavorites = async () => {
    try {
      // Intenta obtener los favoritos almacenados, si no hay nada, usa un array vacío
      let storedFavorites = await AsyncStorage.getItem(key) || '[]';
      
      // Obtiene el valor de la configuración 'order'
      const order = await getSettingValue('order');
      
      if(order){
        // Si hay un orden especificado, ordena los favoritos
        storedFavorites = JSON.stringify(Onlysort(order, JSON.parse(storedFavorites)));
        // Actualiza el estado con los favoritos ordenados
        setFavorites(JSON.parse(storedFavorites));
        // Devuelve los favoritos ordenados
        return JSON.parse(storedFavorites);
      } else {
        // Si no hay orden especificado
        if (storedFavorites) {
          // Actualiza el estado con los favoritos almacenados
          setFavorites(JSON.parse(storedFavorites));
          // Devuelve los favoritos almacenados
          return JSON.parse(storedFavorites);
        }
      }
      
    } catch (error) {
      // Si ocurre un error, lo registra en la consola
      console.error('Error al obtener favoritos:', error);
    }
  };

  const removeFavorite = async (number: number) => {
    try {
      const updatedFavorites = favorites.filter(item => item.number !== number);
      setFavorites(updatedFavorites);
      await AsyncStorage.setItem(key, JSON.stringify(updatedFavorites));
    } catch (error) {
      console.error('Error al eliminar favorito:', error);
    }
  };

  const removeAllFavorites = async () => {
    try {
      setFavorites([]);
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error al eliminar favorito:', error);
    }
  };


  const clearFavorites = async () => {
    try {
      setFavorites([]);
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error al limpiar favoritos:', error);
    }
  };

  return {
    favorites,
    addFavorite,
    removeFavorite,
    removeAllFavorites,
    clearFavorites,
    getFavorites,
    sortFavorites
  };
};

export default useStorage;
