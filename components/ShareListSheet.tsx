import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Sheet from '@/components/Sheet';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useThemeColor';
import { useFriends, getInviteLink } from '@/utils/friends';
import { HymnList, listsApi, ListRole, MemberInfo } from '@/utils/lists';
import { shareText } from '@/utils/share';
import { getSession } from '@/utils/session';
import { Fonts, Radius, Spacing } from '@/constants/Typography';

type Access = 'none' | 'viewer' | 'editor';

const OPTIONS: { key: Access; label: string }[] = [
  { key: 'none', label: 'Sin acceso' },
  { key: 'viewer', label: 'Lectura' },
  { key: 'editor', label: 'Edición' },
];

interface Person {
  uid: string;
  name: string | null;
  photoURL: string | null;
  isFriend: boolean;
}

/** Hoja para que el dueño elija con qué amigos compartir la lista y con qué permiso. */
export default function ShareListSheet({
  list,
  visible,
  onClose,
  onMessage,
}: {
  list: HymnList | null;
  visible: boolean;
  onClose: () => void;
  onMessage?: (text: string) => void;
}) {
  const theme = useTheme();
  const { friends, loading } = useFriends();
  const [draft, setDraft] = useState<Record<string, Access>>({});
  const [inviting, setInviting] = useState(false);

  const current = useMemo<Record<string, Access>>(() => {
    const result: Record<string, Access> = {};
    for (const [uid, role] of Object.entries(list?.members ?? {})) {
      if (role !== 'owner') result[uid] = role;
    }
    return result;
  }, [list?.members]);

  useEffect(() => {
    if (visible) setDraft(current);
  }, [visible, current]);

  // Amigos + miembros actuales que ya no son amigos (para poder quitarles el acceso).
  const people = useMemo<Person[]>(() => {
    const byUid = new Map<string, Person>();
    friends.forEach((f) => byUid.set(f.uid, { uid: f.uid, name: f.name, photoURL: f.photoURL, isFriend: true }));
    Object.keys(current).forEach((uid) => {
      if (!byUid.has(uid)) {
        const info = list?.memberInfo[uid];
        byUid.set(uid, { uid, name: info?.name ?? null, photoURL: info?.photoURL ?? null, isFriend: false });
      }
    });
    return [...byUid.values()];
  }, [friends, current, list?.memberInfo]);

  const changes = useMemo(() => {
    const result: Record<string, Exclude<ListRole, 'owner'> | null> = {};
    for (const person of people) {
      const before = current[person.uid] ?? 'none';
      const after = draft[person.uid] ?? 'none';
      if (before !== after) result[person.uid] = after === 'none' ? null : after;
    }
    return result;
  }, [people, current, draft]);

  const hasChanges = Object.keys(changes).length > 0;

  const save = async () => {
    if (!list || !hasChanges) return onClose();
    const info: Record<string, MemberInfo> = {};
    people.forEach((p) => (info[p.uid] = { name: p.name, photoURL: p.photoURL }));
    await listsApi.share(list.id, changes, info);
    const sharedCount = people.filter((p) => (draft[p.uid] ?? 'none') !== 'none').length;
    onClose();
    onMessage?.(sharedCount ? `Compartida con ${sharedCount} ${sharedCount === 1 ? 'persona' : 'personas'}` : 'La lista ya no está compartida');
  };

  const invite = async () => {
    setInviting(true);
    try {
      const link = await getInviteLink();
      const name = getSession().user?.name ?? 'Un amigo';
      const result = await shareText(
        `${name} te invita a ser su amigo en Alaba+ para compartir listas de alabanzas: ${link}`,
        'Invitación a Alaba+'
      );
      if (result === 'copied') onMessage?.('Enlace de invitación copiado');
    } catch (error) {
      onMessage?.(error instanceof Error ? error.message : 'No se pudo crear la invitación');
    } finally {
      setInviting(false);
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} eyebrow={list?.name ?? ''} title="Compartir lista">
      {loading ? (
        <ActivityIndicator color={theme.secondary} style={{ paddingVertical: Spacing.lg }} />
      ) : people.length === 0 ? (
        <View style={styles.empty}>
          <ThemedText type="caption" style={styles.center}>
            Aún no tienes amigos en Alaba+. Envíales tu enlace de invitación; cuando lo acepten podrás compartirles tus listas.
          </ThemedText>
          <TouchableOpacity
            disabled={inviting}
            onPress={invite}
            style={[styles.primary, { backgroundColor: theme.primary }]}
          >
            <Ionicons name="person-add-outline" size={18} color={theme.onPrimary} />
            <Text style={[styles.primaryText, { color: theme.onPrimary }]}>Invitar amigos</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ThemedText type="caption">
            Lectura: ven la lista y la presentan. Edición: además agregan, quitan y reordenan himnos.
          </ThemedText>
          <ScrollView style={{ maxHeight: 360, marginTop: Spacing.sm }}>
            {people.map((person) => {
              const value = draft[person.uid] ?? 'none';
              return (
                <View key={person.uid} style={[styles.person, { borderBottomColor: theme.border }]}>
                  <View style={styles.personRow}>
                    {person.photoURL ? (
                      <Image source={{ uri: person.photoURL }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatar, { backgroundColor: theme.chip }]}>
                        <Text style={[styles.initial, { color: theme.secondary }]}>
                          {(person.name ?? '?').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <ThemedText style={styles.name} numberOfLines={1}>{person.name ?? 'Sin nombre'}</ThemedText>
                      {!person.isFriend && <ThemedText type="caption">Ya no es tu amigo</ThemedText>}
                    </View>
                  </View>
                  <View style={[styles.segment, { backgroundColor: theme.chip }]}>
                    {OPTIONS.map((option) => {
                      const active = value === option.key;
                      return (
                        <TouchableOpacity
                          key={option.key}
                          onPress={() => setDraft((d) => ({ ...d, [person.uid]: option.key }))}
                          style={[styles.segmentItem, active && { backgroundColor: theme.primary }]}
                          accessibilityState={{ selected: active }}
                          accessibilityLabel={`${person.name ?? ''}: ${option.label}`}
                        >
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
                </View>
              );
            })}
          </ScrollView>
          <TouchableOpacity onPress={save} style={[styles.primary, { backgroundColor: theme.primary, marginTop: Spacing.md }]}>
            <Text style={[styles.primaryText, { color: theme.onPrimary }]}>{hasChanges ? 'Guardar' : 'Listo'}</Text>
          </TouchableOpacity>
        </>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  empty: { gap: Spacing.md, paddingBottom: Spacing.sm },
  center: { textAlign: 'center' },
  person: { paddingVertical: Spacing.sm + 2, gap: Spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: Fonts.serifBold, fontSize: 16 },
  name: { fontFamily: Fonts.sansMedium, fontSize: 15 },
  segment: { flexDirection: 'row', borderRadius: Radius.md, padding: 3 },
  segmentItem: { flex: 1, height: 34, borderRadius: Radius.md - 2, alignItems: 'center', justifyContent: 'center' },
  segmentText: { fontSize: 13 },
  primary: { height: 48, borderRadius: Radius.md, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  primaryText: { fontFamily: Fonts.sansSemiBold, fontSize: 15 },
});
