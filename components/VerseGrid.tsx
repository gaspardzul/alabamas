import React from 'react';
import { FlatList, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useTheme } from '@/hooks/useThemeColor';
import { Fonts, Radius, Spacing } from '@/constants/Typography';

/** Cuadrícula de números (6 columnas) para elegir capítulo o versículo dentro de una hoja. */
export default function VerseGrid({
  count,
  selected,
  onSelect,
}: {
  count: number;
  selected?: number | null;
  onSelect: (n: number) => void;
}) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const size = Math.floor((Math.min(width, 680) - Spacing.gutter * 2 - 8 * 5) / 6);

  return (
    <FlatList
      data={Array.from({ length: count }, (_, i) => i + 1)}
      keyExtractor={(n) => String(n)}
      numColumns={6}
      columnWrapperStyle={{ gap: 8 }}
      contentContainerStyle={{ gap: 8, paddingBottom: Spacing.sm }}
      renderItem={({ item: n }) => {
        const active = n === selected;
        return (
          <TouchableOpacity
            onPress={() => onSelect(n)}
            style={{
              width: size,
              height: size,
              borderRadius: Radius.md,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: active ? theme.primary : theme.chip,
            }}
          >
            <Text style={{ fontFamily: Fonts.sansSemiBold, fontSize: 15, color: active ? theme.onPrimary : theme.text }}>
              {n}
            </Text>
          </TouchableOpacity>
        );
      }}
    />
  );
}
