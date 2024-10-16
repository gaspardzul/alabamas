import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChangeText, placeholder = 'Buscar...' }) => {
  const handleClear = () => {
    onChangeText('');
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
      />
      <TouchableOpacity 
        onPress={value.length > 0 ? handleClear : undefined} 
        style={styles.iconContainer}
      >
        <Ionicons 
          name={value.length > 0 ? "close-circle" : "search"} 
          size={20} 
          color="#999" 
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginVertical: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingRight: 30, // Espacio para el icono
  },
  iconContainer: {
    padding: 5, // Aumenta el área tocable
    position: 'absolute',
    right: 10,
    top: '100%',
    transform: [{ translateY: -15 }], // Ajustado para centrar verticalmente
  },
});

export default SearchBar;
