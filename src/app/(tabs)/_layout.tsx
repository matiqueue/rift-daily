import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';

import { FloatingGlassTabBar } from '@/components/FloatingGlassTabBar';
import { useUsosStore } from '@/store/useUsosStore';

export default function TabsLayout() {
  const isAuthenticated = useUsosStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      tabBar={(props) => <FloatingGlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dziś',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'today' : 'today-outline'}
              size={20}
              color={String(color)}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="timetable"
        options={{
          title: 'Plan',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'calendar' : 'calendar-outline'}
              size={20}
              color={String(color)}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="grades"
        options={{
          title: 'Dziennik',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'book' : 'book-outline'}
              size={20}
              color={String(color)}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'Więcej',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'grid' : 'grid-outline'}
              size={19}
              color={String(color)}
            />
          ),
        }}
      />
    </Tabs>
  );
}
