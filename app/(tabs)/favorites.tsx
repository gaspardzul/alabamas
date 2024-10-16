import Ionicons from '@expo/vector-icons/Ionicons';
import {
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import ListFavorites from '../components/ListFavorites';

export default function FavoriteScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ListFavorites />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: StatusBar.currentHeight || 0,
  },
  item: {
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 32,
  },
});
