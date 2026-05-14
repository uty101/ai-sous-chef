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

const STORAGE_KEY = '@sous_chef_nutrition_goals';

type HealthGoal = 'healthier' | 'lose_weight' | 'build_muscle' | 'maintain';
type CalorieGoal = 1400 | 1600 | 1800 | 2200 | 2500 | null;
type ProteinLevel = 'low' | 'medium' | 'high';

type NutritionGoals = {
  healthGoal: HealthGoal;
  calorieGoal: CalorieGoal;
  proteinLevel: ProteinLevel;
};

const DEFAULT_GOALS: NutritionGoals = {
  healthGoal: 'healthier',
  calorieGoal: 1800,
  proteinLevel: 'medium',
};

const HEALTH_GOALS: {
  id: HealthGoal;
  label: string;
  emoji: string;
  desc: string;
  accent: string;
  bg: string;
}[] = [
  { id: 'healthier',    label: 'Eat Healthier', emoji: '🥗', desc: 'Balanced meals, more veg',   accent: '#34A853', bg: '#E8F8EE' },
  { id: 'lose_weight',  label: 'Lose Weight',   emoji: '⚡',  desc: 'Lower-calorie options',      accent: '#3B82F6', bg: '#EBF3FF' },
  { id: 'build_muscle', label: 'Build Muscle',  emoji: '💪', desc: 'High-protein recipes',        accent: PRIMARY,   bg: '#FFE8E2' },
  { id: 'maintain',     label: 'Maintain',      emoji: '⚖️', desc: 'Keep things consistent',     accent: GOLD,      bg: '#FFF0D8' },
];

const CALORIE_OPTIONS: { value: CalorieGoal; label: string }[] = [
  { value: 1400, label: '1400' },
  { value: 1600, label: '1600' },
  { value: 1800, label: '1800' },
  { value: 2200, label: '2200' },
  { value: 2500, label: '2500' },
  { value: null, label: 'Skip' },
];

const PROTEIN_OPTIONS: { id: ProteinLevel; label: string; desc: string }[] = [
  { id: 'low',    label: 'Low',    desc: 'Under 60g per day' },
  { id: 'medium', label: 'Medium', desc: '60g to 120g per day' },
  { id: 'high',   label: 'High',   desc: '120g or more per day' },
];

export default function NutritionSnapshotScreen() {
  const { openMe } = useMePanel();
  const navigation = useNavigation();
  const [goals, setGoals] = useState<NutritionGoals>(DEFAULT_GOALS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => openMe());
    return unsubscribe;
  }, [navigation, openMe]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val) setGoals(JSON.parse(val));
    });
  }, []);

  const update = (patch: Partial<NutritionGoals>) => {
    setGoals((prev) => ({ ...prev, ...patch }));
    setSaved(false);
  };

  const saveGoals = async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: true }} />
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.hero}>
          <TouchableOpacity style={styles.heroBackBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.heroTitle}>Nutrition</Text>
        </View>

        <ScrollView style={styles.screen} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.infoCard}>
            <Ionicons name="pulse-outline" size={22} color={PRIMARY} />
            <Text style={styles.infoText}>
              These goals help your sous chef suggest meals that fit your lifestyle. Not medical advice.
            </Text>
          </View>

          <Text style={styles.sectionLabel}>What's your main goal?</Text>
          <View style={styles.goalGrid}>
            {HEALTH_GOALS.map((g) => {
              const active = goals.healthGoal === g.id;
              return (
                <TouchableOpacity
                  key={g.id}
                  style={[
                    styles.goalCard,
                    { backgroundColor: active ? g.bg : SURFACE },
                    active && { borderColor: g.accent, borderWidth: 2 },
                  ]}
                  onPress={() => update({ healthGoal: g.id })}
                  activeOpacity={0.85}>
                  <Text style={styles.goalEmoji}>{g.emoji}</Text>
                  <Text style={[styles.goalLabel, active && { color: g.accent }]}>{g.label}</Text>
                  <Text style={styles.goalDesc}>{g.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>Daily calorie target (kcal)</Text>
          <View style={styles.pillRow}>
            {CALORIE_OPTIONS.map((opt) => {
              const active = goals.calorieGoal === opt.value;
              return (
                <TouchableOpacity
                  key={String(opt.value)}
                  style={[styles.pill, active && styles.pillActive]}
                  onPress={() => update({ calorieGoal: opt.value })}
                  activeOpacity={0.8}>
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>Protein preference</Text>
          <View style={styles.optionList}>
            {PROTEIN_OPTIONS.map((opt) => {
              const active = goals.proteinLevel === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.optionRow, active && styles.optionRowActive]}
                  onPress={() => update({ proteinLevel: opt.id })}
                  activeOpacity={0.85}>
                  <View style={styles.radioOuter}>
                    {active && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.optionBody}>
                    <Text style={[styles.optionLabel, active && { color: DARK }]}>{opt.label}</Text>
                    <Text style={styles.optionDesc}>{opt.desc}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saved && styles.saveBtnSaved]}
            onPress={saveGoals}
            activeOpacity={0.85}>
            <Ionicons name={saved ? 'checkmark' : 'save-outline'} size={18} color={SURFACE} />
            <Text style={styles.saveBtnText}>{saved ? 'Saved!' : 'Save Goals'}</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
        </SafeAreaView>
    </>
  );
}

