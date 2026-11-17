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
 * Montos fijos: un enlace de pago por monto (donationOptions); "Otro monto" usa el enlace libre.
 */
export default function DonationCard({ variant = 'full' }: { variant?: 'full' | 'compact' }) {
  const theme = useTheme();
  const open = (url: string) => Linking.openURL(url);

  const Amounts = ({ small = false }: { small?: boolean }) => (
    <View style={styles.amounts}>
      {links.donationOptions.map((option) => (
        <TouchableOpacity
          key={option.url}
          onPress={() => open(option.url)}
          style={[styles.amount, small && styles.amountSmall, { backgroundColor: theme.primary }]}
          accessibilityRole="link"
          accessibilityLabel={`Donar ${option.label} pesos con ${links.donationProvider}`}
        >
          <Text style={[styles.amountText, small && styles.amountTextSmall, { color: theme.onPrimary }]}>{option.label}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity
        onPress={() => open(links.donationUrl)}
        style={[styles.amount, small && styles.amountSmall, { borderWidth: 1, borderColor: theme.primary }]}
        accessibilityRole="link"
        accessibilityLabel={`Donar otro monto con ${links.donationProvider}`}
      >
        <Text style={[styles.amountText, small && styles.amountTextSmall, { color: theme.primary }]}>Otro</Text>
      </TouchableOpacity>
    </View>
  );

  if (variant === 'compact') {
    return (
      <View style={[styles.compact, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.compactHeader}>
          <View style={[styles.heart, { backgroundColor: theme.chorusSoft }]}>
            <Ionicons name="heart" size={18} color={theme.chorus} />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.compactTitle}>¿Alaba+ es de bendición para ti?</ThemedText>
            <ThemedText type="caption">Ayúdanos a mantenerla gratuita y sin anuncios.</ThemedText>
          </View>
        </View>
        <Amounts small />
      </View>
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
      <ThemedText type="label" style={{ color: theme.textMuted }}>Elige un monto (MXN)</ThemedText>
      <Amounts />
      <View style={styles.noteRow}>
        <Ionicons name="lock-closed-outline" size={13} color={theme.textMuted} />
        <ThemedText type="caption" style={{ flex: 1 }}>
          El pago se hace en {links.donationProvider}; Alaba+ no recibe ni guarda tus datos de pago.
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
  amounts: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  amount: {
    flexGrow: 1,
    flexBasis: '22%',
    minWidth: 64,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  amountSmall: { height: 40 },
  amountText: { fontFamily: Fonts.sansBold, fontSize: 16 },
  amountTextSmall: { fontSize: 14 },
  noteRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  compact: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md, gap: Spacing.md },
  compactHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  compactTitle: { fontFamily: Fonts.serifBold, fontSize: 15, lineHeight: 21 },
});
