import { Image, StyleSheet, Platform, View } from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';

export default function HomeScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#1398c0', dark: '#13353f' }}
      headerImage={
        <View style={styles.headerContainer}>
          <Image
            source={require('@/assets/images/pigeon.png')}
            style={styles.reactLogo}
            resizeMode="contain"
          />
          <ThemedText type="title" style={styles.titleHeader}>Alaba +</ThemedText>
        </View>
      }>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    fontSize: 28,
    lineHeight: 32,
    marginTop: -6,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  titleHeader: {
    position: 'absolute',
    bottom: 20,
    left: 50,
    color: 'white',
  },
  reactLogo: {
    width: '100%',
    height: '120%',
    position: 'absolute',
    bottom: 0,
    top: 10,
  },
  headerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
});
