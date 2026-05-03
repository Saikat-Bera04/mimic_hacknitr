import { View, Text, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import '../global.css';
import { useEffect, useState, useRef } from 'react';
import { syncClerkUserToBackend } from '@/utils/clerkBackend';

type AvatarStatus = 'invited' | 'active' | 'ready';

interface Avatar {
  id: string;
  name: string;
  photo?: string;
  status: AvatarStatus;
  memoryCount: number;
  memoryGoal: number;
  lastActivity: string;
  isOnline?: boolean;
}

interface RecentMemory {
  id: string;
  avatarName: string;
  avatarInitial: string;
  content: string;
  timestamp: string;
  type: 'story' | 'preference' | 'fact';
}

// Sample data - in production this would come from your backend
const SAMPLE_AVATARS: Avatar[] = [
  {
    id: '1',
    name: 'Mom',
    photo: undefined,
    status: 'ready',
    memoryCount: 47,
    memoryGoal: 50,
    lastActivity: '2h ago',
    isOnline: true,
  },
  {
    id: '2',
    name: 'Sarah',
    photo: undefined,
    status: 'active',
    memoryCount: 12,
    memoryGoal: 30,
    lastActivity: 'yesterday',
    isOnline: false,
  },
  {
    id: '3',
    name: 'Dad',
    photo: undefined,
    status: 'invited',
    memoryCount: 0,
    memoryGoal: 30,
    lastActivity: 'Pending',
    isOnline: false,
  },
];

const RECENT_MEMORIES: RecentMemory[] = [
  {
    id: '1',
    avatarName: 'Mom',
    avatarInitial: 'M',
    content: '"I always add a pinch of cinnamon to my coffee in the morning"',
    timestamp: '2h ago',
    type: 'preference',
  },
  {
    id: '2',
    avatarName: 'Sarah',
    avatarInitial: 'S',
    content: '"Remember our trip to Italy in 2019? The gelato in Florence was incredible"',
    timestamp: 'yesterday',
    type: 'story',
  },
  {
    id: '3',
    avatarName: 'Mom',
    avatarInitial: 'M',
    content: '"My favorite flower has always been the white peony"',
    timestamp: '3 days ago',
    type: 'fact',
  },
];

const STATUS_CONFIG = {
  invited: {
    color: '#999999',
    bgColor: '#F5F5F5',
    ringColor: '#E5E5E5',
  },
  active: {
    color: '#059669',
    bgColor: '#ECFDF5',
    ringColor: '#059669',
  },
  ready: {
    color: '#2563EB',
    bgColor: '#EFF6FF',
    ringColor: '#2563EB',
  },
};

const MEMORY_TYPE_CONFIG: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  story: { icon: 'book-outline', color: '#8B5CF6', bg: '#F3E8FF' },
  preference: { icon: 'heart-outline', color: '#EC4899', bg: '#FCE7F3' },
  fact: { icon: 'bulb-outline', color: '#F59E0B', bg: '#FEF3C7' },
};

function getGreeting(): { greeting: string; subtitle: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour < 12) {
    return { greeting: 'Good morning', subtitle: 'Start your day by connecting', emoji: '☀️' };
  } else if (hour < 17) {
    return { greeting: 'Good afternoon', subtitle: 'Who would you like to chat with?', emoji: '👋' };
  } else {
    return { greeting: 'Good evening', subtitle: 'Wind down with a conversation', emoji: '🌙' };
  }
}

function PulsingDot({ isOnline }: { isOnline: boolean }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isOnline) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.4,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isOnline, pulseAnim]);

  if (!isOnline) return null;

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      <Animated.View
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: '#22C55E',
          transform: [{ scale: pulseAnim }],
        }}
      />
    </View>
  );
}

function StatCard({ icon, value, label, color, bgColor }: { icon: keyof typeof Ionicons.glyphMap; value: string | number; label: string; color: string; bgColor: string }) {
  return (
    <View 
      className="bg-white border border-[#E5E5E5] rounded-2xl p-4 mr-3"
      style={{ width: 140 }}
    >
      <View
        className="w-10 h-10 rounded-xl items-center justify-center mb-3"
        style={{ backgroundColor: bgColor }}
      >
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text className="text-2xl font-bold text-black">{value}</Text>
      <Text className="text-xs text-[#666] mt-1">{label}</Text>
    </View>
  );
}

function ProgressBar({ progress, color }: { progress: number; color: string }) {
  return (
    <View className="h-1.5 bg-[#E5E5E5] rounded-full overflow-hidden flex-1">
      <View
        className="h-full rounded-full"
        style={{ width: `${Math.min(progress * 100, 100)}%`, backgroundColor: color }}
      />
    </View>
  );
}

function AvatarCard({ avatar }: { avatar: Avatar }) {
  const config = STATUS_CONFIG[avatar.status];
  const isInvited = avatar.status === 'invited';
  const progress = avatar.memoryGoal > 0 ? avatar.memoryCount / avatar.memoryGoal : 0;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      className="bg-white border border-[#E5E5E5] rounded-2xl p-4 mb-3"
    >
      <View className="flex-row items-center">
        {/* Avatar Photo */}
        <View className="mr-4 relative">
          <View
            className="w-14 h-14 rounded-full items-center justify-center"
            style={{ 
              backgroundColor: isInvited ? '#F5F5F5' : '#F0F0F0',
              borderWidth: 2,
              borderColor: config.ringColor,
            }}
          >
            {avatar.photo ? (
              <Image
                source={{ uri: avatar.photo }}
                style={{ width: 48, height: 48, borderRadius: 24 }}
              />
            ) : (
              <Text
                className="text-xl font-semibold"
                style={{ color: isInvited ? '#999' : '#333' }}
              >
                {avatar.name.charAt(0)}
              </Text>
            )}
          </View>
          <PulsingDot isOnline={avatar.isOnline || false} />
        </View>

        {/* Info */}
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text
              className="text-base font-semibold"
              style={{ color: isInvited ? '#666' : '#000' }}
            >
              {avatar.name}
            </Text>
            {avatar.status === 'ready' && (
              <View className="ml-2 bg-[#EFF6FF] rounded-full px-2 py-0.5">
                <Text className="text-[10px] font-semibold text-[#2563EB]">Ready ✓</Text>
              </View>
            )}
          </View>

          {/* Memory Progress Bar */}
          <View className="flex-row items-center mt-2">
            <ProgressBar progress={progress} color={config.ringColor} />
            <Text className="text-xs text-[#666] ml-2">
              {avatar.memoryCount}/{avatar.memoryGoal}
            </Text>
          </View>

          {/* Last Activity */}
          <Text className="text-xs text-[#999] mt-1.5">
            {isInvited ? '⏳ Awaiting response' : `Active ${avatar.lastActivity}`}
          </Text>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          className="ml-3 px-4 py-2.5 rounded-xl flex-row items-center"
          style={{
            backgroundColor: isInvited ? '#F5F5F5' : (avatar.status === 'ready' ? '#2563EB' : '#000'),
          }}
        >
          <Ionicons
            name={isInvited ? 'notifications-outline' : 'chatbubble-outline'}
            size={14}
            color={isInvited ? '#666' : '#fff'}
          />
          <Text
            className="text-sm font-medium ml-1.5"
            style={{ color: isInvited ? '#666' : '#fff' }}
          >
            {isInvited ? 'Nudge' : 'Chat'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function RecentMemoryCard({ memory }: { memory: RecentMemory }) {
  const typeConfig = MEMORY_TYPE_CONFIG[memory.type];
  
  return (
    <TouchableOpacity 
      activeOpacity={0.7}
      className="bg-white border border-[#E5E5E5] rounded-2xl p-4 mr-3" 
      style={{ width: 280 }}
    >
      {/* Header */}
      <View className="flex-row items-center mb-3">
        <View 
          className="w-8 h-8 rounded-full items-center justify-center mr-2"
          style={{ backgroundColor: '#F5F5F5' }}
        >
          <Text className="text-sm font-semibold text-[#333]">{memory.avatarInitial}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-black">{memory.avatarName}</Text>
          <Text className="text-[10px] text-[#999]">{memory.timestamp}</Text>
        </View>
        <View 
          className="rounded-full px-2 py-1 flex-row items-center"
          style={{ backgroundColor: typeConfig.bg }}
        >
          <Ionicons name={typeConfig.icon} size={10} color={typeConfig.color} />
          <Text className="text-[10px] font-medium ml-1 capitalize" style={{ color: typeConfig.color }}>
            {memory.type}
          </Text>
        </View>
      </View>
      
      {/* Content */}
      <Text className="text-sm text-[#333] leading-5 italic" numberOfLines={2}>
        {memory.content}
      </Text>
    </TouchableOpacity>
  );
}

function QuickActionCard({ icon, title, subtitle, color, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className="flex-1 bg-white border border-[#E5E5E5] rounded-2xl p-4"
    >
      <View
        className="w-11 h-11 rounded-xl items-center justify-center mb-3"
        style={{ backgroundColor: color }}
      >
        <Ionicons name={icon} size={22} color="#fff" />
      </View>
      <Text className="text-sm font-semibold text-black">{title}</Text>
      <Text className="text-xs text-[#666] mt-1">{subtitle}</Text>
    </TouchableOpacity>
  );
}

function EmptyState({ onCreateAvatar }: { onCreateAvatar: () => void }) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="w-24 h-24 bg-[#F5F5F5] rounded-full items-center justify-center mb-6">
        <Text className="text-4xl">👥</Text>
      </View>
      <Text className="text-xl font-bold text-black text-center mb-2">
        Create your first avatar
      </Text>
      <Text className="text-sm text-center mb-8 leading-5 px-4" style={{ color: '#666' }}>
        Invite someone special to build their AI together. They'll add memories, and you'll get to chat with their digital twin.
      </Text>
      <TouchableOpacity
        onPress={onCreateAvatar}
        activeOpacity={0.8}
        className="bg-black rounded-2xl px-8 py-4 flex-row items-center"
      >
        <Ionicons name="add" size={18} color="#fff" />
        <Text className="text-white text-sm font-semibold ml-2">Create Avatar</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function HomeScreen() {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const [avatars] = useState<Avatar[]>(SAMPLE_AVATARS);
  const [recentMemories] = useState<RecentMemory[]>(RECENT_MEMORIES);
  const [showEmpty] = useState(false);

  const { greeting, subtitle, emoji } = getGreeting();
  const totalMemories = avatars.reduce((sum, a) => sum + a.memoryCount, 0);
  const activeAvatars = avatars.filter(a => a.status !== 'invited').length;
  const readyToChat = avatars.filter(a => a.status === 'ready').length;

  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        if (!token || cancelled) return;
        await syncClerkUserToBackend(token);
      } catch (error) {
        console.log('Sync error:', error);
      }
    })();
    return () => { cancelled = true; };
  }, [isSignedIn, getToken]);

  const handleCreateAvatar = () => {
    console.log('Create new avatar');
  };

  if (showEmpty || avatars.length === 0) {
    return (
      <View className="flex-1" style={{ backgroundColor: '#FAFAFA' }}>
        <SafeAreaView className="flex-1">
          <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
            <Text className="text-lg font-bold tracking-tight text-black">Mimic</Text>
          </View>
          <EmptyState onCreateAvatar={handleCreateAvatar} />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: '#FAFAFA' }}>
      <SafeAreaView className="flex-1">
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
            <Text className="text-lg font-bold tracking-tight text-black">Mimic</Text>
            <TouchableOpacity
              onPress={handleCreateAvatar}
              activeOpacity={0.7}
              className="bg-black rounded-xl px-3 py-2 flex-row items-center"
            >
              <Ionicons name="add" size={16} color="#fff" />
              <Text className="text-xs font-semibold text-white ml-1">New Avatar</Text>
            </TouchableOpacity>
          </View>

          {/* User Greeting */}
          <View className="px-6 pt-4 pb-6">
            <View className="flex-row items-center">
              {user?.imageUrl ? (
                <View className="relative">
                  <Image
                    source={{ uri: user.imageUrl }}
                    style={{ 
                      width: 56, 
                      height: 56, 
                      borderRadius: 28,
                      borderWidth: 2,
                      borderColor: '#E5E5E5',
                    }}
                  />
                </View>
              ) : (
                <View 
                  className="w-14 h-14 bg-[#F0F0F0] rounded-full items-center justify-center"
                  style={{ borderWidth: 2, borderColor: '#E5E5E5' }}
                >
                  <Text className="text-xl font-bold text-[#333]">
                    {user?.firstName?.charAt(0) || user?.username?.charAt(0) || 'U'}
                  </Text>
                </View>
              )}
              <View className="flex-1 ml-4">
                <Text className="text-2xl font-bold text-black">
                  {greeting} {emoji}
                </Text>
                <Text className="text-lg font-mono text-black mt-0.5 font-bold">
                       {user?.firstName || user?.username?.toUpperCase() || 'there'}, 
                </Text>
              </View>
            </View>
          </View>

          {/* Stats Overview */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-black px-6 mb-3">Overview</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 24, paddingRight: 12 }}
            >
              <StatCard
                icon="layers-outline"
                value={totalMemories}
                label="Total Memories"
                color="#8B5CF6"
                bgColor="#F3E8FF"
              />
              <StatCard
                icon="people-outline"
                value={activeAvatars}
                label="Active Avatars"
                color="#059669"
                bgColor="#ECFDF5"
              />
              <StatCard
                icon="chatbubbles-outline"
                value={readyToChat}
                label="Ready to Chat"
                color="#2563EB"
                bgColor="#EFF6FF"
              />
            </ScrollView>
          </View>

          {/* Quick Actions */}
          <View className="px-6 mb-6">
            <Text className="text-sm font-semibold text-black mb-3">Quick Actions</Text>
            <View className="flex-row">
              <QuickActionCard
                icon="add-circle-outline"
                title="Add Memory"
                subtitle="Help an avatar grow"
                color="#8B5CF6"
                onPress={() => console.log('Add memory')}
              />
              <View style={{ width: 12 }} />
              <QuickActionCard
                icon="person-add-outline"
                title="Invite Someone"
                subtitle="Build a new avatar"
                color="#059669"
                onPress={handleCreateAvatar}
              />
            </View>
          </View>

          {/* Recent Memories */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between px-6 mb-3">
              <Text className="text-sm font-semibold text-black">Recent Memories</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text className="text-xs font-medium text-[#2563EB]">See all →</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 24, paddingRight: 12 }}
            >
              {recentMemories.map((memory) => (
                <RecentMemoryCard key={memory.id} memory={memory} />
              ))}              
            </ScrollView>
          </View>

          {/* Your Avatars */}
          <View className="px-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm font-semibold text-black">Your Avatars</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text className="text-xs font-medium text-[#2563EB]">Manage →</Text>
              </TouchableOpacity>
            </View>
            {avatars.map((avatar) => (
              <AvatarCard key={avatar.id} avatar={avatar} />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
