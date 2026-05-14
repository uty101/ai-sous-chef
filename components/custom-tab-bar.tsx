import Ionicons from '@expo/vector-icons/Ionicons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brandFontFamily } from '@/constants/brand';

const BAR_BG = '#1C1F2E';
const ORANGE = '#FF5C35';
const ACTIVE = '#FFBA35';
const INACTIVE = 'rgba(255,255,255,0.45)';
const CREAM = '#FFF8F0';

const FAB_SIZE = 62;
const BAR_HEIGHT = 88;
// How many px of the FAB circle sit inside the bar from the top.
// The rest (FAB_SIZE - FAB_IN_BAR) protrudes above.
const FAB_IN_BAR = 32;

type TabDef = {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const LEFT: TabDef[] = [
  { name: 'index', label: 'Home', icon: 'home-outline' },
  { name: 'calendar', label: 'Calendar', icon: 'calendar-outline' },
];

const RIGHT: TabDef[] = [
  { name: 'pantry', label: 'Pantry', icon: 'basket-outline' },
  { name: 'saved', label: 'Saved', icon: 'bookmark-outline' },
];

const CENTER: TabDef = {
  name: 'ai-souschef',
  label: 'AI Sous Chef',
  icon: 'sparkles-outline',
};

