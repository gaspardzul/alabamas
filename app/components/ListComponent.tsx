import React, { useEffect, useState, useCallback, useRef } from 'react';
import { StyleSheet, SectionList, Animated } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import himnosData from '@/assets/himnos/lista.json';  
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import useStorage from '@/hooks/useStorage';
import { RootStackParamList } from '@/ts/types';
import { Himno } from '@/ts/interfaces';
import SearchBar from '@/components/SearchBar';
import ListItem from '@/components/ListItem';
import {  tintColorBlue } from '@/constants/Colors';
import { useSettings } from '@/hooks/useSettings';
import { useColorScheme } from '@/hooks/useColorScheme';
type NavigationProp = StackNavigationProp<RootStackParamList, 'HimnoDetail'>;

const ListComponent: React.FC<{ category?: string }> = ({ category }) => {
  const navigation = useNavigation<NavigationProp>();
  const [himnos, setHimnos] = useState<Himno[]>([]);
  const colorScheme = useColorScheme();
  const [busqueda, setBusqueda] = useState<string>('');
  const [himnosFiltrados, setHimnosFiltrados] = useState<Himno[]>([]);
  const { favorites, addFavorite, removeFavorite , getFavorites} = useStorage('favoritos');
  const { settings, updateSettingValue, getSettingValue } = useSettings();
  const [seccionesHimnos, setSeccionesHimnos] = useState<Array<{title: string, data: Himno[]}>>([]);
  const [fontSize, setFontSize] = useState<number>(16);
  const [mensaje, setMensaje] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const showMessage = (text: string) => {
    setMensaje(text);
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(1500),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

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

  const loadSettings = async () => {
    const fontSize = await getSettingValue('fontSize');
    if(fontSize){
      setFontSize(fontSize);
    }
  } 

  useEffect(() => {
    const filtrarYOrdenarHimnos = () => {
      const filtrados = himnos.filter(himno => 
        himno.number.toString().includes(busqueda) ||
        himno.title.toLowerCase().includes(busqueda.toLowerCase()) ||
        himno.group?.toLowerCase()===(busqueda.toLowerCase())
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
      loadSettings();
    }, [])
  );

  useEffect(() => {
    console.log('category===>', category);
    if(category){
      setBusqueda(category);
    }
    return () => {
      setBusqueda('');
    }
  }, [category]);

  const toggleFavorito = (number: number) => {
    const himno = himnos.find(h => h.number === number);
    if (himno) {
      const favoritoExistente = favorites.find(fav => fav.number === himno.number);
      if (favoritoExistente) {
        removeFavorite(himno.number);
        showMessage(`Himno ${himno.number} eliminado de favoritos`);
      } else {
        addFavorite(himno);
        showMessage(`Himno ${himno.number} agregado a favoritos`);
      }
    }
  };


  return (
    <ThemedView style={styles.containerList}>
      <ThemedView style={{...styles.container, backgroundColor: colorScheme === 'dark' ? '#1E1E1E' : tintColorBlue}}>
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
            title={`${item.number}. ${item.title}`}
            fontSize={fontSize <= 27 ? fontSize : 27}
            onPress={() => navigation.navigate('HimnoDetail', {number: item.number})}
            rightIcon={{
              name: "bookmark",
              color: favorites.some(fav => fav.number === item.number) ? "#FF6B6B" : "#737373",
              onPress: () => toggleFavorito(item.number)
            }}
          />
        )}
        renderSectionHeader={({ section: { title } }) => (
          <ThemedView style={{...styles.sectionHeader, backgroundColor: colorScheme === 'dark' ? '#212121' : '#efefef'}}>
            <ThemedText style={styles.sectionHeaderText}>{title}</ThemedText>
          </ThemedView>
        )}
        keyExtractor={(item: Himno) => item.number.toString()}
      />
      <Animated.View style={[
        styles.messageContainer,
        {
          opacity: fadeAnim,
          transform: [{
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0]
            })
          }]
        }
      ]}>
        <ThemedText style={styles.messageText}>{mensaje}</ThemedText>
      </Animated.View>
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
    padding: 8
  },
  sectionHeaderText: {
    fontWeight: 'bold',
  },
  messageContainer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  }
});

export default ListComponent;
