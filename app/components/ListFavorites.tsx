import React, { useEffect, useState, useCallback } from 'react';
import { FlatList, TouchableOpacity, StyleSheet, ListRenderItemInfo, TextInput, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView'; 
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import useStorage from '@/hooks/useStorage';
import { RootStackParamList } from '@/ts/types';
import { Himno } from '@/ts/interfaces';
import SearchBar from '@/components/SearchBar';
import ListItem from '@/components/ListItem';
import { tintColorRed } from '@/constants/Colors';
import { useSettings } from '@/hooks/useSettings';
type NavigationProp = StackNavigationProp<RootStackParamList, 'HimnoDetail'>;

const ListFavorites: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [busqueda, setBusqueda] = useState<string>('');
  const [himnosFiltrados, setHimnosFiltrados] = useState<Himno[]>([]);
  const { getSettingValue } = useSettings();
  const { favorites, removeFavorite, getFavorites, sortFavorites } = useStorage('favoritos');


  useFocusEffect(
    useCallback(() => {
      getFavorites();
      
    }, [])
  );

  

  useEffect(() => {
    const filtrarHimnos = () => {
      const filtrados = favorites.filter(himno => 
        himno.number.toString().includes(busqueda) ||
        himno.title.toLowerCase().includes(busqueda.toLowerCase())
      );
      setHimnosFiltrados(filtrados);
    };

    filtrarHimnos();
  }, [busqueda, favorites]);

  const toggleFavorito = (number: number) => {
    removeFavorite(number);
  };

  return (
    <ThemedView style={styles.containerList}>
      <ThemedView style={styles.searchContainer}>
        <SearchBar
          value={busqueda}
          onSort={(option) => sortFavorites(option as 'asc' | 'desc' | 'numAsc' | 'numDesc')}
          onChangeText={setBusqueda}
          placeholder="Buscar por número o título"
        />
      </ThemedView>
      
      {himnosFiltrados.length > 0 ? (
        <FlatList<Himno>
          data={himnosFiltrados}
          renderItem={(item) => (
            <ListItem
              title={item.item.title}
              subtitle={`Himno ${item.item.number}`}
              onPress={() => navigation.navigate('HimnoDetail', {number: item.item.number})}
              rightIcon={{
                name: "bookmark",
                color: favorites.some(fav => fav.number === item.item.number) ? "#FF6B6B" : "#4ECDC4",
                onPress: () => toggleFavorito(item.item.number)
              }}
            />
          )}
          keyExtractor={(item: Himno) => item.number.toString() || item.title}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <ThemedText style={styles.noFavorites}>No hay himnos favoritos</ThemedText>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  containerList: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: tintColorRed,
  },
  listContent: {
    paddingVertical: 8,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  item: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 12,
    color: '#333',
  },
  itemTitle: {
    fontSize: 16,
    color: '#555',
  },
  favoriteButton: {
    padding: 8,
  },
  noFavorites: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  },
});

export default ListFavorites;
