/**
 * TickBill — Tab Layout
 * Bottom tab navigator with 5 tabs using Iconoir icons
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Typography } from '@/constants/Typography';
import { Layout } from '@/constants/Spacing';
import {
  Timer as TimerIcon,
  Folder as FolderIcon,
  UserCircle as UserIcon,
  Journal as InvoiceIcon,
  Settings as SettingsIcon,
} from 'iconoir-react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';

function TabIcon({
  IconComponent,
  focused,
  color,
  isCenter = false,
}: {
  IconComponent: React.ComponentType<any>;
  focused: boolean;
  color: string;
  isCenter?: boolean;
}) {
  const theme = useTheme();
  // For the center icon, we'll keep it always at full scale, or maybe pop it more.
  const scale = useSharedValue(isCenter ? 1 : (focused ? 1 : 0.85));

  React.useEffect(() => {
    if (!isCenter) {
      scale.value = withSpring(focused ? 1 : 0.85, { damping: 12 });
    }
  }, [focused, isCenter]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (isCenter) {
    return (
      <View style={[styles.centerIconWrapper, { backgroundColor: theme.primary }]}>
        <IconComponent
          color="#0F172A"
          width={28}
          height={28}
          strokeWidth={2.5}
        />
      </View>
    );
  }

  return (
    <Animated.View style={[styles.iconContainer, animatedStyle]}>
      <IconComponent
        color={color}
        width={24}
        height={24}
        strokeWidth={focused ? 2 : 1.5}
      />
      {focused && (
        <View style={[styles.activeDot, { backgroundColor: color }]} />
      )}
    </Animated.View>
  );
}

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: theme.tabActive,
        tabBarInactiveTintColor: theme.tabInactive,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.tabBarBorder,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          elevation: 0,
          shadowOpacity: 0,
        },
      }}
    >
      <Tabs.Screen
        name="clients"
        options={{
          title: 'Kunden',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon IconComponent={UserIcon} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Projekte',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon IconComponent={FolderIcon} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Timer',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon IconComponent={TimerIcon} focused={focused} color={color} isCenter />
          ),
        }}
      />
      <Tabs.Screen
        name="invoices"
        options={{
          title: 'Rechnungen',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon IconComponent={InvoiceIcon} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Einstellungen',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon IconComponent={SettingsIcon} focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
    position: 'absolute',
    bottom: 4,
  },
  centerIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Platform.OS === 'ios' ? 12 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
});
