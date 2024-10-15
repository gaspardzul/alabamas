import React, { useEffect, useState } from 'react';
import { FlatList, TouchableOpacity, StyleSheet, ListRenderItemInfo, TextInput } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import himnosData from '@/assets/himnos/lista.json';  
import { useNavigation } from '@react-navigation/native';

interface Himno {
  title: string;
  number: number;
  group: string;
}

const ListComponent: React.FC = () => {
  const navigation = useNavigation();
  const [himnos, setHimnos] = useState<Himno[]>([]);
  const [busqueda, setBusqueda] = useState<string>('');
  const [himnosFiltrados, setHimnosFiltrados] = useState<Himno[]>([]);

  useEffect(() => {
    const cargarHimnos = (): void => {
      try {
        // Ordenamos los himnos por número
        const himnosOrdenados = himnosData.lista.sort((a, b) => a.number - b.number);
        setHimnos(himnosOrdenados);
      } catch (error) {
        console.error('Error al cargar los himnos:', error);
      }
    };

    cargarHimnos();
  }, []);

  useEffect(() => {
    const filtrarHimnos = () => {
      const filtrados = himnos.filter(himno => 
        himno.number.toString().includes(busqueda) ||
        himno.title.toLowerCase().includes(busqueda.toLowerCase())
      );
      setHimnosFiltrados(filtrados);
    };

    filtrarHimnos();
  }, [busqueda, himnos]);

  const renderItem = ({ item }: ListRenderItemInfo<Himno>): React.ReactElement => (
    <TouchableOpacity 
      style={styles.item}
      onPress={() => navigation.navigate('HimnoDetail' as never )}
    >
      <ThemedText>{item.number}. {item.title}</ThemedText>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.containerList}>
      <ThemedView style={styles.container}>
        <ThemedText type="title">Lista de Himnos</ThemedText>
        <TextInput
          style={styles.input}
          placeholder="Buscar por número o título"
          value={busqueda}
          onChangeText={setBusqueda}
        />
      </ThemedView>
      
      <FlatList<Himno>
        data={himnosFiltrados}
        renderItem={renderItem}
        keyExtractor={(item: Himno) => item.number.toString()}
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  containerList: {
    flex: 1,
  },
  container: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  item: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 10,
  },
});

export default ListComponent;
