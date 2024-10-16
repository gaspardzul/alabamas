import React, { useEffect, useState, useCallback } from 'react';
import { FlatList, TouchableOpacity, StyleSheet, ListRenderItemInfo, TextInput, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import himnosData from '@/assets/himnos/lista.json';  
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import useStorage from '@/hooks/useStorage';
import { RootStackParamList } from '@/ts/types';
import { Himno } from '@/ts/interfaces';
import SearchBar from '@/components/SearchBar';
import ListItem from '@/components/ListItem';
import { tintColorRed } from '@/constants/Colors';

type NavigationProp = StackNavigationProp<RootStackParamList, 'HimnoDetail'>;

const ListComponent: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [himnos, setHimnos] = useState<Himno[]>([]);
  const [busqueda, setBusqueda] = useState<string>('');
  const [himnosFiltrados, setHimnosFiltrados] = useState<Himno[]>([]);
  const { favorites, addFavorite, removeFavorite , getFavorites} = useStorage('favoritos');

  useEffect(() => {
    const cargarHimnos = (): void => {
      try {
        // Ordenamos los himnos por número
        const himnosOrdenados = himnosData.lista.sort((a, b) => a.number - b.number);
        setHimnos(himnosOrdenados);
      } catch (error) {
        console.error('Error al cargar los himnos:', error);
      }
    };

    cargarHimnos();
    
  }, []);

  useEffect(() => {
    const filtrarHimnos = () => {
      const filtrados = himnos.filter(himno => 
        himno.number.toString().includes(busqueda) ||
        himno.title.toLowerCase().includes(busqueda.toLowerCase())
      );    
      setHimnosFiltrados(filtrados);
    };

    filtrarHimnos();
  }, [busqueda, himnos]);

  useFocusEffect(
    useCallback(() => {
      getFavorites();
    }, [])
  );

  const toggleFavorito = (number: number) => {
    const himno = himnos.find(h => h.number === number);
    if (himno) {
      const favoritoExistente = favorites.find(fav => fav.number === himno.number);
      if (favoritoExistente) {
        removeFavorite(himno.number);
      } else {
        addFavorite(himno);
      }
    }
  };

  const renderItem = ({ item }: ListRenderItemInfo<Himno>): React.ReactElement => (
    <View style={styles.itemContainer}>
      <TouchableOpacity 
        style={styles.item}
        onPress={() => navigation.navigate('HimnoDetail', {number:item.number} )}
      >
        <ThemedText>{item.number}. {item.title}</ThemedText>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => toggleFavorito(item.number)}>
        <Ionicons 
          name="bookmark" 
          size={24} 
          color={favorites.some(fav => fav.number === item.number) ? "red" : "gray"} 
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <ThemedView style={styles.containerList}>
      <ThemedView style={styles.container}>
        <SearchBar
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder="Buscar por número o título"
        />
      </ThemedView>
      
      <FlatList<Himno>
        data={himnosFiltrados}
          renderItem={(item) => (
            <ListItem
              title={item.item.title}
              subtitle={`Himno ${item.item.number}`}
              onPress={() => navigation.navigate('HimnoDetail', {number: item.item.number})}
              rightIcon={{
                name: "bookmark",
                color: favorites.some(fav => fav.number === item.item.number) ? "#FF6B6B" : "#737373",
                onPress: () => toggleFavorito(item.item.number)
              }}
            />
          )}
        keyExtractor={(item: Himno) => item.number.toString()}
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  containerList: {
    flex: 1,
  },
  container: {
    padding: 16,
    borderBottomWidth: 1,
    backgroundColor: tintColorRed,
    borderBottomColor: '#ccc',
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  item: {
    flex: 1,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 10,
  },
});

export default ListComponent;
