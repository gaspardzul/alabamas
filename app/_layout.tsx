import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import useFonts from '@/hooks/useFonts';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import DialogHost from '@/components/DialogHost';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const fontsLoaded = useFonts();
  const theme = Colors[colorScheme];

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  const baseTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: theme.primary,
      background: theme.background,
      card: theme.background,
      text: theme.text,
      border: theme.border,
    },
  };

  const headerOptions = {
    headerShown: true,
    headerShadowVisible: false,
    headerStyle: { backgroundColor: theme.background },
    headerTintColor: theme.primary,
    headerTitleStyle: { fontFamily: Fonts.serifBold, fontSize: 17, color: theme.text },
    headerBackButtonDisplayMode: 'minimal' as const,
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ contentStyle: { backgroundColor: theme.background } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Alaba+' }} />
        <Stack.Screen name="+not-found" />
        <Stack.Screen name="HimnoDetail" options={{ ...headerOptions, title: 'Himno' }} />
        <Stack.Screen
          name="ListDetail"
          options={({ route }: { route: { params?: { lista?: { name: string } } } }) => ({
            ...headerOptions,
            title: route.params?.lista?.name || 'Lista',
          })}
        />
        <Stack.Screen name="BibleReader" options={{ ...headerOptions, title: 'Biblia' }} />
        <Stack.Screen
          name="PresentationMode"
          options={({ route }: { route: { params?: { lista?: { name: string } } } }) => ({
            ...headerOptions,
            title: route.params?.lista?.name || 'Presentación',
          })}
        />
      </Stack>
      <DialogHost />
    </ThemeProvider>
  );
}
