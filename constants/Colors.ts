/**
 * Paleta "Sanctuary Warmth": minimalismo editorial cálido.
 * Lienzo marfil, navy como ancla, terracota para acentos y oliva para etiquetas.
 * Todos los colores de la app deben salir de aquí (vía useThemeColor / useTheme).
 */

const light = {
  text: '#1C1E21',
  textMuted: '#706E6B',
  background: '#FBF9F5',
  card: '#FFFFFF',
  border: '#EAE6DF',
  primary: '#1B2A4A',
  onPrimary: '#FFFFFF',
  secondary: '#9A5B32',
  secondarySoft: '#FFDBC8',
  onSecondarySoft: '#6E3812',
  tertiary: '#5E6B58',
  // Coros en rojo, como en el himnario impreso: rojo ladrillo afín al terracota.
  chorus: '#A63D32',
  chorusSoft: '#FBF1EE',
  chip: '#F4EFEA',
  numberBox: '#F3F1EC',
  overlay: 'rgba(27, 42, 74, 0.35)',
  toast: '#1B2A4A',
  danger: '#BA1A1A',
  tint: '#1B2A4A',
  icon: '#706E6B',
  tabIconDefault: '#706E6B',
  tabIconSelected: '#1B2A4A',
};

const dark: typeof light = {
  text: '#ECEAE6',
  textMuted: '#9C9993',
  background: '#121417',
  card: '#1B1E23',
  border: '#2A2E35',
  primary: '#B7C6EE',
  onPrimary: '#0A1A3A',
  secondary: '#FFB68B',
  secondarySoft: '#3A2416',
  onSecondarySoft: '#FFDBC8',
  tertiary: '#BDCBB4',
  chorus: '#F2998C',
  chorusSoft: '#2A1F1E',
  chip: '#23272E',
  numberBox: '#23272E',
  overlay: 'rgba(0, 0, 0, 0.55)',
  toast: '#2F3034',
  danger: '#FFB4AB',
  tint: '#B7C6EE',
  icon: '#9C9993',
  tabIconDefault: '#9C9993',
  tabIconSelected: '#B7C6EE',
};

export const Colors = { light, dark };
export type ThemeColors = typeof light;

// Exportaciones heredadas, mantenidas por compatibilidad.
export const tintColorLight = light.primary;
export const tintColorDark = dark.primary;
export const tintColorRed = light.danger;
export const tintColorBlue = light.primary;
