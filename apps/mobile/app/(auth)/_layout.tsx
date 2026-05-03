import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { HapticTab } from '@/components/haptic-tab';
import { View, Text, TouchableOpacity } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import '../global.css';

type TabConfig = {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconFocused: keyof typeof Ionicons.glyphMap;
  badge?: number;
};

const TABS: TabConfig[] = [
  { name: 'home', label: 'Avatars', icon: 'people-outline', iconFocused: 'people' },
  { name: 'memories', label: 'Memories', icon: 'albums-outline', iconFocused: 'albums' },
  { name: 'feed', label: 'Feed', icon: 'newspaper-outline', iconFocused: 'newspaper' },
  { name: 'invites', label: 'Invites', icon: 'mail-outline', iconFocused: 'mail', badge: 2 },
  { name: 'settings', label: 'Settings', icon: 'settings-outline', iconFocused: 'settings' },
];

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View 
      style={{
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
        paddingTop: 12,
        paddingBottom: 32,
        paddingHorizontal: 8,
      }}
    >
      {state.routes.map((route, index) => {
        const tabConfig = TABS.find(t => t.name === route.name);
        if (!tabConfig) return null;

        const isFocused = state.index === index;
        const { options } = descriptors[route.key];

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            onLongPress={onLongPress}
            style={{
              flex: 1,
              alignItems: 'center',
            }}
          >
            {/* Label above icon */}
            <Text
              style={{
                fontSize: 11,
                fontWeight: isFocused ? '600' : '400',
                color: isFocused ? '#000' : '#999',
                marginBottom: 4,
              }}
            >
              {tabConfig.label}
            </Text>

            {/* Icon with optional badge */}
            <View style={{ position: 'relative' }}>
              <Ionicons
                name={isFocused ? tabConfig.iconFocused : tabConfig.icon}
                size={22}
                color={isFocused ? '#000' : '#999'}
              />
              {tabConfig.badge && tabConfig.badge > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -8,
                    backgroundColor: '#DC2626',
                    borderRadius: 8,
                    minWidth: 16,
                    height: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 4,
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>
                    {tabConfig.badge}
                  </Text>
                </View>
              )}
            </View>

            {/* Underline indicator */}
            <View
              style={{
                marginTop: 6,
                height: 2,
                width: 24,
                backgroundColor: isFocused ? '#000' : 'transparent',
                borderRadius: 1,
              }}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function AuthLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Visible tabs - order matters */}
      <Tabs.Screen name="home" />
      <Tabs.Screen name="memories" />
      <Tabs.Screen name="feed" />
      <Tabs.Screen name="invites" />
      <Tabs.Screen name="settings" />
      
      {/* Hidden screens */}
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="sign-in"
        options={{
          href: null,
        }}
      />
     
    </Tabs>
  );
}
