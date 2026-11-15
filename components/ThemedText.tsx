import { Text, type TextProps, StyleSheet } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';
import { Fonts } from '@/constants/Typography';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?:
    | 'default'
    | 'title'
    | 'defaultSemiBold'
    | 'subtitle'
    | 'link'
    | 'Himno'
    | 'label'
    | 'caption';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const muted = useThemeColor({}, 'textMuted');
  const secondary = useThemeColor({}, 'secondary');

  const typeColor =
    type === 'caption' ? muted : type === 'label' || type === 'link' ? secondary : color;

  return (
    <Text
      style={[
        { color: lightColor || darkColor ? color : typeColor },
        styles[type === 'Himno' ? 'bodyHimno' : type],
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 15,
    lineHeight: 24,
    fontFamily: Fonts.sans,
  },
  defaultSemiBold: {
    fontSize: 15,
    lineHeight: 24,
    fontFamily: Fonts.sansSemiBold,
  },
  title: {
    fontSize: 28,
    lineHeight: 38,
    fontFamily: Fonts.serif,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 19,
    lineHeight: 28,
    fontFamily: Fonts.serifBold,
  },
  bodyHimno: {
    fontSize: 19,
    lineHeight: 32,
    fontFamily: Fonts.serifLight,
  },
  label: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: Fonts.sansSemiBold,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Fonts.sansMedium,
  },
  link: {
    fontSize: 15,
    lineHeight: 24,
    fontFamily: Fonts.sansSemiBold,
  },
});
