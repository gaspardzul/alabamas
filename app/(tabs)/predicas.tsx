import { View, StyleSheet } from 'react-native';
import Predicas from '../components/Predicas';
import { useTheme } from '@/hooks/useThemeColor';

export default function PredicasScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Predicas />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
