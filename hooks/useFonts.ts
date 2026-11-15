import * as Font from 'expo-font';
import { useEffect, useState } from 'react';
import {
  Merriweather_300Light,
  Merriweather_400Regular,
  Merriweather_400Regular_Italic,
  Merriweather_700Bold,
} from '@expo-google-fonts/merriweather';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Fonts } from '@/constants/Typography';

export default function useFonts() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          [Fonts.serifLight]: Merriweather_300Light,
          [Fonts.serif]: Merriweather_400Regular,
          [Fonts.serifItalic]: Merriweather_400Regular_Italic,
          [Fonts.serifBold]: Merriweather_700Bold,
          [Fonts.sans]: PlusJakartaSans_400Regular,
          [Fonts.sansMedium]: PlusJakartaSans_500Medium,
          [Fonts.sansSemiBold]: PlusJakartaSans_600SemiBold,
          [Fonts.sansBold]: PlusJakartaSans_700Bold,
        });
      } catch (error) {
        console.error('Error loading fonts:', error);
      } finally {
        setFontsLoaded(true);
      }
    }

    loadFonts();
  }, []);

  return fontsLoaded;
}
