import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from 'expo-router';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import himnario from '@/assets/himnos/lista.json';
import ListItem, { toTitleCase } from '@/components/ListItem';
import SearchBar from '@/components/SearchBar';
import Sheet from '@/components/Sheet';
import Loader from '@/components/Loader';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useThemeColor';
import { newBloquePredica, usePredicas } from '@/hooks/usePredicas';
import { BLOCK_TYPE_META, BLOCK_TYPES, predicaEstimatedMinutes, predicaWordCount, resolveHymn } from '@/utils/predicaText';
import { normalizarTexto } from '@/utils/functions';
import { compareHymnNumbers } from '@/utils/hymnNumber';
import { showDialog } from '@/utils/dialog';
import { BloquePredica, Predica } from '@/ts/interfaces';
import { RootStackParamList } from '@/ts/types';
import { Fonts, Radius, Spacing } from '@/constants/Typography';

type PredicaDetailRouteProp = RouteProp<RootStackParamList, 'PredicaDetail'>;
type NavigationProp = StackNavigationProp<RootStackParamList, 'PredicaDetail'>;

type PickerSlot = 'apertura' | 'cierre' | 'intermedios';

/**
 * Editor de la prédica: título, pasaje (referencia y texto escrito a mano), fecha y
 * serie; bloques reordenables (introducción, puntos, ilustración, aplicación,
 * conclusión, cita); himnos de apertura, cierre e intermedios. Guarda con el botón
 * ✓ o al ir al Modo Púlpito; avisa si se sale con cambios sin guardar.
 */
const PredicaDetail: React.FC = () => {
  const route = useRoute<PredicaDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const theme = useTheme();
  const predicaId = route.params?.predicaId;
  const { predicas, loaded, save } = usePredicas();

  const predica = predicas.find((p) => p.id === predicaId);
  const [draft, setDraft] = useState<Predica | null>(null);
  const [picker, setPicker] = useState<PickerSlot | null>(null);
  const [pickerQuery, setPickerQuery] = useState('');
  const [addSheetVisible, setAddSheetVisible] = useState(false);
  // Reordenar es un modo aparte (igual que en ListDetail): con el gesto de
  // arrastre siempre activo, el scroll del editor quedaba bloqueado en web.
  const [isReordering, setIsReordering] = useState(false);

  useEffect(() => {
    if (loaded && predica && draft === null) setDraft(predica);
  }, [loaded, predica, draft]);

  // Cambios sin guardar (sin contar la fecha de edición).
  const withoutUpdatedAt = (p: Predica): string => {
    const copy = { ...p } as Record<string, unknown>;
    delete copy.updatedAt;
    return JSON.stringify(copy);
  };
  const dirty = !!draft && !!predica && withoutUpdatedAt(draft) !== withoutUpdatedAt(predica);

  const saveDraft = async () => {
    if (!draft) return;
    const saved = { ...draft, updatedAt: new Date() };
    await save(saved);
    setDraft(saved);
  };

  const goPulpito = async () => {
    if (!draft) return;
    if (dirty) await saveDraft();
    navigation.navigate('PredicaPulpito', { predicaId: draft.id });
  };

  useEffect(() => {
    navigation.setOptions({
      title: draft?.title?.trim() ? draft.title.trim() : 'Nueva prédica',
      headerRight: () =>
        draft ? (
          <View style={styles.headerActions}>
            {dirty && (
              <TouchableOpacity onPress={saveDraft} style={styles.headerButton} accessibilityLabel="Guardar cambios">
                <Ionicons name="checkmark" size={24} color={theme.tertiary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={goPulpito}
              style={[styles.headerPill, { backgroundColor: theme.primary }]}
              accessibilityLabel="Modo Púlpito"
            >
              <Ionicons name="mic" size={14} color={theme.onPrimary} />
              <Text style={[styles.headerPillText, { color: theme.onPrimary }]}>Púlpito</Text>
            </TouchableOpacity>
          </View>
        ) : null,
    });
  }, [navigation, draft, dirty, theme]);

  // Avisar al salir con cambios sin guardar.
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!dirty) return;
      e.preventDefault();
      showDialog('Cambios sin guardar', 'Tienes cambios sin guardar. ¿Deseas guardar antes de salir?', [
        { text: 'Descartar', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
        {
          text: 'Guardar',
          onPress: async () => {
            await saveDraft();
            navigation.dispatch(e.data.action);
          },
        },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    });
    return unsubscribe;
  }, [navigation, dirty, draft]);

  const pickerHymns = useMemo(() => {
    const q = normalizarTexto(pickerQuery.trim());
    const all = himnario.lista as { number: number | string; title: string }[];
    const filtered = !q
      ? all
      : all.filter(
          (h) => String(h.number).includes(pickerQuery.trim()) || normalizarTexto(h.title).includes(q)
        );
    return [...filtered].sort((a, b) => compareHymnNumbers(a.number, b.number)).slice(0, 100);
  }, [pickerQuery]);

  if (!loaded || (predica && draft === null)) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
        <Loader label="Cargando prédica…" />
      </View>
    );
  }

  if (!predica || !draft) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.background, padding: Spacing.xl }]}>
        <Ionicons name="mic-off-outline" size={28} color={theme.textMuted} />
        <ThemedText type="subtitle">Prédica no disponible</ThemedText>
        <ThemedText type="caption" style={{ textAlign: 'center' }}>
          Esta prédica ya no existe.
        </ThemedText>
      </View>
    );
  }

  const setField = <K extends keyof Predica>(key: K, value: Predica[K]) =>
    setDraft({ ...draft, [key]: value });

  const updateBlock = (id: string, patch: Partial<BloquePredica>) =>
    setDraft({ ...draft, blocks: draft.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)) });

  const addBlock = (type: BloquePredica['type']) => {
    setDraft({ ...draft, blocks: [...draft.blocks, newBloquePredica(type)] });
    setAddSheetVisible(false);
  };

  const duplicateBlock = (id: string) => {
    const index = draft.blocks.findIndex((b) => b.id === id);
    if (index === -1) return;
    const copy: BloquePredica = { ...draft.blocks[index], id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}` };
    const blocks = [...draft.blocks];
    blocks.splice(index + 1, 0, copy);
    setDraft({ ...draft, blocks });
  };

  const removeBlock = (id: string) =>
    setDraft({ ...draft, blocks: draft.blocks.filter((b) => b.id !== id) });

  const selectHymn = (number: string) => {
    if (picker === 'apertura') {
      setDraft({ ...draft, hymnApertura: number });
      setPicker(null);
    } else if (picker === 'cierre') {
      setDraft({ ...draft, hymnCierre: number });
      setPicker(null);
    } else if (picker === 'intermedios') {
      const current = draft.hymnIntermedios ?? [];
      setDraft({
        ...draft,
        hymnIntermedios: current.includes(number)
          ? current.filter((n) => n !== number)
          : [...current, number],
      });
    }
  };

  const openPicker = (slot: PickerSlot) => {
    setPickerQuery('');
    setPicker(slot);
  };

  const renderHymnSlot = (label: string, number: string | undefined, slot: 'apertura' | 'cierre') => {
    const himno = resolveHymn(number);
    return (
      <View style={styles.slot}>
        <ThemedText type="label" style={{ color: theme.textMuted }}>
          {label}
        </ThemedText>
        {himno ? (
          <ListItem
            number={himno.number}
            title={toTitleCase(himno.title)}
            onPress={() => navigation.navigate('HimnoDetail', { number: himno.number })}
            style={styles.slotItem}
            rightIcon={{
              name: 'close-circle-outline',
              color: theme.textMuted,
              onPress: () => setField(slot === 'apertura' ? 'hymnApertura' : 'hymnCierre', undefined),
              label: `Quitar ${label.toLowerCase()}`,
            }}
          />
        ) : (
          <TouchableOpacity
            onPress={() => openPicker(slot)}
            style={[styles.pickButton, { borderColor: theme.border }]}
            accessibilityLabel={`Elegir ${label.toLowerCase()}`}
          >
            <Ionicons name="add" size={18} color={theme.secondary} />
            <ThemedText style={{ color: theme.secondary }}>Elegir himno</ThemedText>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderBlock = ({ item, drag, isActive }: RenderItemParams<BloquePredica>) => {
    const meta = BLOCK_TYPE_META[item.type];
    return (
      <ScaleDecorator>
        <View
          style={[
            styles.blockCard,
            {
              backgroundColor: theme.card,
              borderColor: isActive ? theme.secondary : theme.border,
              borderLeftColor: theme[meta.color],
            },
          ]}
        >
          <View style={styles.blockHead}>
            {isReordering && (
              <TouchableOpacity
                onPressIn={drag}
                onLongPress={drag}
                style={styles.dragHandle}
                accessibilityLabel="Arrastrar para reordenar"
              >
                <Ionicons name="reorder-three" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            )}
            <View style={[styles.typeTag, { backgroundColor: theme[meta.soft] }]}>
              <Text style={[styles.typeTagText, { color: theme[meta.color] }]}>{meta.label}</Text>
            </View>
            <View style={styles.blockActions}>
              <TouchableOpacity
                onPress={() => duplicateBlock(item.id)}
                style={styles.iconButton}
                accessibilityLabel="Duplicar bloque"
              >
                <Ionicons name="copy-outline" size={20} color={theme.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => removeBlock(item.id)}
                style={styles.iconButton}
                accessibilityLabel="Eliminar bloque"
              >
                <Ionicons name="trash-outline" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
          <TextInput
            value={item.title ?? ''}
            onChangeText={(t) => updateBlock(item.id, { title: t })}
            placeholder="Título del bloque (opcional)"
            placeholderTextColor={theme.textMuted}
            style={[styles.blockTitleInput, { color: theme.text }]}
          />
          {item.type === 'punto' && (
            <TextInput
              value={item.verseRef ?? ''}
              onChangeText={(t) => updateBlock(item.id, { verseRef: t })}
              placeholder="Versículo de apoyo (opcional, ej. Juan 3:16)"
              placeholderTextColor={theme.textMuted}
              style={[styles.blockRefInput, { color: theme.text }]}
            />
          )}
          <TextInput
            value={item.text}
            onChangeText={(t) => updateBlock(item.id, { text: t })}
            placeholder="Escribe aquí…"
            placeholderTextColor={theme.textMuted}
            multiline
            style={[styles.blockTextInput, { color: theme.text }]}
          />
        </View>
      </ScaleDecorator>
    );
  };

  const words = predicaWordCount(draft);
  const minutes = predicaEstimatedMinutes(draft);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <DraggableFlatList
          data={draft.blocks}
          renderItem={renderBlock}
          keyExtractor={(item) => item.id}
          onDragEnd={({ data }) => setDraft({ ...draft, blocks: data })}
          activationDistance={isReordering ? 0 : 999999}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.header}>
              <ThemedText type="label" style={{ color: theme.textMuted }}>
                Título
              </ThemedText>
              <TextInput
                value={draft.title}
                onChangeText={(t) => setField('title', t)}
                placeholder="Título de la prédica"
                placeholderTextColor={theme.textMuted}
                style={[styles.titleInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
              />
              <View style={styles.row}>
                <View style={styles.half}>
                  <ThemedText type="label" style={{ color: theme.textMuted }}>
                    Pasaje
                  </ThemedText>
                  <TextInput
                    value={draft.passage}
                    onChangeText={(t) => setField('passage', t)}
                    placeholder="Salmo 23:1-6"
                    placeholderTextColor={theme.textMuted}
                    style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
                  />
                </View>
                <View style={styles.half}>
                  <ThemedText type="label" style={{ color: theme.textMuted }}>
                    Fecha
                  </ThemedText>
                  <TextInput
                    value={draft.date ?? ''}
                    onChangeText={(t) => setField('date', t)}
                    placeholder="AAAA-MM-DD"
                    placeholderTextColor={theme.textMuted}
                    style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
                  />
                </View>
              </View>
              <ThemedText type="label" style={{ color: theme.textMuted }}>
                Texto del pasaje (escrito a mano)
              </ThemedText>
              <TextInput
                value={draft.passageText ?? ''}
                onChangeText={(t) => setField('passageText', t)}
                placeholder="Escribe el texto del pasaje en la versión que uses…"
                placeholderTextColor={theme.textMuted}
                multiline
                style={[styles.passageInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
              />
              <ThemedText type="label" style={{ color: theme.textMuted }}>
                Serie (opcional)
              </ThemedText>
              <TextInput
                value={draft.series ?? ''}
                onChangeText={(t) => setField('series', t)}
                placeholder="Ej. Salmos"
                placeholderTextColor={theme.textMuted}
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
              />

              <ThemedText type="label" style={[{ color: theme.textMuted }, styles.sectionLabel]}>
                Himnos
              </ThemedText>
              {renderHymnSlot('Himno de apertura', draft.hymnApertura, 'apertura')}
              <View style={styles.slot}>
                <ThemedText type="label" style={{ color: theme.textMuted }}>
                  Himnos intermedios
                </ThemedText>
                {(draft.hymnIntermedios ?? []).map((n) => {
                  const himno = resolveHymn(n);
                  if (!himno) return null;
                  return (
                    <ListItem
                      key={n}
                      number={himno.number}
                      title={toTitleCase(himno.title)}
                      onPress={() => navigation.navigate('HimnoDetail', { number: himno.number })}
                      style={styles.slotItem}
                      rightIcon={{
                        name: 'close-circle-outline',
                        color: theme.textMuted,
                        onPress: () =>
                          setDraft({
                            ...draft,
                            hymnIntermedios: (draft.hymnIntermedios ?? []).filter((x) => x !== n),
                          }),
                        label: 'Quitar himno intermedio',
                      }}
                    />
                  );
                })}
                <TouchableOpacity
                  onPress={() => openPicker('intermedios')}
                  style={[styles.pickButton, { borderColor: theme.border }]}
                  accessibilityLabel="Agregar himno intermedio"
                >
                  <Ionicons name="add" size={18} color={theme.secondary} />
                  <ThemedText style={{ color: theme.secondary }}>Agregar himno intermedio</ThemedText>
                </TouchableOpacity>
              </View>
              {renderHymnSlot('Himno de cierre', draft.hymnCierre, 'cierre')}

              <View style={styles.bosquejoHead}>
                <ThemedText type="label" style={[{ color: theme.textMuted }, styles.sectionLabel]}>
                  Bosquejo
                </ThemedText>
                <TouchableOpacity
                  onPress={() => setIsReordering(!isReordering)}
                  style={[styles.reorderButton, { borderColor: theme.primary }]}
                  accessibilityLabel={isReordering ? 'Terminar de reordenar' : 'Reordenar bloques'}
                >
                  <Ionicons
                    name={isReordering ? 'checkmark' : 'reorder-three'}
                    size={16}
                    color={theme.primary}
                  />
                  <Text style={[styles.reorderButtonText, { color: theme.primary }]}>
                    {isReordering ? 'Listo' : 'Reordenar'}
                  </Text>
                </TouchableOpacity>
              </View>
              <ThemedText type="caption">
                {isReordering
                  ? 'Mantén presionado ☰ y arrastra para reordenar los bloques. Toca Listo para terminar.'
                  : 'Toca Reordenar para cambiar el orden de los bloques.'}
              </ThemedText>
            </View>
          }
          ListFooterComponent={
            <View style={styles.footer}>
              <TouchableOpacity
                onPress={() => setAddSheetVisible(true)}
                style={[styles.addButton, { borderColor: theme.primary }]}
                accessibilityLabel="Agregar bloque"
              >
                <Ionicons name="add" size={20} color={theme.primary} />
                <ThemedText style={[styles.addButtonText, { color: theme.primary }]}>Agregar bloque</ThemedText>
              </TouchableOpacity>
              <ThemedText type="caption" style={styles.stats}>
                {words} {words === 1 ? 'palabra' : 'palabras'} · ≈ {minutes} min (estimado)
              </ThemedText>
            </View>
          }
        />
      </View>

      <Sheet
        visible={addSheetVisible}
        onClose={() => setAddSheetVisible(false)}
        eyebrow="Bosquejo"
        title="Agregar bloque"
      >
        {BLOCK_TYPES.map((type) => {
          const meta = BLOCK_TYPE_META[type];
          return (
            <TouchableOpacity
              key={type}
              onPress={() => addBlock(type)}
              style={[styles.typeOption, { borderBottomColor: theme.border }]}
            >
              <View style={[styles.typeDot, { backgroundColor: theme[meta.color] }]} />
              <ThemedText style={styles.typeOptionText}>{meta.label}</ThemedText>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          );
        })}
      </Sheet>

      <Sheet
        visible={picker !== null}
        onClose={() => setPicker(null)}
        eyebrow="Himnos"
        title={
          picker === 'apertura'
            ? 'Himno de apertura'
            : picker === 'cierre'
              ? 'Himno de cierre'
              : 'Himnos intermedios'
        }
      >
        <SearchBar
          value={pickerQuery}
          onChangeText={setPickerQuery}
          placeholder="Buscar himno por número o título"
        />
        <FlatList
          data={pickerHymns}
          keyExtractor={(item) => String(item.number)}
          keyboardShouldPersistTaps="handled"
          style={styles.pickerList}
          renderItem={({ item }) => {
            const selected =
              picker === 'intermedios'
                ? (draft.hymnIntermedios ?? []).includes(String(item.number))
                : false;
            return (
              <ListItem
                number={item.number}
                title={toTitleCase(item.title)}
                onPress={() => selectHymn(String(item.number))}
                style={styles.pickerItem}
                rightIcon={
                  selected
                    ? { name: 'checkmark-circle', color: theme.secondary, onPress: () => selectHymn(String(item.number)), label: 'Quitar' }
                    : undefined
                }
              />
            );
          }}
          ListEmptyComponent={
            <ThemedText type="caption" style={styles.pickerEmpty}>
              Ningún himno coincide con tu búsqueda.
            </ThemedText>
          }
        />
        {picker === 'intermedios' && (
          <TouchableOpacity
            onPress={() => setPicker(null)}
            style={[styles.button, { backgroundColor: theme.primary, marginTop: Spacing.md }]}
          >
            <ThemedText style={[styles.buttonText, { color: theme.onPrimary }]}>Listo</ThemedText>
          </TouchableOpacity>
        )}
      </Sheet>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  listContent: { paddingHorizontal: Spacing.gutter, paddingTop: Spacing.md, paddingBottom: Spacing.xl * 2 },
  header: { gap: Spacing.sm, marginBottom: Spacing.md },
  sectionLabel: { marginTop: Spacing.sm },
  bosquejoHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reorderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 32,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: Radius.md,
  },
  reorderButtonText: { fontFamily: Fonts.sansSemiBold, fontSize: 13 },
  row: { flexDirection: 'row', gap: Spacing.sm },
  half: { flex: 1, gap: Spacing.sm },
  titleInput: {
    height: 52,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    fontSize: 19,
    fontFamily: Fonts.serifBold,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    fontSize: 16,
    fontFamily: Fonts.sans,
  },
  passageInput: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 17,
    lineHeight: 28,
    fontFamily: Fonts.serif,
    textAlignVertical: 'top',
  },
  slot: { gap: Spacing.sm, marginTop: Spacing.sm },
  slotItem: { marginHorizontal: 0, marginBottom: 0 },
  pickButton: {
    height: 48,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Radius.md,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockCard: {
    borderWidth: 1,
    borderLeftWidth: 3,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  blockHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dragHandle: { width: 32, height: 36, alignItems: 'center', justifyContent: 'center' },
  typeTag: { borderRadius: Radius.lg, paddingHorizontal: 10, paddingVertical: 4 },
  typeTagText: { fontFamily: Fonts.sansMedium, fontSize: 12, lineHeight: 16 },
  blockActions: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' },
  iconButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  blockTitleInput: { fontSize: 17, fontFamily: Fonts.sansSemiBold, paddingVertical: 2 },
  blockRefInput: { fontSize: 14, fontFamily: Fonts.sans, paddingVertical: 2 },
  blockTextInput: {
    minHeight: 88,
    fontSize: 16,
    lineHeight: 26,
    fontFamily: Fonts.serif,
    textAlignVertical: 'top',
    paddingVertical: 2,
  },
  footer: { gap: Spacing.md, marginTop: Spacing.sm },
  addButton: {
    height: 48,
    borderWidth: 1,
    borderRadius: Radius.md,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: { fontFamily: Fonts.sansSemiBold, fontSize: 15 },
  stats: { textAlign: 'center' },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  typeDot: { width: 12, height: 12, borderRadius: 6 },
  typeOptionText: { flex: 1 },
  pickerList: { marginTop: Spacing.md, maxHeight: 420 },
  pickerItem: { marginHorizontal: 0 },
  pickerEmpty: { textAlign: 'center', paddingVertical: Spacing.lg },
  button: { height: 48, borderRadius: Radius.md, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontFamily: Fonts.sansSemiBold, fontSize: 15 },
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
});

export default PredicaDetail;
