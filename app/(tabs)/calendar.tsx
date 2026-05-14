import AsyncStorage from '@react-native-async-storage/async-storage';
import { brandType } from '@/constants/brand';
import { useUnits } from '@/contexts/me-panel-context';
import { convertText } from '@/utils/units';
import { personaliseSteps, deriveVibe } from '@/constants/personalise-steps';
import { GENERATE_FINAL_MEAL_FUNCTION_URL, SUPABASE_ANON_KEY, supabase } from '@/constants/supabase';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useIsFocused } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, initialWindowMetrics } from 'react-native-safe-area-context';

const BRAND_ORANGE = '#FF5C35';
const CREAM = '#FFF8F0';
const SURFACE = '#FFFFFF';
const INK = '#1C1F2E';
const MUTED = '#8E93A8';
const GOLD = '#FFBA35';
const GREEN = '#34A853';
const BLUE = '#3B82F6';

const TOP_INSET = initialWindowMetrics?.insets.top ?? 0;

const CELL_WIDTH = 44;
const CELL_GAP = 8;
const DAYS_BACK = 7;
const DAYS_FORWARD = 6;

type HistoryEntry = {
  id: string;
  title: string;
  createdAt: string;
  timeMinutes: number;
};

type Nutrition = { calories: number; protein: number; carbs: number; fats: number };

type RecipeDetail = {
  id: string;
  title: string;
  timeMinutes: number;
  createdAt?: string;
  description: string;
  ingredients: string[];
  steps: string[];
  accent?: string;
  bg?: string;
  cuisine?: string;
  goal?: string;
  nutrition?: Nutrition;
};

type PlannedMeal = {
  id: string;
  title: string;
  cuisine: string;
  timeMinutes: number;
  goal: string;
  accent: string;
  bg: string;
  uses: string[];
};

type ElevationHint = {
  ingredient: string;
  label: string;
  result: string;
  note: string;
  accent: string;
  bg: string;
};

type DateEntry = {
  date: Date;
  isToday: boolean;
  isPast: boolean;
};

