import { View, StyleSheet } from 'react-native';
import MyLists from '../components/MyLists';
import { useTheme } from '@/hooks/useThemeColor';

export default function ListScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <MyLists />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
