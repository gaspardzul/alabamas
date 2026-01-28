import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, useColorScheme, Share, Modal, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import HeaderComponent from '@/components/HeaderComponent';
import { useRoute, RouteProp } from '@react-navigation/native';
import allHimnos from '@/assets/himnos/allHimnos.json';
import { Ionicons } from '@expo/vector-icons';
import useStorage from '@/hooks/useStorage';
import { Himno, Lista } from '@/ts/interfaces';
import { Colors } from '@/constants/Colors';
import { useSettings } from '@/hooks/useSettings';
import { generateHimnoHTML, generateAndSharePDF } from '@/utils/pdfGenerator';


interface Verso {
  verse: number;
  text: string;
  repeat?: number;
}

interface HimnoDetalle {
  title?: string;
  number?: number;
  lyrics?: Verso[];
}

type RootStackParamList = {
  HimnoDetail: { number: string };
};

const HimnoDetail: React.FC = () => {
  const [himno, setHimno] = useState<HimnoDetalle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(24);
  const [isFavorite, setIsFavorite] = useState(false);
  const colorScheme = useColorScheme();
  const { getSettingValue, updateSettingValue } = useSettings();
  const route = useRoute<RouteProp<RootStackParamList, 'HimnoDetail'>>();

  const { addFavorite, removeFavorite, getFavorites, favorites } = useStorage('favoritos');
  const [showListModal, setShowListModal] = useState(false);
  const [userLists, setUserLists] = useState<Lista[]>([]);

  useEffect(() => {
    if (route.params?.number) {
      cargarHimno(route.params?.number);
      checkFavoriteStatus(route.params?.number);
      loadSettings();
      setTimeout(async () => {
        await getFavorites();
        console.log("favorites", favorites)
      }, 1000);
    }
  }, [route.params?.number]);

  useEffect(() => {
    loadUserLists();
  }, []);

  const loadSettings = async () => {
    const fontSize = await getSettingValue('fontSize');
    if(fontSize){
      setFontSize(fontSize);
    }
  }

  const loadUserLists = async () => {
    const lists = await getSettingValue('userLists');
    if (lists) {
      setUserLists(lists);
    }
  };

  const addToList = async (lista: Lista) => {
    if (!himno?.number) return;

    const updatedLists = userLists.map(l => {
      if (l.id === lista.id) {
        // Evitar duplicados
        if (!l.himnos.includes(himno?.number?.toString() ?? '')) {
          return {
            ...l,
            himnos: l.himnos.includes(himno.number?.toString() ?? '') 
              ? l.himnos 
              : [...l.himnos, himno.number?.toString() ?? ''],
            updatedAt: new Date()
          };
        }
      }
      return l;
    });

    await updateSettingValue('userLists', updatedLists);
    setUserLists(updatedLists);
    setShowListModal(false);
  };

  const cargarHimno = async (numberHimno: string) => {
    try {
      let himno = allHimnos[numberHimno as keyof typeof allHimnos];
      if (numberHimno && himno) {
        setHimno(himno as HimnoDetalle);
      }
    } catch (error) {
      setError('Error al cargar el himno');
    }
  };

  const checkFavoriteStatus = async (numberHimno: string) => {
    const favs = await getFavorites();
    setIsFavorite(favs.some((fav: Himno) => fav.number === parseInt(numberHimno)));
  };

  const toggleFavorite = async () => {
    if (himno) {
      if (isFavorite) {
        removeFavorite(himno.number as number);
      } else {
        addFavorite(himno as unknown as Himno);
      }
      setIsFavorite(!isFavorite);
    }
  };

  const aumentarFuente = () => {
    setFontSize(prevSize => Math.min(prevSize + 2, 48));
    updateSettingValue('fontSize', fontSize);
  };

  const disminuirFuente = () => {
    setFontSize(prevSize => Math.max(prevSize - 2, 12));
    updateSettingValue('fontSize', fontSize);
  };

  const resetFontSize = async () => {
    const defaultSize = 24;
    setFontSize(defaultSize);
    updateSettingValue('fontSize', defaultSize);
  };

  const compartirHimno = async () => {
    if (!himno) return;
    
    let contenido = `${himno.title}\n\n`;
    himno.lyrics?.forEach((verso) => {
      if (verso.verse === 0) {
        contenido += 'Coro:\n';
      } else {
        contenido += `Verso ${verso.verse}:\n`;
      }
      contenido += verso.text + '\n';
      if (verso.repeat) {
        contenido += `(Repetir ${verso.repeat} veces)\n`;
      }
      contenido += '\n';
    });
    
    try {
      await Share.share({
        message: contenido,
        title: `Himno ${himno.number} - ${himno.title}`,
      });
    } catch (error) {
      console.error('Error al compartir:', error);
    }
  };

  const compartirHimnoPDF = async () => {
    if (!himno || !himno.lyrics) return;

    try {
      const himnoData = {
        title: himno.title || '',
        number: himno.number || 0,
        lyrics: himno.lyrics
      };
      
      const html = generateHimnoHTML(himnoData, fontSize);
      await generateAndSharePDF(html, `${himno.title}.pdf`);
    } catch (error) {
      Alert.alert('Error', 'No se pudo generar el PDF. Intenta de nuevo.');
      console.error(error);
    }
  };

  if (!himno) {
    return <ThemedText>Cargando...</ThemedText>;
  }

  return (
    <View style={styles.container}>
      <ThemedView style={styles.fontSizeControls}>
        <View style={styles.fontSizeButtons}>
          <TouchableOpacity onPress={disminuirFuente} style={styles.fontButton}>
            <Ionicons name="remove-circle-outline" size={24} color={colorScheme === 'dark' ? Colors.dark.icon : Colors.light.icon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={resetFontSize} style={styles.fontButton}>
            <Ionicons name="refresh-circle-outline" size={24} color={colorScheme === 'dark' ? Colors.dark.icon : Colors.light.icon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={aumentarFuente} style={styles.fontButton}>
            <Ionicons name="add-circle-outline" size={24} color={colorScheme === 'dark' ? Colors.dark.icon : Colors.light.icon} />
          </TouchableOpacity>
        </View>
        <View style={styles.rightButtons}>
          <TouchableOpacity onPress={compartirHimno} style={styles.iconButton}>
            <Ionicons name="share-outline" size={24} color={colorScheme === 'dark' ? Colors.dark.icon : Colors.light.icon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={compartirHimnoPDF} style={styles.iconButton}>
            <Ionicons name="document-text" size={24} color={colorScheme === 'dark' ? Colors.dark.icon : Colors.light.icon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowListModal(true)} style={styles.iconButton}>
            <Ionicons name="musical-note" size={24} color={colorScheme === 'dark' ? Colors.dark.icon : Colors.light.icon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleFavorite} style={styles.iconButton}>
            <Ionicons name={isFavorite ? "bookmark" : "bookmark-outline"} size={24} color={isFavorite ? "#ff002f" : colorScheme === 'dark' ? Colors.dark.icon : Colors.light.icon} />
          </TouchableOpacity>
        </View>
      </ThemedView>

      <Modal
        visible={showListModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowListModal(false)}
      >
        <ThemedView style={styles.modalContainer}>
          <ThemedView style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Añadir a lista</ThemedText>
            <ScrollView>
              {userLists.length > 0 ? (
                userLists.map((lista) => (
                  <TouchableOpacity
                    key={lista.id}
                    style={styles.listItem}
                    onPress={() => addToList(lista)}
                  >
                    <ThemedText>{lista.name}</ThemedText>
                    <ThemedText style={styles.listItemCount}>
                      {lista.himnos.length} himnos
                    </ThemedText>
                  </TouchableOpacity>
                ))
              ) : (
                <ThemedText style={styles.noLists}>
                  No hay listas disponibles
                </ThemedText>
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowListModal(false)}
            >
              <ThemedText style={styles.closeButtonText}>Cerrar</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </Modal>

      <ScrollView style={styles.scrollView}>
        <View style={styles.contentContainer}>
          <ThemedText style={[styles.title, { fontSize: fontSize + 8 }]}>{himno.number}. {himno.title}</ThemedText>
          {himno.lyrics && himno.lyrics.map((verso, index) => (
            <ThemedView key={index} style={styles.verseContainer}>
              <ThemedText type="Himno" style={[styles.verseNumber, { fontSize, lineHeight: fontSize + 10 }]}>
                {verso.verse === 0 ? 'Coro' : `Verso ${verso.verse}`}
              </ThemedText>
              <ThemedText type="Himno" style={[
                styles.verseText,
                verso.verse === 0 && styles.chorusText,
                { fontSize, lineHeight: fontSize + 10 }
              ]}>
                {verso.text}
              </ThemedText>
              {verso.repeat && <ThemedText style={[styles.repeat, { fontSize }]}>(Repetir {verso.repeat} veces)</ThemedText>}
            </ThemedView>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    flexGrow: 1,
    width: '100%', // Aseguramos que el contenido ocupe todo el ancho disponible
  },
  fontSizeControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  fontSizeButtons: {
    flexDirection: 'row',
  },
  fontButton: {
    marginRight: 10,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 16,
    flexWrap: 'wrap', // Permitimos que el título se envuelva si es necesario
    lineHeight: 50,
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
    flexWrap: 'wrap', // Permitimos que el texto de los versos se envuelva
  },
  repeat: {
    fontStyle: 'italic',
  },
  chorusText: {
    color: 'red',
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 15,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    maxHeight: '70%',
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
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  listItemCount: {
    fontSize: 12,
    color: '#666666',
  },
  closeButton: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#007AFF',
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  noLists: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666666',
  },
});

export default HimnoDetail;
