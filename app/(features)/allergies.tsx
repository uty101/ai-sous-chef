import AsyncStorage from '@react-native-async-storage/async-storage';
import { brandType } from '@/constants/brand';
import { useMePanel } from '@/contexts/me-panel-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, router } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
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

const STORAGE_KEY = '@sous_chef_allergens';

type Allergen = { id: string; label: string; emoji: string };

const ALLERGENS: Allergen[] = [
  { id: 'gluten',    label: 'Gluten',     emoji: '🌾' },
  { id: 'dairy',     label: 'Dairy',      emoji: '🥛' },
  { id: 'eggs',      label: 'Eggs',       emoji: '🥚' },
  { id: 'peanuts',   label: 'Peanuts',    emoji: '🥜' },
  { id: 'tree_nuts', label: 'Tree Nuts',  emoji: '🌰' },
  { id: 'fish',      label: 'Fish',       emoji: '🐟' },
  { id: 'shellfish', label: 'Shellfish',  emoji: '🦐' },
  { id: 'soya',      label: 'Soya',       emoji: '🫘' },
  { id: 'sesame',    label: 'Sesame',     emoji: '🌿' },
  { id: 'mustard',   label: 'Mustard',    emoji: '🌼' },
  { id: 'celery',    label: 'Celery',     emoji: '🥬' },
  { id: 'sulphites', label: 'Sulphites',  emoji: '🍷' },
  { id: 'lupin',     label: 'Lupin',      emoji: '🌸' },
  { id: 'molluscs',  label: 'Molluscs',   emoji: '🦑' },
];

export default function AllergiesScreen() {
  const { openMe } = useMePanel();
  const navigation = useNavigation();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => openMe());
    return unsubscribe;
  }, [navigation, openMe]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val) setSelected(new Set(JSON.parse(val)));
    });
  }, []);

  const toggle = async (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelected(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
  };

  const activeCount = selected.size;

  return (
    <>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: true }} />
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.hero}>
          <TouchableOpacity style={styles.heroBackBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.heroTitle}>Allergies</Text>
        </View>

        <ScrollView style={styles.screen} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark-outline" size={22} color={GOLD} />
            <Text style={styles.infoText}>
              Recipes will never include these ingredients. These are treated as strict no-go items.
            </Text>
          </View>

          {activeCount > 0 && (
            <View style={styles.countPill}>
              <Text style={styles.countText}>
                {activeCount} allergen{activeCount !== 1 ? 's' : ''} flagged
              </Text>
            </View>
          )}

          <View style={styles.grid}>
            {ALLERGENS.map((a) => {
              const active = selected.has(a.id);
              return (
                <TouchableOpacity
                  key={a.id}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => toggle(a.id)}
                  activeOpacity={0.8}>
                  <Text style={styles.chipEmoji}>{a.emoji}</Text>
                  <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                    {a.label}
                  </Text>
                  {active && (
                    <View style={styles.checkBadge}>
                      <Ionicons name="checkmark" size={12} color={SURFACE} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

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
    gap: 16,
  },
  infoCard: {
    backgroundColor: '#FFF0D8',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 4,
  },
  infoText: {
    flex: 1,
    color: DARK,
    fontSize: 13,
    lineHeight: 20,
  },
  countPill: {
    alignSelf: 'center',
    backgroundColor: '#FFE8E2',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#FFD0C4',
  },
  countText: {
    ...brandType,
    color: PRIMARY,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    backgroundColor: SURFACE,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: '#E2E3EA',
    alignItems: 'center',
    width: '47%',
    gap: 5,
    position: 'relative',
  },
  chipActive: {
    backgroundColor: '#FFE8E2',
    borderColor: PRIMARY,
  },
  chipEmoji: { fontSize: 26 },
  chipLabel: {
    ...brandType,
    color: MUTED,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  chipLabelActive: { color: DARK },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
