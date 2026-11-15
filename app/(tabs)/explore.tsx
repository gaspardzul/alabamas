import { View, StyleSheet } from 'react-native';
import ListComponent from '../components/ListComponent';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useThemeColor';

export default function TabTwoScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ListComponent category={category} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
