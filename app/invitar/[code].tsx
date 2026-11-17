import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useThemeColor';
import { useSession } from '@/utils/session';
import { signInWithGoogle } from '@/utils/auth';
import { acceptInvite, friendsAvailable, getInvite, Invite, useFriends } from '@/utils/friends';
import { Fonts, Radius, Spacing } from '@/constants/Typography';

/**
 * Página del enlace de invitación (alabamas.org/invitar/{código}). Es una ruta pública:
 * app/_layout.tsx no muestra la bienvenida aquí, porque quien llega puede no tener cuenta aún.
 */
type State =
  | { kind: 'loading' }
  | { kind: 'invalid' }
  | { kind: 'self' }
  | { kind: 'ready'; invite: Invite }
  | { kind: 'done'; invite: Invite };

export default function InvitePage() {
  const theme = useTheme();
  const router = useRouter();
  const session = useSession();
  const { code } = useLocalSearchParams<{ code: string }>();
  const { friends } = useFriends();
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signedIn = session.mode === 'google' && !!session.user;

  useEffect(() => {
    if (!signedIn || !code) return;
    setState({ kind: 'loading' });
    getInvite(code)
      .then((invite) => {
        if (!invite) setState({ kind: 'invalid' });
        else if (invite.uid === session.user?.uid) setState({ kind: 'self' });
        else setState({ kind: 'ready', invite });
      })
      .catch(() => setState({ kind: 'invalid' }));
  }, [signedIn, code]);

  const alreadyFriend = state.kind === 'ready' && friends.some((f) => f.uid === state.invite.uid);

  const login = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión.');
    } finally {
      setBusy(false);
    }
  };

  const accept = async () => {
    if (state.kind !== 'ready') return;
    setError(null);
    setBusy(true);
    try {
      const invite = await acceptInvite(state.invite.code);
      setState({ kind: 'done', invite });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo aceptar la invitación.');
    } finally {
      setBusy(false);
    }
  };

  const goHome = () => router.replace('/');
  const goProfile = () => router.replace('/perfil');

  const Avatar = ({ invite }: { invite: Invite }) =>
    invite.photoURL ? (
      <Image source={{ uri: invite.photoURL }} style={styles.avatar} />
    ) : (
      <View style={[styles.avatar, { backgroundColor: theme.chip }]}>
        <Text style={[styles.initial, { color: theme.secondary }]}>{(invite.name ?? '?').charAt(0).toUpperCase()}</Text>
      </View>
    );

  const Button = ({ label, onPress, primary = true, icon }: { label: string; onPress: () => void; primary?: boolean; icon?: string }) => (
    <TouchableOpacity
      disabled={busy}
      onPress={onPress}
      style={[styles.button, primary ? { backgroundColor: theme.primary } : { borderWidth: 1, borderColor: theme.primary }]}
    >
      {busy && primary ? (
        <ActivityIndicator color={theme.onPrimary} />
      ) : (
        <>
          {icon ? <Ionicons name={icon as any} size={18} color={primary ? theme.onPrimary : theme.primary} /> : null}
          <Text style={[styles.buttonText, { color: primary ? theme.onPrimary : theme.primary }]}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );

  let content: React.ReactNode;
  if (!friendsAvailable) {
    content = (
      <>
        <ThemedText style={styles.title}>Invitación a Alaba+</ThemedText>
        <ThemedText style={styles.body}>Abre este enlace en alabamas.org para aceptar la invitación.</ThemedText>
      </>
    );
  } else if (!signedIn) {
    content = (
      <>
        <Ionicons name="people-outline" size={40} color={theme.secondary} />
        <ThemedText style={styles.title}>Te invitaron a Alaba+</ThemedText>
        <ThemedText style={styles.body}>
          Inicia sesión con tu cuenta de Google para aceptar la invitación y compartir listas de alabanzas con tu amigo.
        </ThemedText>
        {session.googleAvailable ? (
          <Button label="Continuar con Google" icon="logo-google" onPress={login} />
        ) : (
          <ThemedText type="caption">El inicio de sesión no está disponible en este momento.</ThemedText>
        )}
        <Button label="Ahora no" primary={false} onPress={goHome} />
      </>
    );
  } else if (state.kind === 'loading') {
    content = <ActivityIndicator color={theme.secondary} />;
  } else if (state.kind === 'invalid') {
    content = (
      <>
        <Ionicons name="link-outline" size={40} color={theme.textMuted} />
        <ThemedText style={styles.title}>Invitación no válida</ThemedText>
        <ThemedText style={styles.body}>
          Este enlace no existe o quien te lo envió ya lo cambió. Pídele uno nuevo.
        </ThemedText>
        <Button label="Ir a Alaba+" onPress={goHome} />
      </>
    );
  } else if (state.kind === 'self') {
    content = (
      <>
        <Ionicons name="person-circle-outline" size={40} color={theme.secondary} />
        <ThemedText style={styles.title}>Este es tu enlace</ThemedText>
        <ThemedText style={styles.body}>Envíalo a tus amigos para que te agreguen.</ThemedText>
        <Button label="Ir a mi perfil" onPress={goProfile} />
      </>
    );
  } else if (state.kind === 'done') {
    content = (
      <>
        <Avatar invite={state.invite} />
        <ThemedText style={styles.title}>¡Ahora son amigos!</ThemedText>
        <ThemedText style={styles.body}>
          Tú y {state.invite.name ?? 'tu amigo'} ya pueden compartirse listas de alabanzas.
        </ThemedText>
        <Button label="Ver mis amigos" onPress={goProfile} />
      </>
    );
  } else {
    content = (
      <>
        <Avatar invite={state.invite} />
        <ThemedText style={styles.title}>{state.invite.name ?? 'Alguien'} te invitó a ser su amigo</ThemedText>
        <ThemedText style={styles.body}>
          Como amigos podrán compartirse listas de alabanzas para preparar el culto. Verá tu nombre y tu foto de Google.
        </ThemedText>
        {alreadyFriend ? (
          <>
            <ThemedText type="caption">Ya son amigos.</ThemedText>
            <Button label="Ver mis amigos" onPress={goProfile} />
          </>
        ) : (
          <>
            <Button label="Aceptar invitación" icon="checkmark" onPress={accept} />
            <Button label="Ahora no" primary={false} onPress={goHome} />
          </>
        )}
      </>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {content}
        {error && <ThemedText type="caption" style={{ color: theme.danger, textAlign: 'center' }}>{error}</ThemedText>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: Spacing.gutter, width: '100%', maxWidth: 480, alignSelf: 'center' },
  card: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.md, alignItems: 'stretch' },
  avatar: { width: 72, height: 72, borderRadius: 36, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: Fonts.serifBold, fontSize: 28 },
  title: { fontFamily: Fonts.serifBold, fontSize: 22, lineHeight: 30, textAlign: 'center' },
  body: { fontFamily: Fonts.serifLight, fontSize: 16, lineHeight: 25, textAlign: 'center' },
  button: { height: 48, borderRadius: Radius.md, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontFamily: Fonts.sansSemiBold, fontSize: 15 },
});
