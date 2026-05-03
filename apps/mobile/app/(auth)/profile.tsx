import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import '../global.css';

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const { user, isLoaded } = useUser();

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!isLoaded) {
    return (
      <View className="flex-1 bg-[#121212] justify-center items-center">
        <Text className="text-white text-lg">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#121212]">
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {/* Profile Header */}
          <View className="items-center mt-6 mb-8">
            {user?.imageUrl ? (
              <Image
                source={{ uri: user.imageUrl }}
                className="w-28 h-28 rounded-full mb-4"
              />
            ) : (
              <View className="w-28 h-28 rounded-full bg-[#333] mb-4 justify-center items-center">
                <Ionicons name="person" size={48} color="#888" />
              </View>
            )}
            <Text className="text-white text-2xl font-bold">
              {user?.fullName || 'User'}
            </Text>
            <Text className="text-gray-400 text-base mt-1">
              {user?.primaryEmailAddress?.emailAddress || ''}
            </Text>
          </View>

          {/* User Info Section */}
          <View className="bg-[#1e1e1e] rounded-2xl p-4 mb-4">
            <Text className="text-gray-400 text-xs uppercase tracking-wider mb-3">
              Account Information
            </Text>

            <InfoRow
              icon="person-outline"
              label="First Name"
              value={user?.firstName || 'Not set'}
            />
            <InfoRow
              icon="person-outline"
              label="Last Name"
              value={user?.lastName || 'Not set'}
            />
            <InfoRow
              icon="mail-outline"
              label="Email"
              value={user?.primaryEmailAddress?.emailAddress || 'Not set'}
            />
            <InfoRow
              icon="finger-print-outline"
              label="User ID"
              value={user?.id ? `${user.id.slice(0, 20)}...` : 'N/A'}
              isLast
            />
          </View>

          {/* Activity Section */}
          <View className="bg-[#1e1e1e] rounded-2xl p-4 mb-4">
            <Text className="text-gray-400 text-xs uppercase tracking-wider mb-3">
              Activity
            </Text>

            <InfoRow
              icon="calendar-outline"
              label="Member Since"
              value={formatDate(user?.createdAt)}
            />
            <InfoRow
              icon="time-outline"
              label="Last Sign In"
              value={formatDate(user?.lastSignInAt)}
              isLast
            />
          </View>

          {/* Connected Accounts Section */}
          {user?.externalAccounts && user.externalAccounts.length > 0 && (
            <View className="bg-[#1e1e1e] rounded-2xl p-4 mb-4">
              <Text className="text-gray-400 text-xs uppercase tracking-wider mb-3">
                Connected Accounts
              </Text>

              {user.externalAccounts.map((account, index) => (
                <View
                  key={account.id}
                  className={`flex-row items-center py-3 ${
                    index !== user.externalAccounts.length - 1
                      ? 'border-b border-[#333]'
                      : ''
                  }`}
                >
                  <View className="w-10 h-10 rounded-full bg-[#333] justify-center items-center mr-3">
                    <Ionicons
                      name={getProviderIcon(account.provider)}
                      size={20}
                      color="#fff"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white text-base font-medium capitalize">
                      {account.provider?.replace('oauth_', '') || 'Unknown'}
                    </Text>
                    <Text className="text-gray-400 text-sm">
                      {account.emailAddress || 'Connected'}
                    </Text>
                  </View>
                  <View className="bg-green-500/20 px-2 py-1 rounded-full">
                    <Text className="text-green-400 text-xs">Connected</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Sign Out Button */}
          <TouchableOpacity
            onPress={() => signOut()}
            className="bg-red-500/10 border border-red-500/30 rounded-2xl py-4 mb-8 flex-row justify-center items-center"
          >
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text className="text-red-500 text-lg font-semibold ml-2">
              Sign Out
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  isLast = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center py-3 ${!isLast ? 'border-b border-[#333]' : ''}`}
    >
      <View className="w-8 h-8 rounded-full bg-[#333] justify-center items-center mr-3">
        <Ionicons name={icon} size={16} color="#888" />
      </View>
      <View className="flex-1">
        <Text className="text-gray-400 text-xs">{label}</Text>
        <Text className="text-white text-base">{value}</Text>
      </View>
    </View>
  );
}

function getProviderIcon(provider: string | undefined): keyof typeof Ionicons.glyphMap {
  switch (provider) {
    case 'oauth_google':
    case 'google':
      return 'logo-google';
    case 'oauth_apple':
    case 'apple':
      return 'logo-apple';
    case 'oauth_github':
    case 'github':
      return 'logo-github';
    case 'oauth_facebook':
    case 'facebook':
      return 'logo-facebook';
    default:
      return 'link-outline';
  }
}
