import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import HeaderComponent from '@/components/HeaderComponent';
import { useRoute, RouteProp } from '@react-navigation/native';
import allHimnos from '@/assets/himnos/allHimnos.json';
import { Ionicons } from '@expo/vector-icons';
import useStorage from '@/hooks/useStorage';
import { Himno } from '@/ts/interfaces';
import { useVisitedItems } from '@/hooks/useLastViews';


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
  const [fontSize, setFontSize] = useState(16);
  const [isFavorite, setIsFavorite] = useState(false);
  
  const route = useRoute<RouteProp<RootStackParamList, 'HimnoDetail'>>();

  const { addFavorite, removeFavorite, getFavorites, favorites } = useStorage('favoritos');

  useEffect(() => {
    if (route.params?.number) {
      cargarHimno(route.params?.number);
      checkFavoriteStatus(route.params?.number);
      setTimeout(async () => {
        await getFavorites();
        console.log("favorites", favorites)
      }, 1000);
    }
  }, [route.params?.number]);


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
    console.log("favs", favs)
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
  };

  const disminuirFuente = () => {
    setFontSize(prevSize => Math.max(prevSize - 2, 12));
  };

  if (!himno) {
    return <ThemedText>Cargando...</ThemedText>;
  }

  return (
    <View style={styles.container}>
      <ThemedView style={styles.fontSizeControls}>
        <View style={styles.fontSizeButtons}>
          <TouchableOpacity onPress={disminuirFuente} style={styles.fontButton}>
            <Ionicons name="remove-circle-outline" size={24} color="black" />
          </TouchableOpacity>
          <TouchableOpacity onPress={aumentarFuente} style={styles.fontButton}>
            <Ionicons name="add-circle-outline" size={24} color="black" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={toggleFavorite}>
          <Ionicons 
            name={isFavorite ? "bookmark" : "bookmark-outline"} 
            size={24} 
            color={isFavorite ? "#ff002f" : "black"} 
          />
        </TouchableOpacity>
      </ThemedView>
      <ScrollView style={styles.scrollView}>
        <View style={styles.contentContainer}>
          <ThemedText style={[styles.title, { fontSize: fontSize + 8 }]}>{himno.number}. {himno.title}</ThemedText>
          {himno.lyrics && himno.lyrics.map((verso, index) => (
            <ThemedView key={index} style={styles.verseContainer}>
              <ThemedText style={[styles.verseNumber, { fontSize, lineHeight: fontSize + 10 }]}>
                {verso.verse === 0 ? 'Coro' : `Verso ${verso.verse}`}
              </ThemedText>
              <ThemedText style={[
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
});

export default HimnoDetail;
