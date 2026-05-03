import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import '../global.css';

interface Invite {
  id: string;
  name: string;
  email: string;
  sentAt: string;
  status: 'pending' | 'opened' | 'expired';
}

const SAMPLE_INVITES: Invite[] = [
  {
    id: '1',
    name: 'Dad',
    email: 'dad@email.com',
    sentAt: '2 days ago',
    status: 'pending',
  },
  {
    id: '2',
    name: 'Uncle John',
    email: 'john@email.com',
    sentAt: '1 week ago',
    status: 'opened',
  },
];

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    color: '#999999',
  },
  opened: {
    label: 'Opened',
    color: '#059669',
  },
  expired: {
    label: 'Expired',
    color: '#DC2626',
  },
};

function InviteCard({ invite }: { invite: Invite }) {
  const config = STATUS_CONFIG[invite.status];
  
  return (
    <View className="bg-white border border-[#E5E5E5] rounded-lg p-4 mb-3">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          {/* Name and Status */}
          <View className="flex-row items-center">
            <Text className="text-base font-semibold text-black">
              {invite.name}
            </Text>
            <View className="w-1.5 h-1.5 rounded-full mx-2" style={{ backgroundColor: config.color }} />
            <Text className="text-xs" style={{ color: config.color }}>
              {config.label}
            </Text>
          </View>
          
          {/* Email */}
          <Text className="text-sm mt-1" style={{ color: '#666' }}>
            {invite.email}
          </Text>
          
          {/* Sent time */}
          <Text className="text-xs mt-1" style={{ color: '#999' }}>
            Sent {invite.sentAt}
          </Text>
        </View>
        
        {/* Actions */}
        <TouchableOpacity
          activeOpacity={0.7}
          className="p-2"
        >
          <Ionicons name="ellipsis-horizontal" size={18} color="#999" />
        </TouchableOpacity>
      </View>
      
      {/* Action Buttons */}
      <View className="flex-row mt-4 pt-3 border-t border-[#F5F5F5]">
        <TouchableOpacity
          activeOpacity={0.7}
          className="flex-row items-center mr-6"
        >
          <Ionicons name="refresh-outline" size={16} color="#666" />
          <Text className="text-sm ml-1.5" style={{ color: '#666' }}>
            Resend
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          activeOpacity={0.7}
          className="flex-row items-center mr-6"
        >
          <Ionicons name="copy-outline" size={16} color="#666" />
          <Text className="text-sm ml-1.5" style={{ color: '#666' }}>
            Copy link
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          activeOpacity={0.7}
          className="flex-row items-center"
        >
          <Ionicons name="close-outline" size={16} color="#DC2626" />
          <Text className="text-sm ml-1" style={{ color: '#DC2626' }}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="w-16 h-16 bg-[#F5F5F5] rounded-full items-center justify-center mb-6">
        <Ionicons name="mail-outline" size={28} color="#999" />
      </View>
      
      <Text className="text-lg font-semibold text-black text-center mb-2">
        No pending invites
      </Text>
      
      <Text className="text-sm text-center" style={{ color: '#666' }}>
        When you invite someone to create an avatar, they'll appear here until they respond
      </Text>
    </View>
  );
}

export default function InvitesScreen() {
  const invites = SAMPLE_INVITES;
  const pendingCount = invites.filter(i => i.status === 'pending').length;

  return (
    <View className="flex-1" style={{ backgroundColor: '#FAFAFA' }}>
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <Text className="text-lg font-semibold tracking-tight text-black">
            Invites
          </Text>
          {invites.length > 0 && (
            <Text className="text-sm mt-1" style={{ color: '#666' }}>
              {pendingCount} pending
            </Text>
          )}
        </View>

        {invites.length === 0 ? (
          <EmptyState />
        ) : (
          <ScrollView
            className="flex-1 px-6"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 32 }}
          >
            {invites.map((invite) => (
              <InviteCard key={invite.id} invite={invite} />
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}
