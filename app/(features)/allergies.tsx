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

