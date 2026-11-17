import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Sheet from '@/components/Sheet';
import { ThemedText } from '@/components/ThemedText';
import { toTitleCase } from '@/components/ListItem';
import { useTheme } from '@/hooks/useThemeColor';
import { useSettings } from '@/hooks/useSettings';
import { shareHymnPdf, shareHymnText } from '@/utils/hymnActions';
import { HymnList, listsApi, ownerName, useLists } from '@/utils/lists';
import { formatHymnNumber, HymnNumber } from '@/utils/hymnNumber';
import { Fonts, Radius, Spacing } from '@/constants/Typography';

export interface HymnSummary {
  number: HymnNumber;
  title: string;
}

interface Props {
  /** Himno del menú; null = cerrado. */
  hymn: HymnSummary | null;
  isFavorite: boolean;
  onClose: () => void;
  onOpen: (hymn: HymnSummary) => void;
  onToggleFavorite: (hymn: HymnSummary) => void;
  /** Mensaje breve de confirmación (toast) en la pantalla que abre el menú. */
  onMessage?: (text: string) => void;
}

/**
 * Menú de acciones de un himno (botón ⋮ o pulsación larga en la lista): abrir, favorito,
 * agregar a lista (o crear una), compartir letra y PDF. Evita llenar cada fila de íconos.
 */
export default function HymnActionsSheet({ hymn, isFavorite, onClose, onOpen, onToggleFavorite, onMessage }: Props) {
  const theme = useTheme();
  const { settings } = useSettings();
  const [step, setStep] = useState<'menu' | 'lists'>('menu');
  // Solo listas donde puedo agregar: propias y compartidas con permiso de edición.
  const { lists: allLists, loading: listsLoading } = useLists();
  const lists = listsLoading ? null : allLists.filter((l) => l.role !== 'viewer');
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);

  // Cada vez que se abre para otro himno, empezar en el menú principal.
  useEffect(() => {
    setStep('menu');
    setNewName('');
  }, [hymn?.number]);

  if (!hymn) return <Sheet visible={false} onClose={onClose}>{null}</Sheet>;

  const title = toTitleCase(hymn.title);
  const key = String(hymn.number);
  const done = (message?: string) => {
    onClose();
    if (message) onMessage?.(message);
  };

  const openLists = () => setStep('lists');

  const handleAdd = async (list: HymnList) => {
    setBusy(true);
    const added = await listsApi.addHymn(list.id, hymn.number);
    setBusy(false);
    done(added ? `Agregado a “${list.name}”` : `Ya estaba en “${list.name}”`);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setBusy(true);
    const name = newName.trim();
    await listsApi.create(name, [String(hymn.number)]);
    setBusy(false);
    done(`Lista “${name}” creada con este himno`);
  };

  const handleShareText = async () => {
    const result = await shareHymnText(hymn.number);
    done(result === 'copied' ? 'Letra copiada al portapapeles' : result === 'failed' ? 'No se pudo compartir' : undefined);
  };

  const handleSharePdf = async () => {
    setBusy(true);
    const ok = await shareHymnPdf(hymn.number, settings.fontSize);
    setBusy(false);
    done(ok ? undefined : 'No se pudo generar el PDF');
  };

  const Row = ({ icon, label, caption, onPress, tint }: { icon: string; label: string; caption?: string; onPress: () => void; tint?: string }) => (
    <TouchableOpacity disabled={busy} onPress={onPress} style={[styles.row, { borderBottomColor: theme.border }]}>
      <View style={[styles.rowIcon, { backgroundColor: theme.chip }]}>
        <Ionicons name={icon as any} size={18} color={tint ?? theme.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <ThemedText style={styles.rowLabel}>{label}</ThemedText>
        {caption ? <ThemedText type="caption">{caption}</ThemedText> : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
    </TouchableOpacity>
  );

  return (
    <Sheet
      visible
      onClose={onClose}
      eyebrow={step === 'menu' ? `Himno ${formatHymnNumber(hymn.number)}` : title}
      title={step === 'menu' ? title : 'Agregar a lista'}
    >
      {step === 'menu' ? (
        <View>
          <Row icon="book-outline" label="Abrir himno" onPress={() => { onClose(); onOpen(hymn); }} />
          <Row
            icon={isFavorite ? 'star' : 'star-outline'}
            tint={theme.secondary}
            label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            onPress={() => { onClose(); onToggleFavorite(hymn); }}
          />
          <Row icon="list-outline" label="Agregar a lista" caption="Para preparar el orden del culto" onPress={openLists} />
          <Row icon="share-outline" label="Compartir letra" onPress={handleShareText} />
          <Row icon="document-text-outline" label="Compartir en PDF" onPress={handleSharePdf} />
          {busy && <ActivityIndicator color={theme.secondary} style={{ marginTop: Spacing.sm }} />}
        </View>
      ) : (
        <View style={{ gap: Spacing.sm }}>
          <TouchableOpacity onPress={() => setStep('menu')} hitSlop={8} style={styles.back}>
            <Ionicons name="chevron-back" size={16} color={theme.secondary} />
            <Text style={[styles.backText, { color: theme.secondary }]}>Volver</Text>
          </TouchableOpacity>

          {lists === null ? (
            <ActivityIndicator color={theme.secondary} style={{ paddingVertical: Spacing.lg }} />
          ) : (
            <ScrollView style={{ maxHeight: 280 }} keyboardShouldPersistTaps="handled">
              {lists.length === 0 && (
                <ThemedText type="caption" style={{ paddingVertical: Spacing.sm }}>
                  Aún no tienes listas. Crea la primera:
                </ThemedText>
              )}
              {lists.map((list) => {
                const included = list.himnos.includes(key);
                return (
                  <TouchableOpacity
                    key={list.id}
                    disabled={busy || included}
                    onPress={() => handleAdd(list)}
                    style={[styles.row, { borderBottomColor: theme.border }]}
                  >
                    <View style={[styles.rowIcon, { backgroundColor: theme.chip }]}>
                      <Ionicons name="musical-notes-outline" size={18} color={theme.secondary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={styles.rowLabel}>{list.name}</ThemedText>
                      <ThemedText type="caption">
                        {list.himnos.length} {list.himnos.length === 1 ? 'himno' : 'himnos'}
                        {list.role === 'editor' ? ` · Lista de ${ownerName(list)}` : ''}
                      </ThemedText>
                    </View>
                    <Ionicons
                      name={included ? 'checkmark-circle' : 'add-circle-outline'}
                      size={22}
                      color={included ? theme.tertiary : theme.primary}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          <View style={styles.createRow}>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="Nueva lista (p. ej. Culto del domingo)"
              placeholderTextColor={theme.textMuted}
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              returnKeyType="done"
              onSubmitEditing={handleCreate}
            />
            <TouchableOpacity
              disabled={busy || !newName.trim()}
              onPress={handleCreate}
              style={[styles.createButton, { backgroundColor: theme.primary, opacity: newName.trim() ? 1 : 0.4 }]}
              accessibilityLabel="Crear lista y agregar"
            >
              <Ionicons name="add" size={22} color={theme.onPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowIcon: { width: 36, height: 36, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontFamily: Fonts.sansMedium, fontSize: 15, lineHeight: 22 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start' },
  backText: { fontFamily: Fonts.sansSemiBold, fontSize: 13 },
  createRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  input: { flex: 1, height: 46, borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: 12, fontFamily: Fonts.sans, fontSize: 15 },
  createButton: { width: 46, height: 46, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
});
