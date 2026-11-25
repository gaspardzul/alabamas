import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import type { StackNavigationProp } from '@react-navigation/stack';
import { ThemedText } from '@/components/ThemedText';
import ScreenHeader from '@/components/ScreenHeader';
import SearchBar from '@/components/SearchBar';
import ListItem from '@/components/ListItem';
import Loader from '@/components/Loader';
import { useTheme } from '@/hooks/useThemeColor';
import { FONT_SIZE_DEFAULT, useSettings } from '@/hooks/useSettings';
import { useSession } from '@/utils/session';
import { signInWithGoogle } from '@/utils/auth';
import { usePredicas } from '@/hooks/usePredicas';
import { formatFecha, puntosCount } from '@/utils/predicaText';
import { normalizarTexto } from '@/utils/functions';
import { showDialog } from '@/utils/dialog';
import { Predica } from '@/ts/interfaces';
import { RootStackParamList } from '@/ts/types';
import { Fonts, Radius, Spacing } from '@/constants/Typography';

type NavigationProp = StackNavigationProp<RootStackParamList, 'PredicaDetail'>;

const shortDate = (iso?: string) => (iso ? formatFecha(iso) : 'Sin fecha');

/**
 * Prédicas: solo con cuenta de Google. El invitado ve la pestaña, pero al tocarla
 * se le invita a registrarse; la lista, el editor y el Modo Púlpito son del usuario
 * con sesión, y sus prédicas se sincronizan con su cuenta.
 */
const Predicas: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const router = useRouter();
  const session = useSession();
  const { settings } = useSettings();
  const fontSize = Math.min(settings.fontSize ?? FONT_SIZE_DEFAULT, 27);
  const { predicas, loaded, reload, create, remove, duplicate } = usePredicas();

  const [busqueda, setBusqueda] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const handleGoogle = async () => {
    setSignInError(null);
    setSigningIn(true);
    try {
      await signInWithGoogle();
      // Al entrar, onAuthStateChanged pone mode en 'google' y esta pantalla muestra la lista.
    } catch (e) {
      setSignInError(e instanceof Error ? e.message : 'No se pudo iniciar sesión.');
    } finally {
      setSigningIn(false);
    }
  };

  const sections = useMemo(() => {
    const query = normalizarTexto(busqueda.trim());
    const matches = predicas.filter((p) => {
      if (!query) return true;
      const haystack = normalizarTexto(
        [p.title, p.passage, p.passageText ?? '', p.series ?? '', ...p.blocks.map((b) => `${b.title ?? ''} ${b.text}`)].join(' ')
      );
      return haystack.includes(query);
    });
    // Por fecha de predicación (la más reciente primero); sin fecha, por última edición.
    const sorted = [...matches].sort((a, b) => {
      const da = a.date || '';
      const db = b.date || '';
      if (da !== db) return db.localeCompare(da);
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    const bySeries = new Map<string, Predica[]>();
    for (const p of sorted) {
      const key = p.series?.trim() || 'Sin serie';
      const list = bySeries.get(key) ?? [];
      list.push(p);
      bySeries.set(key, list);
    }
    return [...bySeries.entries()].map(([title, data]) => ({ title, data }));
  }, [predicas, busqueda]);

  const isEmpty = loaded && predicas.length === 0;
  const noResults = loaded && !isEmpty && sections.every((s) => s.data.length === 0);

  const openCreate = async () => {
    const predica = await create();
    navigation.navigate('PredicaDetail', { predicaId: predica.id });
  };

  const open = (predica: Predica) =>
    navigation.navigate('PredicaDetail', { predicaId: predica.id });

  const confirmDelete = (predica: Predica) =>
    showDialog('Eliminar prédica', `¿Eliminar “${predica.title || 'Prédica sin título'}”?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => remove(predica.id) },
    ]);

  const reuse = async (predica: Predica) => {
    const copy = await duplicate(predica.id);
    if (copy) navigation.navigate('PredicaDetail', { predicaId: copy.id });
  };

  if (session.mode !== 'google') {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Prédicas" />
        <View style={styles.gate}>
          <View style={[styles.gateIcon, { backgroundColor: theme.chip }]}>
            <Ionicons name="mic-outline" size={32} color={theme.secondary} />
          </View>
          <ThemedText type="subtitle" style={styles.center}>
            Prédicas
          </ThemedText>
          <ThemedText type="caption" style={styles.center}>
            Crea tus prédicas, guárdalas en tu cuenta y llévalas en todos tus dispositivos. Para usar
            este módulo, crea tu cuenta con Google.
          </ThemedText>
          <TouchableOpacity
            disabled={signingIn}
            onPress={handleGoogle}
            style={[styles.button, { backgroundColor: theme.primary }]}
            accessibilityLabel="Crear mi cuenta con Google"
          >
            {signingIn ? (
              <ActivityIndicator color={theme.onPrimary} />
            ) : (
              <>
                <Ionicons name="logo-google" size={18} color={theme.onPrimary} />
                <Text style={[styles.buttonText, { color: theme.onPrimary }]}>
                  Crear mi cuenta con Google
                </Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            disabled={signingIn}
            onPress={() => router.replace('/(tabs)')}
            style={[styles.button, { borderWidth: 1, borderColor: theme.primary }]}
            accessibilityLabel="Seguir como invitado"
          >
            <Ionicons name="person-outline" size={18} color={theme.primary} />
            <Text style={[styles.buttonText, { color: theme.primary }]}>Seguir como invitado</Text>
          </TouchableOpacity>
          {signInError && (
            <ThemedText type="caption" style={[styles.center, { color: theme.danger }]}>
              {signInError}
            </ThemedText>
          )}
        </View>
      </View>
    );
  }

  const renderItem = ({ item }: { item: Predica }) => {
    const puntos = puntosCount(item);
    return (
      <ListItem
        leadingIcon="mic-outline"
        title={item.title || 'Prédica sin título'}
        subtitle={`${item.passage || 'Sin pasaje'} · ${shortDate(item.date)} · ${puntos} ${puntos === 1 ? 'punto' : 'puntos'}`}
        tags={item.series?.trim() ? [item.series.trim()] : undefined}
        fontSize={fontSize}
        onPress={() => open(item)}
        leftIcon={{ name: 'copy-outline', color: theme.primary, onPress: () => reuse(item), label: 'Reutilizar prédica' }}
        rightIcon={{ name: 'trash-outline', color: theme.textMuted, onPress: () => confirmDelete(item), label: 'Eliminar prédica' }}
      />
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Prédicas">
        <SearchBar value={busqueda} onChangeText={setBusqueda} onCreate={openCreate} placeholder="Buscar prédica" />
      </ScreenHeader>

      {!loaded ? (
        <Loader label="Cargando prédicas…" />
      ) : isEmpty ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.chip }]}>
            <Ionicons name="mic-outline" size={28} color={theme.secondary} />
          </View>
          <ThemedText type="subtitle">{busqueda ? 'Sin resultados' : 'Aún no tienes prédicas'}</ThemedText>
          <ThemedText type="caption" style={styles.center}>
            {busqueda
              ? 'Ninguna prédica coincide con tu búsqueda.'
              : 'Crea tu primera prédica: bosquejo por bloques, pasaje y sus himnos.'}
          </ThemedText>
          {!busqueda && (
            <TouchableOpacity style={[styles.button, styles.emptyButton, { backgroundColor: theme.primary }]} onPress={openCreate}>
              <Ionicons name="add" size={20} color={theme.onPrimary} />
              <ThemedText style={[styles.buttonText, { color: theme.onPrimary }]}>Nueva prédica</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      ) : noResults ? (
        <View style={styles.empty}>
          <ThemedText type="subtitle">Sin resultados</ThemedText>
          <ThemedText type="caption" style={styles.center}>
            Ninguna prédica coincide con tu búsqueda.
          </ThemedText>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          stickySectionHeadersEnabled={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <ThemedText type="label" style={{ color: theme.textMuted }}>{section.title}</ThemedText>
              <View style={[styles.rule, { backgroundColor: theme.border }]} />
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingBottom: Spacing.xl },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.gutter,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  rule: { flex: 1, height: StyleSheet.hairlineWidth },
  empty: { alignItems: 'center', gap: Spacing.sm, paddingTop: 72, paddingHorizontal: Spacing.xl },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  center: { textAlign: 'center' },
  emptyButton: { marginTop: Spacing.md, paddingHorizontal: Spacing.lg },
  button: { height: 48, borderRadius: Radius.md, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontFamily: Fonts.sansSemiBold, fontSize: 15 },
  gate: { alignItems: 'center', gap: Spacing.sm, paddingTop: 72, paddingHorizontal: Spacing.xl },
  gateIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
});

export default Predicas;
