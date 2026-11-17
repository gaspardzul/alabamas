import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useThemeColor';
import { useColorScheme } from '@/hooks/useColorScheme';
import { setThemePreference } from '@/utils/themePreference';

/**
 * Cambio rápido de tema junto al avatar: luna en modo claro (pasa a oscuro) y sol en modo
 * oscuro (pasa a claro). Guarda la misma preferencia que Perfil → Apariencia; ahí se puede
 * volver a "Sistema".
 */
export default function ThemeToggle() {
  const theme = useTheme();
  const isDark = useColorScheme() === 'dark';

  return (
    <TouchableOpacity
      onPress={() => setThemePreference(isDark ? 'light' : 'dark')}
      accessibilityRole="button"
      accessibilityLabel={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      hitSlop={8}
      style={[styles.button, { backgroundColor: theme.chip, borderColor: theme.border }]}
    >
      <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={19} color={theme.primary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
