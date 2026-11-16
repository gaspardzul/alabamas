import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useThemeColor';
import { Fonts, Radius, Spacing } from '@/constants/Typography';
import policy from '@/constants/privacyPolicy.json';

/**
 * Política de privacidad pública (https://alabamas.org/privacidad).
 * Es una ruta pública: app/_layout.tsx no muestra la bienvenida aquí, porque Google
 * (verificación de la marca OAuth) y cualquier visitante deben poder leerla sin entrar.
 * Si cambia qué datos se guardan, actualizar constants/privacyPolicy.json (texto y lastUpdated).
 */
type Block = string | { bullets: string[] };

// El texto vive en constants/privacyPolicy.json: lo usan esta pantalla y la página estática
// /privacidad que genera scripts/build-pwa.mjs (visible sin JavaScript para Google).
const LAST_UPDATED = policy.lastUpdated;
const CONTACT_EMAIL = policy.contactEmail;
const withEmail = (text: string) => text.replaceAll('{{email}}', CONTACT_EMAIL);
const SECTIONS = policy.sections.map((section) => ({
  title: section.title,
  body: (section.body as Block[]).map((block) =>
    typeof block === 'string' ? withEmail(block) : { bullets: block.bullets.map(withEmail) }
  ),
}));

export default function PrivacyPolicy() {
  const theme = useTheme();

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <ThemedText type="label">Alaba+</ThemedText>
        <ThemedText style={styles.title}>Política de privacidad</ThemedText>
        <ThemedText type="caption">Última actualización: {LAST_UPDATED}</ThemedText>
      </View>

      {SECTIONS.map((section) => (
        <View key={section.title} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
          {section.body.map((block, i) =>
            typeof block === 'string' ? (
              <ThemedText key={i} style={[styles.paragraph, { color: theme.text }]}>
                {block}
              </ThemedText>
            ) : (
              <View key={i} style={styles.bullets}>
                {block.bullets.map((item) => (
                  <View key={item} style={styles.bulletRow}>
                    <View style={[styles.dot, { backgroundColor: theme.secondary }]} />
                    <ThemedText style={[styles.paragraph, styles.bulletText, { color: theme.text }]}>{item}</ThemedText>
                  </View>
                ))}
              </View>
            )
          )}
        </View>
      ))}

      <Text
        style={[styles.mail, { color: theme.secondary }]}
        onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=Privacidad%20Alaba%2B`)}
      >
        {CONTACT_EMAIL}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.gutter,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl * 2,
    gap: Spacing.md,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  hero: { gap: Spacing.xs, marginBottom: Spacing.sm },
  title: { fontFamily: Fonts.serifBold, fontSize: 28, lineHeight: 36 },
  card: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.gutter, gap: Spacing.sm + 2 },
  sectionTitle: { fontFamily: Fonts.serifBold, fontSize: 18, lineHeight: 26 },
  paragraph: { fontFamily: Fonts.serifLight, fontSize: 16, lineHeight: 26 },
  bullets: { gap: Spacing.sm },
  bulletRow: { flexDirection: 'row', gap: Spacing.sm + 2 },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 11 },
  bulletText: { flex: 1 },
  mail: { fontFamily: Fonts.sansSemiBold, fontSize: 15, textAlign: 'center', marginTop: Spacing.sm },
});
