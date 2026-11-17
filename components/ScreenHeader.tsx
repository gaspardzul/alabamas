import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTopInset } from '@/utils/safeArea';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useThemeColor';
import { Spacing } from '@/constants/Typography';

interface ScreenHeaderProps {
  eyebrow?: string;
  title: string;
  right?: ReactNode;
  children?: ReactNode;
}

/** Encabezado editorial de las pestañas: etiqueta terracota + título serif. */
export default function ScreenHeader({ eyebrow, title, right, children }: ScreenHeaderProps) {
  const paddingTop = useTopInset(Spacing.sm);
  const theme = useTheme();

  return (
    <View style={[styles.container, { paddingTop, backgroundColor: theme.background }]}>
      <View style={styles.row}>
        <View style={styles.titles}>
          {eyebrow ? <ThemedText type="label">{eyebrow}</ThemedText> : null}
          <ThemedText type="title" numberOfLines={1}>
            {title}
          </ThemedText>
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.gutter,
    paddingBottom: Spacing.sm,
    gap: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  titles: {
    flex: 1,
    gap: 2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
});
