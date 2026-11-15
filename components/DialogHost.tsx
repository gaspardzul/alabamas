import React from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useThemeColor';
import { closeDialog, DialogButton, useDialogState } from '@/utils/dialog';
import { Fonts, Radius, Spacing } from '@/constants/Typography';

/** Pinta los diálogos de showDialog en web. En iOS/Android no renderiza nada (se usa Alert nativo). */
export default function DialogHost() {
  const dialog = useDialogState();
  const theme = useTheme();
  if (Platform.OS !== 'web' || !dialog) return null;

  const cancel = dialog.buttons.find((b) => b.style === 'cancel');
  const press = (button?: DialogButton) => {
    closeDialog();
    button?.onPress?.();
  };

  // Botón de cancelar primero (a la izquierda/arriba), como en iOS.
  const ordered = [...dialog.buttons].sort((a, b) => (a.style === 'cancel' ? -1 : b.style === 'cancel' ? 1 : 0));
  const stacked = ordered.length > 2;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => press(cancel)}>
      <View style={styles.center}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: theme.overlay }]} onPress={() => press(cancel)} />
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]} accessibilityRole="alert">
          <ThemedText type="subtitle">{dialog.title}</ThemedText>
          {dialog.message ? <ThemedText style={[styles.message, { color: theme.textMuted }]}>{dialog.message}</ThemedText> : null}
          <View style={[styles.buttons, stacked && styles.buttonsStacked]}>
            {ordered.map((button, i) => {
              const isCancel = button.style === 'cancel';
              const isDestructive = button.style === 'destructive';
              const primary = !isCancel && i === ordered.length - 1;
              return (
                <TouchableOpacity
                  key={`${button.text}-${i}`}
                  onPress={() => press(button)}
                  style={[
                    styles.button,
                    !stacked && styles.buttonFlex,
                    primary
                      ? { backgroundColor: isDestructive ? theme.danger : theme.primary }
                      : { borderWidth: 1, borderColor: isDestructive ? theme.danger : theme.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      {
                        color: primary
                          ? theme.onPrimary
                          : isDestructive
                            ? theme.danger
                            : isCancel
                              ? theme.text
                              : theme.primary,
                      },
                    ]}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  card: {
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  message: { fontSize: 15, lineHeight: 22 },
  buttons: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  buttonsStacked: { flexDirection: 'column' },
  button: { height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.md },
  buttonFlex: { flex: 1 },
  buttonText: { fontFamily: Fonts.sansSemiBold, fontSize: 14 },
});
