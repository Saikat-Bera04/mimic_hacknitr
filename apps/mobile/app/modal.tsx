import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ModalScreen() {
  return (
   <View className='bg-black'>
<Text className='text-white text-3xl font-bold pt-12 px-4'>This is a modal</Text>
   </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
