import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Alert } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@/ts/types';
import ListItem from '@/components/ListItem';
import { useColorScheme } from '@/hooks/useColorScheme';
import himnario from '@/assets/himnos/lista.json';
import { listaDetail } from '@/ts/interfaces';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSettings } from '@/hooks/useSettings';
import {ThemedText} from '@/components/ThemedText';
type ListDetailRouteProp = RouteProp<RootStackParamList, 'ListDetail'>;
type NavigationProp = StackNavigationProp<RootStackParamList, 'HimnoDetail'>;

const ListDetail: React.FC = () => {
  const route = useRoute<ListDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { lista } = route.params as { lista: listaDetail };
  const colorScheme = useColorScheme();
  const [himnosLista, setHimnosLista] = useState<any[]>([]);
  const { getSettingValue, updateSettingValue } = useSettings();

  useEffect(() => {
    // Filtrar los himnos que están en la lista
    const himnosFiltrados = himnario.lista.filter(himno => 
      lista.himnos.includes(himno.number.toString())
    );
    setHimnosLista(himnosFiltrados);
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

  return (
    <ThemedView style={styles.container}>
      {himnosLista.length > 0 ? (
        <FlatList
          data={himnosLista}
          renderItem={({item, index}) => (
            <ListItem
              title={item.title}
              subtitle={`Himno ${item.number}`}
              onPress={() => navigation.navigate('HimnoDetail', { number: item.number })}
              style={{
                backgroundColor: index % 2 === 0 
                  ? (colorScheme === 'dark' ? '#2A2A2A' : '#f7f7f7')
                  : (colorScheme === 'dark' ? '#1E1E1E' : '#FFFFFF')
              }}
              sizeIcon={30}
              rightIcon={{
                name: "remove-circle",
                color: "red",
                onPress: () => handleDeleteHimno(item.number.toString())
              }}
            />
          )}
          keyExtractor={(item) => item.number.toString()}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <ThemedText style={styles.noHimnos}>
          No hay himnos en esta lista
        </ThemedText>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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