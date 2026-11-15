import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../hooks/useSettings';
import { useTheme } from '@/hooks/useThemeColor';
import { ThemedText } from '@/components/ThemedText';
import Sheet from '@/components/Sheet';
import { Fonts, Radius, Spacing } from '@/constants/Typography';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onSort?: (option: string) => void;
  onCreate?: () => void;
}

type SortOption = 'asc' | 'desc' | 'numAsc' | 'numDesc';

const SORT_OPTIONS: { key: SortOption; label: string; icon: string }[] = [
  { key: 'numAsc', label: 'Por número (1 → 999)', icon: 'arrow-up' },
  { key: 'numDesc', label: 'Por número (999 → 1)', icon: 'arrow-down' },
  { key: 'asc', label: 'Por título (A → Z)', icon: 'text' },
  { key: 'desc', label: 'Por título (Z → A)', icon: 'text-outline' },
];

const SearchBar: React.FC<SearchBarProps> = ({ value, onChangeText, placeholder = 'Buscar...', onSort, onCreate }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  const { settings, updateSettingValue } = useSettings();
  const theme = useTheme();

  const handleSort = (option: SortOption) => {
    onSort && onSort(option);
    updateSettingValue('order', option);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.card,
            borderColor: focused ? theme.primary : theme.border,
            borderWidth: focused ? 1.5 : 1,
          },
        ]}
      >
        <Ionicons name="search" size={18} color={theme.textMuted} />
        <TextInput
          style={[styles.input, { color: theme.text }]}
          placeholder={placeholder}
          placeholderTextColor={theme.textMuted}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          returnKeyType="search"
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={() => onChangeText('')} hitSlop={10}>
            <Ionicons name="close-circle" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {onSort && (
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={[styles.squareButton, { backgroundColor: theme.card, borderColor: theme.border }]}
          accessibilityLabel="Ordenar"
        >
          <Ionicons name="swap-vertical" size={20} color={theme.primary} />
        </TouchableOpacity>
      )}

      {onCreate && (
        <TouchableOpacity
          onPress={onCreate}
          style={[styles.squareButton, { backgroundColor: theme.primary, borderColor: theme.primary }]}
          accessibilityLabel="Crear"
        >
          <Ionicons name="add" size={24} color={theme.onPrimary} />
        </TouchableOpacity>
      )}

      <Sheet visible={modalVisible} onClose={() => setModalVisible(false)} eyebrow="Índice" title="Ordenar por">
        {SORT_OPTIONS.map((option) => {
          const active = settings.order === option.key;
          return (
            <TouchableOpacity
              key={option.key}
              onPress={() => handleSort(option.key)}
              style={[styles.option, { borderBottomColor: theme.border }]}
            >
              <Ionicons name={option.icon as any} size={18} color={active ? theme.secondary : theme.textMuted} />
              <ThemedText style={[styles.optionText, active && { fontFamily: Fonts.sansSemiBold }]}>
                {option.label}
              </ThemedText>
              {active && <Ionicons name="checkmark" size={20} color={theme.secondary} />}
            </TouchableOpacity>
          );
        })}
      </Sheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    height: 48,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: Fonts.sans,
    height: '100%',
  },
  squareButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionText: {
    flex: 1,
  },
});

export default SearchBar;
