import React, { ReactNode } from 'react';
import { TouchableOpacity, StyleSheet, View, ViewStyle, Text } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import Chip from '@/components/Chip';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/hooks/useThemeColor';
import { Fonts, Radius, Spacing } from '@/constants/Typography';
import { formatHymnNumber } from '@/utils/hymnNumber';

interface IconAction {
  name: string;
  color?: string;
  onPress: () => void;
}

interface ListItemProps {
  title: string;
  subtitle?: string;
  onPress: () => void;
  onLongPress?: () => void;
  fontSize?: number;
  /** Número del himno: se muestra en una caja a la izquierda. */
  number?: number | string;
  /** Icono a la izquierda cuando no hay número (p. ej. listas). */
  leadingIcon?: string;
  /** Etiquetas (categorías) debajo del título. */
  tags?: string[] | string;
  leftIcon?: IconAction;
  rightIcon?: IconAction;
  sizeIcon?: number;
  style?: ViewStyle;
  children?: ReactNode;
}

/** Tarjeta de fila: superficie blanca con borde fino, número en caja y título serif. */
const ListItem: React.FC<ListItemProps> = ({
  title,
  subtitle,
  onPress,
  onLongPress,
  leftIcon,
  rightIcon,
  fontSize = 17,
  number,
  leadingIcon,
  tags,
  style,
  sizeIcon = 22,
}) => {
  const theme = useTheme();
  const titleSize = Math.min(Math.max(fontSize, 15), 24);
  const tagList = toArray(tags);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }, style]}
    >
      {number !== undefined ? (
        <View style={[styles.leading, { backgroundColor: theme.numberBox }]}>
          <Text style={[styles.number, { color: theme.primary }]} numberOfLines={1} adjustsFontSizeToFit>
            {formatHymnNumber(number)}
          </Text>
        </View>
      ) : leadingIcon ? (
        <View style={[styles.leading, { backgroundColor: theme.numberBox }]}>
          <Ionicons name={leadingIcon as any} size={22} color={theme.secondary} />
        </View>
      ) : null}

      <View style={styles.textContainer}>
        <ThemedText
          numberOfLines={2}
          style={[styles.title, { fontSize: titleSize, lineHeight: titleSize * 1.35 }]}
        >
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText type="caption" numberOfLines={1}>
            {subtitle}
          </ThemedText>
        ) : null}
        {tagList.length > 0 ? (
          <View style={styles.tags}>
            {tagList.slice(0, 2).map((tag) => (
              <Chip key={tag} label={toTitleCase(tag)} />
            ))}
          </View>
        ) : null}
      </View>

      {leftIcon && (
        <TouchableOpacity onPress={leftIcon.onPress} style={styles.iconButton} hitSlop={8}>
          <Ionicons name={leftIcon.name as any} size={sizeIcon} color={leftIcon.color ?? theme.icon} />
        </TouchableOpacity>
      )}
      {rightIcon && (
        <TouchableOpacity onPress={rightIcon.onPress} style={styles.iconButton} hitSlop={8}>
          <Ionicons name={rightIcon.name as any} size={sizeIcon} color={rightIcon.color ?? theme.icon} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

/** Algunos himnos traen `group` como texto en vez de arreglo. */
export const toArray = (value?: string[] | string): string[] =>
  Array.isArray(value) ? value : value ? [value] : [];

const MINOR_WORDS = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'y', 'a', 'en', 'al', 'por', 'con']);

export const toTitleCase = (text: string) =>
  text
    .toLowerCase()
    .split(' ')
    .map((word, i) =>
      i > 0 && MINOR_WORDS.has(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(' ');

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    marginHorizontal: Spacing.gutter,
    marginBottom: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  leading: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  number: {
    fontFamily: Fonts.serifBold,
    fontSize: 17,
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: Fonts.serif,
  },
  tags: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ListItem;
