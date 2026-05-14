import AsyncStorage from '@react-native-async-storage/async-storage';
import { brandType } from '@/constants/brand';
import { personaliseSteps, deriveVibe } from '@/constants/personalise-steps';
import { GET_VIRAL_DISHES_FUNCTION_URL, supabase } from '@/constants/supabase';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { User } from '@supabase/supabase-js';
import { router } from 'expo-router';
import { useUnits } from '@/contexts/me-panel-context';
import { convertText } from '@/utils/units';
import { StatusBar } from 'expo-status-bar';
import { useIsFocused } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, initialWindowMetrics } from 'react-native-safe-area-context';

const PRIMARY = '#FF5C35';
const BG = '#FFF8F0';
const SURFACE = '#FFFFFF';
const DARK = '#1C1F2E';
const GOLD = '#FFBA35';
const MUTED = '#8E93A8';

const TOP_INSET = initialWindowMetrics?.insets.top ?? 0;

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getFirstName(user: { email?: string | null } | null): string | null {
  if (!user?.email) return null;
  const local = user.email.split('@')[0];
  const first = local.split(/[._]/)[0];
  return first.charAt(0).toUpperCase() + first.slice(1);
}

const DAILY_PROMPTS = [
  { icon: 'flask-outline', text: "Got leftovers? Turn them into something worth eating.", color: GOLD, bg: '#FFF3D0', action: 'Remix leftovers', route: '/leftovers-lab' },
  { icon: 'leaf-outline', text: "Try something lighter tonight. Your future self will thank you.", color: '#34A853', bg: '#E8F8EE', action: 'Cook healthy', route: '/(tabs)/ai-souschef' },
  { icon: 'flash-outline', text: "Busy evening? Find a meal ready in under 25 minutes.", color: '#3B82F6', bg: '#EBF3FF', action: 'Quick meals', route: '/(tabs)/ai-souschef' },
  { icon: 'calendar-outline', text: "Plan the week ahead. Less stress, better eating.", color: '#3B82F6', bg: '#EBF3FF', action: 'Plan my week', route: '/(tabs)/calendar' },
  { icon: 'barbell-outline', text: "High protein, big flavour. Scan what's in your fridge.", color: PRIMARY, bg: '#FFE8E2', action: 'Go high protein', route: '/(tabs)/ai-souschef' },
  { icon: 'camera-outline', text: "Scan your groceries and discover tonight's dinner.", color: PRIMARY, bg: '#FFE8E2', action: 'Scan now', route: '/(tabs)/ai-souschef' },
  { icon: 'options-outline', text: "Set your taste preferences for smarter meal suggestions.", color: '#34A853', bg: '#E8F8EE', action: 'Set preferences', route: '/taste-profile' },
];

