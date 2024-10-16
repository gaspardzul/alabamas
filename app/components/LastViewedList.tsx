import React, { useEffect } from 'react';
import { FlatList, StyleSheet, View, ListRenderItem } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ThemedText } from '@/components/ThemedText';
import { useVisitedItems } from '@/hooks/useLastViews';

interface LastView {
  number: number;
  title: string;
}

const LastViewedList = () => {
  const { visitedItems, loadVisitedItems, removeAllVisitedItems } = useVisitedItems();

  useFocusEffect(
    React.useCallback(() => {
        loadVisitedItems();
    }, [])
  );

  const randomUUID = () => {
    return Math.random().toString(36).substring(2, 15);
  }

  // Mover el console.log fuera de useFocusEffect
  useEffect(() => {
    console.log("visitedItems", visitedItems);
  }, [visitedItems]);

  const renderItem: ListRenderItem<LastView> = ({ item }) => (
    <View style={styles.item}>
      <ThemedText>{item?.title || item?.number}</ThemedText>
    </View>
  );

  return (
    <FlatList
      ListHeaderComponent={
        <ThemedText type="subtitle" style={styles.header}>Últimos elementos visitados</ThemedText>
      }
      data={visitedItems as unknown as LastView[]}
      keyExtractor={(item) => item.number.toString()}
      renderItem={renderItem}
      contentContainerStyle={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  header: {
    marginBottom: 10,
  },
  item: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
});

export default LastViewedList;
