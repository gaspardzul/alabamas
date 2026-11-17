import React, { useEffect, useState, useCallback, useRef } from 'react';
import { StyleSheet, SectionList, Animated, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import ScreenHeader from '@/components/ScreenHeader';
import { useTheme } from '@/hooks/useThemeColor';
import { Fonts, Radius, Spacing } from '@/constants/Typography';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import himnosData from '@/assets/himnos/lista.json';  
import { useNavigation, useFocusEffect } from 'expo-router';
import type { StackNavigationProp } from '@react-navigation/stack';
import useStorage from '@/hooks/useStorage';
import { RootStackParamList } from '@/ts/types';
import { Himno } from '@/ts/interfaces';
import SearchBar from '@/components/SearchBar';
import ListItem, { toTitleCase } from '@/components/ListItem';
import { FONT_SIZE_DEFAULT, useSettings } from '@/hooks/useSettings';
import { compareHymnNumbers, hymnBase, HymnNumber, sameHymn } from '@/utils/hymnNumber';
import HymnActionsSheet, { HymnSummary } from '@/components/HymnActionsSheet';
import { useToast } from '@/components/Toast';
import Loader from '@/components/Loader';
type NavigationProp = StackNavigationProp<RootStackParamList, 'HimnoDetail'>;

const ListComponent: React.FC<{ category?: string }> = ({ category }) => {
  const navigation = useNavigation<NavigationProp>();
  const [himnos, setHimnos] = useState<Himno[]>([]);
  const [loaded, setLoaded] = useState(false);
  const theme = useTheme();
  const [busqueda, setBusqueda] = useState<string>('');
  const [himnosFiltrados, setHimnosFiltrados] = useState<Himno[]>([]);
  const { favorites, addFavorite, removeFavorite , getFavorites} = useStorage('favoritos');
  const { settings, updateSettingValue, getSettingValue } = useSettings();
  const [seccionesHimnos, setSeccionesHimnos] = useState<Array<{title: string, data: Himno[]}>>([]);
  const [fontSize, setFontSize] = useState<number>(FONT_SIZE_DEFAULT);
  const { show: showMessage, element: toast } = useToast();
  // Himno cuyo menú de acciones (⋮) está abierto.
  const [menuHymn, setMenuHymn] = useState<HymnSummary | null>(null);

  const cargarHimnos = async () => {
    try {
      const order = await getSettingValue('order');
      let himnosOrdenados = [...himnosData.lista];
      
      switch (order) {
        case 'numAsc':
          himnosOrdenados.sort((a, b) => compareHymnNumbers(a.number, b.number));
          break;
        case 'numDesc':
          himnosOrdenados.sort((a, b) => compareHymnNumbers(b.number, a.number));
          break;
        case 'asc':
          himnosOrdenados.sort((a, b) => a.title.localeCompare(b.title));
          break;
        case 'desc':
          himnosOrdenados.sort((a, b) => b.title.localeCompare(a.title));
          break;
        // No es necesario un caso por defecto, ya que himnosOrdenados ya contiene la lista original
      }
      setHimnos(himnosOrdenados as Himno[]);
      setLoaded(true);
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
        (Array.isArray(himno.group) && himno.group.some(group => 
          group.toLowerCase().includes(busqueda.toLowerCase())
        ))
      );
      
      const order = settings.order;
      let himnosOrdenados = [...filtrados];
      
      switch (order) {
        case 'numAsc':
          himnosOrdenados.sort((a, b) => compareHymnNumbers(a.number, b.number));
          break;
        case 'numDesc':
          himnosOrdenados.sort((a, b) => compareHymnNumbers(b.number, a.number));
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
          seccionTitle = `${Math.floor(hymnBase(himno.number) / 10) * 10} - ${Math.floor(hymnBase(himno.number) / 10) * 10 + 9}`;
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
        _himnosFiltrados = _himnosFiltrados.sort((a, b) => compareHymnNumbers(a.number, b.number));
        setHimnosFiltrados(_himnosFiltrados);
        break;
      case 'numDesc':
        _himnosFiltrados = [...himnosFiltrados].sort((a, b) => compareHymnNumbers(b.number, a.number));
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

  const toggleFavorito = (number: HymnNumber) => {
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


  const total = seccionesHimnos.reduce((n, s) => n + s.data.length, 0);

  return (
    <ThemedView style={styles.containerList}>
      <ScreenHeader title="Alabanzas">
        <SearchBar
          value={busqueda}
          onSort={handleSort}
          onChangeText={setBusqueda}
          placeholder="Buscar por número, título o tema"
        />
        <ThemedText type="caption">
          {busqueda ? `${total} resultados` : `${total} alabanzas disponibles`}
        </ThemedText>
      </ScreenHeader>

      <SectionList
        sections={seccionesHimnos}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isFav = favorites.some(fav => fav.number === item.number);
          return (
            <ListItem
              number={item.number}
              title={toTitleCase(item.title)}
              tags={item.group}
              fontSize={fontSize <= 27 ? fontSize : 27}
              favorite={isFav}
              onPress={() => navigation.navigate('HimnoDetail', {number: item.number})}
              onLongPress={() => setMenuHymn(item)}
              rightIcon={{
                name: 'ellipsis-vertical',
                label: 'Más opciones',
                color: theme.textMuted,
                onPress: () => setMenuHymn(item)
              }}
            />
          );
        }}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader}>
            <ThemedText type="label" style={{ color: theme.textMuted }}>{title}</ThemedText>
            <View style={[styles.sectionRule, { backgroundColor: theme.border }]} />
          </View>
        )}
        ListEmptyComponent={
          !loaded ? (
            <Loader label="Cargando alabanzas…" />
          ) : (
            <View style={styles.empty}>
              <ThemedText type="subtitle">Sin resultados</ThemedText>
              <ThemedText type="caption">Prueba con otro número, título o tema.</ThemedText>
            </View>
          )
        }
        keyExtractor={(item: Himno) => item.number.toString()}
      />
      <HymnActionsSheet
        hymn={menuHymn}
        isFavorite={!!menuHymn && favorites.some(fav => sameHymn(fav.number, menuHymn.number))}
        onClose={() => setMenuHymn(null)}
        onOpen={(h) => navigation.navigate('HimnoDetail', { number: h.number })}
        onToggleFavorite={(h) => toggleFavorito(h.number)}
        onMessage={showMessage}
      />
      {toast}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  containerList: {
    flex: 1,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.gutter,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  sectionRule: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.xs,
    paddingTop: Spacing.xl,
  },
});

export default ListComponent;
