import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { HapticTab } from '@/components/common/ui/HapticTab';
import { PetAnimation } from '@/components/common/PetAnimation';
import theme from '@/theme';

export default function TabLayout() {
  return (
    <>
      <PetAnimation />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            elevation: 0,
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textSecondary,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '500',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: '首页',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
            tabBarButton: (props) => <HapticTab {...props} />,
          }}
        />
        <Tabs.Screen
          name="details"
          options={{
            title: '详情',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="list" size={size} color={color} />
            ),
            tabBarButton: (props) => <HapticTab {...props} />,
          }}
        />
        <Tabs.Screen
          name="add"
          options={{
            title: '添加',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="add-circle" size={size} color={color} />
            ),
            tabBarButton: (props) => <HapticTab {...props} />,
          }}
        />
        <Tabs.Screen
          name="options"
          options={{
            title: '选项',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="menu" size={size} color={color} />
            ),
            tabBarButton: (props) => <HapticTab {...props} />,
          }}
        />
      </Tabs>
    </>
  );
}