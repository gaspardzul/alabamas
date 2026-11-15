import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { showDialog } from '@/utils/dialog';
import { useRoute, useNavigation } from 'expo-router';
import type { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '@/ts/types';
import ListItem, { toTitleCase } from '@/components/ListItem';
import { useTheme } from '@/hooks/useThemeColor';
import { Fonts, Radius, Spacing } from '@/constants/Typography';
import himnario from '@/assets/himnos/lista.json';
import { listaDetail } from '@/ts/interfaces';
import type { StackNavigationProp } from '@react-navigation/stack';
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
  const theme = useTheme();
  const [himnosLista, setHimnosLista] = useState<any[]>([]);
  const [originalHimnosLista, setOriginalHimnosLista] = useState<any[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { getSettingValue, updateSettingValue } = useSettings();

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <TouchableOpacity onPress={handleToggleEditMode} style={styles.headerButton} accessibilityLabel={isEditMode ? 'Guardar orden' : 'Reordenar'}>
            <Ionicons
              name={isEditMode ? "checkmark" : "swap-vertical"}
              size={22}
              color={isEditMode ? theme.tertiary : theme.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handlePresentationMode}
            style={[styles.headerPill, { backgroundColor: theme.primary }]}
            accessibilityLabel="Modo presentación"
          >
            <Ionicons name="play" size={14} color={theme.onPrimary} />
            <ThemedText style={[styles.headerPillText, { color: theme.onPrimary }]}>Presentar</ThemedText>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [isEditMode, theme, lista, hasChanges]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!isEditMode || !hasChanges) {
        return;
      }

      e.preventDefault();

      showDialog(
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
    showDialog(
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
      showDialog(
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
    const index = getIndex() ?? 0;

    return (
      <ScaleDecorator>
        <View style={[styles.row, { opacity: isActive ? 0.85 : 1 }]}>
          {isEditMode && (
            <TouchableOpacity
              onPressIn={drag}
              onLongPress={drag}
              style={styles.dragHandle}
              accessibilityLabel="Arrastrar para reordenar"
            >
              <Ionicons name="reorder-three" size={26} color={theme.textMuted} />
            </TouchableOpacity>
          )}
          <ListItem
            number={item.number}
            title={toTitleCase(item.title)}
            subtitle={`${String(index + 1).padStart(2, '0')} · en el orden`}
            onPress={() => navigation.navigate('HimnoDetail', { number: item.number })}
            style={{
              ...styles.rowCard,
              ...(isActive ? { borderColor: theme.secondary } : null),
            }}
            rightIcon={{
              name: "remove-circle-outline",
              color: theme.textMuted,
              onPress: () => handleDeleteHimno(item.number.toString())
            }}
          />
        </View>
      </ScaleDecorator>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.summary}>
          <ThemedText type="label">Secuencia del servicio</ThemedText>
          <ThemedText type="caption">
            {himnosLista.length} {himnosLista.length === 1 ? 'himno' : 'himnos'}
          </ThemedText>
        </View>
        {isEditMode && (
          <View style={[styles.instructionsContainer, { backgroundColor: theme.chip }]}>
            <Ionicons name="hand-left-outline" size={18} color={theme.secondary} />
            <ThemedText type="caption" style={styles.instructionsText}>
              Mantén presionado ☰ y arrastra para reordenar. Toca ✓ para guardar.
            </ThemedText>
          </View>
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
          <View style={styles.empty}>
            <ThemedText type="subtitle">Lista vacía</ThemedText>
            <ThemedText type="caption" style={{ textAlign: 'center' }}>
              Añade himnos desde el lector con el botón “+ Lista”.
            </ThemedText>
          </View>
        )}
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
  },
  headerPillText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    lineHeight: 18,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.gutter,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: Spacing.gutter,
    marginBottom: Spacing.md,
    borderRadius: Radius.md,
    gap: 10,
  },
  instructionsText: {
    flex: 1,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.gutter,
    marginBottom: 10,
    gap: 4,
  },
  rowCard: {
    flex: 1,
    marginHorizontal: 0,
    marginBottom: 0,
  },
  dragHandle: {
    width: 32,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: 72,
    paddingHorizontal: Spacing.xl,
  },
});

export default ListDetail;
