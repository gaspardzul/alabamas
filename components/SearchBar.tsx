import React, { useEffect, useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Modal, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../hooks/useSettings';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onSort: (option: string) => void;
}


const SearchBar: React.FC<SearchBarProps> = ({ value, onChangeText, placeholder = 'Buscar...', onSort }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const { settings, updateSettingValue, getSettingValue } = useSettings();

  const handleClear = () => {
    onChangeText('');
  };

  const handleSort = (option: 'asc' | 'desc' | 'numAsc' | 'numDesc') => {
    onSort(option);
    updateSettingValue('order', option);
    console.log("updateSettingValue", option);
    setModalVisible(false);
   
  };


  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
        />
        <TouchableOpacity 
          onPress={value.length > 0 ? handleClear : undefined} 
          style={styles.clearIconContainer}
        >
          <Ionicons 
            name={value.length > 0 ? "close-circle" : "search"} 
            size={20} 
            color="#999" 
          />
        </TouchableOpacity>
      </View>
      <TouchableOpacity 
        onPress={() => setModalVisible(true)} 
        style={styles.sortButton}
      >
        <Ionicons name="funnel-outline" size={24} color="#fff" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Ordenar Por:</Text>
          <TouchableOpacity onPress={() => handleSort('asc')} style={styles.modalOption}>
            <Text style={styles.modalOptionText}>Ordenar A-Z</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleSort('desc')} style={styles.modalOption}>
            <Text style={styles.modalOptionText}>Ordenar Z-A</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleSort('numAsc')} style={styles.modalOption}>
            <Text style={styles.modalOptionText}>Por número (ascendente 1-999)</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleSort('numDesc')} style={styles.modalOption}>
            <Text style={styles.modalOptionText}>Por número (descendente 999-1)</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 10,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
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
    paddingRight: 30,
  },
  clearIconContainer: {
    padding: 5,
  },
  sortButton: {
    backgroundColor: '#0e161e',
    borderRadius: 25,
    padding: 10,
    marginLeft: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modalView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalOption: {
    padding: 15,
    marginVertical: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalOptionText: {
    fontSize: 18,
  },
  closeButton: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#ddd',
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SearchBar;
