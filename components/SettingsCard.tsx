import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useThemeColor';
import { FONT_SIZE_DEFAULT, FONT_SIZE_MAX, FONT_SIZE_MIN, useSettings } from '@/hooks/useSettings';
import { setThemePreference, ThemePreference, useThemePreference } from '@/utils/themePreference';
import { Fonts, Radius, Spacing } from '@/constants/Typography';
import features from '@/constants/features.json';

type Order = 'numAsc' | 'numDesc' | 'asc' | 'desc';

const THEMES: { key: ThemePreference; label: string; icon: string }[] = [
  { key: 'system', label: 'Sistema', icon: 'phone-portrait-outline' },
  { key: 'light', label: 'Claro', icon: 'sunny-outline' },
  { key: 'dark', label: 'Oscuro', icon: 'moon-outline' },
];

const ORDERS: { key: Order; label: string }[] = [
  { key: 'numAsc', label: 'Número 1 → 999' },
  { key: 'numDesc', label: 'Número 999 → 1' },
  { key: 'asc', label: 'Título A → Z' },
  { key: 'desc', label: 'Título Z → A' },
];

/** Ajustes de lectura y apariencia en Perfil. Se sincronizan con la cuenta de Google. */
export default function SettingsCard() {
  const theme = useTheme();
  const { settings, updateSettingValue } = useSettings();
  const themePreference = useThemePreference();
  // Valor local inmediato: si se toca A+ varias veces seguidas, cada toque parte del último
  // valor y no del que todavía se está guardando.
  const [fontSize, setFontSize] = useState(settings.fontSize ?? FONT_SIZE_DEFAULT);
  const latest = useRef(fontSize);
  useEffect(() => {
    const stored = settings.fontSize ?? FONT_SIZE_DEFAULT;
    latest.current = stored;
    setFontSize(stored);
  }, [settings.fontSize]);

  const setFont = (value: number) => {
    const next = Math.min(Math.max(value, FONT_SIZE_MIN), FONT_SIZE_MAX);
    latest.current = next;
    setFontSize(next);
    updateSettingValue('fontSize', next);
  };
  const changeFont = (delta: number) => setFont(latest.current + delta);

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {/* Tamaño de letra */}
      <View style={styles.section}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.title}>Tamaño de letra</ThemedText>
            <ThemedText type="caption">{features.bible ? 'Himnos, listas y Biblia' : 'Himnos y listas'}</ThemedText>
          </View>
          <View style={[styles.stepper, { backgroundColor: theme.chip }]}>
            <TouchableOpacity
              onPress={() => changeFont(-2)}
              disabled={fontSize <= FONT_SIZE_MIN}
              style={[styles.stepButton, fontSize <= FONT_SIZE_MIN && styles.disabled]}
              accessibilityLabel="Reducir letra"
            >
              <Text style={[styles.stepLabel, { color: theme.text }]}>A−</Text>
            </TouchableOpacity>
            <Text style={[styles.stepValue, { color: theme.textMuted }]}>{fontSize}px</Text>
            <TouchableOpacity
              onPress={() => changeFont(2)}
              disabled={fontSize >= FONT_SIZE_MAX}
              style={[styles.stepButton, fontSize >= FONT_SIZE_MAX && styles.disabled]}
              accessibilityLabel="Aumentar letra"
            >
              <Text style={[styles.stepLabel, { color: theme.text }]}>A+</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={[styles.preview, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <Text
            style={{ fontFamily: Fonts.serifLight, fontSize, lineHeight: Math.round(fontSize * 1.6), color: theme.text }}
          >
            Cantad alegres a Dios, habitantes de toda la tierra.
          </Text>
        </View>
        {fontSize !== FONT_SIZE_DEFAULT && (
          <TouchableOpacity onPress={() => setFont(FONT_SIZE_DEFAULT)} hitSlop={8}>
            <Text style={[styles.link, { color: theme.secondary }]}>Restablecer ({FONT_SIZE_DEFAULT}px)</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      {/* Tema */}
      <View style={styles.section}>
        <ThemedText style={styles.title}>Apariencia</ThemedText>
        <View style={[styles.segment, { backgroundColor: theme.chip }]}>
          {THEMES.map((option) => {
            const active = themePreference === option.key;
            return (
              <TouchableOpacity
                key={option.key}
                onPress={() => setThemePreference(option.key)}
                style={[styles.segmentItem, active && { backgroundColor: theme.primary }]}
                accessibilityState={{ selected: active }}
              >
                <Ionicons name={option.icon as any} size={16} color={active ? theme.onPrimary : theme.text} />
                <Text
                  style={[
                    styles.segmentText,
                    { color: active ? theme.onPrimary : theme.text, fontFamily: active ? Fonts.sansSemiBold : Fonts.sansMedium },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {themePreference === 'system' && (
          <ThemedText type="caption">Sigue el modo claro u oscuro de tu dispositivo.</ThemedText>
        )}
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      {/* Orden de la lista */}
      <View style={styles.section}>
        <ThemedText style={styles.title}>Orden de las alabanzas</ThemedText>
        <View style={styles.chips}>
          {ORDERS.map((option) => {
            const active = settings.order === option.key;
            return (
              <TouchableOpacity
                key={option.key}
                onPress={() => updateSettingValue('order', option.key)}
                style={[
                  styles.chip,
                  { backgroundColor: active ? theme.primary : theme.chip },
                ]}
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.chipText, { color: active ? theme.onPrimary : theme.text }]}>{option.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.gutter, gap: Spacing.md },
  section: { gap: Spacing.sm + 2 },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  title: { fontFamily: Fonts.serifBold, fontSize: 16, lineHeight: 22 },
  stepper: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.md },
  stepButton: { width: 42, height: 40, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.35 },
  stepLabel: { fontFamily: Fonts.sansSemiBold, fontSize: 15 },
  stepValue: { fontFamily: Fonts.sansMedium, fontSize: 12, minWidth: 36, textAlign: 'center' },
  preview: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md },
  link: { fontFamily: Fonts.sansSemiBold, fontSize: 13 },
  divider: { height: 1 },
  segment: { flexDirection: 'row', borderRadius: Radius.md, padding: 4 },
  segmentItem: {
    flex: 1,
    height: 40,
    borderRadius: Radius.md - 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  segmentText: { fontSize: 13 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: { paddingHorizontal: 12, height: 36, borderRadius: Radius.lg, justifyContent: 'center' },
  chipText: { fontFamily: Fonts.sansMedium, fontSize: 13 },
});
