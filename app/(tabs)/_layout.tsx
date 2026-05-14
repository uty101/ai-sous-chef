import { CustomTabBar } from '@/components/custom-tab-bar';
import { MePanel } from '@/components/me-panel';
import { useMePanel } from '@/contexts/me-panel-context';
import { brandType } from '@/constants/brand';
import { Tabs } from 'expo-router';
import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SCREEN_OPTIONS = { headerShown: false } as const;

export default function TabLayout() {
  const { meOpen, openMe, closeMe } = useMePanel();
  const insets = useSafeAreaInsets();
  const renderTabBar = useCallback((props: any) => <CustomTabBar {...props} />, []);

  return (
    <View style={styles.root}>
      <Tabs
        tabBar={renderTabBar}
        screenOptions={SCREEN_OPTIONS}>
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="ai-souschef" options={{ title: 'AI Sous Chef' }} />
        <Tabs.Screen name="saved" options={{ title: 'Saved' }} />
        <Tabs.Screen name="pantry" options={{ title: 'Pantry' }} />
        <Tabs.Screen name="calendar" options={{ title: 'Calendar' }} />
        {/* Me is accessed via the floating profile button, not the tab bar */}
        <Tabs.Screen name="me" options={{ title: 'Me', href: null }} />
        <Tabs.Screen name="plan" options={{ href: null }} />
        <Tabs.Screen name="discover" options={{ href: null }} />
        <Tabs.Screen name="explore" options={{ href: null }} />
      </Tabs>

      {/*
        Floating profile / contents button — sits in the top-right corner
        across all tab screens. Tapping it slides down the Me panel.
      */}
      <TouchableOpacity
        style={[styles.meBtn, { top: insets.top + 4 }]}
        onPress={() => openMe()}
        activeOpacity={0.85}>
        <View style={styles.burgerLines}>
          <View style={styles.burgerLine} />
          <View style={styles.burgerLine} />
          <View style={styles.burgerLine} />
        </View>
        <Text style={styles.menuLabel}>Menu</Text>
      </TouchableOpacity>

      {meOpen && <MePanel onClose={closeMe} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  meBtn: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    paddingVertical: 9,
    zIndex: 100,
  },
  burgerLines: {
    gap: 4,
    justifyContent: 'center',
  },
  burgerLine: {
    width: 16,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#FFFFFF',
  },
  menuLabel: {
    ...brandType,
    color: '#FFFFFF',
    fontSize: 12,
    textTransform: 'uppercase',
  },
});
