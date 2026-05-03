import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import '../global.css';

interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  showChevron?: boolean;
  destructive?: boolean;
  onPress?: () => void;
}

function SettingsRow({ icon, label, value, showChevron = true, destructive = false, onPress }: SettingsRowProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className="flex-row items-center py-4 border-b border-[#F5F5F5]"
    >
      <View 
        className="w-8 h-8 rounded items-center justify-center mr-3"
        style={{ backgroundColor: '#F5F5F5' }}
      >
        <Ionicons 
          name={icon} 
          size={16} 
          color={destructive ? '#DC2626' : '#666'} 
        />
      </View>
      <View className="flex-1">
        <Text 
          className="text-sm"
          style={{ color: destructive ? '#DC2626' : '#000' }}
        >
          {label}
        </Text>
      </View>
      {value && (
        <Text className="text-sm mr-2" style={{ color: '#999' }}>{value}</Text>
      )}
      {showChevron && (
        <Ionicons name="chevron-forward" size={16} color="#D4D4D4" />
      )}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();

  return (
    <View className="flex-1" style={{ backgroundColor: '#FAFAFA' }}>
      <SafeAreaView className="flex-1">
        <ScrollView 
          className="flex-1" 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {/* Header */}
          <View className="px-6 pt-4 pb-6">
            <Text className="text-lg font-semibold tracking-tight text-black">
              Settings
            </Text>
          </View>

          {/* Account Section */}
          <View className="mx-6 bg-white rounded-lg border border-[#E5E5E5] px-4">
            <TouchableOpacity 
              activeOpacity={0.7}
              className="flex-row items-center py-4"
            >
              {user?.imageUrl ? (
                <Image
                  source={{ uri: user.imageUrl }}
                  style={{ width: 48, height: 48, borderRadius: 24 }}
                />
              ) : (
                <View className="w-12 h-12 bg-[#F5F5F5] rounded-full items-center justify-center">
                  <Text className="text-lg font-semibold" style={{ color: '#666' }}>
                    {user?.firstName?.charAt(0) || 'U'}
                  </Text>
                </View>
              )}
              <View className="flex-1 ml-3">
                <Text className="text-base font-semibold text-black">
                  {user?.fullName || 'User'}
                </Text>
                <Text className="text-sm mt-0.5" style={{ color: '#666' }}>
                  {user?.primaryEmailAddress?.emailAddress || ''}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#D4D4D4" />
            </TouchableOpacity>
          </View>

          {/* Avatar Management Section */}
          <View className="px-6 mt-6">
            <Text className="text-xs uppercase tracking-wider mb-3" style={{ color: '#999' }}>
              Avatars
            </Text>
            <View className="bg-white rounded-lg border border-[#E5E5E5] px-4">
              <SettingsRow icon="people-outline" label="Manage Avatars" />
              <SettingsRow icon="link-outline" label="Default Invite Link" />
              <SettingsRow 
                icon="notifications-outline" 
                label="Memory Notifications" 
                value="On" 
              />
            </View>
          </View>

          {/* Preferences Section */}
          <View className="px-6 mt-6">
            <Text className="text-xs uppercase tracking-wider mb-3" style={{ color: '#999' }}>
              Preferences
            </Text>
            <View className="bg-white rounded-lg border border-[#E5E5E5] px-4">
              <SettingsRow icon="moon-outline" label="Appearance" value="System" />
              <SettingsRow icon="globe-outline" label="Language" value="English" />
            </View>
          </View>

          {/* Privacy Section */}
          <View className="px-6 mt-6">
            <Text className="text-xs uppercase tracking-wider mb-3" style={{ color: '#999' }}>
              Privacy & Data
            </Text>
            <View className="bg-white rounded-lg border border-[#E5E5E5] px-4">
              <SettingsRow icon="shield-outline" label="Privacy Settings" />
              <SettingsRow icon="download-outline" label="Export Data" />
              <SettingsRow 
                icon="trash-outline" 
                label="Delete All Data" 
                destructive 
                showChevron={false}
              />
            </View>
          </View>

          {/* Support Section */}
          <View className="px-6 mt-6">
            <Text className="text-xs uppercase tracking-wider mb-3" style={{ color: '#999' }}>
              Support
            </Text>
            <View className="bg-white rounded-lg border border-[#E5E5E5] px-4">
              <SettingsRow icon="help-circle-outline" label="Help Center" />
              <SettingsRow icon="chatbubble-outline" label="Contact Us" />
              <SettingsRow icon="document-text-outline" label="Terms of Service" />
              <SettingsRow icon="lock-closed-outline" label="Privacy Policy" />
              <SettingsRow 
                icon="information-circle-outline" 
                label="Version" 
                value="1.0.0" 
                showChevron={false} 
              />
            </View>
          </View>

          {/* Sign Out */}
          <View className="px-6 mt-8">
            <TouchableOpacity
              onPress={() => signOut()}
              activeOpacity={0.7}
              className="bg-white rounded-lg border border-[#E5E5E5] py-4 items-center"
            >
              <Text className="text-sm font-medium" style={{ color: '#DC2626' }}>
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
