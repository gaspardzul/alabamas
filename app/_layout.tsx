import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import useFonts from '@/hooks/useFonts';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import HimnoDetail from './HimnoDetail';

import { useColorScheme } from '@/hooks/useColorScheme';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const fontsLoaded = useFonts();

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Alaba+' }} />
        <Stack.Screen name="+not-found" />
        <Stack.Screen name="HimnoDetail"  options={{ headerShown: true, title: 'Himno' }} />
      </Stack>
      
    </ThemeProvider>
  );
}
