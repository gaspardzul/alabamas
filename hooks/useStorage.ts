import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Himno } from '@/ts/interfaces';


const useStorage = (key: string) => {
  const [favorites, setFavorites] = useState<Himno[]>([]);

  const loadFavorites = async () => {
    try {
      const storedFavorites = await AsyncStorage.getItem(key);
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
      const storedFavorites = await AsyncStorage.getItem(key);
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
        return JSON.parse(storedFavorites);
      }
    } catch (error) {
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
  };
};

export default useStorage;
