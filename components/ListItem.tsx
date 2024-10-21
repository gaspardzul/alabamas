import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import Ionicons from '@expo/vector-icons/Ionicons';

interface ListItemProps {
  title: string;
  subtitle?: string;
  onPress: () => void;
  rightIcon?: {
    name: string;
    color: string;
    onPress: () => void;
  };
}

const ListItem: React.FC<ListItemProps> = ({ title, subtitle, onPress, rightIcon }) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.itemContainer}>
      <View style={styles.iconContainer}>
        <Ionicons name="musical-note" size={20} color="#888" />
      </View>
      <View style={styles.textContainer}>
        <ThemedText style={styles.itemTitle}>{title}</ThemedText>
        <ThemedText style={styles.itemSubtitle}>{subtitle}</ThemedText>
      </View>
      {rightIcon && (
        <TouchableOpacity onPress={rightIcon.onPress} style={styles.iconButton}>
          <Ionicons 
            name={rightIcon.name as any}
            size={20} 
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
