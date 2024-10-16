import React, { useState } from 'react';
import { Image, StyleSheet, Platform, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function SettingsScreen() {
  const [fontSize, setFontSize] = useState(16);

  const aumentarFuente = () => {
    setFontSize(prevSize => Math.min(prevSize + 2, 48));
  };

  const disminuirFuente = () => {
    setFontSize(prevSize => Math.max(prevSize - 2, 12));
  };

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
        <ThemedText type="title">Ajustes</ThemedText>
        <HelloWave />
      </ThemedView>

      <ThemedView style={styles.settingsContainer}>
        <ThemedText type="subtitle">Tamaño de fuente</ThemedText>
        <View style={styles.fontSizeControls}>
          <TouchableOpacity onPress={disminuirFuente} style={styles.fontButton}>
            <Ionicons name="remove-circle-outline" size={24} color="black" />
          </TouchableOpacity>
          <ThemedText style={{ fontSize:16 }}>
            {fontSize}
          </ThemedText>
          <TouchableOpacity onPress={aumentarFuente} style={styles.fontButton}>
            <Ionicons name="add-circle-outline" size={24} color="black" />
          </TouchableOpacity>
        </View>
        <ThemedText style={{ fontSize: fontSize, lineHeight: fontSize + 8 }}>
          Texto de ejemplo
        </ThemedText>
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
  settingsContainer: {
    padding: 16,
    gap: 16,
  },
  fontSizeControls: {
    flexDirection: 'row',
    gap: 16,
  },
  fontButton: {
    padding: 8,
  },
});
