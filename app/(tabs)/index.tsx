
import { useMemo } from 'react';
import { Image, StyleSheet, Platform, View, Text, TouchableOpacity } from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { LinearGradient } from 'expo-linear-gradient';
import himnosData from '@/assets/himnos/lista.json'
import { tintColorBlue } from '@/constants/Colors';
import { useRouter } from 'expo-router';

const gradientCombinations = [
  ['#00E2E0', '#00A9F2'],  // Turquesa brillante a azul
  ['#00A9F2', '#172D9D'],  // Azul a azul marino
  ['#172D9D', '#787CFE'],  // Azul marino a violeta
  ['#787CFE', '#48BED9'],  // Violeta a azul claro
  ['#48BED9', '#00E2E0'],  // Azul claro a turquesa
  ['#00A9F2', '#48BED9'],  // Azul a azul claro
  ['#172D9D', '#00A9F2'],  // Azul marino a azul
  ['#787CFE', '#00E2E0'],  // Violeta a turquesa
];
// Función para obtener un índice consistente basado en el nombre de la categoría
const getConsistentColorIndex = (categoria: string) => {
  let hash = 0;
  for (let i = 0; i < categoria.length; i++) {
    hash = categoria.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % gradientCombinations.length;
};

export default function HomeScreen() {
  const totalAlabanzas = himnosData.lista.length;
  const router = useRouter();


  const categorias = useMemo(() => {
    const grupos = himnosData.lista.reduce((acc, himno) => {
      const grupo = himno.group;
      if (!acc[grupo]) {
        const colorIndex = getConsistentColorIndex(grupo);
        acc[grupo] = {
          count: 0,
          colors: gradientCombinations[colorIndex]
        };
      }
      acc[grupo].count++;
      return acc;
    }, {} as Record<string, { count: number; colors: string[] }>);

    return Object.entries(grupos);
  }, []);

  const navegarAAlabanzas = (category: string) => {
    router.push({
      pathname: '/(tabs)/explore',
      params: { category }
    });
  };


  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: tintColorBlue, dark: '#1E1E1E' }}
      headerImage={
        <View style={styles.headerContainer}>
          <Image
            source={require('@/assets/images/pigeon.png')}
            style={styles.reactLogo}
            resizeMode="contain"
          />
          <ThemedText type="title" style={styles.titleHeader}>Alaba+</ThemedText>
        </View>
      }>
      <View style={styles.centeredTextContainer}>
        <ThemedText type="title" style={{textAlign: 'center'}}>HIMNARIO</ThemedText>
        <ThemedText style={styles.centeredText}>Salmo 95:1</ThemedText>
        <ThemedText style={styles.totalAlabanzas}>Total de alabanzas: {totalAlabanzas}</ThemedText>
      </View>
      <View style={styles.grid}>
        {categorias.map(([categoria, { count, colors }]) => (
          <TouchableOpacity 
            key={categoria}
            onPress={() => navegarAAlabanzas(categoria)}
            style={styles.cardWrapper}
          >
            <LinearGradient
              colors={colors}
              style={styles.card}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <ThemedText style={styles.categoriaTitle}>{categoria}</ThemedText>
              <ThemedText style={styles.cantidad}>{count}</ThemedText>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    fontSize: 28,
    lineHeight: 32,
    marginTop: -6,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  titleHeader: {
    position: 'absolute',
    bottom: 20,
    left: 50,
    color: 'white',
  },
  reactLogo: {
    width: '100%',
    height: '120%',
    position: 'absolute',
    bottom: 0,
    top: 10,
  },
  headerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  centeredTextContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  totalAlabanzas: {
    fontSize: 18,
    marginTop: 10,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  cardWrapper: {
    width: '47%',
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  card: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    borderRadius: 12,
  },
  categoriaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  cantidad: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
