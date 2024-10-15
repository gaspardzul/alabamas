import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import HeaderComponent from '@/components/HeaderComponent';
import { useRoute, RouteProp } from '@react-navigation/native';
import allHimnos from '@/assets/himnos/allHimnos.json';


interface Verso {
  verse: number;
  text: string;
  repeat?: number;
}

interface HimnoDetalle {
  title: string;
  number: number;
  lyrics: Verso[];
}

type RootStackParamList = {
  HimnoDetail: { number: string };
};

const HimnoDetail: React.FC = () => {
  const [himno, setHimno] = useState<HimnoDetalle | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const route = useRoute<RouteProp<RootStackParamList, 'HimnoDetail'>>();
  const number = route.params?.number;

  useEffect(() => {
     if (route.params?.number) {
      cargarHimno(route.params?.number);
     }
  }, [route.params?.number]);

  const cargarHimno = async (numberHimno: string) => {
    try {
      let himno = allHimnos[numberHimno as keyof typeof allHimnos];
      if (numberHimno && himno) {
        setHimno(himno as HimnoDetalle);
      }
      //setHimno(himnoData);
    } catch (error) {
      setError('Error al cargar el himno');
    }
  };

  if (!himno) {
    return <ThemedText>Cargando...</ThemedText>;
  }

  return (
    <ScrollView style={styles.container}>
      <ThemedText style={styles.title}>{himno.number}. {himno.title}</ThemedText>
      {himno.lyrics.map((verso, index) => (
        <ThemedView key={index} style={styles.verseContainer}>
          <ThemedText style={styles.verseNumber}>
            {verso.verse === 0 ? 'Coro' : `Verso ${verso.verse}`}
          </ThemedText>
          <ThemedText style={[
            styles.verseText,
            verso.verse === 0 && styles.chorusText
          ]}>
            {verso.text}
          </ThemedText>
          {verso.repeat && <ThemedText style={styles.repeat}>(Repetir {verso.repeat} veces)</ThemedText>}
        </ThemedView>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  verseContainer: {
    marginBottom: 16,
  },
  verseNumber: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  verseText: {
    marginBottom: 4,
  },
  repeat: {
    fontStyle: 'italic',
  },
  chorusText: {
    color: 'red',
  },
});

export default HimnoDetail;
