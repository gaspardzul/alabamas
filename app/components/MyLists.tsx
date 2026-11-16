import React, { useEffect, useState, useCallback } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, TextInput, View } from 'react-native';
import { showDialog } from '@/utils/dialog';
import Ionicons from '@expo/vector-icons/Ionicons';
import ScreenHeader from '@/components/ScreenHeader';
import Sheet from '@/components/Sheet';
import { useTheme } from '@/hooks/useThemeColor';
import { Fonts, Radius, Spacing } from '@/constants/Typography';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView'; 
import { RootStackParamList } from '@/ts/types';
import { Lista } from '@/ts/interfaces';
import SearchBar from '@/components/SearchBar';
import ListItem from '@/components/ListItem';
import { useNavigation, useFocusEffect } from 'expo-router';
import { FONT_SIZE_DEFAULT, useSettings } from '@/hooks/useSettings';
import type { StackNavigationProp } from '@react-navigation/stack';

type NavigationProp = StackNavigationProp<RootStackParamList, 'ListDetail'>;
// Agregar una nueva clave para las listas en Settings
interface Settings {
  fontSize: number;
  order: 'asc' | 'desc' | 'numAsc' | 'numDesc';
  userLists: Lista[];  // Nueva propiedad
}

const MyLists: React.FC = () => {
  const theme = useTheme();
  const [busqueda, setBusqueda] = useState<string>('');
  const [listasFiltradas, setListasFiltradas] = useState<Lista[]>([]);
  const { getSettingValue, updateSettingValue } = useSettings();
  const [lists, setLists] = useState<Lista[]>([]);
  const [fontSize, setFontSize] = useState<number>(FONT_SIZE_DEFAULT);
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


  const closeModal = () => {
    setModalVisible(false);
    setEditingList(null);
    setNewListName('');
  };

  return (
    <ThemedView style={styles.containerList}>
      <ScreenHeader eyebrow="Planificador" title="Mis Listas">
        <SearchBar
          value={busqueda}
          onChangeText={setBusqueda}
          onCreate={handleCreateList}
          placeholder="Buscar lista"
        />
      </ScreenHeader>

      {listasFiltradas.length > 0 ? (
        <FlatList
          data={listasFiltradas}
          keyboardShouldPersistTaps="handled"
          renderItem={({item}) => (
            <ListItem
              leadingIcon="musical-notes-outline"
              title={item.name}
              subtitle={`${item.himnos.length} ${item.himnos.length === 1 ? 'himno' : 'himnos'} · ${item.createdAt.toLocaleDateString()}`}
              fontSize={fontSize <= 27 ? fontSize : 27}
              onPress={() => navigation.navigate('ListDetail', { lista: {name: item.name, himnos: item.himnos} })}
              rightIcon={{
                name: "trash-outline",
                color: theme.textMuted,
                onPress: async () => {
                  showDialog(
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
                          handleDeleteList(item.id)
                        }
                      }
                    ]
                  );
                }
              }}
              leftIcon={{
                name: "create-outline",
                color: theme.primary,
                onPress: () => handleEditList(item)
              }}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.chip }]}>
            <Ionicons name="list-outline" size={28} color={theme.secondary} />
          </View>
          <ThemedText type="subtitle">
            {busqueda ? 'Sin resultados' : 'No hay listas creadas'}
          </ThemedText>
          <ThemedText type="caption" style={styles.emptyText}>
            {busqueda
              ? 'Ninguna lista coincide con tu búsqueda.'
              : 'Crea una lista para preparar el orden de alabanzas de un culto.'}
          </ThemedText>
          {!busqueda && (
            <TouchableOpacity
              style={[styles.button, styles.emptyButton, { backgroundColor: theme.primary }]}
              onPress={handleCreateList}
            >
              <Ionicons name="add" size={20} color={theme.onPrimary} />
              <ThemedText style={[styles.buttonText, { color: theme.onPrimary }]}>Nueva lista</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      )}

      <Sheet
        visible={modalVisible}
        onClose={closeModal}
        eyebrow="Mis listas"
        title={editingList ? 'Editar lista' : 'Crear nueva lista'}
      >
        <TextInput
          style={[
            styles.input,
            { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
          ]}
          value={newListName}
          onChangeText={setNewListName}
          placeholder="Nombre de la lista"
          placeholderTextColor={theme.textMuted}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleSaveList}
        />
        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={[styles.button, styles.flex, { borderColor: theme.primary, borderWidth: 1 }]}
            onPress={closeModal}
          >
            <ThemedText style={[styles.buttonText, { color: theme.primary }]}>Cancelar</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.flex, { backgroundColor: theme.primary }]}
            onPress={handleSaveList}
          >
            <ThemedText style={[styles.buttonText, { color: theme.onPrimary }]}>
              {editingList ? 'Actualizar' : 'Guardar'}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </Sheet>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  containerList: {
    flex: 1,
  },
  listContent: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: 72,
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  emptyText: {
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    fontSize: 16,
    fontFamily: Fonts.sans,
    marginBottom: Spacing.md,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  flex: {
    flex: 1,
  },
  button: {
    height: 48,
    borderRadius: Radius.md,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
  },
});

export default MyLists;
