import { View, StyleSheet } from 'react-native';
import ListFavorites from '../components/ListFavorites';
import { useTheme } from '@/hooks/useThemeColor';

export default function FavoriteScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ListFavorites />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
