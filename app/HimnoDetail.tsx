import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

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

const HimnoDetail: React.FC<{ route: { params: { number: number } } }> = ({ route }) => {
  const [himno, setHimno] = useState<HimnoDetalle | null>(null);

  useEffect(() => {
    const cargarHimno = async () => {
      try {
        const number = 78;
        const himnoData = require(`@/assets/himnos/${number}.json`);
        setHimno(himnoData);
      } catch (error) {
        console.error('Error al cargar el himno:', error);
      }
    };

    cargarHimno();
  }, []);

  if (!himno) {
    return <ThemedText>Cargando...</ThemedText>;
  }

  return (
    <ScrollView style={styles.container}>
      <ThemedText style={styles.title}>{himno.number}. {himno.title}</ThemedText>
      {himno.lyrics.map((verso, index) => (
        <ThemedView key={index} style={styles.verseContainer}>
          <ThemedText style={styles.verseNumber}>Verso {verso.verse}</ThemedText>
          <ThemedText style={styles.verseText}>{verso.text}</ThemedText>
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
});

export default HimnoDetail;
