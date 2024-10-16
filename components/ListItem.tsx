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
    <ThemedView style={styles.itemContainer}>
      <TouchableOpacity 
        style={styles.item}
        onPress={onPress}
      >
        <View>
          <ThemedText style={styles.itemTitle}>{title}</ThemedText>
          {subtitle && <ThemedText style={styles.itemSubtitle}>{subtitle}</ThemedText>}
        </View>
      </TouchableOpacity>
      {rightIcon && (
        <TouchableOpacity onPress={rightIcon.onPress} style={styles.iconButton}>
          <Ionicons 
            name={rightIcon.name as any}
            size={24} 
            color={rightIcon.color} 
          />
        </TouchableOpacity>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  item: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  iconButton: {
    padding: 8,
  },
});

export default ListItem;

