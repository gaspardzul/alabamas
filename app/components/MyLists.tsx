import React, { useEffect, useState, useCallback } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView'; 
import { RootStackParamList } from '@/ts/types';
import { Lista } from '@/ts/interfaces';
import SearchBar from '@/components/SearchBar';
import ListItem from '@/components/ListItem';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { tintColorBlue } from '@/constants/Colors';
import { useSettings } from '@/hooks/useSettings';
import { StackNavigationProp } from '@react-navigation/stack';

type NavigationProp = StackNavigationProp<RootStackParamList, 'ListDetail'>;
// Agregar una nueva clave para las listas en Settings
interface Settings {
  fontSize: number;
  order: 'asc' | 'desc' | 'numAsc' | 'numDesc';
  userLists: Lista[];  // Nueva propiedad
}

const MyLists: React.FC = () => {
  const colorScheme = useColorScheme();
  const [busqueda, setBusqueda] = useState<string>('');
  const [listasFiltradas, setListasFiltradas] = useState<Lista[]>([]);
  const { getSettingValue, updateSettingValue } = useSettings();
  const [lists, setLists] = useState<Lista[]>([]);
  const [fontSize, setFontSize] = useState<number>(16);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [newListName, setNewListName] = useState<string>('');
  const [editingList, setEditingList] = useState<Lista | null>(null);
  const navigation = useNavigation<NavigationProp>();

  // Cargar las listas al inicio
  useEffect(() => {
    loadSettings();
    loadLists();
  }, []);

  const loadSettings = async () => {
    const fontSize = await getSettingValue('fontSize');
    if(fontSize){
      setFontSize(fontSize);
    }
  } 

  const loadLists = async () => {
    const storedLists = await getSettingValue('userLists');
    if (storedLists) {
      // Convertir las fechas de string a Date
      const parsedLists = storedLists.map((lista: Lista) => ({
        ...lista,
        createdAt: new Date(lista.createdAt),
        updatedAt: new Date(lista.updatedAt)
      }));
      setLists(parsedLists);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadLists();
    }, [])
  );

  useEffect(() => {
    const filtrarListas = () => {
      const filtradas = lists.filter((lista: Lista) => 
        lista.name.toLowerCase().includes(busqueda.toLowerCase())
      );
      setListasFiltradas(filtradas);
    };

    filtrarListas();
  }, [busqueda, lists]);

  const handleCreateList = () => {
    setModalVisible(true);
  }


  useFocusEffect(
    useCallback(() => {
      
    }, [])
  );

  // Modificar handleSaveList para persistir los cambios
  const handleSaveList = async () => {
    if (newListName.trim()) {
      let updatedLists: Lista[];
      
      if (editingList) {
        // Editar lista existente
        updatedLists = lists.map(list => 
          list.id === editingList.id 
            ? { ...list, name: newListName.trim(), updatedAt: new Date() }
            : list
        );
      } else {
        // Crear nueva lista
        const newList: Lista = {
          id: Date.now(),
          name: newListName.trim(),
          himnos: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        updatedLists = [...lists, newList];
      }
      
      // Guardar en AsyncStorage
      await updateSettingValue('userLists', updatedLists);
      setLists(updatedLists);
      setNewListName('');
      setModalVisible(false);
      setEditingList(null);
    }
  };

  // Agregar función para eliminar lista
  const handleDeleteList = async (id: number) => {
    const updatedLists = lists.filter(list => list.id !== id);
    await updateSettingValue('userLists', updatedLists);
    setLists(updatedLists);
  };

  // Agregar función para editar lista
  const handleEditList = (lista: Lista) => {
    setEditingList(lista);
    setNewListName(lista.name);
    setModalVisible(true);
  };


  return (
    <ThemedView style={styles.containerList}>
      <ThemedView style={{...styles.searchContainer, backgroundColor: colorScheme === 'dark' ? '#1E1E1E' : tintColorBlue}}>
        <SearchBar
          value={busqueda}
          onChangeText={setBusqueda}
          onCreate={handleCreateList}
          placeholder="Buscar..."
        />
        
      </ThemedView>
      
      {listasFiltradas.length > 0 ? (
        <FlatList
          data={listasFiltradas}
          renderItem={({item, index}) => (
            <ListItem
              title={item.name}
              subtitle={`${item.himnos.length} Himnos, Creado el ${item.createdAt.toLocaleDateString()}`}
              fontSize={fontSize <= 27 ? fontSize : 27}
              onPress={() => navigation.navigate('ListDetail', { lista: {name: item.name, himnos: item.himnos} })}
              style={{
                backgroundColor: index % 2 === 0 
                  ? (colorScheme === 'dark' ? '#2A2A2A' : '#f7f7f7')
                  : (colorScheme === 'dark' ? '#1E1E1E' : '#FFFFFF')
              }}
              sizeIcon={30}
              rightIcon={{
                name: "remove-circle",
                color: "red",
                onPress: async () => {
                  Alert.alert(
                    "Confirmar eliminación",
                    "¿Estás seguro que deseas eliminar este elemento?",
                    [
                      {
                        text: "Cancelar",
                        style: "cancel"
                      },
                      {
                        text: "Eliminar",
                        style: "destructive",
                        onPress: async () => {
                          // aquí va tu código original de eliminación
                          handleDeleteList(item.id)
                        }
                      }
                    ]
                  );
                }
              }}
              leftIcon={{
                name: "build",
                color: tintColorBlue,
                onPress: () => handleEditList(item)
              }}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <ThemedText style={styles.noLists}>No hay listas creadas</ThemedText>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setEditingList(null);
          setNewListName('');
        }}
      >
        <ThemedView style={styles.modalContainer}>
          <ThemedView style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>
              {editingList ? 'Editar Lista' : 'Crear Nueva Lista'}
            </ThemedText>
            <TextInput
              style={styles.input}
              value={newListName}
              onChangeText={setNewListName}
              placeholder="Nombre de la lista"
              placeholderTextColor="#888"
            />
            <ThemedView style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setEditingList(null);
                  setNewListName('');
                }}
              >
                <ThemedText>Cancelar</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.saveButton]}
                onPress={handleSaveList}
              >
                <ThemedText style={styles.saveButtonText}>
                  {editingList ? 'Actualizar' : 'Guardar'}
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  containerList: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  listContent: {
    paddingVertical: 8,
  },
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 12,
    color: '#333',
  },
  itemTitle: {
    fontSize: 16,
    color: '#555',
  },
  favoriteButton: {
    padding: 8,
  },
  noFavorites: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  },
  createButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 8,
  },
  noLists: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    padding: 10,
    borderRadius: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#CCCCCC',
  },
  saveButton: {
    backgroundColor: tintColorBlue,
  },
  saveButtonText: {
    color: '#FFFFFF',
  },
});

export default MyLists;
