import { useColorScheme as useSystemColorScheme } from 'react-native';
import { useThemePreference } from '@/utils/themePreference';

/**
 * Tema efectivo de la app ('light' | 'dark'): la preferencia de Perfil o, en "Sistema",
 * la del dispositivo. Úsalo siempre en lugar de useColorScheme de react-native.
 * (Antes había un useColorScheme.web.ts que devolvía siempre 'light': por eso en web con
 * el sistema en oscuro la barra de pestañas salía blanca.)
 */
export function useColorScheme(): 'light' | 'dark' {
  const system = useSystemColorScheme();
  const preference = useThemePreference();
  if (preference === 'light' || preference === 'dark') return preference;
  return system === 'dark' ? 'dark' : 'light';
}
