import React from 'react';
import { TouchableOpacity, StyleSheet, View, ViewStyle } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import Ionicons from '@expo/vector-icons/Ionicons';

interface ListItemProps {
  title: string;
  subtitle?: string;
  onPress: () => void;
  fontSize?: number;
  leftIcon?: {
    name: string;
    color: string;
    onPress: () => void;
  };
  sizeIcon?: number;
  rightIcon?: {
    name: string;
    color: string;
    onPress: () => void;
  };
  style?: ViewStyle;
}

const ListItem: React.FC<ListItemProps> = ({ title, subtitle, onPress, leftIcon, rightIcon, fontSize=16, style, sizeIcon=20 }) => {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.itemContainer, style]}>
      <View style={styles.textContainer}>
        <ThemedText style={[ { fontSize: fontSize }]}>{title}</ThemedText>
        <ThemedText style={styles.itemSubtitle}>{subtitle}</ThemedText>
      </View>
      {leftIcon && (
        <TouchableOpacity onPress={leftIcon.onPress} style={styles.iconButton}>
          <Ionicons 
            name={leftIcon.name as any}
            size={sizeIcon} 
            color={leftIcon.color} 
          />
        </TouchableOpacity>
      )}
      {rightIcon && (
        <TouchableOpacity onPress={rightIcon.onPress} style={styles.iconButton}>
          <Ionicons 
            name={rightIcon.name as any}
            size={sizeIcon} 
            color={rightIcon.color} 
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'normal',
    color: '#333',
  },
  itemSubtitle: {
    fontSize: 14,
    paddingTop: 0,
    margin:0,
    color: '#888',
  },
  iconButton: {
    padding: 4,
  },
});

export default ListItem;
