import AsyncStorage from '@react-native-async-storage/async-storage';
import { brandType } from '@/constants/brand';
import { personaliseSteps, deriveVibe } from '@/constants/personalise-steps';
import { SUPABASE_ENABLED, supabase } from '@/constants/supabase';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { User } from '@supabase/supabase-js';
import { useIsFocused } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, initialWindowMetrics } from 'react-native-safe-area-context';

const PRIMARY = '#FF5C35';
const BG = '#FFF8F0';
const SURFACE = '#FFFFFF';
const DARK = '#1C1F2E';
const GOLD = '#FFBA35';
const MUTED = '#8E93A8';

const TOP_INSET = initialWindowMetrics?.insets.top ?? 0;

const FAVORITES_KEY = 'saved_favorites';
const SAVED_RECIPES_DATA_KEY = 'saved_recipes_data';
const SAVED_SEEDED_KEY = 'saved_seeded_v1';

type Nutrition = { calories: number; protein: number; carbs: number; fats: number };

type RecipeResult = {
  title: string;
  description: string;
  ingredients: string[];
  steps: string[];
  timeMinutes: number;
  nutrition?: Nutrition;
  cuisine?: string;
};

type SavedRecipe = RecipeResult & { id: string; createdAt: string };
type SavedRecipeCard = SavedRecipe & { accent: string; bg: string };

