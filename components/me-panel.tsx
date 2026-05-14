import { brandType } from '@/constants/brand';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PRIMARY = '#FF5C35';
const BG = '#FFF8F0';
const SURFACE = '#FFFFFF';
const DARK = '#1C1F2E';
const MUTED = '#8E93A8';
const GOLD = '#FFBA35';

const SECTIONS = [
  {
    title: 'General Settings',
    icon: 'settings-outline' as const,
    meta: 'Account, app controls, data',
    tone: PRIMARY,
    route: '/(features)/settings' as string | undefined,
  },
  {
    title: 'Allergies',
    icon: 'medical-outline' as const,
    meta: 'Strict avoid list for recipes',
    tone: GOLD,
    route: '/(features)/allergies' as string | undefined,
  },
  {
    title: 'Dislikes',
    icon: 'close-circle-outline' as const,
    meta: 'Foods to avoid unless selected',
    tone: GOLD,
    route: '/(features)/dislikes' as string | undefined,
  },
  {
    title: 'Nutrition',
    icon: 'pulse-outline' as const,
    meta: 'Simple goals, not medical tracking',
    tone: PRIMARY,
    route: '/(features)/nutrition-snapshot' as string | undefined,
  },
  {
    title: 'Recent Recipes',
    icon: 'time-outline' as const,
    meta: 'Your last 5 cooked meals',
    tone: PRIMARY,
    route: '/recent-recipes' as string | undefined,
  },
];

