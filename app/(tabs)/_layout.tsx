import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useBottomInset } from '@/utils/safeArea';
import features from '@/constants/features.json';

// `hidden`: la ruta existe pero no aparece en la barra.
//  - bible: oculta hasta tener la licencia de la RVR1960 (constants/features.json).
// Perfil no es pestaña: es la pantalla app/perfil.tsx y se abre con el avatar (components/ProfileButton.tsx).
const TABS = [
  { name: 'index', title: 'Inicio', icon: 'home', hidden: false },
  { name: 'explore', title: 'Alabanzas', icon: 'musical-notes', hidden: false },
  { name: 'bible', title: 'Biblia', icon: 'book', hidden: !features.bible },
  { name: 'favorites', title: 'Favoritos', icon: 'star', hidden: false },
  { name: 'mylists', title: 'Mis Listas', icon: 'list', hidden: false },
] as const;

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  // Espacio para el indicador de inicio del iPhone (en web la barra no lo recibía).
  const bottomInset = useBottomInset();
  const webTabBar =
    Platform.OS === 'web'
      ? { paddingBottom: bottomInset, height: `calc(58px + env(safe-area-inset-bottom, 0px))` as unknown as number }
      : {};

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.tabIconSelected,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          elevation: 0,
          ...webTabBar,
        },
        sceneStyle: { backgroundColor: theme.background },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            href: tab.hidden ? null : undefined,
            title: tab.title,
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? tab.icon : `${tab.icon}-outline`} color={color as string} />
            ),
            tabBarLabel: ({ color, focused }) => (
              <View style={styles.labelWrap}>
                <Text
                  style={[
                    styles.label,
                    { color: color as string, fontFamily: focused ? Fonts.sansSemiBold : Fonts.sansMedium },
                  ]}
                  numberOfLines={1}
                >
                  {tab.title}
                </Text>
                <View style={[styles.indicator, { backgroundColor: focused ? theme.secondary : 'transparent' }]} />
              </View>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  labelWrap: {
    alignItems: 'center',
    gap: 3,
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
  indicator: {
    width: 18,
    height: 2,
    borderRadius: 1,
  },
});
