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

const FAVORITES_KEY = 'saved_favorites';
const SAVED_RECIPES_DATA_KEY = 'saved_recipes_data';

type ButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  textPill?: boolean;
  variant?: 'primary' | 'secondary' | 'success';
  icon?: keyof typeof Ionicons.glyphMap;
};

const VIBE_DETAILS: Record<Vibe, {
  icon: keyof typeof Ionicons.glyphMap;
  eyebrow: string;
  description: string;
  bg: string;
  accent: string;
}> = {
  Quick: {
    icon: 'flash-outline',
    eyebrow: '15–20 min',
    description: 'Minimal effort, no technique needed',
    bg: '#FFF3D0',
    accent: '#D4900A',
  },
  Easy: {
    icon: 'sunny-outline',
    eyebrow: '20–30 min',
    description: 'Simple steps, build your confidence',
    bg: '#E8F8EE',
    accent: '#1E8C45',
  },
  Everyday: {
    icon: 'home-outline',
    eyebrow: '30–45 min',
    description: 'Proper home cooking, satisfying meals',
    bg: '#EBF3FF',
    accent: '#2563EB',
  },
  Gourmet: {
    icon: 'restaurant-outline',
    eyebrow: '45–60 min',
    description: 'Restaurant-quality results at home',
    bg: '#FFE8E2',
    accent: '#FF5C35',
  },
  Michelin: {
    icon: 'star-outline',
    eyebrow: '60+ min',
    description: 'Fine dining techniques, advanced skill',
    bg: '#F0EBFF',
    accent: '#6D28D9',
  },
};

const DIET_DETAILS: Record<Diet, {
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  bg: string;
  description: string;
}> = {
  'No Preference': { icon: 'globe-outline', accent: '#6D28D9', bg: '#F0EBFF', description: 'No restrictions, cook freely with whatever looks good.' },
  Balanced: { icon: 'heart-outline', accent: '#1E8C45', bg: '#E8F8EE', description: 'Well-rounded meals with a healthy mix of macros.' },
  'High Protein': { icon: 'barbell-outline', accent: '#FF5C35', bg: '#FFE8E2', description: 'Protein-forward dishes to fuel activity and recovery.' },
  'Low Carb': { icon: 'nutrition-outline', accent: '#2563EB', bg: '#EBF3FF', description: 'Fewer carbs, more veg and lean proteins.' },
  'Comfort Food': { icon: 'cafe-outline', accent: '#D4900A', bg: '#FFF3D0', description: 'Hearty, indulgent dishes that hit the spot.' },
};

// Small reusable UI building blocks keep the screen easier to read.
function Button({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  icon,
  textPill = false,
}: ButtonProps) {
  const isSecondary = variant === 'secondary';
  const contentColor = isSecondary ? BRAND_ORANGE : SURFACE;

  return (
    <TouchableOpacity
      style={[
        styles.buttonBase,
        variant === 'primary' && styles.buttonPrimary,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'success' && styles.buttonSuccess,
        disabled && styles.buttonDisabled,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={disabled}>
      {loading ? (
        <ActivityIndicator color={contentColor} size="small" />
      ) : (
        <View style={styles.buttonContent}>
          {icon ? <Ionicons name={icon} size={18} color={contentColor} /> : null}
          {textPill ? (
            <View style={styles.buttonTextPill}>
              <Text style={[styles.buttonText, isSecondary && styles.buttonTextSecondary]} numberOfLines={1} adjustsFontSizeToFit>
                {title}
              </Text>
            </View>
          ) : (
            <Text style={[styles.buttonText, isSecondary && styles.buttonTextSecondary]} numberOfLines={1} adjustsFontSizeToFit>
              {title}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function isIngredient(value: unknown): value is Ingredient {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Record<string, unknown>;
  return (
    typeof item.name === 'string' &&
    typeof item.confidence === 'number' &&
    (item.source === 'vision' || item.source === 'label' || item.source === 'mixed')
  );
}

function isUnresolvedItem(value: unknown): value is UnresolvedItem {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Record<string, unknown>;
  return typeof item.labelHint === 'string' && typeof item.reason === 'string';
}

function isDetectionResult(value: unknown): value is DetectionResult {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Record<string, unknown>;
  return (
    Array.isArray(item.confirmedIngredients) &&
    item.confirmedIngredients.every(isIngredient) &&
    Array.isArray(item.possibleIngredients) &&
    item.possibleIngredients.every(isIngredient) &&
    Array.isArray(item.unresolvedItems) &&
    item.unresolvedItems.every(isUnresolvedItem) &&
    Array.isArray(item.qualityWarnings) &&
    item.qualityWarnings.every((entry) => typeof entry === 'string')
  );
}

function isRecipeResult(value: unknown): value is RecipeResult {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Record<string, unknown>;
  const n = item.nutrition as Record<string, unknown> | null | undefined;
  const nutritionOk =
    n !== null && typeof n === 'object' &&
    typeof n.calories === 'number' &&
    typeof n.protein === 'number' &&
    typeof n.carbs === 'number' &&
    typeof n.fats === 'number';
  return (
    typeof item.title === 'string' &&
    typeof item.description === 'string' &&
    Array.isArray(item.ingredients) &&
    item.ingredients.every((entry) => typeof entry === 'string') &&
    Array.isArray(item.steps) &&
    item.steps.every((entry) => typeof entry === 'string') &&
    typeof item.timeMinutes === 'number' &&
    nutritionOk
  );
}

async function readErrorBody(response: Response) {
  try {
    return await response.json();
  } catch {
    try {
      return await response.text();
    } catch {
      return null;
    }
  }
}

function getBackendErrorStage(errorBody: unknown) {
  if (!errorBody || typeof errorBody !== 'object') {
    return null;
  }

  const stage = (errorBody as Record<string, unknown>).stage;
  return typeof stage === 'string' ? stage : null;
}

function getBackendErrorCode(errorBody: unknown) {
  if (!errorBody || typeof errorBody !== 'object') {
    return null;
  }

  const details = (errorBody as Record<string, unknown>).details;

  if (!details || typeof details !== 'object') {
    return null;
  }

  const code = (details as Record<string, unknown>).code;
  return typeof code === 'string' ? code : null;
}

function getBackendErrorMessage(errorBody: unknown) {
  const stage = getBackendErrorStage(errorBody);
  const code = getBackendErrorCode(errorBody);

  if (stage === 'missing_openai_key') {
    return 'missing_openai_key';
  }

  if (code === 'insufficient_quota') {
    return 'openai_insufficient_quota';
  }

  return stage ?? 'Request failed';
}

function getDetectionFailureMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return 'Detection had trouble with that image. Try a brighter photo, face labels upward, or add missing ingredients manually below.';
  }

  if (error.message === 'missing_openai_key') {
    return 'The Supabase backend is missing its OpenAI API key. Run .\\app-set-openai-key.cmd once, then try again.';
  }

  if (error.message === 'openai_insufficient_quota') {
    return 'OpenAI rejected the request because the API account has no quota or billing credit. Add API billing/credits in the OpenAI Platform, then try again.';
  }

  if (error.message === 'Image is too large for direct detection') {
    return 'That image is too large to send directly. Try taking a fresh photo in the app or upload a smaller image.';
  }

  return 'Detection had trouble with that image. Try a brighter photo, face labels upward, or add missing ingredients manually below.';
}

function getRecipeFailureMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return 'Please try again in a moment.';
  }

  if (error.message === 'missing_openai_key') {
    return 'The Supabase backend is missing its OpenAI API key. Run .\\app-set-openai-key.cmd once, then try again.';
  }

  if (error.message === 'openai_insufficient_quota') {
    return 'OpenAI rejected the request because the API account has no quota or billing credit. Add API billing/credits in the OpenAI Platform, then try again.';
  }

  return 'Please try again in a moment.';
}

function getImageSize(uri: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (error) => reject(error),
    );
  });
}

async function localImageToDataUrl(localImageUri: string) {
  const { width, height } = await getImageSize(localImageUri);
  const longestEdge = Math.max(width, height);
  const resizeAction =
    longestEdge > FINAL_SCAN_MAX_EDGE
      ? [
          width >= height
            ? { resize: { width: FINAL_SCAN_MAX_EDGE } }
            : { resize: { height: FINAL_SCAN_MAX_EDGE } },
        ]
      : [];

  const normalizedImage = await ImageManipulator.manipulateAsync(localImageUri, resizeAction, {
    base64: true,
    compress: 0.9,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  if (!normalizedImage.base64) {
    throw new Error('Image could not be converted for detection');
  }

  const estimatedBytes = Math.ceil((normalizedImage.base64.length * 3) / 4);

  if (estimatedBytes > MAX_DIRECT_IMAGE_BYTES) {
    throw new Error('Image is too large for direct detection');
  }

  return `data:image/jpeg;base64,${normalizedImage.base64}`;
}

async function getFunctionHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    apikey: SUPABASE_ANON_KEY,
  };
}

function formatConfidence(confidence: number) {
  return `${Math.round(Math.max(0, Math.min(confidence, 1)) * 100)}%`;
}

function toTitleCase(str: string) {
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function mergeIngredientNames(ingredients: Ingredient[]) {
  const names = new Map<string, string>();

  for (const ingredient of ingredients) {
    const normalizedName = ingredient.name.trim().toLowerCase();

    if (normalizedName && !names.has(normalizedName)) {
      names.set(normalizedName, ingredient.name.trim());
    }
  }

  return Array.from(names.values());
}

