import React, { useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useBottomInset, useTopInset } from '@/utils/safeArea';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import features from '@/constants/features.json';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useThemeColor';
import { continueAsGuest, signInWithGoogle } from '@/utils/auth';
import { Fonts, Radius, Spacing } from '@/constants/Typography';

/** Primera pantalla: elegir entre cuenta de Google o modo invitado. */
export default function WelcomeScreen() {
  const theme = useTheme();
  const topPadding = useTopInset(Spacing.xl);
  const bottomPadding = useBottomInset(Spacing.xl);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[
        styles.container,
        { paddingTop: topPadding, paddingBottom: bottomPadding },
      ]}
    >
      <View style={styles.hero}>
        <Image source={require('@/assets/images/icon.png')} style={styles.logo} />
        <ThemedText type="label">{features.bible ? 'Himnario y Biblia' : 'Himnario'}</ThemedText>
        <ThemedText style={styles.title}>Alaba+</ThemedText>
        <ThemedText style={[styles.verse, { color: theme.textMuted }]}>
          «Cantad alegres a Dios, habitantes de toda la tierra.»
        </ThemedText>
        <ThemedText type="link">Salmo 100:1</ThemedText>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          disabled={loading}
          onPress={handleGoogle}
          style={[styles.button, { backgroundColor: theme.primary }]}
          accessibilityLabel="Continuar con Google"
        >
          {loading ? (
            <ActivityIndicator color={theme.onPrimary} />
          ) : (
            <>
              <Ionicons name="logo-google" size={18} color={theme.onPrimary} />
              <Text style={[styles.buttonText, { color: theme.onPrimary }]}>Continuar con Google</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          disabled={loading}
          onPress={continueAsGuest}
          style={[styles.button, { borderWidth: 1, borderColor: theme.primary }]}
          accessibilityLabel="Continuar como invitado"
        >
          <Ionicons name="person-outline" size={18} color={theme.primary} />
          <Text style={[styles.buttonText, { color: theme.primary }]}>Continuar como invitado</Text>
        </TouchableOpacity>

        {error && (
          <ThemedText type="caption" style={[styles.center, { color: theme.danger }]}>
            {error}
          </ThemedText>
        )}

        <View style={[styles.note, { backgroundColor: theme.chip }]}>
          <View style={styles.noteRow}>
            <Ionicons name="cloud-outline" size={16} color={theme.secondary} />
            <ThemedText type="caption" style={styles.noteText}>
              <Text style={{ fontFamily: Fonts.sansSemiBold, color: theme.text }}>Con Google</Text>, tus favoritos,
              listas y ajustes se guardan en tu cuenta y los ves en todos tus dispositivos.
            </ThemedText>
          </View>
          <View style={styles.noteRow}>
            <Ionicons name="phone-portrait-outline" size={16} color={theme.secondary} />
            <ThemedText type="caption" style={styles.noteText}>
              <Text style={{ fontFamily: Fonts.sansSemiBold, color: theme.text }}>Como invitado</Text>, todo se guarda
              solo en este dispositivo. Puedes iniciar sesión después desde Perfil.
            </ThemedText>
          </View>
        </View>

        <ThemedText type="caption" style={styles.center}>
          Al continuar aceptas nuestra{' '}
          <Text style={{ color: theme.secondary, fontFamily: Fonts.sansSemiBold }} onPress={() => router.push('/privacidad')}>
            política de privacidad
          </Text>
          .
        </ThemedText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.gutter,
    gap: Spacing.xl,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  hero: { alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xl },
  logo: { width: 88, height: 88, borderRadius: 22, marginBottom: Spacing.md },
  title: { fontFamily: Fonts.serifBold, fontSize: 40, lineHeight: 50 },
  verse: { fontFamily: Fonts.serifItalic, fontSize: 17, lineHeight: 27, textAlign: 'center', marginTop: Spacing.sm },
  actions: { gap: Spacing.sm + 4 },
  button: {
    height: 52,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  buttonText: { fontFamily: Fonts.sansSemiBold, fontSize: 16 },
  center: { textAlign: 'center' },
  note: { borderRadius: Radius.md, padding: Spacing.md, gap: Spacing.sm + 2, marginTop: Spacing.sm },
  noteRow: { flexDirection: 'row', gap: Spacing.sm },
  noteText: { flex: 1 },
});
