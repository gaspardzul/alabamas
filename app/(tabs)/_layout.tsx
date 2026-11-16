import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useColorScheme } from '@/hooks/useColorScheme';

const TABS = [
  { name: 'index', title: 'Inicio', icon: 'home' },
  { name: 'explore', title: 'Alabanzas', icon: 'musical-notes' },
  { name: 'bible', title: 'Biblia', icon: 'book' },
  { name: 'favorites', title: 'Favoritos', icon: 'star' },
  { name: 'mylists', title: 'Mis Listas', icon: 'list' },
  { name: 'about', title: 'Perfil', icon: 'person-circle' },
] as const;

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

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
        },
        sceneStyle: { backgroundColor: theme.background },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
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
