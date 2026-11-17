import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { showDialog } from '@/utils/dialog';
import { useFocusEffect, useNavigation } from 'expo-router';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '@/components/ScreenHeader';
import SearchBar from '@/components/SearchBar';
import Sheet from '@/components/Sheet';
import VerseGrid from '@/components/VerseGrid';
import Chip from '@/components/Chip';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useThemeColor';
import { useBibleState } from '@/hooks/useBibleState';
import { normalizarTexto } from '@/utils/functions';
import {
  BibleBook,
  SPANISH_TRANSLATIONS,
  COMING_SOON_TRANSLATIONS,
  getBooks,
  getChapter,
  getTranslation,
  isOldTestament,
} from '@/utils/bibleApi';
import {
  APPROX_DOWNLOAD_MB,
  downloadTranslation,
  removeTranslation,
  useOfflineStatus,
} from '@/utils/bibleOffline';
import { RootStackParamList } from '@/ts/types';
import { Fonts, Radius, Spacing } from '@/constants/Typography';

type NavigationProp = StackNavigationProp<RootStackParamList, 'BibleReader'>;
type Testament = 'AT' | 'NT';

export default function BibleScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { translationId, lastRead, loaded, reload, setTranslation } = useBibleState();

  const [books, setBooks] = useState<BibleBook[]>([]);
  const [error, setError] = useState(false);
  const [testament, setTestament] = useState<Testament>('AT');
  const [busqueda, setBusqueda] = useState('');
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  // Paso 2 de la hoja: capítulo elegido y su número de versículos.
  const [pickedChapter, setPickedChapter] = useState<number | null>(null);
  const [verseCount, setVerseCount] = useState<number | null>(null);
  const [verseError, setVerseError] = useState(false);
  const [showTranslations, setShowTranslations] = useState(false);

  // Al volver del lector, refrescar "Seguir leyendo".
  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const loadBooks = useCallback(async () => {
    setError(false);
    setBooks([]);
    try {
      setBooks(await getBooks(translationId));
    } catch {
      setError(true);
    }
  }, [translationId]);

  useEffect(() => {
    if (loaded) loadBooks();
  }, [loaded, loadBooks]);

  const visibleBooks = useMemo(() => {
    const query = normalizarTexto(busqueda.trim());
    if (query) {
      return books.filter((b) => normalizarTexto(`${b.commonName} ${b.name}`).includes(query));
    }
    return books.filter((b) => (testament === 'AT' ? isOldTestament(b) : !isOldTestament(b)));
  }, [books, busqueda, testament]);

  const closeBookSheet = () => {
    setSelectedBook(null);
    setPickedChapter(null);
    setVerseCount(null);
    setVerseError(false);
  };

  const openChapter = (bookId: string, chapter: number, tId = translationId, verse?: number) => {
    closeBookSheet();
    navigation.navigate('BibleReader', { translationId: tId, bookId, chapter, verse });
  };

  const pickChapter = async (book: BibleBook, chapter: number) => {
    setPickedChapter(chapter);
    setVerseCount(null);
    setVerseError(false);
    try {
      const data = await getChapter(translationId, book.id, chapter);
      setVerseCount(data.numberOfVerses);
    } catch {
      setVerseError(true);
    }
  };

  const translation = getTranslation(translationId);

  const header = (
    <View style={styles.headerBlock}>
      {lastRead && !busqueda && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => openChapter(lastRead.bookId, lastRead.chapter, lastRead.translationId)}
          style={[styles.continueCard, { backgroundColor: theme.primary }]}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.continueLabel, { color: theme.secondarySoft }]}>SEGUIR LEYENDO</Text>
            <Text style={[styles.continueTitle, { color: theme.onPrimary }]}>
              {lastRead.bookName} {lastRead.chapter}
            </Text>
            <Text style={[styles.continueMeta, { color: theme.onPrimary }]}>
              {getTranslation(lastRead.translationId).name}
            </Text>
          </View>
          <View style={[styles.continueIcon, { borderColor: theme.onPrimary }]}>
            <Ionicons name="arrow-forward" size={18} color={theme.onPrimary} />
          </View>
        </TouchableOpacity>
      )}

      {!busqueda && <OfflineCard translationId={translationId} name={translation.name} />}

      {!busqueda && (
        <View style={[styles.segment, { backgroundColor: theme.chip }]}>
          {(['AT', 'NT'] as Testament[]).map((t) => {
            const active = testament === t;
            return (
              <TouchableOpacity
                key={t}
                onPress={() => setTestament(t)}
                style={[styles.segmentItem, active && { backgroundColor: theme.primary }]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    { color: active ? theme.onPrimary : theme.text, fontFamily: active ? Fonts.sansSemiBold : Fonts.sansMedium },
                  ]}
                >
                  {t === 'AT' ? 'Antiguo Testamento' : 'Nuevo Testamento'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title="Biblia"
        right={
          <TouchableOpacity
            onPress={() => setShowTranslations(true)}
            style={[styles.translationButton, { backgroundColor: theme.card, borderColor: theme.border }]}
            accessibilityLabel="Cambiar traducción"
          >
            <Text style={[styles.translationButtonText, { color: theme.primary }]}>{translation.shortName}</Text>
            <Ionicons name="chevron-down" size={14} color={theme.primary} />
          </TouchableOpacity>
        }
      >
        <SearchBar value={busqueda} onChangeText={setBusqueda} placeholder="Buscar libro" />
      </ScreenHeader>

      {error ? (
        <View style={styles.state}>
          <Ionicons name="cloud-offline-outline" size={28} color={theme.textMuted} />
          <ThemedText type="subtitle">Sin conexión</ThemedText>
          <ThemedText type="caption" style={styles.stateText}>
            Necesitas internet para cargar la Biblia por primera vez. Los capítulos que leas quedan guardados.
          </ThemedText>
          <TouchableOpacity onPress={loadBooks} style={[styles.retry, { borderColor: theme.primary }]}>
            <Text style={[styles.retryText, { color: theme.primary }]}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : books.length === 0 ? (
        <View style={styles.state}>
          <ActivityIndicator color={theme.secondary} />
        </View>
      ) : (
        <FlatList
          data={visibleBooks}
          keyExtractor={(b) => b.id}
          ListHeaderComponent={header}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <ThemedText type="caption" style={styles.stateText}>Ningún libro coincide con tu búsqueda.</ThemedText>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setSelectedBook(item);
                if (item.numberOfChapters === 1) pickChapter(item, 1);
              }}
              style={[styles.bookRow, { borderBottomColor: theme.border }]}
            >
              <ThemedText style={styles.bookName}>{item.commonName || item.name}</ThemedText>
              <ThemedText type="caption">
                {item.numberOfChapters} {item.numberOfChapters === 1 ? 'cap.' : 'caps.'}
              </ThemedText>
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        />
      )}

      <Sheet
        visible={!!selectedBook}
        onClose={closeBookSheet}
        eyebrow={pickedChapter ? `Capítulo ${pickedChapter} · elige versículo` : 'Elige un capítulo'}
        title={selectedBook ? selectedBook.commonName || selectedBook.name : ''}
      >
        {selectedBook && pickedChapter === null && (
          <VerseGrid
            count={selectedBook.numberOfChapters}
            selected={
              lastRead?.bookId === selectedBook.id && lastRead?.translationId === translationId ? lastRead.chapter : null
            }
            onSelect={(n) => pickChapter(selectedBook, n)}
          />
        )}

        {selectedBook && pickedChapter !== null && (
          <View style={styles.verseStep}>
            <View style={styles.verseActions}>
              {selectedBook.numberOfChapters > 1 && (
                <TouchableOpacity
                  onPress={() => setPickedChapter(null)}
                  style={[styles.ghostButton, { borderColor: theme.border }]}
                >
                  <Ionicons name="chevron-back" size={16} color={theme.primary} />
                  <Text style={[styles.ghostButtonText, { color: theme.primary }]}>Capítulos</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => openChapter(selectedBook.id, pickedChapter)}
                style={[styles.primaryButton, { backgroundColor: theme.primary }]}
              >
                <Text style={[styles.primaryButtonText, { color: theme.onPrimary }]}>Leer capítulo completo</Text>
              </TouchableOpacity>
            </View>
            {verseError ? (
              <ThemedText type="caption" style={styles.stateText}>
                No se pudieron cargar los versículos. Puedes abrir el capítulo completo.
              </ThemedText>
            ) : verseCount === null ? (
              <ActivityIndicator color={theme.secondary} style={{ paddingVertical: Spacing.lg }} />
            ) : (
              <VerseGrid count={verseCount} onSelect={(v) => openChapter(selectedBook.id, pickedChapter, translationId, v)} />
            )}
          </View>
        )}
      </Sheet>

      <Sheet
        visible={showTranslations}
        onClose={() => setShowTranslations(false)}
        eyebrow="Biblia"
        title="Traducción"
      >
        {SPANISH_TRANSLATIONS.map((t) => {
          const active = t.id === translationId;
          return (
            <TouchableOpacity
              key={t.id}
              onPress={() => {
                setTranslation(t.id);
                setShowTranslations(false);
              }}
              style={[styles.translationRow, { borderBottomColor: theme.border }]}
            >
              <View style={[styles.translationBadge, { backgroundColor: active ? theme.primary : theme.chip }]}>
                <Text style={[styles.translationBadgeText, { color: active ? theme.onPrimary : theme.secondary }]}>
                  {t.shortName}
                </Text>
              </View>
              <ThemedText style={[styles.translationName, active && { fontFamily: Fonts.sansSemiBold }]}>
                {t.name}
              </ThemedText>
              <TranslationStatusIcon id={t.id} />
              {active && <Ionicons name="checkmark" size={20} color={theme.secondary} />}
            </TouchableOpacity>
          );
        })}
        {COMING_SOON_TRANSLATIONS.map((t) => (
          <TouchableOpacity
            key={t.id}
            activeOpacity={0.6}
            onPress={() =>
              showDialog(
                `${t.name} · Próximamente`,
                'Esta versión requiere un permiso especial de las Sociedades Bíblicas y estará disponible próximamente. Mientras tanto puedes usar la Reina-Valera 1909 o la Reina-Valera Gómez.'
              )
            }
            style={[styles.translationRow, { borderBottomColor: theme.border }]}
            accessibilityState={{ disabled: true }}
          >
            <View style={[styles.translationBadge, { backgroundColor: theme.chip, opacity: 0.6 }]}>
              <Text style={[styles.translationBadgeText, { color: theme.textMuted }]}>{t.shortName}</Text>
            </View>
            <ThemedText style={[styles.translationName, { color: theme.textMuted }]}>{t.name}</ThemedText>
            <Chip label="Próximamente" tone="accent" />
          </TouchableOpacity>
        ))}
      </Sheet>
    </View>
  );
}

function TranslationStatusIcon({ id }: { id: string }) {
  const theme = useTheme();
  const { downloaded, status } = useOfflineStatus(id);
  if (status.state === 'downloading') return <ActivityIndicator size="small" color={theme.secondary} />;
  return downloaded ? <Ionicons name="cloud-done-outline" size={18} color={theme.tertiary} /> : null;
}

/** Tarjeta para descargar la traducción actual y leerla sin conexión. */
function OfflineCard({ translationId, name }: { translationId: string; name: string }) {
  const theme = useTheme();
  const { downloaded, status } = useOfflineStatus(translationId);

  if (downloaded) {
    return (
      <View style={[styles.offlineRow, { borderColor: theme.border }]}>
        <Ionicons name="cloud-done-outline" size={18} color={theme.tertiary} />
        <ThemedText type="caption" style={{ flex: 1 }}>Disponible sin conexión</ThemedText>
        <TouchableOpacity
          hitSlop={8}
          onPress={() =>
            showDialog('Eliminar descarga', `¿Quitar ${name} del dispositivo? Podrás descargarla de nuevo.`, [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Eliminar', style: 'destructive', onPress: () => removeTranslation(translationId) },
            ])
          }
        >
          <Text style={[styles.offlineLink, { color: theme.textMuted }]}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (status.state === 'downloading') {
    return (
      <View style={[styles.offlineCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <ThemedText type="label">Descargando {name}</ThemedText>
        <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
          <View style={[styles.progressFill, { backgroundColor: theme.secondary, width: `${Math.round(status.progress * 100)}%` }]} />
        </View>
        <ThemedText type="caption">{status.label}</ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.offlineCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.offlineHeader}>
        <Ionicons name="cloud-download-outline" size={20} color={theme.secondary} />
        <ThemedText style={styles.offlineTitle}>Leer sin conexión</ThemedText>
      </View>
      <ThemedText type="caption">
        {status.state === 'error'
          ? status.message
          : `Descarga ${name} completa en tu dispositivo (≈${APPROX_DOWNLOAD_MB} MB).`}
      </ThemedText>
      <TouchableOpacity
        onPress={() => downloadTranslation(translationId)}
        style={[styles.ghostButton, styles.offlineButton, { borderColor: theme.primary }]}
      >
        <Text style={[styles.ghostButtonText, { color: theme.primary }]}>
          {status.state === 'error' ? 'Reintentar descarga' : 'Descargar'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  verseStep: { gap: Spacing.md },
  verseActions: { flexDirection: 'row', gap: Spacing.sm },
  ghostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  ghostButtonText: { fontFamily: Fonts.sansSemiBold, fontSize: 14 },
  primaryButton: { flex: 1, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { fontFamily: Fonts.sansSemiBold, fontSize: 14 },
  offlineCard: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md, gap: Spacing.sm },
  offlineHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  offlineTitle: { fontFamily: Fonts.serifBold, fontSize: 16, lineHeight: 22 },
  offlineButton: { alignSelf: 'flex-start', marginTop: 2 },
  offlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  offlineLink: { fontFamily: Fonts.sansSemiBold, fontSize: 13 },
  progressTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2 },
  container: { flex: 1 },
  headerBlock: { gap: Spacing.md, paddingBottom: Spacing.sm },
  listContent: { paddingHorizontal: Spacing.gutter, paddingTop: Spacing.sm, paddingBottom: Spacing.xl },
  translationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: 2,
  },
  translationButtonText: { fontFamily: Fonts.sansSemiBold, fontSize: 13 },
  continueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    padding: Spacing.gutter,
    gap: Spacing.md,
  },
  continueLabel: { fontFamily: Fonts.sansSemiBold, fontSize: 11, letterSpacing: 0.9 },
  continueTitle: { fontFamily: Fonts.serifBold, fontSize: 22, lineHeight: 30 },
  continueMeta: { fontFamily: Fonts.sans, fontSize: 13, opacity: 0.75 },
  continueIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.9,
  },
  segment: { flexDirection: 'row', borderRadius: Radius.md, padding: 4 },
  segmentItem: { flex: 1, height: 38, borderRadius: Radius.md - 2, alignItems: 'center', justifyContent: 'center' },
  segmentText: { fontSize: 13 },
  bookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: 54,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bookName: { flex: 1, fontFamily: Fonts.serif, fontSize: 17, lineHeight: 24 },
  state: { alignItems: 'center', gap: Spacing.sm, paddingTop: 72, paddingHorizontal: Spacing.xl },
  stateText: { textAlign: 'center', paddingTop: Spacing.md },
  retry: { borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Spacing.md, height: 40, justifyContent: 'center', marginTop: Spacing.sm },
  retryText: { fontFamily: Fonts.sansSemiBold, fontSize: 14 },
  translationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  translationBadge: { minWidth: 58, height: 30, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  translationBadgeText: { fontFamily: Fonts.sansBold, fontSize: 11 },
  translationName: { flex: 1 },
});
