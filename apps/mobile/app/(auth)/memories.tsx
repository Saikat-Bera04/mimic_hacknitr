import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import '../global.css';

interface Memory {
  id: string;
  content: string;
  timestamp: string;
  category: string;
}

const SAMPLE_MEMORIES: Memory[] = [
  {
    id: '1',
    content: 'I prefer dark mode and concise responses',
    timestamp: 'Yesterday',
    category: 'Preferences',
  },
  {
    id: '2',
    content: 'Working on a React Native project called Mimic',
    timestamp: '2 days ago',
    category: 'Context',
  },
  {
    id: '3',
    content: 'Timezone is IST (UTC+5:30)',
    timestamp: '3 days ago',
    category: 'Preferences',
  },
  {
    id: '4',
    content: 'Interested in privacy-first AI applications',
    timestamp: '1 week ago',
    category: 'Interests',
  },
];

export default function MemoriesScreen() {
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
              Memories
            </Text>
            <Text className="text-neutral-400 text-sm mt-1">
              {SAMPLE_MEMORIES.length} stored
            </Text>
          </View>

          {/* Memory List */}
          <View className="px-6">
            {SAMPLE_MEMORIES.map((memory, index) => (
              <TouchableOpacity
                key={memory.id}
                activeOpacity={0.7}
                className={`py-4 ${
                  index !== SAMPLE_MEMORIES.length - 1 ? 'border-b border-neutral-100' : ''
                }`}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-4">
                    <Text className="text-neutral-900 text-sm leading-relaxed">
                      {memory.content}
                    </Text>
                    <View className="flex-row items-center mt-2">
                      <Text className="text-neutral-300 text-xs">
                        {memory.timestamp}
                      </Text>
                      <View className="w-1 h-1 bg-neutral-200 rounded-full mx-2" />
                      <Text className="text-neutral-300 text-xs">
                        {memory.category}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="ellipsis-horizontal" size={16} color="#d4d4d4" />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Add Memory CTA */}
          <View className="px-6 mt-6">
            <TouchableOpacity 
              activeOpacity={0.8}
              className="border border-dashed border-neutral-300 rounded-lg py-4 items-center"
            >
              <View className="flex-row items-center">
                <Ionicons name="add" size={18} color="#a3a3a3" />
                <Text className="text-neutral-400 text-sm ml-2">Add memory</Text>
              </View>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
