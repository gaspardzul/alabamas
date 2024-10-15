import { Image, StyleSheet, Platform, Linking } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import Ionicons from '@expo/vector-icons/Ionicons';
import { type IconProps } from '@expo/vector-icons/build/createIconSet';
import { type ComponentProps } from 'react';


export default function SettingsScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Hola!</ThemedText>
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
          Esta app es totalmente gratuita, sin embargo, su mantenimiento tiene un coste mensual. Si te
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
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
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
