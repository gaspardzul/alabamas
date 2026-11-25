import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from 'expo-router';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Loader from '@/components/Loader';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useThemeColor';
import { FONT_SIZE_DEFAULT, useSettings } from '@/hooks/useSettings';
import { usePredicas } from '@/hooks/usePredicas';
import {
  BLOCK_TYPE_META,
  buildPredicaText,
  formatFecha,
  predicaEstimatedMinutes,
  predicaHymns,
  HimnoResuelto,
} from '@/utils/predicaText';
import { generateAndSharePDF, generatePredicaHTML } from '@/utils/pdfGenerator';
import { showDialog } from '@/utils/dialog';
import { BloquePredica } from '@/ts/interfaces';
import { RootStackParamList } from '@/ts/types';
import { Fonts, Radius, Spacing } from '@/constants/Typography';

type PredicaPulpitoRouteProp = RouteProp<RootStackParamList, 'PredicaPulpito'>;

const formatSeconds = (total: number) => {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

/**
 * Modo Púlpito: el bosquejo completo en letra grande, un bloque por sección, con el
 * pasaje y los himnos al inicio y al final. Cronómetro total y por bloque (toca un
 * bloque para marcarlo como el actual). Todo es local: funciona sin internet.
 * Comparte el texto o el PDF desde los botones del encabezado.
 */
const PredicaPulpito: React.FC = () => {
  const route = useRoute<PredicaPulpitoRouteProp>();
  const navigation = useNavigation();
  const theme = useTheme();
  const { settings } = useSettings();
  const { predicas, loaded } = usePredicas();
  const predica = predicas.find((p) => p.id === route.params?.predicaId);

  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(true);
  const [currentBlock, setCurrentBlock] = useState(0);
  const [blockStart, setBlockStart] = useState(0);

  const estimatedMinutes = useMemo(
    () => (predica ? predicaEstimatedMinutes(predica) : 0),
    [predica]
  );

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [running]);

  const handleShareText = async () => {
    if (!predica) return;
    try {
      await Share.share({ message: buildPredicaText(predica), title: predica.title || 'Prédica' });
    } catch (error) {
      console.error('Error al compartir:', error);
    }
  };

  const handleSharePDF = async () => {
    if (!predica) return;
    try {
      const html = generatePredicaHTML(predica, settings.fontSize, predicaHymns(predica));
      await generateAndSharePDF(html, `${predica.title || 'Predica'}.pdf`);
    } catch (error) {
      showDialog('Error', 'No se pudo generar el PDF. Intenta de nuevo.');
      console.error(error);
    }
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={handleShareText} style={styles.headerButton} accessibilityLabel="Compartir texto">
            <Ionicons name="share-outline" size={21} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSharePDF} style={styles.headerButton} accessibilityLabel="Compartir PDF">
            <Ionicons name="document-text-outline" size={21} color={theme.primary} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, predica, theme]);

  if (!loaded) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
        <Loader label="Cargando prédica…" />
      </View>
    );
  }

  if (!predica) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.background, padding: Spacing.xl }]}>
        <Ionicons name="mic-off-outline" size={28} color={theme.textMuted} />
        <ThemedText type="subtitle">Prédica no disponible</ThemedText>
        <ThemedText type="caption" style={{ textAlign: 'center' }}>
          Esta prédica ya no existe.
        </ThemedText>
      </View>
    );
  }

  const fontSize = settings.fontSize ?? FONT_SIZE_DEFAULT;
  const lineStyle = { fontSize, lineHeight: Math.round(fontSize * 1.65) };
  const blockSeconds = seconds - blockStart;
  // Cerca del final del tiempo estimado: el cronómetro cambia de color.
  const nearEnd = estimatedMinutes > 0 && seconds >= estimatedMinutes * 60 * 0.9;

  const setCurrent = (index: number) => {
    setCurrentBlock(index);
    setBlockStart(seconds);
  };

  const nextBlock = () => {
    if (currentBlock < predica.blocks.length - 1) setCurrent(currentBlock + 1);
  };

  const renderHimno = (role: string, himno: HimnoResuelto, key: string) => (
    <View key={key} style={styles.himnoContainer}>
      <View style={styles.himnoHeader}>
        <ThemedText type="label">{role}</ThemedText>
        <ThemedText style={styles.himnoTitle}>
          Himno #{himno.number} · {himno.title}
        </ThemedText>
      </View>
      {himno.lyrics.map((verso, versoIndex) =>
        verso.verse === 0 ? (
          <View
            key={versoIndex}
            style={[styles.chorus, { backgroundColor: theme.chorusSoft, borderLeftColor: theme.chorus }]}
          >
            <ThemedText type="label" style={{ color: theme.chorus }}>
              Coro
            </ThemedText>
            <ThemedText style={[styles.coro, lineStyle, { color: theme.chorus }]}>{verso.text}</ThemedText>
          </View>
        ) : (
          <View key={versoIndex} style={styles.versoContainer}>
            <ThemedText type="label" style={{ color: theme.textMuted }}>
              Estrofa {verso.verse}
            </ThemedText>
            <ThemedText type="Himno" style={lineStyle}>
              {verso.text}
            </ThemedText>
          </View>
        )
      )}
    </View>
  );

  const renderBlock = (block: BloquePredica, index: number) => {
    const meta = BLOCK_TYPE_META[block.type];
    const isCurrent = index === currentBlock;
    return (
      <TouchableOpacity
        key={block.id}
        activeOpacity={0.85}
        onPress={() => setCurrent(index)}
        style={[
          styles.blockCard,
          {
            backgroundColor: isCurrent ? theme.chip : 'transparent',
            borderLeftColor: theme[meta.color],
          },
        ]}
        accessibilityLabel={`${meta.label}${block.title ? `: ${block.title}` : ''}. Toca para marcarlo como bloque actual.`}
      >
        <View style={styles.blockHead}>
          <ThemedText type="label" style={{ color: theme[meta.color] }}>
            {meta.label}
          </ThemedText>
          {isCurrent && (
            <ThemedText type="label" style={{ color: theme.textMuted }}>
              · Ahora · {formatSeconds(blockSeconds)}
            </ThemedText>
          )}
        </View>
        {block.title ? <ThemedText style={styles.blockTitle}>{block.title}</ThemedText> : null}
        {block.verseRef ? (
          <ThemedText type="caption" style={{ color: theme.secondary }}>
            {block.verseRef}
          </ThemedText>
        ) : null}
        <ThemedText type="Himno" style={lineStyle}>
          {block.text}
        </ThemedText>
      </TouchableOpacity>
    );
  };

  const hymns = predicaHymns(predica);
  const apertura = hymns.find((h) => h.role === 'Himno de apertura');
  const intermedios = hymns.filter((h) => h.role === 'Himno intermedio');
  const cierre = hymns.find((h) => h.role === 'Himno de cierre');

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.predicaHeader}>
          <ThemedText type="label">{predica.series || 'Prédica'}</ThemedText>
          <ThemedText style={styles.predicaTitle}>{predica.title || 'Prédica sin título'}</ThemedText>
          <ThemedText type="caption">
            {[predica.passage, predica.date ? formatFecha(predica.date) : ''].filter(Boolean).join(' · ')}
          </ThemedText>
        </View>

        {predica.passageText ? (
          <View style={[styles.chorus, { backgroundColor: theme.chorusSoft, borderLeftColor: theme.chorus }]}>
            {predica.passage ? (
              <ThemedText type="label" style={{ color: theme.chorus }}>
                {predica.passage}
              </ThemedText>
            ) : null}
            <ThemedText style={[styles.coro, lineStyle, { color: theme.chorus }]}>
              {predica.passageText}
            </ThemedText>
          </View>
        ) : null}

        {apertura ? renderHimno(apertura.role, apertura.himno, 'apertura') : null}

        {predica.blocks.map((block, index) => renderBlock(block, index))}

        {intermedios.map((h, i) => renderHimno(h.role, h.himno, `intermedio-${i}`))}

        {cierre ? renderHimno(cierre.role, cierre.himno, 'cierre') : null}

        <ThemedText type="caption" style={styles.estimate}>
          Tiempo estimado: ≈ {estimatedMinutes} min (estimado)
        </ThemedText>
      </ScrollView>

      <View style={[styles.timerBar, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <View style={styles.timerGroup}>
          <ThemedText type="label" style={{ color: theme.textMuted }}>
            Total
          </ThemedText>
          <Text style={[styles.timerText, { color: nearEnd ? theme.danger : theme.secondary }]}>
            {formatSeconds(seconds)}
          </Text>
        </View>
        <View style={styles.timerGroup}>
          <ThemedText type="label" style={{ color: theme.textMuted }}>
            Bloque actual
          </ThemedText>
          <Text style={[styles.timerText, { color: theme.text }]}>{formatSeconds(blockSeconds)}</Text>
        </View>
        <TouchableOpacity
          onPress={() => setRunning(!running)}
          style={[styles.timerButton, { borderColor: theme.border }]}
          accessibilityLabel={running ? 'Pausar cronómetro' : 'Reanudar cronómetro'}
        >
          <Ionicons name={running ? 'pause' : 'play'} size={20} color={theme.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={nextBlock}
          style={[styles.nextButton, { backgroundColor: theme.primary }]}
          accessibilityLabel="Siguiente bloque"
        >
          <Ionicons name="arrow-forward" size={18} color={theme.onPrimary} />
          <Text style={[styles.nextButtonText, { color: theme.onPrimary }]}>Siguiente</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  headerButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.gutter + 4,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl * 2,
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    gap: Spacing.lg,
  },
  predicaHeader: { alignItems: 'center', gap: Spacing.sm, paddingTop: Spacing.sm },
  predicaTitle: { fontFamily: Fonts.serifBold, fontSize: 28, lineHeight: 36, textAlign: 'center' },
  himnoContainer: { gap: Spacing.lg },
  himnoHeader: { alignItems: 'center', gap: Spacing.sm, paddingTop: Spacing.sm },
  himnoTitle: { fontFamily: Fonts.serifBold, fontSize: 26, lineHeight: 34, textAlign: 'center' },
  versoContainer: { gap: Spacing.sm },
  chorus: { borderLeftWidth: 2, borderRadius: Radius.md, padding: Spacing.md, gap: Spacing.sm },
  coro: { fontFamily: Fonts.serif },
  blockCard: {
    borderLeftWidth: 3,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  blockHead: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  blockTitle: { fontFamily: Fonts.serifBold, fontSize: 22, lineHeight: 30 },
  estimate: { textAlign: 'center' },
  timerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.gutter,
    paddingVertical: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  timerGroup: { gap: 2 },
  timerText: { fontFamily: Fonts.sansSemiBold, fontSize: 20, lineHeight: 26 },
  timerButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
  },
  nextButtonText: { fontFamily: Fonts.sansSemiBold, fontSize: 14 },
});

export default PredicaPulpito;
