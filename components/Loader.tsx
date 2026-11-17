import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useThemeColor';
import { Spacing } from '@/constants/Typography';

/**
 * Indicador de carga centrado. Úsalo mientras los datos aún no llegan, en lugar de mostrar
 * un estado vacío ("Sin resultados", "Aún no hay…") que parece un error.
 */
export default function Loader({ label, fill = false }: { label?: string; fill?: boolean }) {
  const theme = useTheme();
  return (
    <View style={[styles.container, fill && styles.fill]} accessibilityRole="progressbar" accessibilityLabel={label ?? 'Cargando'}>
      <ActivityIndicator size="large" color={theme.secondary} />
      {label ? <ThemedText type="caption">{label}</ThemedText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl * 1.5 },
  fill: { flex: 1 },
});
