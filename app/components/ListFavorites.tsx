import React, { useEffect, useState, useCallback } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import ScreenHeader from '@/components/ScreenHeader';
import Chip from '@/components/Chip';
import { useTheme } from '@/hooks/useThemeColor';
import { Spacing } from '@/constants/Typography';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView'; 
import { useNavigation, useFocusEffect } from 'expo-router';
import type { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import useStorage from '@/hooks/useStorage';
import { RootStackParamList } from '@/ts/types';
import { Himno } from '@/ts/interfaces';
import SearchBar from '@/components/SearchBar';
import ListItem, { toTitleCase } from '@/components/ListItem';
import { FONT_SIZE_DEFAULT, useSettings } from '@/hooks/useSettings';
import type { HymnNumber } from '@/utils/hymnNumber';
import HymnActionsSheet, { HymnSummary } from '@/components/HymnActionsSheet';
import { useToast } from '@/components/Toast';
import Loader from '@/components/Loader';
type NavigationProp = StackNavigationProp<RootStackParamList, 'HimnoDetail'>;

const ListFavorites: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const theme = useTheme();
  const [busqueda, setBusqueda] = useState<string>('');
  const [himnosFiltrados, setHimnosFiltrados] = useState<Himno[]>([]);
  const { getSettingValue } = useSettings();
  const [fontSize, setFontSize] = useState<number>(FONT_SIZE_DEFAULT);
  const { favorites, removeFavorite, getFavorites, sortFavorites, loaded } = useStorage('favoritos');
  const { show: showMessage, element: toast } = useToast();
  const [menuHymn, setMenuHymn] = useState<HymnSummary | null>(null);


  useFocusEffect(
    useCallback(() => {
      getFavorites();
      loadSettings();
    }, [])
  );

  const loadSettings = async () => {
    const fontSize = await getSettingValue('fontSize');
    if(fontSize){
      setFontSize(fontSize);
    }
  } 

  useEffect(() => {
    const filtrarHimnos = () => {
      const filtrados = favorites.filter(himno => 
        himno.number.toString().includes(busqueda) ||
        himno.title.toLowerCase().includes(busqueda.toLowerCase()) || 
        (Array.isArray(himno.group) && himno.group.some(group => 
          group.toLowerCase().includes(busqueda.toLowerCase())
        ))
      );
      setHimnosFiltrados(filtrados);
    };

    filtrarHimnos();
  }, [busqueda, favorites]);

  const toggleFavorito = (number: HymnNumber) => {
    removeFavorite(number);
  };

  return (
    <ThemedView style={styles.containerList}>
      <ScreenHeader
        eyebrow="Tu colección"
        title="Favoritos"
        right={
          favorites.length > 0 ? <Chip label={`${favorites.length}`} tone="accent" /> : undefined
        }
      >
        <SearchBar
          value={busqueda}
          onSort={(option) => sortFavorites(option as 'asc' | 'desc' | 'numAsc' | 'numDesc')}
          onChangeText={setBusqueda}
          placeholder="Buscar en favoritos"
        />
      </ScreenHeader>

      {!loaded ? (
        <Loader label="Cargando favoritos…" />
      ) : himnosFiltrados.length > 0 ? (
        <FlatList<Himno>
          data={himnosFiltrados}
          keyboardShouldPersistTaps="handled"
          renderItem={({item}) => (
            <ListItem
              number={item.number}
              title={toTitleCase(item.title)}
              tags={item.group}
              fontSize={fontSize <= 27 ? fontSize : 27}
              favorite
              onPress={() => navigation.navigate('HimnoDetail', {number: item.number})}
              onLongPress={() => setMenuHymn(item)}
              rightIcon={{
                name: 'ellipsis-vertical',
                label: 'Más opciones',
                color: theme.textMuted,
                onPress: () => setMenuHymn(item)
              }}
            />
          )}
          keyExtractor={(item: Himno) => item.number.toString() || item.title}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.chip }]}>
            <Ionicons name="star-outline" size={28} color={theme.secondary} />
          </View>
          <ThemedText type="subtitle">
            {busqueda ? 'Sin resultados' : 'Aún no hay favoritos'}
          </ThemedText>
          <ThemedText type="caption" style={styles.emptyText}>
            {busqueda
              ? 'Ningún favorito coincide con tu búsqueda.'
              : 'Toca la estrella de una alabanza para guardarla aquí.'}
          </ThemedText>
        </View>
      )}

      <HymnActionsSheet
        hymn={menuHymn}
        isFavorite
        onClose={() => setMenuHymn(null)}
        onOpen={(h) => navigation.navigate('HimnoDetail', { number: h.number })}
        onToggleFavorite={(h) => {
          toggleFavorito(h.number);
          showMessage('Quitado de favoritos');
        }}
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
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: 72,
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  emptyText: {
    textAlign: 'center',
  },
});

export default ListFavorites;
