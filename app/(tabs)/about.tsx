import { Image, StyleSheet, Platform, Linking, View } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import Ionicons from '@expo/vector-icons/Ionicons';
import { tintColorBlue } from '@/constants/Colors';


export default function SettingsScreen() {
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
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="subtitle">PAZ!</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        
        <ThemedText>
          Espero que esta app te sea de utilidad y de bendicion para tu caminar cristiano.
          {' '}
          Se ha realizado con mucho cariño y dedicación para ti por: {' '}
          <ThemedText type="defaultSemiBold">Hno. Gaspar Dzul</ThemedText>
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Apóyanos:</ThemedText>
        <ThemedText>
          Esta app es totalmente gratuita, sin embargo, su mantenimiento tiene un costo mensual. Si te
          ha sido de utilidad, considera apoyar su mantenimiento para que podamos agregar nuevas
          funcionalidades y mejorar la experiencia de uso.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Información:</ThemedText>
        <ThemedText>
          casper088@gmail.com{' '}
        </ThemedText>
        <ThemedView style={styles.whatsappContainer}>
          <Ionicons name="logo-whatsapp" size={24} color={Platform.OS === 'ios' ? '#007AFF' : '#2196F3'} />
          <ThemedText
            style={styles.link}
            onPress={() => Linking.openURL('https://wa.me/529991659403')}>
            WhatsApp
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
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
  titleHeader: {
    position: 'absolute',
    bottom: 20,
    left: 50,
    color: 'white',
  },
  link: {
    textDecorationLine: 'underline',
    color: Platform.OS === 'ios' ? '#007AFF' : '#25D366',
  },
  whatsappContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
