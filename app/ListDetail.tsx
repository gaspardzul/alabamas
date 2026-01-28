import React, { useEffect, useState } from 'react';
import { StyleSheet, Alert, TouchableOpacity, View } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@/ts/types';
import ListItem from '@/components/ListItem';
import { useColorScheme } from '@/hooks/useColorScheme';
import himnario from '@/assets/himnos/lista.json';
import { listaDetail } from '@/ts/interfaces';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSettings } from '@/hooks/useSettings';
import { ThemedText } from '@/components/ThemedText';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
type ListDetailRouteProp = RouteProp<RootStackParamList, 'ListDetail'>;
type NavigationProp = StackNavigationProp<RootStackParamList, 'HimnoDetail'>;

const ListDetail: React.FC = () => {
  const route = useRoute<ListDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { lista } = route.params as { lista: listaDetail };
  const colorScheme = useColorScheme();
  const [himnosLista, setHimnosLista] = useState<any[]>([]);
  const [originalHimnosLista, setOriginalHimnosLista] = useState<any[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { getSettingValue, updateSettingValue } = useSettings();

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', marginRight: 10, gap: 15 }}>
          <TouchableOpacity onPress={handlePresentationMode}>
            <Ionicons name="play" size={24} color={colorScheme === 'dark' ? '#fff' : '#000'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleToggleEditMode}>
            <Ionicons 
              name={isEditMode ? "checkmark" : "swap-vertical"} 
              size={24} 
              color={isEditMode ? '#4CAF50' : (colorScheme === 'dark' ? '#fff' : '#000')} 
            />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [isEditMode, colorScheme, lista, hasChanges]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!isEditMode || !hasChanges) {
        return;
      }

      e.preventDefault();

      Alert.alert(
        'Cambios sin guardar',
        'Tienes cambios sin guardar. ¿Deseas guardar antes de salir?',
        [
          {
            text: 'Descartar',
            style: 'destructive',
            onPress: () => {
              setHimnosLista(originalHimnosLista);
              setIsEditMode(false);
              setHasChanges(false);
              navigation.dispatch(e.data.action);
            },
          },
          {
            text: 'Guardar',
            onPress: async () => {
              await handleToggleEditMode();
              navigation.dispatch(e.data.action);
            },
          },
          { text: 'Cancelar', style: 'cancel' },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, isEditMode, hasChanges, originalHimnosLista]);

  useEffect(() => {
    // Filtrar y ordenar los himnos según el orden en lista.himnos
    const himnosOrdenados = lista.himnos
      .map(numeroHimno => 
        himnario.lista.find(himno => himno.number.toString() === numeroHimno)
      )
      .filter(himno => himno !== undefined);
    setHimnosLista(himnosOrdenados);
    setOriginalHimnosLista(himnosOrdenados);
  }, [lista]);

  const handleDeleteHimno = async (number: string) => {
    Alert.alert(
      "Confirmar eliminación",
      "¿Estás seguro que deseas eliminar este himno de la lista?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            // Obtener todas las listas
            const userLists = await getSettingValue('userLists');
            
            // Encontrar y actualizar la lista específica
            const updatedLists = userLists.map((l: any) => {
              if (l.name === lista.name) {
                return {
                  ...l,
                  himnos: l.himnos.filter((h: string) => h !== number.toString()),
                  updatedAt: new Date()
                };
              }
              return l;
            });

            // Guardar las listas actualizadas
            await updateSettingValue('userLists', updatedLists);

            // Actualizar la vista actual
            const updatedHimnos = himnosLista.filter(h => h.number.toString() !== number.toString());
            setHimnosLista(updatedHimnos);
          }
        }
      ]
    );
  };

  const handlePresentationMode = async () => {
    if (isEditMode && hasChanges) {
      Alert.alert(
        "Cambios sin guardar",
        "Tienes cambios sin guardar. Guarda el orden antes de continuar.",
        [{ text: "OK" }]
      );
      return;
    }
    
    // Obtener la lista actualizada desde AsyncStorage para asegurar el orden correcto
    const userLists = await getSettingValue('userLists');
    const listaActualizada = userLists.find((l: any) => l.name === lista.name);
    
    navigation.navigate('PresentationMode', { lista: listaActualizada || lista });
  };

  const handleToggleEditMode = async () => {
    if (isEditMode) {
      // Guardar cambios
      if (hasChanges) {
        const userLists = await getSettingValue('userLists');
        const updatedLists = userLists.map((l: any) => {
          if (l.name === lista.name) {
            return {
              ...l,
              himnos: himnosLista.map(himno => himno.number.toString()),
              updatedAt: new Date()
            };
          }
          return l;
        });
        await updateSettingValue('userLists', updatedLists);
        setOriginalHimnosLista(himnosLista);
        setHasChanges(false);
      }
      setIsEditMode(false);
    } else {
      // Activar modo edición
      setIsEditMode(true);
    }
  };

  const handleDragEnd = ({ data }: { data: any[] }) => {
    setHimnosLista(data);
    setHasChanges(true);
  };

  const renderItem = ({ item, drag, isActive, getIndex }: RenderItemParams<any>) => {
    const index = getIndex();
    const backgroundColor = index !== undefined && index % 2 === 0 
      ? (colorScheme === 'dark' ? '#2A2A2A' : '#f7f7f7')
      : (colorScheme === 'dark' ? '#1E1E1E' : '#FFFFFF');
    
    return (
      <ScaleDecorator>
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'stretch',
          backgroundColor: backgroundColor,
          opacity: isActive ? 0.7 : 1,
        }}>
          {isEditMode && (
            <TouchableOpacity 
              onPressIn={drag}
              onLongPress={drag}
              style={{
                paddingHorizontal: 16,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons 
                name="menu" 
                size={24} 
                color={colorScheme === 'dark' ? '#888' : '#666'} 
              />
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }}>
            <ListItem
              title={item.title}
              subtitle={`Himno ${item.number}`}
              onPress={() => navigation.navigate('HimnoDetail', { number: item.number })}
              style={{
                backgroundColor: 'transparent',
              }}
              sizeIcon={30}
              rightIcon={{
                name: "remove-circle",
                color: "red",
                onPress: () => handleDeleteHimno(item.number.toString())
              }}
            />
          </View>
        </View>
      </ScaleDecorator>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemedView style={styles.container}>
        {isEditMode && (
          <ThemedView style={styles.instructionsContainer}>
            <Ionicons name="information-circle" size={20} color="#2196F3" />
            <ThemedText style={styles.instructionsText}>
              Mantén presionado el ícono ☰ y arrastra para reordenar. Presiona ✓ para guardar los cambios.
            </ThemedText>
          </ThemedView>
        )}
        {himnosLista.length > 0 ? (
          <DraggableFlatList
            data={himnosLista}
            renderItem={renderItem}
            keyExtractor={(item: any) => item.number.toString()}
            onDragEnd={handleDragEnd}
            activationDistance={isEditMode ? 0 : 999999}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <ThemedText style={styles.noHimnos}>
            No hay himnos en esta lista
          </ThemedText>
        )}
      </ThemedView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
    gap: 8,
  },
  instructionsText: {
    flex: 1,
    fontSize: 14,
    color: '#1976D2',
  },
  listContent: {
    paddingVertical: 8,
  },
  noHimnos: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  },
});

export default ListDetail;