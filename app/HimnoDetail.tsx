import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { showDialog } from '@/utils/dialog';
import { ThemedText } from '@/components/ThemedText';
import { useRoute } from 'expo-router';
import type { RouteProp } from '@react-navigation/native';
import allHimnos from '@/assets/himnos/allHimnos.json';
import { Ionicons } from '@expo/vector-icons';
import useStorage from '@/hooks/useStorage';
import { Himno, Lista } from '@/ts/interfaces';
import himnario from '@/assets/himnos/lista.json';
import Sheet from '@/components/Sheet';
import Chip from '@/components/Chip';
import { toArray, toTitleCase } from '@/components/ListItem';
import { useTheme } from '@/hooks/useThemeColor';
import { Fonts, Radius, Spacing } from '@/constants/Typography';
import { FONT_SIZE_DEFAULT, FONT_SIZE_MAX, FONT_SIZE_MIN, useSettings } from '@/hooks/useSettings';
import { shareHymnPdf, shareHymnText } from '@/utils/hymnActions';
import { useToast } from '@/components/Toast';
import { sameHymn, HymnNumber } from '@/utils/hymnNumber';


interface Verso {
  verse: number;
  text: string;
  repeat?: number;
}

interface HimnoDetalle {
  title?: string;
  number?: HymnNumber;
  lyrics?: Verso[];
}

type RootStackParamList = {
  HimnoDetail: { number: string };
};

const HimnoDetail: React.FC = () => {
  const [himno, setHimno] = useState<HimnoDetalle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(FONT_SIZE_DEFAULT);
  const [isFavorite, setIsFavorite] = useState(false);
  const theme = useTheme();
  const { getSettingValue, updateSettingValue } = useSettings();
  const { show: showMessage, element: toast } = useToast();
  const route = useRoute<RouteProp<RootStackParamList, 'HimnoDetail'>>();

  const { addFavorite, removeFavorite, getFavorites, favorites } = useStorage('favoritos');
  const [showListModal, setShowListModal] = useState(false);
  const [userLists, setUserLists] = useState<Lista[]>([]);

  useEffect(() => {
    if (route.params?.number) {
      cargarHimno(route.params?.number);
      checkFavoriteStatus(route.params?.number);
      loadSettings();
      setTimeout(async () => {
        await getFavorites();
        console.log("favorites", favorites)
      }, 1000);
    }
  }, [route.params?.number]);

  useEffect(() => {
    loadUserLists();
  }, []);

  const loadSettings = async () => {
    const fontSize = await getSettingValue('fontSize');
    if(fontSize){
      setFontSize(fontSize);
    }
  }

  const loadUserLists = async () => {
    const lists = await getSettingValue('userLists');
    if (lists) {
      setUserLists(lists);
    }
  };

  const addToList = async (lista: Lista) => {
    if (!himno?.number) return;

    const updatedLists = userLists.map(l => {
      if (l.id === lista.id) {
        // Evitar duplicados
        if (!l.himnos.includes(himno?.number?.toString() ?? '')) {
          return {
            ...l,
            himnos: l.himnos.includes(himno.number?.toString() ?? '') 
              ? l.himnos 
              : [...l.himnos, himno.number?.toString() ?? ''],
            updatedAt: new Date()
          };
        }
      }
      return l;
    });

    await updateSettingValue('userLists', updatedLists);
    setUserLists(updatedLists);
    setShowListModal(false);
  };

  const cargarHimno = async (numberHimno: string) => {
    try {
      let himno = allHimnos[numberHimno as keyof typeof allHimnos];
      if (numberHimno && himno) {
        setHimno(himno as HimnoDetalle);
      }
    } catch (error) {
      setError('Error al cargar el himno');
    }
  };

  const checkFavoriteStatus = async (numberHimno: string) => {
    const favs = await getFavorites();
    setIsFavorite(favs.some((fav: Himno) => sameHymn(fav.number, numberHimno)));
  };

  const toggleFavorite = async () => {
    if (himno) {
      if (isFavorite) {
        removeFavorite(himno.number as HymnNumber);
      } else {
        addFavorite(himno as unknown as Himno);
      }
      setIsFavorite(!isFavorite);
    }
  };

  const cambiarFuente = (delta: number) => {
    const next = Math.min(Math.max(fontSize + delta, FONT_SIZE_MIN), FONT_SIZE_MAX);
    setFontSize(next);
    updateSettingValue('fontSize', next);
  };
  const aumentarFuente = () => cambiarFuente(2);
  const disminuirFuente = () => cambiarFuente(-2);

  const resetFontSize = async () => {
    const defaultSize = FONT_SIZE_DEFAULT;
    setFontSize(defaultSize);
    updateSettingValue('fontSize', defaultSize);
  };

  const compartirHimno = async () => {
    if (!himno?.number) return;
    const result = await shareHymnText(himno.number);
    if (result === 'copied') showMessage('Letra copiada al portapapeles');
    if (result === 'failed') showMessage('No se pudo compartir');
  };

  const compartirHimnoPDF = async () => {
    if (!himno?.number) return;
    const ok = await shareHymnPdf(himno.number, fontSize);
    if (!ok) showDialog('Error', 'No se pudo generar el PDF. Intenta de nuevo.');
  };

  if (!himno) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
        <ThemedText type="caption">{error ?? 'Cargando...'}</ThemedText>
      </View>
    );
  }

  const grupos = toArray(himnario.lista.find((h) => sameHymn(h.number, himno.number))?.group);
  let estrofa = 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Sheet
        visible={showListModal}
        onClose={() => setShowListModal(false)}
        eyebrow={`Himno ${himno.number}`}
        title="Añadir a lista"
      >
        <ScrollView>
          {userLists.length > 0 ? (
            userLists.map((lista) => {
              const yaIncluido = lista.himnos.includes(himno.number?.toString() ?? '');
              return (
                <TouchableOpacity
                  key={lista.id}
                  style={[styles.listItem, { borderBottomColor: theme.border }]}
                  onPress={() => addToList(lista)}
                >
                  <View style={[styles.listIcon, { backgroundColor: theme.chip }]}>
                    <Ionicons name="musical-notes-outline" size={18} color={theme.secondary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.listName}>{lista.name}</ThemedText>
                    <ThemedText type="caption">{lista.himnos.length} himnos</ThemedText>
                  </View>
                  <Ionicons
                    name={yaIncluido ? 'checkmark-circle' : 'add-circle-outline'}
                    size={22}
                    color={yaIncluido ? theme.tertiary : theme.primary}
                  />
                </TouchableOpacity>
              );
            })
          ) : (
            <ThemedText type="caption" style={styles.noLists}>
              No hay listas disponibles. Créalas desde la pestaña Mis Listas.
            </ThemedText>
          )}
        </ScrollView>
      </Sheet>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.hero}>
          <View style={styles.chips}>
            <Chip label={`HIMNO ${himno.number}`} tone="accent" />
            {grupos.slice(0, 2).map((g) => (
              <Chip key={g} label={toTitleCase(g)} />
            ))}
          </View>
          <ThemedText style={[styles.title, { fontSize: Math.min(fontSize + 4, 40), lineHeight: Math.min(fontSize + 4, 40) * 1.3 }]}>
            {toTitleCase(himno.title ?? '')}
          </ThemedText>
        </View>

        <View style={[styles.toolbar, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.segment, { backgroundColor: theme.chip }]}>
            <TouchableOpacity onPress={disminuirFuente} style={styles.segmentButton} accessibilityLabel="Reducir letra">
              <Text style={[styles.segmentLabel, { color: theme.text }]}>A−</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={resetFontSize} style={styles.segmentValue} accessibilityLabel="Restablecer tamaño">
              <Text style={[styles.segmentSize, { color: theme.textMuted }]}>{fontSize}px</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={aumentarFuente} style={styles.segmentButton} accessibilityLabel="Aumentar letra">
              <Text style={[styles.segmentLabel, { color: theme.text }]}>A+</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.rightButtons}>
            <TouchableOpacity onPress={compartirHimno} style={styles.iconButton} accessibilityLabel="Compartir texto">
              <Ionicons name="share-outline" size={21} color={theme.icon} />
            </TouchableOpacity>
            <TouchableOpacity onPress={compartirHimnoPDF} style={styles.iconButton} accessibilityLabel="Compartir PDF">
              <Ionicons name="document-text-outline" size={21} color={theme.icon} />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleFavorite} style={styles.iconButton} accessibilityLabel="Favorito">
              <Ionicons name={isFavorite ? 'star' : 'star-outline'} size={21} color={isFavorite ? theme.secondary : theme.icon} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowListModal(true)}
              style={[styles.listButton, { backgroundColor: theme.chip }]}
              accessibilityLabel="Añadir a lista"
            >
              <Ionicons name="add" size={16} color={theme.primary} />
              <Text style={[styles.listButtonText, { color: theme.primary }]}>Lista</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.lyricsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {himno.lyrics && himno.lyrics.map((verso, index) => {
            const esCoro = verso.verse === 0;
            if (!esCoro) estrofa = verso.verse;
            const lineStyle = { fontSize, lineHeight: Math.round(fontSize * 1.65) };

            if (esCoro) {
              return (
                <View
                  key={index}
                  style={[styles.chorus, { backgroundColor: theme.chip, borderLeftColor: theme.secondary }]}
                >
                  <View style={styles.verseHeader}>
                    <Ionicons name="musical-note" size={13} color={theme.secondary} />
                    <ThemedText type="label">Coro</ThemedText>
                  </View>
                  <ThemedText style={[styles.chorusText, lineStyle]}>{verso.text}</ThemedText>
                  {verso.repeat && <ThemedText type="caption" style={styles.repeat}>(Repetir {verso.repeat} veces)</ThemedText>}
                </View>
              );
            }

            return (
              <View key={index} style={styles.verseContainer}>
                <View style={styles.verseHeader}>
                  <View style={[styles.verseBadge, { backgroundColor: theme.secondarySoft }]}>
                    <Text style={[styles.verseBadgeText, { color: theme.onSecondarySoft }]}>{toRoman(estrofa)}</Text>
                  </View>
                  <ThemedText type="label" style={{ color: theme.textMuted }}>Estrofa</ThemedText>
                </View>
                <ThemedText type="Himno" style={lineStyle}>{verso.text}</ThemedText>
                {verso.repeat && <ThemedText type="caption" style={styles.repeat}>(Repetir {verso.repeat} veces)</ThemedText>}
              </View>
            );
          })}
        </View>
      </ScrollView>
      {toast}
    </View>
  );
};

const toRoman = (n: number) => {
  const map: [number, string][] = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let out = '';
  let rest = n;
  for (const [value, symbol] of map) {
    while (rest >= value) {
      out += symbol;
      rest -= value;
    }
  }
  return out || String(n);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.gutter,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
  },
  hero: {
    gap: Spacing.sm + 4,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  title: {
    fontFamily: Fonts.serifBold,
    letterSpacing: -0.3,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 6,
  },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
  },
  segmentButton: {
    width: 40,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentValue: {
    paddingHorizontal: 4,
    height: 38,
    justifyContent: 'center',
  },
  segmentLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
  },
  segmentSize: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 34,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
    marginLeft: 4,
  },
  listButtonText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
  },
  lyricsCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.gutter,
    paddingVertical: Spacing.lg,
    gap: Spacing.lg,
  },
  verseContainer: {
    gap: Spacing.sm,
  },
  verseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  verseBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verseBadgeText: {
    fontFamily: Fonts.sansBold,
    fontSize: 11,
  },
  chorus: {
    borderLeftWidth: 2,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  chorusText: {
    fontFamily: Fonts.serif,
  },
  repeat: {
    fontStyle: 'italic',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  listIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listName: {
    fontFamily: Fonts.serif,
    fontSize: 16,
  },
  noLists: {
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
});

export default HimnoDetail;
