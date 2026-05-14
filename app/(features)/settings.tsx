import AsyncStorage from '@react-native-async-storage/async-storage';
import { brandType } from '@/constants/brand';
import { useMePanel } from '@/contexts/me-panel-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, router } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PRIMARY = '#FF5C35';
const BG = '#FFF8F0';
const SURFACE = '#FFFFFF';
const DARK = '#1C1F2E';
const GOLD = '#FFBA35';
const MUTED = '#8E93A8';

const SETTINGS_KEY = '@sous_chef_settings';

type SkillLevel = 'beginner' | 'home_cook' | 'advanced';

type Settings = {
  units: 'metric' | 'imperial';
  notifications: boolean;
  darkMode: boolean;
  servings: number;
  skillLevel: SkillLevel;
};

const DEFAULT_SETTINGS: Settings = {
  units: 'metric',
  notifications: true,
  darkMode: false,
  servings: 2,
  skillLevel: 'home_cook',
};

export default function SettingsScreen() {
  const { openMe, setUnits, setDarkMode } = useMePanel();
  const navigation = useNavigation();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => openMe());
    return unsubscribe;
  }, [navigation, openMe]);

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY).then((val) => {
      if (val) {
        try {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(val) });
        } catch {}
      }
    });
  }, []);

  const save = async (next: Settings) => {
    setSettings(next);
    setUnits(next.units);
    setDarkMode(next.darkMode);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  };

  const confirmClear = (label: string, key: string) => {
    Alert.alert(
      `Clear ${label}?`,
      `This will remove all saved ${label.toLowerCase()}. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => AsyncStorage.removeItem(key) },
      ],
    );
  };

  const SKILL_OPTIONS: { key: SkillLevel; label: string }[] = [
    { key: 'beginner', label: 'Beginner' },
    { key: 'home_cook', label: 'Home Cook' },
    { key: 'advanced', label: 'Advanced' },
  ];

  return (
    <>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: true }} />
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.hero}>
          <TouchableOpacity style={styles.heroBackBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.heroTitle}>General Settings</Text>
        </View>

        <ScrollView style={styles.screen} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

          {/* App */}
          <Text style={styles.sectionLabel}>App</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowIcon}>
                <Ionicons name="globe-outline" size={20} color={PRIMARY} />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>Units</Text>
                <Text style={styles.rowMeta}>Amounts and temperatures</Text>
              </View>
              <View style={styles.segmented}>
                <TouchableOpacity
                  style={[styles.seg, settings.units === 'metric' && styles.segActive]}
                  onPress={() => save({ ...settings, units: 'metric' })}
                  activeOpacity={0.8}>
                  <Text style={[styles.segText, settings.units === 'metric' && styles.segTextActive]}>
                    Metric
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.seg, settings.units === 'imperial' && styles.segActive]}
                  onPress={() => save({ ...settings, units: 'imperial' })}
                  activeOpacity={0.8}>
                  <Text style={[styles.segText, settings.units === 'imperial' && styles.segTextActive]}>
                    Imperial
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Cooking */}
          <Text style={styles.sectionLabel}>Cooking</Text>
          <View style={styles.card}>
            <View style={[styles.row, { flexDirection: 'column', alignItems: 'flex-start', gap: 10 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[styles.rowIcon, { backgroundColor: '#FFF0D8' }]}>
                  <Ionicons name="people-outline" size={20} color={GOLD} />
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>Default Servings</Text>
                  <Text style={styles.rowMeta}>I usually cook for this many people</Text>
                </View>
              </View>
              <View style={styles.pillRow}>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <TouchableOpacity
                    key={n}
                    style={[styles.pill, settings.servings === n && styles.pillActive]}
                    onPress={() => save({ ...settings, servings: n })}
                    activeOpacity={0.8}>
                    <Text style={[styles.pillText, settings.servings === n && styles.pillTextActive]}>
                      {n}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.divider} />

            <View style={[styles.row, { flexDirection: 'column', alignItems: 'flex-start', gap: 10 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[styles.rowIcon, { backgroundColor: '#F0EBFF' }]}>
                  <Ionicons name="ribbon-outline" size={20} color="#7C3AED" />
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>Skill Level</Text>
                  <Text style={styles.rowMeta}>Adjusts recipe complexity</Text>
                </View>
              </View>
              <View style={[styles.segmented, { flex: 0, alignSelf: 'stretch' }]}>
                {SKILL_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.seg, { flex: 1 }, settings.skillLevel === opt.key && styles.segActive]}
                    onPress={() => save({ ...settings, skillLevel: opt.key })}
                    activeOpacity={0.8}>
                    <Text style={[styles.segText, { textAlign: 'center' }, settings.skillLevel === opt.key && styles.segTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Notifications */}
          <Text style={styles.sectionLabel}>Notifications</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: '#FFF0D8' }]}>
                <Ionicons name="notifications-outline" size={20} color={GOLD} />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>Meal Reminders</Text>
                <Text style={styles.rowMeta}>Get nudged to cook at meal times</Text>
              </View>
              <Switch
                value={settings.notifications}
                onValueChange={(v) => save({ ...settings, notifications: v })}
                trackColor={{ false: '#E2E3EA', true: `${PRIMARY}88` }}
                thumbColor={settings.notifications ? PRIMARY : SURFACE}
              />
            </View>
          </View>

          {/* Appearance */}
          <Text style={styles.sectionLabel}>Appearance</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: '#1C1F2E' }]}>
                <Ionicons name="moon-outline" size={20} color="#A78BFA" />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>Dark Mode</Text>
                <Text style={styles.rowMeta}>Switch to a dark colour scheme</Text>
              </View>
              <Switch
                value={settings.darkMode}
                onValueChange={(v) => save({ ...settings, darkMode: v })}
                trackColor={{ false: '#E2E3EA', true: '#7C3AED88' }}
                thumbColor={settings.darkMode ? '#7C3AED' : SURFACE}
              />
            </View>
          </View>

          {/* Data */}
          <Text style={styles.sectionLabel}>Data</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => confirmClear('Pantry', '@sous_chef_pantry')}
              activeOpacity={0.8}>
              <View style={[styles.rowIcon, { backgroundColor: '#FFF0D8' }]}>
                <Ionicons name="basket-outline" size={20} color={GOLD} />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>Clear Pantry</Text>
                <Text style={styles.rowMeta}>Remove all saved ingredients</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={MUTED} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.row}
              onPress={() => confirmClear('Recipe History', '@sous_chef_history')}
              activeOpacity={0.8}>
              <View style={[styles.rowIcon, { backgroundColor: '#F0EBFF' }]}>
                <Ionicons name="time-outline" size={20} color="#7C3AED" />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>Clear Recipe History</Text>
                <Text style={styles.rowMeta}>Remove all recently cooked meals</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={MUTED} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.row}
              onPress={() =>
                Alert.alert(
                  'Clear All Data?',
                  'This will reset the app completely. This cannot be undone.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Clear All', style: 'destructive', onPress: () => AsyncStorage.clear() },
                  ],
                )
              }
              activeOpacity={0.8}>
              <View style={[styles.rowIcon, { backgroundColor: '#FFE8E2' }]}>
                <Ionicons name="trash-outline" size={20} color={PRIMARY} />
              </View>
              <View style={styles.rowBody}>
                <Text style={[styles.rowTitle, { color: PRIMARY }]}>Clear All Data</Text>
                <Text style={styles.rowMeta}>Reset everything. Cannot be undone.</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={MUTED} />
            </TouchableOpacity>
          </View>

          {/* About */}
          <Text style={styles.sectionLabel}>About</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="information-circle-outline" size={20} color="#2E7D32" />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>App Version</Text>
                <Text style={styles.rowMeta}>Version 1.0.0</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.row} activeOpacity={0.8}>
              <View style={[styles.rowIcon, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#1565C0" />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>Privacy Policy</Text>
                <Text style={styles.rowMeta}>How we handle your data</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={MUTED} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.row} activeOpacity={0.8}>
              <View style={[styles.rowIcon, { backgroundColor: '#FFF0D8' }]}>
                <Ionicons name="star-outline" size={20} color={GOLD} />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>Rate AI Sous Chef</Text>
                <Text style={styles.rowMeta}>Enjoying the app? Let us know.</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={MUTED} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.signOutBtn} activeOpacity={0.85}>
            <Ionicons name="log-out-outline" size={18} color={PRIMARY} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
        </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: PRIMARY },
  screen: { flex: 1, backgroundColor: BG },
  hero: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 10,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 8,
  },
  heroBackBtn: {
    padding: 4,
    marginTop: -5,
  },
  heroTitle: {
    ...brandType,
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 30,
    marginTop: 2,
    textTransform: 'uppercase',
    textShadowColor: DARK,
    textShadowOffset: { width: 1.5, height: 1.5 },
    textShadowRadius: 0,
  },
  container: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 8,
  },
  sectionLabel: {
    ...brandType,
    color: MUTED,
    fontSize: 11,
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 4,
    marginLeft: 4,
  },
  card: {
    backgroundColor: SURFACE,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E3EA',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#FFE8E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1 },
  rowTitle: {
    ...brandType,
    color: DARK,
    fontSize: 13,
    textTransform: 'uppercase',
  },
  rowMeta: { color: MUTED, fontSize: 12, marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F0EBE3', marginHorizontal: 14 },
  segmented: {
    flexDirection: 'row',
    backgroundColor: '#F0EBE3',
    borderRadius: 10,
    padding: 2,
  },
  seg: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  segActive: { backgroundColor: SURFACE },
  segText: { color: MUTED, fontSize: 12, fontWeight: '700' },
  segTextActive: { color: DARK },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 2,
  },
  pill: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F0EBE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: { backgroundColor: PRIMARY },
  pillText: { color: MUTED, fontSize: 14, fontWeight: '700' },
  pillTextActive: { color: SURFACE },
  signOutBtn: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFE8E2',
    borderRadius: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#FFD0C4',
  },
  signOutText: {
    ...brandType,
    color: PRIMARY,
    fontSize: 14,
    textTransform: 'uppercase',
  },
});
