import React, { useEffect, useState, useCallback } from 'react';
import { FlatList, TouchableOpacity, StyleSheet, ListRenderItemInfo, TextInput, View, SectionList } from 'react-native';
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
import { useSettings } from '@/hooks/useSettings';
type NavigationProp = StackNavigationProp<RootStackParamList, 'HimnoDetail'>;

const ListComponent: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [himnos, setHimnos] = useState<Himno[]>([]);
  const [busqueda, setBusqueda] = useState<string>('');
  const [himnosFiltrados, setHimnosFiltrados] = useState<Himno[]>([]);
  const { favorites, addFavorite, removeFavorite , getFavorites} = useStorage('favoritos');
  const { settings, updateSettingValue, getSettingValue } = useSettings();
  const [seccionesHimnos, setSeccionesHimnos] = useState<Array<{title: string, data: Himno[]}>>([]);

  const cargarHimnos = async () => {
    try {
      const order = await getSettingValue('order');
      let himnosOrdenados = [...himnosData.lista];
      
      switch (order) {
        case 'numAsc':
          himnosOrdenados.sort((a, b) => a.number - b.number);
          break;
        case 'numDesc':
          himnosOrdenados.sort((a, b) => b.number - a.number);
          break;
        case 'asc':
          himnosOrdenados.sort((a, b) => a.title.localeCompare(b.title));
          break;
        case 'desc':
          himnosOrdenados.sort((a, b) => b.title.localeCompare(a.title));
          break;
        // No es necesario un caso por defecto, ya que himnosOrdenados ya contiene la lista original
      }
      
      setHimnos(himnosOrdenados);
    } catch (error) {
      console.error('Error al cargar los himnos:', error);
    }
  };

  useEffect(() => {
    cargarHimnos();
    
  }, []);

  useEffect(() => {
    const filtrarYOrdenarHimnos = () => {
      const filtrados = himnos.filter(himno => 
        himno.number.toString().includes(busqueda) ||
        himno.title.toLowerCase().includes(busqueda.toLowerCase())
      );
      
      const order = settings.order;
      let himnosOrdenados = [...filtrados];
      
      switch (order) {
        case 'numAsc':
          himnosOrdenados.sort((a, b) => a.number - b.number);
          break;
        case 'numDesc':
          himnosOrdenados.sort((a, b) => b.number - a.number);
          break;
        case 'asc':
          himnosOrdenados.sort((a, b) => a.title.localeCompare(b.title));
          break;
        case 'desc':
          himnosOrdenados.sort((a, b) => b.title.localeCompare(a.title));
          break;
      }

      const secciones = himnosOrdenados.reduce((acc, himno) => {
        let seccionTitle;
        if (order === 'numAsc' || order === 'numDesc') {
          seccionTitle = `${Math.floor(himno.number / 10) * 10} - ${Math.floor(himno.number / 10) * 10 + 9}`;
        } else {
          seccionTitle = himno.title[0].toUpperCase();
        }
        
        const seccionExistente = acc.find(seccion => seccion.title === seccionTitle);
        if (seccionExistente) {
          seccionExistente.data.push(himno);
        } else {
          acc.push({ title: seccionTitle, data: [himno] });
        }
        return acc;
      }, [] as Array<{title: string, data: Himno[]}>);

      // Ordenar las secciones
      if (order === 'numAsc' || order === 'numDesc') {
        secciones.sort((a, b) => {
          const numA = parseInt(a.title.split('-')[0]);
          const numB = parseInt(b.title.split('-')[0]);
          return order === 'numAsc' ? numA - numB : numB - numA;
        });
      } else {
        secciones.sort((a, b) => order === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title));
      }

      setSeccionesHimnos(secciones);
    };

    filtrarYOrdenarHimnos();
  }, [busqueda, himnos, settings.order]);

  // hacer una funcion para ordenar los himnos, las opciones son:
  // 1. Por número (numAsc)
  // 2. Por número (numDesc)
  // 3. Por título (asc)
  // 4. Por título (desc)
  const handleSort = (option: string) => {
    let _himnosFiltrados = [...himnosFiltrados];
    updateSettingValue('order', option as 'asc' | 'desc' | 'numAsc' | 'numDesc');
    switch (option) {
      case 'numAsc':
        _himnosFiltrados = _himnosFiltrados.sort((a, b) => a.number - b.number);
        setHimnosFiltrados(_himnosFiltrados);
        break;
      case 'numDesc':
        _himnosFiltrados = [...himnosFiltrados].sort((a, b) => b.number - a.number);
        setHimnosFiltrados(_himnosFiltrados);
        break;
      case 'asc':
        _himnosFiltrados = _himnosFiltrados.sort((a, b) => a.title.localeCompare(b.title));
        setHimnosFiltrados(_himnosFiltrados);
        break;
      case 'desc':
        _himnosFiltrados = _himnosFiltrados.sort((a, b) => b.title.localeCompare(a.title));
        setHimnosFiltrados(_himnosFiltrados);
        break;
      default:
        break;
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarHimnos();
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


  return (
    <ThemedView style={styles.containerList}>
      <ThemedView style={styles.container}>
        <SearchBar
          value={busqueda}
          onSort={handleSort}
          onChangeText={setBusqueda}
          placeholder="Buscar por número o título"
        />
      </ThemedView>
      
      <SectionList
        sections={seccionesHimnos}
        renderItem={({ item }) => (
          <ListItem
            title={item.title}
            subtitle={`Himno ${item.number}`}
            onPress={() => navigation.navigate('HimnoDetail', {number: item.number})}
            rightIcon={{
              name: "bookmark",
              color: favorites.some(fav => fav.number === item.number) ? "#FF6B6B" : "#737373",
              onPress: () => toggleFavorito(item.number)
            }}
          />
        )}
        renderSectionHeader={({ section: { title } }) => (
          <ThemedView style={styles.sectionHeader}>
            <ThemedText style={styles.sectionHeaderText}>{title}</ThemedText>
          </ThemedView>
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
  sectionHeader: {
    backgroundColor: '#f4f4f4',
    padding: 8,
  },
  sectionHeaderText: {
    fontWeight: 'bold',
  },
});

export default ListComponent;
