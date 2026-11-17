import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Margen inferior para elementos pegados abajo (barra de pestañas, hojas, barras de acción)
 * que respete la zona segura (indicador de inicio del iPhone/iPad).
 *
 * En web (PWA instalada en iOS) la medición de react-native-safe-area-context no llega a
 * la barra de pestañas y quedaba encima del indicador; por eso ahí usamos directamente
 * CSS env(safe-area-inset-bottom) (index.html declara viewport-fit=cover).
 * En iOS/Android se usa el inset medido.
 */
export function useBottomInset(extra = 0): number {
  const insets = useSafeAreaInsets();
  if (Platform.OS === 'web') {
    // RN Web pasa el string tal cual a CSS; el tipo numérico es solo para TypeScript.
    return `calc(env(safe-area-inset-bottom, 0px) + ${extra}px)` as unknown as number;
  }
  return insets.bottom + extra;
}

/** Margen superior (zona de la barra de estado / Dynamic Island), con el mismo criterio que abajo. */
export function useTopInset(extra = 0): number {
  const insets = useSafeAreaInsets();
  if (Platform.OS === 'web') {
    return `calc(env(safe-area-inset-top, 0px) + ${extra}px)` as unknown as number;
  }
  return insets.top + extra;
}

/** Igual que useBottomInset pero con un mínimo (p. ej. dispositivos sin indicador de inicio). */
export function useBottomInsetAtLeast(min: number, extra = 0): number {
  const insets = useSafeAreaInsets();
  if (Platform.OS === 'web') {
    return `max(${min}px, calc(env(safe-area-inset-bottom, 0px) + ${extra}px))` as unknown as number;
  }
  return Math.max(insets.bottom + extra, min);
}
