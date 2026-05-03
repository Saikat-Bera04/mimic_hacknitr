import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSignIn } from '@clerk/clerk-expo';

export default function SignIn() {
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading,  setIsLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      if (!isLoaded) return;
      if (!identifier || !password) {
        Alert.alert('Missing fields', 'Please enter your email or username and password.');
        return;
      }

      setIsLoading(true);

      const result = await signIn.create({
        identifier: identifier.trim(),
        password,
      });

      if (result.status === 'complete' && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        router.replace('/home');
      } else {
        console.log('Signin not complete:', result.status);
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      const message = err?.errors?.[0]?.longMessage || err?.message || 'Unable to sign in.';
      Alert.alert('Sign In Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#121212]">
      <SafeAreaView className="flex-1 px-6 justify-center">
        <Text className="text-white text-2xl font-bold mb-6">Sign In</Text>
        <TextInput
          placeholder="Email or Username"
          placeholderTextColor="#9ca3af"
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
          className="w-full bg-[#1f2933] text-white rounded-xl px-4 py-3 mb-3"
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor="#9ca3af"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          className="w-full bg-[#1f2933] text-white rounded-xl px-4 py-3 mb-6"
        />
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleSignIn}
          disabled={isLoading}
          className="bg-white rounded-full py-4 px-6 w-full items-center"
        >
          <Text className="text-black text-lg font-semibold">
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
      <View className='bg-white'>
        <TouchableOpacity  onPress={() => router.push('/')} className="p-4 items-center">
          <Text className='text-black'>Sign up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
