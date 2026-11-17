import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useThemeColor';
import { useSession } from '@/utils/session';
import { Fonts } from '@/constants/Typography';

/**
 * Acceso a Perfil arriba a la derecha (reemplaza la pestaña Perfil): foto de la cuenta de Google,
 * su inicial si no hay foto, o un ícono de persona en modo invitado.
 */
export default function ProfileButton() {
  const theme = useTheme();
  const router = useRouter();
  const { mode, user } = useSession();
  const [imageFailed, setImageFailed] = useState(false);

  const signedIn = mode === 'google' && !!user;
  const label = signedIn ? `Perfil de ${user?.name ?? 'tu cuenta'}` : 'Perfil';

  return (
    <TouchableOpacity
      onPress={() => router.push('/perfil')}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={[styles.ring, { borderColor: signedIn ? theme.secondary : theme.border }]}
    >
      {signedIn && user?.photoURL && !imageFailed ? (
        <Image source={{ uri: user.photoURL }} style={styles.avatar} onError={() => setImageFailed(true)} />
      ) : signedIn ? (
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <Text style={[styles.initial, { color: theme.onPrimary }]}>
            {(user?.name ?? user?.email ?? '?').charAt(0).toUpperCase()}
          </Text>
        </View>
      ) : (
        <View style={[styles.avatar, { backgroundColor: theme.chip }]}>
          <Ionicons name="person-outline" size={18} color={theme.secondary} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const SIZE = 36;
const styles = StyleSheet.create({
  ring: { width: SIZE + 4, height: SIZE + 4, borderRadius: (SIZE + 4) / 2, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: SIZE, height: SIZE, borderRadius: SIZE / 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  initial: { fontFamily: Fonts.serifBold, fontSize: 16 },
});
