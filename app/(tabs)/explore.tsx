import Ionicons from '@expo/vector-icons/Ionicons';
import {
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import ListComponent from '../components/ListComponent';
import { useLocalSearchParams } from 'expo-router';

export default function TabTwoScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  

  return (
    <SafeAreaView style={styles.container}>
      <ListComponent category={category} />
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
