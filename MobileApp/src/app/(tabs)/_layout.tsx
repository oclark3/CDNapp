import React, { useRef } from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons, Entypo } from '@expo/vector-icons';

export default function TabsLayout() {
  const makeListeners = (routeName: string) => ({
    tabPress: ({ navigation, route }: any) => {
      // If the tab is already focused, this is the "second tap" behavior:
      // allow the default/tabPress behavior (screens that listen will scroll to top),
      // and additionally navigate with a changing `_refresh` param to force a remount/refresh.
      try {
        const state = navigation.getState && navigation.getState();
        const isFocused = !!(state && state.routes && state.routes[state.index] && state.routes[state.index].name === route.name);
        if (isFocused) {
          const now = Date.now();
          navigation.navigate(route.name, { _refresh: now });
        }
      } catch (err) {
        // If anything goes wrong, do nothing and let default behavior continue.
      }
    },
  });

  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: 'black' }}>
      <Tabs.Screen
        name='index'
        listeners={makeListeners('index')}
        options={{
          title: 'News',
          tabBarIcon: ({ color }) => <Entypo name="news" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name='categories'
        listeners={makeListeners('categories')}
        options={{
          title: 'Categories',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="cards" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name='search'
        listeners={makeListeners('search')}
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="magnify" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name='about'
        listeners={makeListeners('about')}
        options={{
          title: 'About',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="information" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name='account'
        listeners={makeListeners('account')}
        options={{
          title: 'Account',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="account" size={24} color={color} />,
        }}
      />
    </Tabs>
  )
}