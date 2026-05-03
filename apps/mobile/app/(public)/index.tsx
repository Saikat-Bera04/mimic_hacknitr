import { Image } from 'expo-image';
import { Text, View, TouchableOpacity, Platform, ActivityIndicator, Alert, StyleSheet, TextInput, KeyboardAvoidingView, ScrollView, Dimensions } from 'react-native';
import './../global.css';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { useAuth } from '@clerk/clerk-expo';
import { useFonts, Amarna_400Regular } from '@expo-google-fonts/amarna';
import { Ionicons } from '@expo/vector-icons';
import { signupUser } from '../api/auth';
import { Button } from 'react-native';

// Handle OAuth redirect
WebBrowser.maybeCompleteAuthSession();

const { height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const textInputRef = React.useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
 
  const [fontsLoaded] = useFonts({ Amarna_400Regular });
  const passwordVisible = isVisible ? 'eye' : 'eye-off';
  // Redirect if signed in
  useEffect(() => {
    if (isSignedIn) router.replace('/home');
  }, [isSignedIn, router]);

  const handleEmailSignup = useCallback(async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;

    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();

    if (!trimmedEmail || !trimmedUsername || !password) {
      Alert.alert('Missing fields', 'Please fill email, username and password.');
      return;
    }

    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert('Invalid email', 'Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    if (!usernameRegex.test(trimmedUsername)) {
      Alert.alert(
        'Invalid username',
        'Username can only contain letters, numbers, "-" and "_", with no spaces.'
      );
      return;
    }

    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters long.');
      return;
    }

    try {
      setIsLoading(true);
      await signupUser(trimmedEmail, trimmedUsername, password);
      Alert.alert('Account created', 'Please log in to continue.');
      router.push('/sign-in');
    } catch (err: any) {
      const message = err?.errors?.[0]?.longMessage || err?.message || 'Something went wrong.';
      Alert.alert('Sign Up Failed for now', message);
    } finally {
      setIsLoading(false);
    }
  }, [email, username, password]);

  if (!fontsLoaded) return null;

  return (
    <View className="flex-1 bg-black">
      <Video
        source={require('./landing-vid.mp4')}
        style={StyleSheet.absoluteFill}
        resizeMode={ResizeMode.COVER}
        isLooping
        shouldPlay
        isMuted
      />

      <View className="absolute inset-0 bg-black/20" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        style={{ flex: 1 }}
      >
        <SafeAreaView className="flex-1">
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={{ flex: 1, justifyContent: 'flex-end', paddingHorizontal: 16, paddingBottom: 24 }}>
              <View className="w-full bg-transparent rounded-3xl p-3 shadow-2xl overflow-hidden flex-col">
                <View className="mb-6">
                  <Text className="text-3xl text-white mb-2" style={{ fontFamily: 'Amarna_400Regular' }}>
                    Join Us
                  </Text>
                </View>

                <View className="space-y-4">
                  <View>
                    <Text className="text-[10px] font-bold text-white uppercase tracking-widest mb-1 ml-1">Email</Text>
                    <TextInput
                      placeholder="name@example.com"
                      placeholderTextColor="#a3a3a3"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      cursorColor="#1a1a1a"
                      className="w-full bg-white border border-[#e5e5e0] text-[#1a1a1a] text-base rounded-lg px-4 py-3 focus:border-[#1a1a1a]"
                    />
                  </View>

                  <View>
                    <Text className="text-[10px] font-bold text-[#1a1a1a] uppercase tracking-widest mb-1 ml-1">Username</Text>
                    <TextInput
                      placeholder="username"
                      placeholderTextColor="#a3a3a3"
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="none"
                      cursorColor="#1a1a1a"
                      className="w-full bg-white border border-[#e5e5e0] text-[#1a1a1a] text-base rounded-lg px-4 py-3 focus:border-[#1a1a1a]"
                    />
                  </View>

                  <View>
                    <Text className="text-[10px] font-bold text-[#1a1a1a] uppercase tracking-widest mb-1 ml-1">Password</Text>
                    <TextInput

                      placeholder="••••••••"
                      placeholderTextColor="#a3a3a3"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!isVisible}
                      cursorColor="#1a1a1a"
                      className="w-full bg-white border border-[#e5e5e0] text-[#1a1a1a] text-base rounded-lg px-4 py-3 focus:border-[#1a1a1a]"
                    />
                    <TouchableOpacity
                      className="absolute right-4 top-9"
                      onPress={() => setIsVisible(!isVisible)}
                    >
                      <Ionicons name={passwordVisible} size={20} color="#a3a3a3" />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={handleEmailSignup}
                    activeOpacity={0.8}
                    className="w-full bg-[#1a1a1a] rounded-lg py-4 mt-2 items-center justify-center shadow-sm"
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FDFBF7" />
                    ) : (
                      <Text className="text-[#FDFBF7] font-semibold text-base tracking-wide">
                        Create Account
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                <View className="mt-6 flex-row justify-center">
                  <Text className="text-neutral-200 text-xs">Already have an account? </Text>
                  <TouchableOpacity onPress={() => router.push('/sign-in')}>
                    <Text className="text-white text-xs font-bold underline">Log in</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}