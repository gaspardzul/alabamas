import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTopInset } from '@/utils/safeArea';
import { ThemedText } from '@/components/ThemedText';
import ProfileButton from '@/components/ProfileButton';
import { useTheme } from '@/hooks/useThemeColor';
import { Spacing } from '@/constants/Typography';

interface ScreenHeaderProps {
  eyebrow?: string;
  title: string;
  right?: ReactNode;
  children?: ReactNode;
  /** Ocultar el avatar de Perfil (p. ej. en la propia pantalla de Perfil). */
  hideProfile?: boolean;
}

/** Encabezado editorial de las pestañas: etiqueta terracota + título serif. */
export default function ScreenHeader({ eyebrow, title, right, children, hideProfile = false }: ScreenHeaderProps) {
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
        {right || !hideProfile ? (
          <View style={styles.right}>
            {right}
            {!hideProfile && <ProfileButton />}
          </View>
        ) : null}
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
