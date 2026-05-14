import { brandType } from '@/constants/brand';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BRAND_ORANGE = '#FF5C35';
const SURFACE = '#FFFFFF';
const CREAM = '#FFF8F0';
const INK = '#1C1F2E';
const MUTED = '#8E93A8';
const SAGE = '#FFBA35';
const GOLD = '#FFBA35';

type InspirationCard = {
  title: string;
  meta: string;
  detail: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: Href;
  tone?: 'orange' | 'sage' | 'gold';
};

const inspirationCards: InspirationCard[] = [
  {
    title: 'Leftovers Lab',
    meta: 'Remix',
    detail: 'Turn cooked odds and ends into a fresh second meal.',
    icon: 'flask-outline',
    route: '/leftovers-lab',
  },
  {
    title: 'Weekly Plan',
    meta: 'Plan',
    detail: 'Build dinners from current ingredients and saved favorites.',
    icon: 'calendar-outline',
    route: '/weekly-plan',
    tone: 'sage',
  },
  {
    title: 'Shopping List',
    meta: 'Shop',
    detail: 'See missing ingredients grouped by aisle-style categories.',
    icon: 'cart-outline',
    route: '/shopping-list',
    tone: 'gold',
  },
  {
    title: 'Nutrition Snapshot',
    meta: 'Simple',
    detail: 'Quick protein, calories, time, and serving estimates.',
    icon: 'pulse-outline',
    route: '/nutrition-snapshot',
    tone: 'sage',
  },
  {
    title: 'Recipe History',
    meta: 'Recent',
    detail: 'Find generated ideas that were not saved yet.',
    icon: 'time-outline',
    route: '/recipe-history',
  },
  {
    title: 'Cooking Mode',
    meta: 'Hands-free',
    detail: 'Big steps, timers, checkboxes, and focused cooking controls.',
    icon: 'play-circle-outline',
    route: '/cooking-mode',
    tone: 'gold',
  },
];

function getToneColor(tone: InspirationCard['tone']) {
  if (tone === 'sage') {
    return SAGE;
  }

  if (tone === 'gold') {
    return GOLD;
  }

  return BRAND_ORANGE;
}

