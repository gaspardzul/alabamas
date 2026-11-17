import React, { ReactNode } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useTopInset } from '@/utils/safeArea';
import ProfileButton from '@/components/ProfileButton';
import { useTheme } from '@/hooks/useThemeColor';
import { Fonts, Radius, Spacing } from '@/constants/Typography';

interface ScreenHeaderProps {
  /** Sección actual (Himnario, Alabanzas, Favoritos…); se muestra bajo el nombre de la app. */
  title: string;
  right?: ReactNode;
  children?: ReactNode;
  /** Ocultar el avatar de Perfil (p. ej. en la propia pantalla de Perfil). */
  hideProfile?: boolean;
}

/**
 * Encabezado de las pantallas principales: ícono de Alaba+, el nombre de la app en serif y la
 * sección en terracota debajo; a la derecha, acciones de la pantalla y el avatar de Perfil.
 */
export default function ScreenHeader({ title, right, children, hideProfile = false }: ScreenHeaderProps) {
  const paddingTop = useTopInset(Spacing.sm);
  const theme = useTheme();

  return (
    <View style={[styles.container, { paddingTop, backgroundColor: theme.background }]}>
      <View style={styles.row}>
        <View style={styles.brand} accessibilityRole="header" accessibilityLabel={`Alaba+, ${title}`}>
          <Image source={require('@/assets/images/header-icon.png')} style={styles.icon} accessibilityIgnoresInvertColors />
          <View style={styles.titles}>
            <Text style={[styles.appName, { color: theme.primary }]} numberOfLines={1}>
              Alaba+
            </Text>
            <Text style={[styles.section, { color: theme.secondary }]} numberOfLines={1}>
              {title}
            </Text>
          </View>
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

const ICON = 48;
const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.gutter,
    paddingBottom: Spacing.sm,
    gap: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  brand: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    width: ICON,
    height: ICON,
    borderRadius: Radius.md + 4,
  },
  titles: {
    flex: 1,
  },
  appName: {
    fontFamily: Fonts.serifBold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  section: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
});
