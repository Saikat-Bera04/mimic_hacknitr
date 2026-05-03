import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import '../global.css';

interface FeedItem {
  id: string;
  avatarName: string;
  avatarInitial: string;
  action: string;
  content: string;
  timestamp: string;
}

const SAMPLE_FEED: FeedItem[] = [
  {
    id: '1',
    avatarName: 'Mom',
    avatarInitial: 'M',
    action: 'added a memory',
    content: 'Loves gardening on Sunday mornings',
    timestamp: '2h ago',
  },
  {
    id: '2',
    avatarName: 'Sarah',
    avatarInitial: 'S',
    action: 'added a memory',
    content: 'Prefers tea over coffee',
    timestamp: '5h ago',
  },
  {
    id: '3',
    avatarName: 'Mom',
    avatarInitial: 'M',
    action: 'added a memory',
    content: 'Birthday is March 15th',
    timestamp: 'Yesterday',
  },
  {
    id: '4',
    avatarName: 'Sarah',
    avatarInitial: 'S',
    action: 'reached 10 memories',
    content: 'Avatar is now ready to chat',
    timestamp: '2 days ago',
  },
];

export default function FeedScreen() {
  return (
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1">
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {/* Header */}
          <View className="px-6 pt-8 pb-6">
            <Text className="text-neutral-900 text-lg font-semibold tracking-tight">
              Activity
            </Text>
            <Text className="text-neutral-400 text-sm mt-1">
              Recent updates from your avatars
            </Text>
          </View>

          {/* Feed List */}
          <View className="px-6">
            {SAMPLE_FEED.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.7}
                className={`py-4 ${
                  index !== SAMPLE_FEED.length - 1 ? 'border-b border-neutral-100' : ''
                }`}
              >
                <View className="flex-row items-start">
                  {/* Avatar Initial */}
                  <View className="w-10 h-10 bg-neutral-100 rounded-full items-center justify-center mr-3">
                    <Text className="text-neutral-600 text-sm font-semibold">
                      {item.avatarInitial}
                    </Text>
                  </View>

                  {/* Content */}
                  <View className="flex-1">
                    <Text className="text-neutral-900 text-sm">
                      <Text className="font-semibold">{item.avatarName}</Text>
                      {' '}{item.action}
                    </Text>
                    <Text className="text-neutral-500 text-sm mt-1">
                      "{item.content}"
                    </Text>
                    <Text className="text-neutral-300 text-xs mt-2">
                      {item.timestamp}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Empty state if no feed items */}
          {SAMPLE_FEED.length === 0 && (
            <View className="px-6 py-16 items-center">
              <View className="w-16 h-16 bg-neutral-50 rounded-full items-center justify-center mb-4">
                <Ionicons name="newspaper-outline" size={28} color="#999" />
              </View>
              <Text className="text-neutral-900 text-base font-medium text-center">
                No activity yet
              </Text>
              <Text className="text-neutral-400 text-sm text-center mt-2">
                Activity from your avatars will appear here
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}