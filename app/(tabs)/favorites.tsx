import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
    
export default function FavoritesScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Perfil del Usuario</ThemedText>
      <ThemedText>Aquí puedes agregar la información del perfil</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
});