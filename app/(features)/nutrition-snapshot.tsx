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

