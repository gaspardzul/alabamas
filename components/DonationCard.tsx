import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useThemeColor';
import links from '@/constants/links.json';
import { Fonts, Radius, Spacing } from '@/constants/Typography';

/**
 * Invitación a donar. El enlace (constants/links.json) abre Mercado Pago fuera de la app:
 * Alaba+ no procesa ni guarda datos de pago (así lo dice la política de privacidad).
 *  - variant "full": tarjeta completa en Perfil.
 *  - variant "compact": recordatorio discreto al final de Inicio.
 */
export default function DonationCard({ variant = 'full' }: { variant?: 'full' | 'compact' }) {
  const theme = useTheme();
  const donate = () => Linking.openURL(links.donationUrl);

  if (variant === 'compact') {
    return (
      <TouchableOpacity
        onPress={donate}
        activeOpacity={0.8}
        style={[styles.compact, { backgroundColor: theme.card, borderColor: theme.border }]}
        accessibilityRole="link"
        accessibilityLabel={`Donar a Alaba+ con ${links.donationProvider}`}
      >
        <View style={[styles.heart, { backgroundColor: theme.chorusSoft }]}>
          <Ionicons name="heart" size={18} color={theme.chorus} />
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.compactTitle}>¿Alaba+ es de bendición para ti?</ThemedText>
          <ThemedText type="caption">Ayúdanos a mantenerla gratuita y sin anuncios.</ThemedText>
        </View>
        <Text style={[styles.compactAction, { color: theme.secondary }]}>Donar</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.header}>
        <View style={[styles.heart, { backgroundColor: theme.chorusSoft }]}>
          <Ionicons name="heart" size={20} color={theme.chorus} />
        </View>
        <ThemedText style={styles.title}>Apoya Alaba+</ThemedText>
      </View>
      <ThemedText style={styles.paragraph}>
        Esta app es totalmente gratuita y sin anuncios, pero su mantenimiento tiene un costo mensual. Si te ha sido de
        bendición, considera apoyarla para que podamos seguir mejorándola y agregar nuevas funciones.
      </ThemedText>
      <TouchableOpacity
        onPress={donate}
        style={[styles.button, { backgroundColor: theme.primary }]}
        accessibilityRole="link"
        accessibilityLabel={`Donar con ${links.donationProvider}`}
      >
        <Ionicons name="heart-outline" size={18} color={theme.onPrimary} />
        <Text style={[styles.buttonText, { color: theme.onPrimary }]}>Donar con {links.donationProvider}</Text>
      </TouchableOpacity>
      <View style={styles.noteRow}>
        <Ionicons name="lock-closed-outline" size={13} color={theme.textMuted} />
        <ThemedText type="caption" style={{ flex: 1 }}>
          Tú eliges el monto. El pago se hace en {links.donationProvider}; Alaba+ no recibe ni guarda tus datos de pago.
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.gutter, gap: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm + 2 },
  heart: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: Fonts.serifBold, fontSize: 18, lineHeight: 26 },
  paragraph: { fontFamily: Fonts.serifLight, fontSize: 16, lineHeight: 26 },
  button: { height: 50, borderRadius: Radius.md, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontFamily: Fonts.sansSemiBold, fontSize: 16 },
  noteRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  compactTitle: { fontFamily: Fonts.serifBold, fontSize: 15, lineHeight: 21 },
  compactAction: { fontFamily: Fonts.sansSemiBold, fontSize: 14 },
});
