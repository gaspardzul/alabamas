import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import useFonts from '@/hooks/useFonts';
import { Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import DialogHost from '@/components/DialogHost';
import WelcomeScreen from '@/components/WelcomeScreen';
import { initAuth } from '@/utils/auth';
import { setSession, useSession } from '@/utils/session';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const fontsLoaded = useFonts();
  const theme = Colors[colorScheme];
  const session = useSession();
  const pathname = usePathname();
  // Rutas que se pueden ver sin elegir Google/invitado (p. ej. la política de privacidad).
  const isPublicRoute = pathname === '/privacidad';

  useEffect(() => {
    // Si la sesión no puede iniciarse (p. ej. Firebase no responde), no dejar la app en blanco:
    // entrar como invitado con lo guardado en el dispositivo.
    initAuth().catch((error) => {
      console.error('No se pudo iniciar la sesión:', error);
      setSession({ ready: true, mode: 'guest', googleAvailable: false });
    });
  }, []);

  useEffect(() => {
    if (fontsLoaded && session.ready) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, session.ready]);

  if (!fontsLoaded || !session.ready) {
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
      {session.mode === null && !isPublicRoute ? (
        <WelcomeScreen />
      ) : (
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
        <Stack.Screen name="privacidad" options={{ ...headerOptions, title: 'Privacidad' }} />
        <Stack.Screen name="BibleReader" options={{ ...headerOptions, title: 'Biblia' }} />
        <Stack.Screen
          name="PresentationMode"
          options={({ route }: { route: { params?: { lista?: { name: string } } } }) => ({
            ...headerOptions,
            title: route.params?.lista?.name || 'Presentación',
          })}
        />
      </Stack>
      )}
      <DialogHost />
    </ThemeProvider>
  );
}
