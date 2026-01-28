import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Alert, Share, TouchableOpacity } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@/ts/types';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSettings } from '@/hooks/useSettings';
import { Ionicons } from '@expo/vector-icons';
import { generateMultipleHimnosHTML, generateAndSharePDF } from '@/utils/pdfGenerator';
import allHimnos from '@/assets/himnos/allHimnos.json';

type PresentationModeRouteProp = RouteProp<RootStackParamList, 'PresentationMode'>;

interface Verso {
  verse: number;
  text: string;
}

interface Himno {
  title: string;
  number: number;
  lyrics: Verso[];
}

const PresentationMode: React.FC = () => {
  const route = useRoute<PresentationModeRouteProp>();
  const navigation = useNavigation();
  const { lista } = route.params as { lista: any };
  const colorScheme = useColorScheme();
  const { settings } = useSettings();
  const [himnos, setHimnos] = useState<Himno[]>([]);

  useEffect(() => {
    const himnosCompletos = lista.himnos
      .map((numeroHimno: string) => {
        const himnoData = (allHimnos as any)[numeroHimno];
        return himnoData ? { ...himnoData } : null;
      })
      .filter((himno: Himno | null) => himno !== null);
    
    setHimnos(himnosCompletos);
  }, [lista]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', marginRight: 10, gap: 15 }}>
          <TouchableOpacity onPress={handleShareText}>
            <Ionicons name="share-outline" size={24} color={colorScheme === 'dark' ? '#fff' : '#000'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSharePDF}>
            <Ionicons name="document-text" size={24} color={colorScheme === 'dark' ? '#fff' : '#000'} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [himnos, colorScheme]);

  const handleSharePDF = async () => {
    try {
      if (himnos.length === 0) {
        Alert.alert('Error', 'No hay himnos para compartir');
        return;
      }

      const html = generateMultipleHimnosHTML(himnos, settings.fontSize, lista.name);
      await generateAndSharePDF(html, `${lista.name}.pdf`);
    } catch (error) {
      Alert.alert('Error', 'No se pudo generar el PDF. Intenta de nuevo.');
      console.error(error);
    }
  };

  const handleShareText = async () => {
    if (himnos.length === 0) {
      Alert.alert('Error', 'No hay himnos para compartir');
      return;
    }

    let contenido = `${lista.name}\n\n`;
    
    himnos.forEach((himno, index) => {
      contenido += `Himno #${himno.number} - ${himno.title}\n\n`;
      
      himno.lyrics.forEach((verso) => {
        if (verso.verse === 0) {
          contenido += 'Coro:\n';
        } else {
          contenido += `Verso ${verso.verse}:\n`;
        }
        contenido += verso.text + '\n\n';
      });
      
      if (index < himnos.length - 1) {
        contenido += '---\n\n';
      }
    });

    try {
      await Share.share({
        message: contenido,
        title: lista.name,
      });
    } catch (error) {
      console.error('Error al compartir:', error);
    }
  };

  const renderHimno = (himno: Himno, index: number) => {
    return (
      <View key={himno.number} style={styles.himnoContainer}>
        <ThemedText style={styles.himnoNumber}>
          Himno #{himno.number}
        </ThemedText>
        <ThemedText style={styles.himnoTitle}>
          {himno.title}
        </ThemedText>
        
        {himno.lyrics.map((verso, versoIndex) => (
          <View key={versoIndex} style={styles.versoContainer}>
            {verso.verse === 0 ? (
              <ThemedText style={[styles.coro, { fontSize: settings.fontSize, color: '#FF0000' }]}>
                {verso.text}
              </ThemedText>
            ) : (
              <>
                <ThemedText style={[styles.versoNumber, { fontSize: settings.fontSize }]}>
                  {verso.verse}.
                </ThemedText>
                <ThemedText style={[styles.versoText, { fontSize: settings.fontSize }]}>
                  {verso.text}
                </ThemedText>
              </>
            )}
          </View>
        ))}
        
        {index < himnos.length - 1 && (
          <View style={[
            styles.separator,
            { backgroundColor: colorScheme === 'dark' ? '#444' : '#ddd' }
          ]} />
        )}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {himnos.map((himno, index) => renderHimno(himno, index))}
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  himnoContainer: {
    marginBottom: 32,
  },
  himnoNumber: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 4,
  },
  himnoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  versoContainer: {
    marginBottom: 16,
  },
  versoNumber: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  versoText: {
    lineHeight: 28,
  },
  coro: {
    lineHeight: 28,
    fontStyle: 'italic',
  },
  separator: {
    height: 2,
    marginTop: 24,
    marginBottom: 8,
  },
});

export default PresentationMode;
