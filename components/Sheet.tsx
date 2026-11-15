import React, { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useThemeColor';
import { Radius, Spacing } from '@/constants/Typography';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  eyebrow?: string;
  children: ReactNode;
}

/** Hoja inferior con velo navy translúcido; reemplaza los modales a pantalla completa. */
export default function Sheet({ visible, onClose, title, eyebrow, children }: SheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={[styles.overlay, { backgroundColor: theme.overlay }]} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
              paddingBottom: Math.max(insets.bottom, Spacing.md) + Spacing.sm,
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
          {eyebrow ? <ThemedText type="label">{eyebrow}</ThemedText> : null}
          {title ? (
            <ThemedText type="subtitle" style={styles.title}>
              {title}
            </ThemedText>
          ) : null}
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, justifyContent: 'flex-end' },
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  sheet: {
    borderTopLeftRadius: Radius.lg + 8,
    borderTopRightRadius: Radius.lg + 8,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.gutter,
    paddingTop: Spacing.sm,
    maxHeight: '80%',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: Spacing.md,
  },
  title: {
    marginBottom: Spacing.md,
  },
});
