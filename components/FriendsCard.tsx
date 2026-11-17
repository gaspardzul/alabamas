import React, { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useThemeColor';
import { friendsAvailable, getInviteLink, removeFriend, resetInviteLink, useFriends, Friend } from '@/utils/friends';
import { useSession } from '@/utils/session';
import { shareText } from '@/utils/share';
import { showDialog } from '@/utils/dialog';
import { Fonts, Radius, Spacing } from '@/constants/Typography';

/** Amigos en Perfil: invitar por enlace, cambiar el enlace y ver/quitar amigos. Solo con cuenta. */
export default function FriendsCard({ onMessage }: { onMessage?: (text: string) => void }) {
  const theme = useTheme();
  const session = useSession();
  const { friends, loading } = useFriends();
  const [busy, setBusy] = useState(false);

  if (!friendsAvailable || session.mode !== 'google') return null;

  const invite = async (reset = false) => {
    setBusy(true);
    try {
      const link = reset ? await resetInviteLink() : await getInviteLink();
      const name = session.user?.name ?? 'Un amigo';
      const result = await shareText(
        `${name} te invita a ser su amigo en Alaba+ para compartir listas de alabanzas: ${link}`,
        'Invitación a Alaba+'
      );
      if (result === 'copied') onMessage?.(reset ? 'Enlace nuevo copiado' : 'Enlace de invitación copiado');
      if (result === 'failed') onMessage?.('No se pudo compartir el enlace');
    } catch (error) {
      onMessage?.(error instanceof Error ? error.message : 'No se pudo crear la invitación');
    } finally {
      setBusy(false);
    }
  };

  const confirmReset = () =>
    showDialog(
      'Cambiar enlace',
      'El enlace que ya enviaste dejará de funcionar. Tus amigos actuales no se ven afectados.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cambiar y compartir', onPress: () => invite(true) },
      ]
    );

  const confirmRemove = (friend: Friend) =>
    showDialog(
      'Quitar amigo',
      `${friend.name ?? 'Esta persona'} dejará de estar en tus amigos. Las listas que ya le compartiste siguen compartidas hasta que le quites el acceso.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Quitar',
          style: 'destructive',
          onPress: () => removeFriend(friend.uid).catch(() => onMessage?.('No se pudo quitar. Revisa tu conexión.')),
        },
      ]
    );

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.title}>Amigos</ThemedText>
          <ThemedText type="caption">Para compartir listas de alabanzas</ThemedText>
        </View>
        {!loading && friends.length > 0 && (
          <View style={[styles.count, { backgroundColor: theme.chip }]}>
            <Text style={[styles.countText, { color: theme.secondary }]}>{friends.length}</Text>
          </View>
        )}
      </View>

      {loading ? (
        <ActivityIndicator color={theme.secondary} />
      ) : friends.length === 0 ? (
        <ThemedText type="caption">
          Envía tu enlace de invitación por WhatsApp o correo. Cuando tu amigo lo abra y acepte, podrán compartirse listas.
        </ThemedText>
      ) : (
        <View>
          {friends.map((friend) => (
            <View key={friend.uid} style={[styles.friend, { borderBottomColor: theme.border }]}>
              {friend.photoURL ? (
                <Image source={{ uri: friend.photoURL }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: theme.chip }]}>
                  <Text style={[styles.initial, { color: theme.secondary }]}>{(friend.name ?? '?').charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.name} numberOfLines={1}>{friend.name ?? 'Sin nombre'}</ThemedText>
                {friend.since ? (
                  <ThemedText type="caption">Desde {new Date(friend.since).toLocaleDateString()}</ThemedText>
                ) : null}
              </View>
              <TouchableOpacity onPress={() => confirmRemove(friend)} hitSlop={8} accessibilityLabel={`Quitar a ${friend.name ?? 'amigo'}`}>
                <Ionicons name="person-remove-outline" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        disabled={busy}
        onPress={() => invite(false)}
        style={[styles.primary, { backgroundColor: theme.primary }]}
        accessibilityLabel="Invitar amigos"
      >
        {busy ? (
          <ActivityIndicator color={theme.onPrimary} />
        ) : (
          <>
            <Ionicons name="person-add-outline" size={18} color={theme.onPrimary} />
            <Text style={[styles.primaryText, { color: theme.onPrimary }]}>Invitar amigos</Text>
          </>
        )}
      </TouchableOpacity>
      <TouchableOpacity disabled={busy} onPress={confirmReset} hitSlop={8} style={{ alignSelf: 'center' }}>
        <Text style={[styles.link, { color: theme.textMuted }]}>Cambiar mi enlace de invitación</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.gutter, gap: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  title: { fontFamily: Fonts.serifBold, fontSize: 16, lineHeight: 22 },
  count: { minWidth: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  countText: { fontFamily: Fonts.sansBold, fontSize: 13 },
  friend: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: Fonts.serifBold, fontSize: 16 },
  name: { fontFamily: Fonts.sansMedium, fontSize: 15 },
  primary: { height: 46, borderRadius: Radius.md, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  primaryText: { fontFamily: Fonts.sansSemiBold, fontSize: 15 },
  link: { fontFamily: Fonts.sansMedium, fontSize: 13 },
});
