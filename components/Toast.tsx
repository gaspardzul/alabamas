import React, { useCallback, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useThemeColor';
import { Fonts, Radius } from '@/constants/Typography';

/** Mensaje breve flotante (p. ej. "Agregado a la lista"). Devuelve `show` y el elemento a renderizar. */
export function useToast() {
  const theme = useTheme();
  const [message, setMessage] = useState('');
  const opacity = useRef(new Animated.Value(0)).current;

  const show = useCallback(
    (text: string) => {
      setMessage(text);
      opacity.stopAnimation();
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.delay(1800),
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    },
    [opacity]
  );

  const element = (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        {
          backgroundColor: theme.toast,
          opacity,
          transform: [{ translateY: opacity.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
        },
      ]}
    >
      <Ionicons name="checkmark-circle" size={16} color="#FFB68B" />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );

  return { show, element };
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    maxWidth: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  text: { color: '#FFFFFF', fontFamily: Fonts.sansMedium, fontSize: 14, lineHeight: 20, flexShrink: 1 },
});
