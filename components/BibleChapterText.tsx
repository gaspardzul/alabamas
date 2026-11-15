import React, { useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ChapterContentItem, Footnote, VerseContentItem } from '@/utils/bibleApi';
import { useTheme } from '@/hooks/useThemeColor';
import { ThemedText } from '@/components/ThemedText';
import { Fonts, Radius, Spacing } from '@/constants/Typography';

type Span =
  | { kind: 'verse'; number: number }
  | { kind: 'text'; text: string; verse: number }
  | { kind: 'note'; noteId: number };

type Block =
  | { kind: 'heading'; text: string }
  | { kind: 'subtitle'; spans: Span[] }
  | { kind: 'para'; poem: number; spans: Span[] };

/**
 * Convierte el contenido de la API en bloques renderizables:
 * encabezados, subtítulos hebreos y párrafos (con sangría de poesía).
 * Si la traducción no trae saltos de párrafo (p. ej. RV1909), cada versículo
 * va en su propia línea, como en la Reina-Valera impresa.
 */
function buildBlocks(content: ChapterContentItem[]): Block[] {
  const lineBreaks =
    content.filter((i) => i.type === 'line_break').length +
    content.reduce(
      (n, i) =>
        n + (i.type === 'verse' ? i.content.filter((c) => typeof c === 'object' && 'lineBreak' in c).length : 0),
      0
    );
  const versePerLine = lineBreaks <= 1;

  const blocks: Block[] = [];
  type Para = Extract<Block, { kind: 'para' }>;
  let current = null as Para | null;
  // TS no sigue las mutaciones dentro de los closures; leemos el poema actual con esta función.
  const currentPoem = () => (current as Para | null)?.poem ?? 0;

  const flush = () => {
    if (current && current.spans.length > 0) blocks.push(current);
    current = null;
  };
  const para = (poem = 0) => {
    if (current && current.poem !== poem && current.spans.some((s) => s.kind === 'text')) flush();
    if (!current) current = { kind: 'para', poem, spans: [] };
    else current.poem = poem;
    return current;
  };
  const toSpans = (items: VerseContentItem[]): Span[] =>
    items.flatMap((c): Span[] => {
      if (typeof c === 'string') return [{ kind: 'text', text: c, verse: 0 }];
      if ('noteId' in c) return [{ kind: 'note', noteId: c.noteId }];
      if ('text' in c) return [{ kind: 'text', text: c.text, verse: 0 }];
      return [];
    });

  for (const item of content) {
    if (item.type === 'heading') {
      flush();
      blocks.push({ kind: 'heading', text: item.content.join(' ') });
    } else if (item.type === 'line_break') {
      flush();
    } else if (item.type === 'hebrew_subtitle') {
      flush();
      blocks.push({ kind: 'subtitle', spans: toSpans(item.content) });
    } else if (item.type === 'verse') {
      if (versePerLine) flush();
      const firstPoem = item.content.find((c): c is { text: string; poem?: number } => typeof c === 'object' && 'text' in c)?.poem ?? 0;
      para(firstPoem).spans.push({ kind: 'verse', number: item.number });

      for (const c of item.content) {
        if (typeof c === 'string') {
          para(currentPoem()).spans.push({ kind: 'text', text: c, verse: item.number });
        } else if ('lineBreak' in c) {
          flush();
        } else if ('heading' in c) {
          flush();
          blocks.push({ kind: 'heading', text: c.heading });
        } else if ('noteId' in c) {
          para(currentPoem()).spans.push({ kind: 'note', noteId: c.noteId });
        } else if ('text' in c) {
          para(c.poem ?? 0).spans.push({ kind: 'text', text: c.text, verse: item.number });
        }
      }
    }
  }
  flush();
  return blocks;
}

interface Props {
  content: ChapterContentItem[];
  footnotes: Footnote[];
  fontSize: number;
  /** Versículo a resaltar (fondo terracota suave). */
  highlightVerse?: number | null;
  /** Posición Y (relativa a este componente) del bloque donde empieza cada versículo. */
  onVersePositions?: (positions: Record<number, number>) => void;
}

export default function BibleChapterText({
  content,
  footnotes,
  fontSize,
  highlightVerse,
  onVersePositions,
}: Props) {
  const theme = useTheme();
  const blocks = useMemo(() => buildBlocks(content), [content]);
  const positions = useRef<Record<number, number>>({});

  // Versículos que empiezan en cada bloque, para mapear su posición al hacer layout.
  const verseStarts = useMemo(
    () =>
      blocks.map((b) =>
        b.kind === 'heading' ? [] : b.spans.flatMap((s) => (s.kind === 'verse' ? [s.number] : []))
      ),
    [blocks]
  );

  const handleBlockLayout = (index: number, y: number) => {
    if (!onVersePositions) return;
    verseStarts[index].forEach((n) => {
      positions.current[n] = y;
    });
    onVersePositions({ ...positions.current });
  };
  const noteIndex = useMemo(
    () => new Map(footnotes.map((f, i) => [f.noteId, i + 1])),
    [footnotes]
  );
  const lineHeight = Math.round(fontSize * 1.7);

  const renderSpans = (spans: Span[]) =>
    spans.map((s, i) => {
      if (s.kind === 'verse') {
        return (
          <Text
            key={i}
            style={[styles.verseNumber, { color: theme.secondary, fontSize: Math.max(11, fontSize * 0.62) }]}
          >
            {i === 0 ? '' : ' '}
            {s.number}{' '}
          </Text>
        );
      }
      if (s.kind === 'note') {
        const n = noteIndex.get(s.noteId);
        return n ? (
          <Text key={i} style={[styles.noteMarker, { color: theme.secondary, fontSize: Math.max(10, fontSize * 0.55) }]}>
            {' '}[{n}]
          </Text>
        ) : null;
      }
      const highlighted = highlightVerse != null && s.verse === highlightVerse;
      return (
        <Text key={i} style={highlighted ? { backgroundColor: theme.secondarySoft } : undefined}>
          {s.text}
        </Text>
      );
    });

  return (
    <View style={styles.container}>
      {blocks.map((block, i) => {
        if (block.kind === 'heading') {
          return (
            <ThemedText key={i} style={[styles.heading, { fontSize: Math.max(15, fontSize * 0.9) }]}>
              {block.text}
            </ThemedText>
          );
        }
        if (block.kind === 'subtitle') {
          return (
            <Text key={i} onLayout={(e) => handleBlockLayout(i, e.nativeEvent.layout.y)} style={[styles.subtitle, { color: theme.textMuted, fontSize: fontSize * 0.85 }]}>
              {renderSpans(block.spans)}
            </Text>
          );
        }
        return (
          <Text
            key={i}
            onLayout={(e) => handleBlockLayout(i, e.nativeEvent.layout.y)}
            style={[
              styles.paragraph,
              { color: theme.text, fontSize, lineHeight, paddingLeft: block.poem * Spacing.md },
              block.poem > 0 && styles.poemLine,
            ]}
          >
            {renderSpans(block.spans)}
          </Text>
        );
      })}

      {footnotes.length > 0 && (
        <View style={[styles.notes, { borderTopColor: theme.border }]}>
          <ThemedText type="label" style={{ color: theme.textMuted }}>Notas</ThemedText>
          {footnotes.map((f, i) => (
            <View key={f.noteId} style={styles.noteRow}>
              <Text style={[styles.noteNumber, { color: theme.secondary }]}>{i + 1}</Text>
              <ThemedText type="caption" style={styles.noteText}>
                {f.reference ? `${f.reference.chapter}:${f.reference.verse} · ` : ''}
                {f.text}
              </ThemedText>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm + 4,
  },
  heading: {
    fontFamily: Fonts.serifBold,
    marginTop: Spacing.sm,
  },
  subtitle: {
    fontFamily: Fonts.serifItalic,
  },
  paragraph: {
    fontFamily: Fonts.serifLight,
  },
  poemLine: {
    marginTop: -Spacing.xs,
  },
  verseNumber: {
    fontFamily: Fonts.sansBold,
  },
  noteMarker: {
    fontFamily: Fonts.sansSemiBold,
  },
  notes: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  noteRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  noteNumber: {
    fontFamily: Fonts.sansBold,
    fontSize: 12,
    lineHeight: 18,
    minWidth: 16,
    borderRadius: Radius.sm,
  },
  noteText: {
    flex: 1,
  },
});
