import React, { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useThemeColor';
import { useSession, SyncStatus } from '@/utils/session';
import { signInWithGoogle, signOut } from '@/utils/auth';
import { accountDeletionAvailable, deleteAccount } from '@/utils/account';
import { showDialog } from '@/utils/dialog';
import { Fonts, Radius, Spacing } from '@/constants/Typography';

const SYNC_LABEL: Record<SyncStatus, { icon: string; text: string }> = {
  idle: { icon: 'cloud-outline', text: 'Conectando…' },
  syncing: { icon: 'sync-outline', text: 'Sincronizando…' },
  synced: { icon: 'cloud-done-outline', text: 'Tus datos están sincronizados' },
  offline: { icon: 'cloud-offline-outline', text: 'Sin conexión: se sincronizará al volver' },
  error: { icon: 'alert-circle-outline', text: 'No se pudo sincronizar. Se reintentará.' },
};

/** Cuenta del usuario en Perfil: datos de Google y sincronización, o invitado con opción de iniciar sesión. */
export default function AccountCard() {
  const theme = useTheme();
  const session = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
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

  const handleDelete = () =>
    showDialog(
      'Eliminar mi cuenta',
      'Se borrarán de forma permanente tus favoritos, ajustes, tus listas (también para quienes las compartías), tus amistades y tu enlace de invitación. Saldrás de las listas que otros te compartieron. Esto no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar cuenta',
          style: 'destructive',
          onPress: async () => {
            setError(null);
            setLoading(true);
            try {
              await deleteAccount();
            } catch (e) {
              setError(e instanceof Error ? e.message : 'No se pudo eliminar la cuenta.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );

  const handleSignOut = () =>
    showDialog(
      'Cerrar sesión',
      'Tus favoritos, listas y ajustes se quitarán de este dispositivo, pero seguirán guardados en tu cuenta.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', style: 'destructive', onPress: () => signOut() },
      ]
    );

  if (session.mode === 'google' && session.user) {
    const { name, email, photoURL } = session.user;
    const sync = SYNC_LABEL[session.sync];
    const initial = (name ?? email ?? '?').charAt(0).toUpperCase();

    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.row}>
          {photoURL ? (
            <Image source={{ uri: photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
              <Text style={[styles.initial, { color: theme.onPrimary }]}>{initial}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.name} numberOfLines={1}>{name ?? 'Tu cuenta'}</ThemedText>
            {email ? <ThemedText type="caption" numberOfLines={1}>{email}</ThemedText> : null}
          </View>
        </View>
        <View style={[styles.syncRow, { backgroundColor: theme.chip }]}>
          <Ionicons
            name={sync.icon as any}
            size={16}
            color={session.sync === 'error' ? theme.danger : theme.tertiary}
          />
          <ThemedText type="caption" style={{ flex: 1 }}>{sync.text}</ThemedText>
        </View>
        <TouchableOpacity onPress={handleSignOut} style={[styles.button, { borderColor: theme.border }]}>
          <Ionicons name="log-out-outline" size={18} color={theme.text} />
          <Text style={[styles.buttonText, { color: theme.text }]}>Cerrar sesión</Text>
        </TouchableOpacity>
        {accountDeletionAvailable && (
          <TouchableOpacity disabled={loading} onPress={handleDelete} hitSlop={8} style={{ alignSelf: 'center' }}>
            {loading ? (
              <ActivityIndicator color={theme.danger} />
            ) : (
              <Text style={[styles.deleteText, { color: theme.danger }]}>Eliminar mi cuenta</Text>
            )}
          </TouchableOpacity>
        )}
        {error && <ThemedText type="caption" style={{ color: theme.danger, textAlign: 'center' }}>{error}</ThemedText>}
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.row}>
        <View style={[styles.avatar, { backgroundColor: theme.chip }]}>
          <Ionicons name="person-outline" size={22} color={theme.secondary} />
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.name}>Invitado</ThemedText>
          <ThemedText type="caption">Tus datos se guardan solo en este dispositivo.</ThemedText>
        </View>
      </View>
      {session.googleAvailable ? (
        <>
          <TouchableOpacity
            disabled={loading}
            onPress={handleSignIn}
            style={[styles.button, styles.primary, { backgroundColor: theme.primary }]}
          >
            {loading ? (
              <ActivityIndicator color={theme.onPrimary} />
            ) : (
              <>
                <Ionicons name="logo-google" size={17} color={theme.onPrimary} />
                <Text style={[styles.buttonText, { color: theme.onPrimary }]}>Iniciar sesión con Google</Text>
              </>
            )}
          </TouchableOpacity>
          <ThemedText type="caption">
            Lo que ya tienes en este dispositivo se combinará con tu cuenta.
          </ThemedText>
          {error && <ThemedText type="caption" style={{ color: theme.danger }}>{error}</ThemedText>}
        </>
      ) : (
        <ThemedText type="caption">
          El inicio de sesión con Google estará disponible próximamente en esta versión de la app.
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.gutter, gap: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: Fonts.serifBold, fontSize: 20 },
  name: { fontFamily: Fonts.serifBold, fontSize: 17, lineHeight: 24 },
  syncRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderRadius: Radius.md, padding: 10 },
  button: {
    height: 46,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  primary: { borderWidth: 0 },
  buttonText: { fontFamily: Fonts.sansSemiBold, fontSize: 15 },
  deleteText: { fontFamily: Fonts.sansMedium, fontSize: 13 },
});
