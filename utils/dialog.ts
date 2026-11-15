import { useSyncExternalStore } from 'react';
import { Alert, Platform } from 'react-native';

/**
 * Reemplazo multiplataforma de Alert.alert (misma firma).
 * - iOS/Android: usa el diálogo nativo.
 * - Web: Alert.alert de react-native-web no hace nada, así que publicamos el diálogo
 *   en un store y lo pinta <DialogHost /> (montado en app/_layout.tsx).
 * Usa siempre showDialog en lugar de Alert.alert.
 */

export interface DialogButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

export interface DialogState {
  title: string;
  message?: string;
  buttons: DialogButton[];
}

let current: DialogState | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function showDialog(title: string, message?: string, buttons?: DialogButton[]) {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }
  current = { title, message, buttons: buttons?.length ? buttons : [{ text: 'OK' }] };
  emit();
}

export function closeDialog() {
  current = null;
  emit();
}

export function useDialogState() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    () => current
  );
}
