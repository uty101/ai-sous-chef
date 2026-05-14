import AsyncStorage from '@react-native-async-storage/async-storage';
import { brandType } from '@/constants/brand';
import { personaliseSteps } from '@/constants/personalise-steps';
import { buildProfilePrompt, type UserProfile } from '@/constants/user-profile';
import {
  DETECT_INGREDIENTS_FUNCTION_URL,
  GENERATE_FINAL_MEAL_FUNCTION_URL,
  SUPABASE_ANON_KEY,
  supabase,
} from '@/constants/supabase';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { User } from '@supabase/supabase-js';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, initialWindowMetrics } from 'react-native-safe-area-context';

const VIBES = ['Quick', 'Easy', 'Everyday', 'Gourmet', 'Michelin'] as const;
const DIETS = ['No Preference', 'Balanced', 'High Protein', 'Low Carb', 'Comfort Food'] as const;

const PANTRY_BASKET_KEY = 'pantry_basket';
const PANTRY_STAPLES_KEY = 'pantry_staples';
const USER_PROFILE_KEY = 'ai_souschef_user_profile';
const SHOPPING_LIST_KEY = 'shopping_list_items';

// Soft diversity note — identical for every nutrition-focus variation.
// Encourages worldwide cuisine variety across the 5 cards without forcing anything.
const DIVERSITY_NOTE =
  'This is one of five meal variations, each with a different nutrition focus. ' +
  'Where the ingredients naturally allow it, bring a distinct culinary perspective drawn from anywhere in the world. ' +
  'You may use a subset of the available ingredients if that enables a more authentic or varied result — ' +
  'for example, setting aside the pasta to create a non-Italian dish from the remaining items. ' +
  'Across all five variations, 2–3 different culinary traditions are welcome, but ingredient suitability and authenticity always come first. ' +
  'Never force a cuisine that clashes with what is available.';
const BRAND_ORANGE = '#FF5C35';
const SURFACE = '#FFFFFF';
const CREAM = '#FFF8F0';
const SAGE = '#FFBA35';
const TOMATO = '#FF5C35';
const INK = '#1C1F2E';
const MUTED = '#8E93A8';
const AUTO_ADD_POSSIBLE_CONFIDENCE = 0.45;

const TOP_INSET = initialWindowMetrics?.insets.top ?? 0;
const MAX_DIRECT_IMAGE_BYTES = 12 * 1024 * 1024;
const FINAL_SCAN_MAX_EDGE = 1800;

type Vibe = (typeof VIBES)[number];
type Diet = (typeof DIETS)[number];

type Ingredient = {
  name: string;
  confidence: number;
  source: 'vision' | 'label' | 'mixed';
};

type UnresolvedItem = {
  labelHint: string;
  reason: string;
};

type DetectionResult = {
  confirmedIngredients: Ingredient[];
  possibleIngredients: Ingredient[];
  unresolvedItems: UnresolvedItem[];
  qualityWarnings: string[];
};

type Nutrition = { calories: number; protein: number; carbs: number; fats: number };

type RecipeResult = {
  title: string;
  description: string;
  cuisine?: string;
  ingredients: string[];
  steps: string[];
  timeMinutes: number;
  nutrition?: Nutrition;
};

