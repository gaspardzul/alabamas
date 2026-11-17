import React, { useMemo, useState } from 'react';
import { SectionList, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from 'expo-router';
import type { StackNavigationProp } from '@react-navigation/stack';
import { ThemedText } from '@/components/ThemedText';
import ScreenHeader from '@/components/ScreenHeader';
import SearchBar from '@/components/SearchBar';
import ListItem from '@/components/ListItem';
import Sheet from '@/components/Sheet';
import Loader from '@/components/Loader';
import { useTheme } from '@/hooks/useThemeColor';
import { FONT_SIZE_DEFAULT, useSettings } from '@/hooks/useSettings';
import { HymnList, listsApi, ownerName, useCanShare, useLists } from '@/utils/lists';
import { normalizarTexto } from '@/utils/functions';
import { showDialog } from '@/utils/dialog';
import { RootStackParamList } from '@/ts/types';
import { Fonts, Radius, Spacing } from '@/constants/Typography';

type NavigationProp = StackNavigationProp<RootStackParamList, 'ListDetail'>;

const plural = (n: number) => `${n} ${n === 1 ? 'himno' : 'himnos'}`;
const shortDate = (iso: string) => new Date(iso).toLocaleDateString();

/** Mis Listas: listas propias y, con cuenta, las que otros compartieron conmigo. */
const MyLists: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { settings } = useSettings();
  const fontSize = Math.min(settings.fontSize ?? FONT_SIZE_DEFAULT, 27);
  const { lists, loading } = useLists();
  const canShare = useCanShare();

  const [busqueda, setBusqueda] = useState('');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editing, setEditing] = useState<HymnList | null>(null);
  const [name, setName] = useState('');

  const sections = useMemo(() => {
    const query = normalizarTexto(busqueda.trim());
    const matches = lists.filter((l) => !query || normalizarTexto(l.name).includes(query));
    const own = matches.filter((l) => l.role === 'owner');
    const shared = matches.filter((l) => l.role !== 'owner');
    return [
      { key: 'own', title: canShare ? 'Mis listas' : '', data: own },
      ...(shared.length ? [{ key: 'shared', title: 'Compartidas conmigo', data: shared }] : []),
    ];
  }, [lists, busqueda, canShare]);

  const isEmpty = !loading && sections.every((s) => s.data.length === 0);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setSheetVisible(true);
  };

  const openRename = (list: HymnList) => {
    setEditing(list);
    setName(list.name);
    setSheetVisible(true);
  };

  const closeSheet = () => {
    setSheetVisible(false);
    setEditing(null);
    setName('');
  };

  const save = async () => {
    if (!name.trim()) return;
    if (editing) await listsApi.rename(editing.id, name);
    else await listsApi.create(name);
    closeSheet();
  };

  const confirmDelete = (list: HymnList) => {
    const sharedWith = Object.keys(list.members).length - 1;
    showDialog(
      'Eliminar lista',
      sharedWith > 0
        ? `“${list.name}” está compartida con ${sharedWith} ${sharedWith === 1 ? 'persona' : 'personas'}; también dejarán de verla.`
        : `¿Eliminar “${list.name}”?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => listsApi.remove(list.id) },
      ]
    );
  };

  const confirmLeave = (list: HymnList) =>
    showDialog('Dejar de ver esta lista', `“${list.name}” de ${ownerName(list)} ya no aparecerá en tus listas.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir de la lista', style: 'destructive', onPress: () => listsApi.leave(list.id) },
    ]);

  const open = (list: HymnList) => navigation.navigate('ListDetail', { listId: list.id, name: list.name });

  const renderItem = ({ item }: { item: HymnList }) => {
    if (item.role !== 'owner') {
      return (
        <ListItem
          leadingIcon="people-outline"
          title={item.name}
          subtitle={`De ${ownerName(item)} · ${item.role === 'editor' ? 'Puedes editar' : 'Solo lectura'} · ${plural(item.himnos.length)}`}
          fontSize={fontSize}
          onPress={() => open(item)}
          rightIcon={{ name: 'exit-outline', color: theme.textMuted, onPress: () => confirmLeave(item), label: 'Salir de la lista' }}
        />
      );
    }
    const sharedWith = Object.keys(item.members).length - 1;
    return (
      <ListItem
        leadingIcon="musical-notes-outline"
        title={item.name}
        subtitle={`${plural(item.himnos.length)} · ${sharedWith > 0 ? `Compartida con ${sharedWith}` : shortDate(item.createdAt)}`}
        fontSize={fontSize}
        onPress={() => open(item)}
        leftIcon={{ name: 'create-outline', color: theme.primary, onPress: () => openRename(item), label: 'Renombrar' }}
        rightIcon={{ name: 'trash-outline', color: theme.textMuted, onPress: () => confirmDelete(item), label: 'Eliminar lista' }}
      />
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader eyebrow="Planificador" title="Mis Listas">
        <SearchBar value={busqueda} onChangeText={setBusqueda} onCreate={openCreate} placeholder="Buscar lista" />
      </ScreenHeader>

      {loading ? (
        <Loader label="Cargando listas…" />
      ) : isEmpty ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.chip }]}>
            <Ionicons name="list-outline" size={28} color={theme.secondary} />
          </View>
          <ThemedText type="subtitle">{busqueda ? 'Sin resultados' : 'No hay listas creadas'}</ThemedText>
          <ThemedText type="caption" style={styles.center}>
            {busqueda
              ? 'Ninguna lista coincide con tu búsqueda.'
              : 'Crea una lista para preparar el orden de alabanzas de un culto.'}
          </ThemedText>
          {!busqueda && (
            <TouchableOpacity style={[styles.button, styles.emptyButton, { backgroundColor: theme.primary }]} onPress={openCreate}>
              <Ionicons name="add" size={20} color={theme.onPrimary} />
              <ThemedText style={[styles.buttonText, { color: theme.onPrimary }]}>Nueva lista</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          stickySectionHeadersEnabled={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          renderSectionHeader={({ section }) =>
            section.title ? (
              <View style={styles.sectionHeader}>
                <ThemedText type="label" style={{ color: theme.textMuted }}>{section.title}</ThemedText>
                <View style={[styles.rule, { backgroundColor: theme.border }]} />
              </View>
            ) : null
          }
          renderSectionFooter={({ section }) =>
            section.key === 'own' && section.data.length === 0 ? (
              <ThemedText type="caption" style={styles.sectionEmpty}>Aún no tienes listas propias.</ThemedText>
            ) : null
          }
        />
      )}

      <Sheet
        visible={sheetVisible}
        onClose={closeSheet}
        eyebrow="Mis listas"
        title={editing ? 'Renombrar lista' : 'Crear nueva lista'}
      >
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
          value={name}
          onChangeText={setName}
          placeholder="Nombre de la lista"
          placeholderTextColor={theme.textMuted}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={save}
        />
        <View style={styles.modalButtons}>
          <TouchableOpacity style={[styles.button, styles.flex, { borderColor: theme.primary, borderWidth: 1 }]} onPress={closeSheet}>
            <ThemedText style={[styles.buttonText, { color: theme.primary }]}>Cancelar</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.flex, { backgroundColor: theme.primary }]} onPress={save}>
            <ThemedText style={[styles.buttonText, { color: theme.onPrimary }]}>{editing ? 'Guardar' : 'Crear'}</ThemedText>
          </TouchableOpacity>
        </View>
      </Sheet>
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
  sectionEmpty: { paddingHorizontal: Spacing.gutter, paddingBottom: Spacing.sm },
  empty: { alignItems: 'center', gap: Spacing.sm, paddingTop: 72, paddingHorizontal: Spacing.xl },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  center: { textAlign: 'center' },
  emptyButton: { marginTop: Spacing.md, paddingHorizontal: Spacing.lg },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    fontSize: 16,
    fontFamily: Fonts.sans,
    marginBottom: Spacing.md,
  },
  modalButtons: { flexDirection: 'row', gap: Spacing.sm },
  flex: { flex: 1 },
  button: { height: 48, borderRadius: Radius.md, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontFamily: Fonts.sansSemiBold, fontSize: 15 },
});

export default MyLists;
