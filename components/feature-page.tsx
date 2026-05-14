import { brandType } from '@/constants/brand';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BRAND_ORANGE = '#FF5C35';
const CREAM = '#FFF8F0';
const SURFACE = '#FFFFFF';
const INK = '#1C1F2E';
const MUTED = '#8E93A8';
const SAGE = '#FFBA35';
const GOLD = '#FFBA35';

export type FeatureAction = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route?: Href;
};

export type FeatureStat = {
  label: string;
  value: string;
};

export type FeatureSection = {
  title: string;
  description?: string;
  items: {
    title: string;
    meta?: string;
    detail?: string;
    icon: keyof typeof Ionicons.glyphMap;
    tone?: 'orange' | 'sage' | 'gold';
  }[];
};

export type FeaturePageContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  stats?: FeatureStat[];
  primaryAction?: FeatureAction;
  secondaryAction?: FeatureAction;
  sections: FeatureSection[];
};

function getToneColor(tone: FeatureSection['items'][number]['tone']) {
  if (tone === 'sage') {
    return SAGE;
  }

  if (tone === 'gold') {
    return GOLD;
  }

  return BRAND_ORANGE;
}

function handleAction(action?: FeatureAction) {
  if (!action?.route) {
    return;
  }

  router.push(action.route);
}

function ActionButton({ action, variant }: { action: FeatureAction; variant: 'primary' | 'secondary' }) {
  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      style={[styles.actionButton, isPrimary ? styles.actionPrimary : styles.actionSecondary]}
      onPress={() => handleAction(action)}
      activeOpacity={0.85}>
      <Ionicons name={action.icon} size={18} color={isPrimary ? SURFACE : BRAND_ORANGE} />
      <Text style={[styles.actionText, !isPrimary && styles.actionTextSecondary]}>{action.label}</Text>
    </TouchableOpacity>
  );
}

