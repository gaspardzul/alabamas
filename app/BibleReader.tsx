import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from 'expo-router';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import Chip from '@/components/Chip';
import Sheet from '@/components/Sheet';
import VerseGrid from '@/components/VerseGrid';
import BibleChapterText from '@/components/BibleChapterText';
import { useTheme } from '@/hooks/useThemeColor';
import { FONT_SIZE_DEFAULT, useSettings } from '@/hooks/useSettings';
import { useBibleState } from '@/hooks/useBibleState';
import { BibleChapter, ChapterReference, getChapter, getTranslation } from '@/utils/bibleApi';
import { RootStackParamList } from '@/ts/types';
import { Fonts, Radius, Spacing } from '@/constants/Typography';

type BibleReaderRouteProp = RouteProp<RootStackParamList, 'BibleReader'>;

const MIN_FONT = 14;
const MAX_FONT = 34;

export default function BibleReader() {
  const route = useRoute<BibleReaderRouteProp>();
  const navigation = useNavigation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const { getSettingValue, updateSettingValue } = useSettings();
  const { setLastRead } = useBibleState();

  const params = route.params!;
  const [ref, setRef] = useState<ChapterReference>({
    translationId: params.translationId,
    book: params.bookId,
    chapter: Number(params.chapter),
  });
  // Versículo resaltado y al que hay que desplazarse cuando el texto termine de medirse.
  const [highlight, setHighlight] = useState<number | null>(params.verse ? Number(params.verse) : null);
  const pendingVerse = useRef<number | null>(params.verse ? Number(params.verse) : null);
  const textCardY = useRef(0);
  const [showVerses, setShowVerses] = useState(false);
  // Si la pantalla se reutiliza con otros parámetros, seguirlos.
  useEffect(() => {
    setRef({ translationId: params.translationId, book: params.bookId, chapter: Number(params.chapter) });
    const verse = params.verse ? Number(params.verse) : null;
    setHighlight(verse);
    pendingVerse.current = verse;
  }, [params.translationId, params.bookId, params.chapter, params.verse]);

  const goToChapter = (next: ChapterReference) => {
    setHighlight(null);
    pendingVerse.current = null;
    setRef(next);
  };

  const goToVerse = (verse: number) => {
    setShowVerses(false);
    setHighlight(verse);
    const y = versePositions.current[verse];
    if (y !== undefined) scrollToY(y);
    else pendingVerse.current = verse;
  };

  const versePositions = useRef<Record<number, number>>({});
  const scrollToY = (y: number) =>
    scrollRef.current?.scrollTo({ y: Math.max(textCardY.current + Spacing.lg + y - Spacing.md, 0), animated: true });

  const handleVersePositions = (positions: Record<number, number>) => {
    versePositions.current = positions;
    const target = pendingVerse.current;
    if (target !== null && positions[target] !== undefined) {
      pendingVerse.current = null;
      // Esperar un frame para que el layout del ScrollView esté completo.
      requestAnimationFrame(() => scrollToY(positions[target]));
    }
  };

  const [data, setData] = useState<BibleChapter | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(FONT_SIZE_DEFAULT);

  useEffect(() => {
    getSettingValue('fontSize').then((size) => size && setFontSize(Math.min(Math.max(size, MIN_FONT), MAX_FONT)));
  }, []);

  const load = useCallback(async () => {
    setError(null);
    setData(null);
    versePositions.current = {};
    try {
      const chapter = await getChapter(ref.translationId, ref.book, ref.chapter);
      setData(chapter);
      navigation.setOptions({ title: `${chapter.book.commonName || chapter.book.name} ${chapter.chapter.number}` });
      setLastRead({
        translationId: ref.translationId,
        bookId: ref.book,
        bookName: chapter.book.commonName || chapter.book.name,
        chapter: chapter.chapter.number,
      });
      if (pendingVerse.current === null) scrollRef.current?.scrollTo({ y: 0, animated: false });
    } catch (e) {
      setError(e instanceof Error && e.message === 'Capítulo no encontrado'
        ? 'Este capítulo no está disponible en esta traducción.'
        : 'No se pudo cargar el capítulo. Revisa tu conexión a internet.');
    }
  }, [ref]);

  useEffect(() => {
    load();
  }, [load]);

  const changeFont = (delta: number) => {
    const next = Math.min(Math.max(fontSize + delta, MIN_FONT), MAX_FONT);
    setFontSize(next);
    updateSettingValue('fontSize', next);
  };

  const translation = getTranslation(ref.translationId);
  const bookName = data ? data.book.commonName || data.book.name : '';

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.chips}>
            <Chip label={translation.shortName} tone="accent" />
            {data && <Chip label={`${data.numberOfVerses} versículos`} />}
            {highlight !== null && (
              <TouchableOpacity onPress={() => setHighlight(null)} accessibilityLabel="Quitar resaltado">
                <Chip label={`v. ${highlight}  ✕`} tone="active" />
              </TouchableOpacity>
            )}
          </View>
          {data && (
            <View style={styles.titleRow}>
              <ThemedText style={styles.title}>{bookName}</ThemedText>
              <Text style={[styles.chapterNumber, { color: theme.secondary }]}>{data.chapter.number}</Text>
            </View>
          )}
        </View>

        <View style={[styles.toolbar, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.segment, { backgroundColor: theme.chip }]}>
            <TouchableOpacity onPress={() => changeFont(-2)} style={styles.segmentButton} accessibilityLabel="Reducir letra">
              <Text style={[styles.segmentLabel, { color: theme.text }]}>A−</Text>
            </TouchableOpacity>
            <Text style={[styles.segmentSize, { color: theme.textMuted }]}>{fontSize}px</Text>
            <TouchableOpacity onPress={() => changeFont(2)} style={styles.segmentButton} accessibilityLabel="Aumentar letra">
              <Text style={[styles.segmentLabel, { color: theme.text }]}>A+</Text>
            </TouchableOpacity>
          </View>
          <ThemedText type="caption" numberOfLines={1} style={styles.translationName}>
            {translation.name}
          </ThemedText>
          <TouchableOpacity
            disabled={!data}
            onPress={() => setShowVerses(true)}
            style={[styles.verseButton, { backgroundColor: theme.chip }]}
            accessibilityLabel="Ir a un versículo"
          >
            <Ionicons name="list" size={15} color={theme.primary} />
            <Text style={[styles.verseButtonText, { color: theme.primary }]}>Versículo</Text>
          </TouchableOpacity>
        </View>

        <View
          onLayout={(e) => (textCardY.current = e.nativeEvent.layout.y)}
          style={[styles.textCard, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          {error ? (
            <View style={styles.state}>
              <Ionicons name="cloud-offline-outline" size={28} color={theme.textMuted} />
              <ThemedText type="caption" style={styles.stateText}>{error}</ThemedText>
              <TouchableOpacity onPress={load} style={[styles.retry, { borderColor: theme.primary }]}>
                <Text style={[styles.retryText, { color: theme.primary }]}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : !data ? (
            <View style={styles.state}>
              <ActivityIndicator color={theme.secondary} />
            </View>
          ) : (
            <BibleChapterText
              content={data.chapter.content}
              footnotes={data.chapter.footnotes}
              fontSize={fontSize}
              highlightVerse={highlight}
              onVersePositions={handleVersePositions}
            />
          )}
        </View>

        <ThemedText type="caption" style={styles.attribution}>
          Texto: {translation.name} · bible.helloao.org
        </ThemedText>
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          { backgroundColor: theme.card, borderTopColor: theme.border, paddingBottom: Math.max(insets.bottom, Spacing.sm) },
        ]}
      >
        <TouchableOpacity
          disabled={!data?.previousChapterReference}
          onPress={() => data?.previousChapterReference && goToChapter(data.previousChapterReference)}
          style={[styles.navButton, { borderColor: theme.border, opacity: data?.previousChapterReference ? 1 : 0.35 }]}
          accessibilityLabel="Capítulo anterior"
        >
          <Ionicons name="chevron-back" size={18} color={theme.primary} />
          <Text style={[styles.navText, { color: theme.primary }]}>Anterior</Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={!data?.nextChapterReference}
          onPress={() => data?.nextChapterReference && goToChapter(data.nextChapterReference)}
          style={[styles.navButton, styles.navPrimary, { backgroundColor: theme.primary, opacity: data?.nextChapterReference ? 1 : 0.35 }]}
          accessibilityLabel="Capítulo siguiente"
        >
          <Text style={[styles.navText, { color: theme.onPrimary }]}>Siguiente</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.onPrimary} />
        </TouchableOpacity>
      </View>

      <Sheet
        visible={showVerses}
        onClose={() => setShowVerses(false)}
        eyebrow={data ? `${bookName} ${data.chapter.number}` : ''}
        title="Ir al versículo"
      >
        <VerseGrid count={data?.numberOfVerses ?? 0} selected={highlight} onSelect={goToVerse} />
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.gutter,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
  },
  hero: { gap: Spacing.sm + 4 },
  chips: { flexDirection: 'row', gap: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm, flexWrap: 'wrap' },
  title: { fontFamily: Fonts.serifBold, fontSize: 28, lineHeight: 36, letterSpacing: -0.3 },
  chapterNumber: { fontFamily: Fonts.serif, fontSize: 28, lineHeight: 36 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 6,
  },
  segment: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.md },
  segmentButton: { width: 40, height: 38, alignItems: 'center', justifyContent: 'center' },
  segmentLabel: { fontFamily: Fonts.sansSemiBold, fontSize: 15 },
  segmentSize: { fontFamily: Fonts.sansMedium, fontSize: 12, paddingHorizontal: 4 },
  translationName: { flex: 1, textAlign: 'right' },
  verseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 34,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
  },
  verseButtonText: { fontFamily: Fonts.sansSemiBold, fontSize: 13 },
  textCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.gutter,
    paddingVertical: Spacing.lg,
  },
  state: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl },
  stateText: { textAlign: 'center' },
  retry: { borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Spacing.md, height: 40, justifyContent: 'center', marginTop: Spacing.sm },
  retryText: { fontFamily: Fonts.sansSemiBold, fontSize: 14 },
  attribution: { textAlign: 'center' },
  bottomBar: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.gutter,
    paddingTop: Spacing.sm + 2,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  navButton: {
    flex: 1,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  navPrimary: { borderWidth: 0 },
  navText: { fontFamily: Fonts.sansSemiBold, fontSize: 15 },
});
