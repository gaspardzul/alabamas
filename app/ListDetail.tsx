import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from 'expo-router';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import himnario from '@/assets/himnos/lista.json';
import ListItem, { toTitleCase } from '@/components/ListItem';
import ShareListSheet from '@/components/ShareListSheet';
import { ThemedText } from '@/components/ThemedText';
import { useToast } from '@/components/Toast';
import { useTheme } from '@/hooks/useThemeColor';
import { listsApi, ownerName, useCanShare, useList } from '@/utils/lists';
import { showDialog } from '@/utils/dialog';
import { RootStackParamList } from '@/ts/types';
import { Fonts, Radius, Spacing } from '@/constants/Typography';

type ListDetailRouteProp = RouteProp<RootStackParamList, 'ListDetail'>;
type NavigationProp = StackNavigationProp<RootStackParamList, 'HimnoDetail'>;

interface Row {
  number: number | string;
  title: string;
}

const byNumber = new Map<string, Row>(himnario.lista.map((h) => [String(h.number), h as Row]));

/**
 * Detalle de una lista (propia o compartida). Permisos:
 *  - dueño: reordenar, quitar himnos y compartir;
 *  - editor: reordenar y quitar himnos;
 *  - lector: ver, abrir himnos y presentar.
 * Los cambios de otros miembros llegan en vivo (onSnapshot); mientras se reordena se trabaja
 * sobre un borrador local que se guarda al confirmar.
 */
const ListDetail: React.FC = () => {
  const route = useRoute<ListDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const theme = useTheme();
  const listId = route.params?.listId;
  const { list, loading } = useList(listId);
  const canShare = useCanShare();
  const { show: showMessage, element: toast } = useToast();

  const [draft, setDraft] = useState<string[] | null>(null); // orden en edición
  const [shareVisible, setShareVisible] = useState(false);

  const isEditMode = draft !== null;
  const canEdit = list?.role === 'owner' || list?.role === 'editor';
  const isOwner = list?.role === 'owner';
  const hasChanges = !!draft && !!list && draft.join('|') !== list.himnos.join('|');
  const sharedWith = list ? Object.keys(list.members).length - 1 : 0;

  const rows = useMemo(
    () => (draft ?? list?.himnos ?? []).map((n) => byNumber.get(n)).filter((r): r is Row => !!r),
    [draft, list?.himnos]
  );

  const saveOrder = async () => {
    if (list && draft && hasChanges) {
      await listsApi.setHymns(list.id, draft);
      showMessage('Orden guardado');
    }
    setDraft(null);
  };

  const toggleEdit = () => (isEditMode ? saveOrder() : list && setDraft(list.himnos));

  const presentation = () => {
    if (!list) return;
    if (hasChanges) {
      showDialog('Cambios sin guardar', 'Guarda el orden antes de presentar.');
      return;
    }
    navigation.navigate('PresentationMode', { lista: { name: list.name, himnos: list.himnos } });
  };

  useEffect(() => {
    navigation.setOptions({
      title: list?.name ?? route.params?.name ?? 'Lista',
      headerRight: () =>
        list ? (
          <View style={styles.headerActions}>
            {isOwner && canShare && !isEditMode && (
              <TouchableOpacity onPress={() => setShareVisible(true)} style={styles.headerButton} accessibilityLabel="Compartir lista">
                <Ionicons name="person-add-outline" size={20} color={theme.primary} />
              </TouchableOpacity>
            )}
            {canEdit && (
              <TouchableOpacity onPress={toggleEdit} style={styles.headerButton} accessibilityLabel={isEditMode ? 'Guardar orden' : 'Reordenar'}>
                <Ionicons name={isEditMode ? 'checkmark' : 'swap-vertical'} size={22} color={isEditMode ? theme.tertiary : theme.primary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={presentation}
              style={[styles.headerPill, { backgroundColor: theme.primary }]}
              accessibilityLabel="Modo presentación"
            >
              <Ionicons name="play" size={14} color={theme.onPrimary} />
              <Text style={[styles.headerPillText, { color: theme.onPrimary }]}>Presentar</Text>
            </TouchableOpacity>
          </View>
        ) : null,
    });
  }, [list, isEditMode, hasChanges, theme, canShare]);

  // Avisar al salir con un orden sin guardar.
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!hasChanges) return;
      e.preventDefault();
      showDialog('Cambios sin guardar', 'Tienes cambios sin guardar. ¿Deseas guardar antes de salir?', [
        { text: 'Descartar', style: 'destructive', onPress: () => { setDraft(null); navigation.dispatch(e.data.action); } },
        { text: 'Guardar', onPress: async () => { await saveOrder(); navigation.dispatch(e.data.action); } },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    });
    return unsubscribe;
  }, [navigation, hasChanges, draft]);

  const removeHymn = (row: Row) =>
    showDialog('Quitar himno', `¿Quitar “${toTitleCase(row.title)}” de la lista?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: () => {
          if (draft) setDraft(draft.filter((h) => h !== String(row.number)));
          else if (list) listsApi.removeHymn(list.id, row.number);
        },
      },
    ]);

  const renderItem = ({ item, drag, isActive, getIndex }: RenderItemParams<Row>) => {
    const index = getIndex() ?? 0;
    return (
      <ScaleDecorator>
        <View style={[styles.row, { opacity: isActive ? 0.85 : 1 }]}>
          {isEditMode && (
            <TouchableOpacity onPressIn={drag} onLongPress={drag} style={styles.dragHandle} accessibilityLabel="Arrastrar para reordenar">
              <Ionicons name="reorder-three" size={26} color={theme.textMuted} />
            </TouchableOpacity>
          )}
          <ListItem
            number={item.number}
            title={toTitleCase(item.title)}
            subtitle={`${String(index + 1).padStart(2, '0')} · en el orden`}
            onPress={() => navigation.navigate('HimnoDetail', { number: item.number })}
            style={{ ...styles.rowCard, ...(isActive ? { borderColor: theme.secondary } : null) }}
            rightIcon={
              canEdit
                ? { name: 'remove-circle-outline', color: theme.textMuted, onPress: () => removeHymn(item), label: 'Quitar de la lista' }
                : undefined
            }
          />
        </View>
      </ScaleDecorator>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.secondary} />
      </View>
    );
  }

  if (!list) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.background, padding: Spacing.xl }]}>
        <Ionicons name="lock-closed-outline" size={28} color={theme.textMuted} />
        <ThemedText type="subtitle">Lista no disponible</ThemedText>
        <ThemedText type="caption" style={{ textAlign: 'center' }}>
          Esta lista ya no existe o ya no tienes acceso a ella.
        </ThemedText>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.summary}>
          <ThemedText type="label">Secuencia del servicio</ThemedText>
          <ThemedText type="caption">
            {list.himnos.length} {list.himnos.length === 1 ? 'himno' : 'himnos'}
          </ThemedText>
        </View>

        {list.role !== 'owner' ? (
          <View style={[styles.banner, { backgroundColor: theme.chip }]}>
            <Ionicons name={list.role === 'editor' ? 'create-outline' : 'eye-outline'} size={18} color={theme.secondary} />
            <ThemedText type="caption" style={{ flex: 1 }}>
              Lista de {ownerName(list)} · {list.role === 'editor' ? 'puedes agregar, quitar y reordenar himnos' : 'solo lectura'}
            </ThemedText>
          </View>
        ) : sharedWith > 0 ? (
          <TouchableOpacity onPress={() => setShareVisible(true)} style={[styles.banner, { backgroundColor: theme.chip }]}>
            <Ionicons name="people-outline" size={18} color={theme.secondary} />
            <ThemedText type="caption" style={{ flex: 1 }}>
              Compartida con {sharedWith} {sharedWith === 1 ? 'persona' : 'personas'}
            </ThemedText>
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </TouchableOpacity>
        ) : null}

        {isEditMode && (
          <View style={[styles.banner, { backgroundColor: theme.chip }]}>
            <Ionicons name="hand-left-outline" size={18} color={theme.secondary} />
            <ThemedText type="caption" style={{ flex: 1 }}>
              Mantén presionado ☰ y arrastra para reordenar. Toca ✓ para guardar.
            </ThemedText>
          </View>
        )}

        {rows.length > 0 ? (
          <DraggableFlatList
            data={rows}
            renderItem={renderItem}
            keyExtractor={(item) => String(item.number)}
            onDragEnd={({ data }) => setDraft(data.map((r) => String(r.number)))}
            activationDistance={isEditMode ? 0 : 999999}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.empty}>
            <ThemedText type="subtitle">Lista vacía</ThemedText>
            <ThemedText type="caption" style={{ textAlign: 'center' }}>
              {canEdit ? 'Agrega himnos desde Alabanzas con el menú ⋮ → “Agregar a lista”.' : 'Aún no tiene himnos.'}
            </ThemedText>
          </View>
        )}
      </View>

      {isOwner && (
        <ShareListSheet list={list} visible={shareVisible} onClose={() => setShareVisible(false)} onMessage={showMessage} />
      )}
      {toast}
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    marginLeft: 2,
  },
  headerPillText: { fontFamily: Fonts.sansSemiBold, fontSize: 13, lineHeight: 18 },
  summary: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.gutter,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: Spacing.gutter,
    marginBottom: Spacing.md,
    borderRadius: Radius.md,
    gap: 10,
  },
  listContent: { paddingBottom: Spacing.xl },
  row: { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.gutter, marginBottom: 10, gap: 4 },
  rowCard: { flex: 1, marginHorizontal: 0, marginBottom: 0 },
  dragHandle: { width: 32, height: 48, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', gap: Spacing.sm, paddingTop: 72, paddingHorizontal: Spacing.xl },
});

export default ListDetail;
