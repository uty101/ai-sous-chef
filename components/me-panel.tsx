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

export function MePanel({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const slideY = useRef(new Animated.Value(-620)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 40,
        stiffness: 700,
        mass: 0.3,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(slideY, {
        toValue: -620,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  const handleItemPress = (route?: string) => {
    if (!route) return;
    dismiss();
    setTimeout(() => router.push(route as never), 240);
  };

  return (
    <Modal transparent animationType="none" onRequestClose={dismiss}>
      {/* Tap-to-dismiss backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
      </Animated.View>

      {/* Slide-down card */}
      <Animated.View
        style={[styles.panel, { paddingTop: insets.top, transform: [{ translateY: slideY }] }]}>

        {/* Header row */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>AI</Text>
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>Sous Chef Profile</Text>
            <Text style={styles.headerSub}>Preferences & settings</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={dismiss} activeOpacity={0.8}>
            <Ionicons name="close" size={20} color={DARK} />
          </TouchableOpacity>
        </View>

        {/* Section list */}
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          bounces={false}>
          {SECTIONS.map((section) => (
            <TouchableOpacity
              key={section.title}
              style={styles.row}
              onPress={() => handleItemPress(section.route)}
              activeOpacity={section.route ? 0.82 : 1}>
              <View style={[styles.rowIcon, { backgroundColor: `${section.tone}22` }]}>
                <Ionicons name={section.icon} size={20} color={section.tone} />
              </View>
              <View style={styles.rowCopy}>
                <Text style={styles.rowTitle}>{section.title}</Text>
                <Text style={styles.rowMeta}>{section.meta}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={section.route ? MUTED : `${MUTED}55`}
              />
            </TouchableOpacity>
          ))}
          <View style={{ height: 8 }} />
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

