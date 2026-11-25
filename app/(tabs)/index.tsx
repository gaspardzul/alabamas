import { useMemo } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import ScreenHeader from '@/components/ScreenHeader';
import { toTitleCase } from '@/components/ListItem';
import himnosData from '@/assets/himnos/lista.json';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useThemeColor';
import { Fonts, Radius, Spacing } from '@/constants/Typography';

export default function HomeScreen() {
  const totalAlabanzas = himnosData.lista.length;
  const router = useRouter();
  const theme = useTheme();

  const categorias = useMemo(() => {
    const grupos = himnosData.lista.reduce((acc, himno) => {
      if (Array.isArray(himno.group)) {
        // Set evita contar dos veces una categoría repetida en el mismo himno
        new Set(himno.group).forEach((categoria) => {
          acc[categoria] = (acc[categoria] ?? 0) + 1;
        });
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grupos);
  }, []);

  const navegarAAlabanzas = (category: string) => {
    router.push({
      pathname: '/(tabs)/explore',
      params: { category },
    });
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader title="Himnario" />

      <View style={styles.body}>
        <View style={[styles.verseCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.verseBadge, { backgroundColor: theme.chip }]}>
            <ThemedText type="label" style={{ color: theme.tertiary }}>
              Versículo
            </ThemedText>
          </View>
          <ThemedText style={[styles.verseText, { color: theme.text }]}>
            «Cantad alegres a Dios, habitantes de toda la tierra. Servid a Jehová con alegría; venid ante su presencia con regocijo.»
          </ThemedText>
          <View style={styles.citation}>
            <ThemedText type="link">Salmo 100:1-2</ThemedText>
            <ThemedText type="caption">RVR1960</ThemedText>
          </View>
        </View>

        <View style={[styles.statsRow, { borderColor: theme.border }]}>
          <View style={styles.stat}>
            <ThemedText style={[styles.statNumber, { color: theme.primary }]}>{totalAlabanzas}</ThemedText>
            <ThemedText type="caption">Alabanzas</ThemedText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.stat}>
            <ThemedText style={[styles.statNumber, { color: theme.primary }]}>{categorias.length}</ThemedText>
            <ThemedText type="caption">Categorías</ThemedText>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle">Categorías</ThemedText>
          <ThemedText type="caption">Toca para filtrar</ThemedText>
        </View>

        <View style={styles.grid}>
          {categorias.map(([categoria, count]) => (
            <TouchableOpacity
              key={categoria}
              activeOpacity={0.7}
              onPress={() => navegarAAlabanzas(categoria)}
              style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <ThemedText type="label" style={{ color: theme.textMuted }}>
                {count === 1 ? '1 himno' : `${count} himnos`}
              </ThemedText>
              <ThemedText style={styles.categoriaTitle} numberOfLines={2}>
                {toTitleCase(categoria)}
              </ThemedText>
              <View style={[styles.cardRule, { backgroundColor: theme.secondary }]} />
            </TouchableOpacity>
          ))}
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: Spacing.xl,
  },
  body: {
    paddingHorizontal: Spacing.gutter,
    paddingTop: Spacing.sm,
    gap: Spacing.lg,
  },
  verseCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg - 4,
    gap: Spacing.md,
  },
  verseBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.lg,
  },
  verseText: {
    fontFamily: Fonts.serifItalic,
    fontSize: 20,
    lineHeight: 32,
  },
  citation: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: Spacing.md,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statNumber: {
    fontFamily: Fonts.serifBold,
    fontSize: 26,
    lineHeight: 34,
  },
  statDivider: {
    width: 1,
    alignSelf: 'stretch',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: -Spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  card: {
    width: '48.3%',
    minHeight: 112,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: 6,
  },
  categoriaTitle: {
    fontFamily: Fonts.serifBold,
    fontSize: 17,
    lineHeight: 24,
  },
  cardRule: {
    marginTop: 'auto',
    width: 20,
    height: 2,
    borderRadius: 1,
  },
});
