import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useThemeColor';
import { Fonts, Radius } from '@/constants/Typography';

interface ChipProps {
  label: string;
  tone?: 'neutral' | 'accent' | 'active';
  style?: ViewStyle;
}

/** Etiqueta pequeña para categorías, números de himno y metadatos. */
export default function Chip({ label, tone = 'neutral', style }: ChipProps) {
  const theme = useTheme();
  const palette = {
    neutral: { bg: theme.chip, fg: theme.tertiary },
    accent: { bg: theme.secondarySoft, fg: theme.onSecondarySoft },
    active: { bg: theme.primary, fg: theme.onPrimary },
  }[tone];

  return (
    <View style={[styles.chip, { backgroundColor: palette.bg }, style]}>
      <Text style={[styles.text, { color: palette.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.lg,
  },
  text: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.2,
  },
});
