import { ScrollView, StyleSheet, Linking, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import ScreenHeader from '@/components/ScreenHeader';
import AccountCard from '@/components/AccountCard';
import SettingsCard from '@/components/SettingsCard';
import DonationCard from '@/components/DonationCard';
import links from '@/constants/links.json';
import FriendsCard from '@/components/FriendsCard';
import { useToast } from '@/components/Toast';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useThemeColor';
import { Fonts, Radius, Spacing } from '@/constants/Typography';

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { show: showMessage, element: toast } = useToast();

  return (
    <View style={{ flex: 1 }}>
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="Perfil"
        hideProfile
        right={
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            style={[styles.close, { backgroundColor: theme.chip }]}
            accessibilityLabel="Cerrar perfil"
            hitSlop={8}
          >
            <Ionicons name="close" size={20} color={theme.text} />
          </TouchableOpacity>
        }
      />

      <View style={styles.body}>
        <AccountCard />
        <FriendsCard onMessage={showMessage} />

        <ThemedText type="label" style={styles.sectionLabel}>Ajustes</ThemedText>
        <SettingsCard />

        <ThemedText type="label" style={styles.sectionLabel}>Apoya</ThemedText>
        <DonationCard />

        <ThemedText type="label" style={styles.sectionLabel}>Acerca de</ThemedText>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ThemedText style={[styles.greeting, { color: theme.primary }]}>¡Paz!</ThemedText>
          <ThemedText style={styles.paragraph}>
            Espero que esta app te sea de utilidad y de bendición para tu caminar cristiano. Se ha
            realizado con mucho cariño y dedicación para ti por:
          </ThemedText>
          <ThemedText style={styles.author}>Hno. Gaspar Dzul</ThemedText>
          <ThemedText style={styles.author}>Colaboración. Hno. Julián Dzul</ThemedText>

        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ThemedText type="label">Información</ThemedText>
          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => Linking.openURL(`mailto:${links.contactEmail}`)}
            accessibilityRole="link"
            accessibilityLabel={`Escribir un correo a ${links.contactEmail}`}
          >
            <Ionicons name="mail-outline" size={18} color={theme.textMuted} />
            <ThemedText>{links.contactEmail}</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => Linking.openURL(links.whatsappUrl)}
            accessibilityRole="link"
            accessibilityLabel={`Escribir por WhatsApp al ${links.whatsappNumber}`}
          >
            <Ionicons name="logo-whatsapp" size={18} color={theme.textMuted} />
            <ThemedText>{links.whatsappNumber}</ThemedText>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/privacidad')}
          style={[styles.linkRow, { borderColor: theme.border }]}
        >
          <Ionicons name="shield-checkmark-outline" size={18} color={theme.secondary} />
          <ThemedText style={{ flex: 1 }}>Política de privacidad</ThemedText>
          <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
        </TouchableOpacity>
      </View>
    </ScrollView>
    {toast}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: Spacing.xl,
  },
  body: {
    paddingHorizontal: Spacing.gutter,
    paddingTop: Spacing.sm,
    gap: Spacing.md,
  },
  close: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    marginTop: Spacing.sm,
  },
  card: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.gutter,
    gap: Spacing.sm + 2,
  },
  greeting: {
    fontFamily: Fonts.serifBold,
    fontSize: 22,
    lineHeight: 30,
  },
  paragraph: {
    fontFamily: Fonts.serifLight,
    fontSize: 16,
    lineHeight: 26,
  },
  author: {
    fontFamily: Fonts.serifItalic,
    fontSize: 16,
    lineHeight: 24,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: 52,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginTop: Spacing.sm,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 48,
    borderWidth: 1,
    borderRadius: Radius.md,
    marginTop: Spacing.xs,
  },
  buttonText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
  },
});
