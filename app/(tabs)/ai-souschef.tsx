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

function RecipeCard({ recipe, vibe, diet, isFav, onToggleFav }: {
  recipe: RecipeResult;
  vibe: Vibe | null;
  diet: Diet;
  isFav: boolean;
  onToggleFav: () => void;
}) {
  const vc = DIET_DETAILS[diet];
  const [displaySteps, setDisplaySteps] = useState<string[]>(recipe.steps);
  const [stepsLoading, setStepsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    personaliseSteps(
      { title: recipe.title, ingredients: recipe.ingredients, steps: recipe.steps, timeMinutes: recipe.timeMinutes },
      vibe ?? undefined,
    )
      .then(steps => { if (!cancelled) { setDisplaySteps(steps); setStepsLoading(false); } })
      .catch(() => { if (!cancelled) setStepsLoading(false); });
    return () => { cancelled = true; };
  }, [recipe.title]);

  return (
    <View style={[styles.recipeSheet, { backgroundColor: vc.bg }]}>
      {/* Tags */}
      <View style={styles.recipeSheetTags}>
        {vibe ? (
          <View style={[styles.recipeSheetPill, { backgroundColor: vc.accent }]}>
            <Text style={styles.recipeSheetPillText}>{vibe}</Text>
          </View>
        ) : null}
        <View style={[styles.recipeSheetBadge, { backgroundColor: 'rgba(255,255,255,0.65)' }]}>
          <Ionicons name="time-outline" size={13} color={MUTED} />
          <Text style={styles.recipeSheetBadgeText}>{recipe.timeMinutes} min</Text>
        </View>
        {diet !== 'No Preference' ? (
          <View style={[styles.recipeSheetBadge, { backgroundColor: 'rgba(255,255,255,0.65)' }]}>
            <Text style={styles.recipeSheetBadgeText}>{diet}</Text>
          </View>
        ) : null}
      </View>

      {/* Title + heart */}
      <View style={styles.recipeSheetTitleRow}>
        <Text style={[styles.recipeSheetTitle, { color: vc.accent, textShadowColor: INK }]}>{recipe.title}</Text>
        <TouchableOpacity onPress={onToggleFav} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} activeOpacity={0.7}>
          <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={22} color={isFav ? BRAND_ORANGE : vc.accent} />
        </TouchableOpacity>
      </View>

      <Text style={styles.recipeSheetDescription} numberOfLines={1}>{recipe.description}</Text>

      <View style={[styles.recipeSheetDivider, { backgroundColor: vc.accent + '30' }]} />

      <Text style={[styles.recipeSheetSectionHead, { color: vc.accent }]}>Ingredients</Text>
      {recipe.ingredients.map((ing, i) => (
        <View key={i} style={styles.recipeSheetListRow}>
          <Text style={[styles.recipeSheetBullet, { color: vc.accent }]}>{'•'}</Text>
          <Text style={styles.recipeSheetListText}>{ing}</Text>
        </View>
      ))}

      <View style={[styles.recipeSheetDivider, { backgroundColor: vc.accent + '30' }]} />

      <Text style={[styles.recipeSheetSectionHead, { color: vc.accent }]}>Steps</Text>
      {stepsLoading ? (
        <ActivityIndicator size="small" color={vc.accent} style={{ marginVertical: 12 }} />
      ) : (
        displaySteps.map((step, i) => (
          <View key={i} style={styles.recipeSheetListRow}>
            <View style={[styles.recipeSheetStepCircle, { backgroundColor: vc.accent }]}>
              <Text style={styles.recipeSheetStepCircleText}>{i + 1}</Text>
            </View>
            <Text style={styles.recipeSheetListText}>{step}</Text>
          </View>
        ))
      )}

      <View style={[styles.recipeSheetDivider, { backgroundColor: vc.accent + '30' }]} />
      <Text style={[styles.recipeSheetSectionHead, { color: vc.accent }]}>Nutritional Info</Text>
      <View style={[styles.recipeSheetMacroGrid, { backgroundColor: 'rgba(255,255,255,0.65)', borderColor: vc.accent + '30' }]}>
        <View style={styles.recipeSheetMacroCell}>
          <Text style={[styles.recipeSheetMacroValue, { color: vc.accent }]}>{recipe.nutrition?.calories ?? '—'}</Text>
          <Text style={styles.recipeSheetMacroLabel}>Calories</Text>
        </View>
        <View style={[styles.recipeSheetMacroDivider, { backgroundColor: vc.accent + '30' }]} />
        <View style={styles.recipeSheetMacroCell}>
          <Text style={[styles.recipeSheetMacroValue, { color: vc.accent }]}>{recipe.nutrition?.protein != null ? `${recipe.nutrition.protein}g` : '—'}</Text>
          <Text style={styles.recipeSheetMacroLabel}>Protein</Text>
        </View>
        <View style={[styles.recipeSheetMacroDivider, { backgroundColor: vc.accent + '30' }]} />
        <View style={styles.recipeSheetMacroCell}>
          <Text style={[styles.recipeSheetMacroValue, { color: vc.accent }]}>{recipe.nutrition?.carbs != null ? `${recipe.nutrition.carbs}g` : '—'}</Text>
          <Text style={styles.recipeSheetMacroLabel}>Carbs</Text>
        </View>
        <View style={[styles.recipeSheetMacroDivider, { backgroundColor: vc.accent + '30' }]} />
        <View style={styles.recipeSheetMacroCell}>
          <Text style={[styles.recipeSheetMacroValue, { color: vc.accent }]}>{recipe.nutrition?.fats != null ? `${recipe.nutrition.fats}g` : '—'}</Text>
          <Text style={styles.recipeSheetMacroLabel}>Fats</Text>
        </View>
      </View>
    </View>
  );
}

export default function CookScreen() {
  const { capturedImageUri, capturedAt } = useLocalSearchParams<{
    capturedImageUri?: string;
    capturedAt?: string;
  }>();
  const [user, setUser] = useState<User | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [selectedVibe, setSelectedVibe] = useState<Vibe | null>(null);
  const [selectedDiet, setSelectedDiet] = useState<Diet>('No Preference');
  const [detectedIngredients, setDetectedIngredients] = useState<Ingredient[]>([]);
  const [possibleIngredients, setPossibleIngredients] = useState<Ingredient[]>([]);
  const [unresolvedItems, setUnresolvedItems] = useState<UnresolvedItem[]>([]);
  const [qualityWarnings, setQualityWarnings] = useState<string[]>([]);
  const [editableIngredients, setEditableIngredients] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState('');
  const [recipeResults, setRecipeResults] = useState<Partial<Record<Diet, RecipeResult>>>({});
  const [showNutritionFocus, setShowNutritionFocus] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasTriedDetection, setHasTriedDetection] = useState(false);
  const [detectionFeedback, setDetectionFeedback] = useState<string | null>(null);
  const [showVibeInfo, setShowVibeInfo] = useState(false);
  const [showDietInfo, setShowDietInfo] = useState(false);

  const hatY = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const scrollYRef = useRef(0);
  const ingredientListHeightRef = useRef(0);
  const inputFocusedRef = useRef(false);
  const hatSpin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isDetecting || isGenerating) {
      const loop = Animated.loop(
        Animated.sequence([
          // Jump up + begin spin
          Animated.parallel([
            Animated.timing(hatY, { toValue: 1, duration: 380, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
            Animated.timing(hatSpin, { toValue: 1, duration: 380, useNativeDriver: true, easing: Easing.linear }),
          ]),
          // Drop back with bounce + finish spin
          Animated.parallel([
            Animated.timing(hatY, { toValue: 0, duration: 620, useNativeDriver: true, easing: Easing.out(Easing.bounce) }),
            Animated.timing(hatSpin, { toValue: 2, duration: 620, useNativeDriver: true, easing: Easing.linear }),
          ]),
          Animated.delay(750),
          // Reset spin counter silently so it doesn't accumulate
          Animated.timing(hatSpin, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    } else {
      hatY.setValue(0);
      hatSpin.setValue(0);
    }
  }, [isDetecting, isGenerating, hatY, hatSpin]);

  useEffect(() => {
    if (isDetecting || isGenerating) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    }
  }, [isDetecting, isGenerating]);

  const hatTranslateY = hatY.interpolate({ inputRange: [0, 1], outputRange: [0, -30] });
  const hatRotate = hatSpin.interpolate({ inputRange: [0, 2], outputRange: ['0deg', '720deg'] });

  useEffect(() => {
    AsyncStorage.getItem(FAVORITES_KEY).then((stored) => {
      if (stored) { try { setFavoriteIds(new Set(JSON.parse(stored) as string[])); } catch {} }
    });
  }, []);

  const toggleFavorite = (id: string, recipe?: RecipeResult, diet?: Diet) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      const adding = !next.has(id);
      if (adding) { next.add(id); } else { next.delete(id); }
      AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify([...next]));
      if (recipe && diet) {
        const dc = DIET_DETAILS[diet];
        AsyncStorage.getItem(SAVED_RECIPES_DATA_KEY).then(raw => {
          const data: Record<string, object> = raw ? JSON.parse(raw) : {};
          if (adding) {
            data[id] = {
              id, title: recipe.title, description: recipe.description,
              cuisine: recipe.cuisine,
              ingredients: recipe.ingredients, steps: recipe.steps,
              timeMinutes: recipe.timeMinutes, nutrition: recipe.nutrition,
              bg: dc.bg, accent: dc.accent,
              createdAt: new Date().toISOString(),
            };
          } else {
            delete data[id];
          }
          AsyncStorage.setItem(SAVED_RECIPES_DATA_KEY, JSON.stringify(data));
        });
      }
      return next;
    });
  };

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (typeof capturedImageUri !== 'string' || typeof capturedAt !== 'string') {
      return;
    }

    setSelectedImageUri(capturedImageUri);
    setDetectedIngredients([]);
    setPossibleIngredients([]);
    setUnresolvedItems([]);
    setQualityWarnings([]);
    setEditableIngredients([]);
    setNewIngredient('');
    setHasTriedDetection(false);
    setDetectionFeedback(null);
    setRecipeResults({});
    setShowNutritionFocus(false);
    // Auto-detect as soon as the camera hands back an image
    handleDetectIngredients(capturedImageUri);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capturedAt, capturedImageUri]);

  const resetRecipe = () => {
    setRecipeResults({});
    setShowNutritionFocus(false);
  };

  const resetIngredientFlow = () => {
    setDetectedIngredients([]);
    setPossibleIngredients([]);
    setUnresolvedItems([]);
    setQualityWarnings([]);
    setEditableIngredients([]);
    setNewIngredient('');
    setHasTriedDetection(false);
    setDetectionFeedback(null);
    resetRecipe();
  };

  const resetAppState = () => {
    setSelectedImageUri(null);
    resetIngredientFlow();
  };

  const showTryAgainAlert = (title: string, message: string, onRetry?: () => void) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      ...(onRetry ? [{ text: 'Try Again', onPress: onRetry }] : []),
    ]);
  };

  const handleVibePress = (vibe: Vibe) => {
    if (selectedVibe === vibe) {
      setSelectedVibe(null);
      resetIngredientFlow();
      return;
    }
    setSelectedVibe(vibe);
    // If ingredients already exist (scanned or typed), keep them — just regenerate recipe
    if (hasTriedDetection || editableIngredients.length > 0) {
      resetRecipe();
    } else {
      resetIngredientFlow();
      if (selectedImageUri) {
        handleDetectIngredients(selectedImageUri, vibe, selectedDiet);
      }
    }
  };

  const handleDietPress = (diet: Diet) => {
    setSelectedDiet(diet);
  };

  const handleUploadPhoto = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        'Photo access needed',
        'Please allow photo access so you can choose grocery images.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.95,
      selectionLimit: 1,
    });

    if (result.canceled) {
      return;
    }

    const imageUri = result.assets[0].uri;
    setSelectedImageUri(imageUri);
    resetIngredientFlow();
    handleDetectIngredients(imageUri);
  };

  const handleTakePhoto = async () => {
    if (!selectedVibe) {
      Alert.alert(
        'Choose a vibe first',
        'Pick a vibe before opening the smart camera so live ingredient preview can help you.',
      );
      return;
    }

    const cameraRoute = {
      pathname: '/camera',
      params: { goal: selectedVibe },
    } as unknown as Href;

    router.push(cameraRoute);
  };

  const handleDetectIngredients = async (autoUri?: string, vibeOverride?: Vibe, dietOverride?: Diet) => {
    const uri = autoUri ?? selectedImageUri;
    const vibe = vibeOverride ?? selectedVibe;
    const diet = dietOverride ?? selectedDiet;

    if (!uri) return;

    if (!vibe) {
      setDetectionFeedback('Pick a vibe above to personalise your results.');
      return;
    }

    setIsWorking(true);
    setIsDetecting(true);
    setDetectedIngredients([]);
    setPossibleIngredients([]);
    setUnresolvedItems([]);
    setQualityWarnings([]);
    setEditableIngredients([]);
    setNewIngredient('');
    setHasTriedDetection(true);
    setDetectionFeedback(null);
    resetRecipe();

    try {
      const imageDataUrl = await localImageToDataUrl(uri);
      const headers = await getFunctionHeaders();

      const response = await fetch(DETECT_INGREDIENTS_FUNCTION_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          imageUri: imageDataUrl,
          goal: `${vibe}${diet !== 'No Preference' ? ` (${diet})` : ''}`,
          mode: 'detect',
        }),
      });

      if (!response.ok) {
        const errorBody = await readErrorBody(response);
        console.log('Ingredient detection backend error:', errorBody);
        throw new Error(getBackendErrorMessage(errorBody));
      }

      const data = await response.json();

      if (!isDetectionResult(data)) {
        throw new Error('Invalid detection response');
      }

      const confirmed = data.confirmedIngredients;
      const possible = data.possibleIngredients;
      const likelyPossible = possible.filter(
        (ingredient) => ingredient.confidence >= AUTO_ADD_POSSIBLE_CONFIDENCE,
      );

      if (confirmed.length === 0 && possible.length === 0) {
        setUnresolvedItems(data.unresolvedItems);
        setQualityWarnings(data.qualityWarnings);
        setDetectionFeedback(
          'I could not confidently identify enough items from that photo. You can retake it or add ingredients manually below.',
        );
        return;
      }

      setDetectedIngredients(confirmed);
      setPossibleIngredients(possible);
      setUnresolvedItems(data.unresolvedItems);
      setQualityWarnings(data.qualityWarnings);
      setEditableIngredients(mergeIngredientNames([...confirmed, ...likelyPossible]));
      setDetectionFeedback(
        confirmed.length + likelyPossible.length < 3
          ? 'I found a few matches. Check the possible items and unresolved packaged foods below to fill gaps.'
          : likelyPossible.length > 0
            ? 'I added strong and likely matches. Quickly remove anything that looks wrong before generating a meal.'
            : null,
      );
    } catch (error) {
      console.log('Ingredient detection failed:', error);
      setDetectionFeedback(getDetectionFailureMessage(error));
    } finally {
      setIsWorking(false);
      setIsDetecting(false);
    }
  };

  const handleRemoveIngredient = (ingredientToRemove: string) => {
    setEditableIngredients((currentIngredients) =>
      currentIngredients.filter((ingredient) => ingredient !== ingredientToRemove),
    );
    resetRecipe();
  };

  const handleAddIngredient = () => {
    const trimmedIngredient = newIngredient.trim();

    if (!trimmedIngredient) {
      Alert.alert('Ingredient missing', 'Type an ingredient before adding it.');
      return;
    }

    const alreadyExists = editableIngredients.some(
      (ingredient) => ingredient.toLowerCase() === trimmedIngredient.toLowerCase(),
    );

    if (alreadyExists) {
      Alert.alert('Already added', 'That ingredient is already in your list.');
      return;
    }

    setEditableIngredients((currentIngredients) => [...currentIngredients, toTitleCase(trimmedIngredient)]);
    setNewIngredient('');
    resetRecipe();
  };

  const handleAddSuggestedIngredient = (ingredientToAdd: Ingredient) => {
    const alreadyExists = editableIngredients.some(
      (ingredient) => ingredient.toLowerCase() === ingredientToAdd.name.toLowerCase(),
    );

    if (alreadyExists) {
      return;
    }

    setEditableIngredients((currentIngredients) => [...currentIngredients, toTitleCase(ingredientToAdd.name)]);
    resetRecipe();
  };

  const handleGenerateFinalMeal = async () => {
    if (!selectedVibe) {
      Alert.alert('Vibe required', 'Please pick a vibe before generating a recipe.');
      return;
    }

    if (editableIngredients.length === 0) {
      Alert.alert('Ingredients required', 'Please keep or add at least one ingredient.');
      return;
    }

    setIsWorking(true);
    setIsGenerating(true);
    setRecipeResults({});
    setShowNutritionFocus(false);

    try {
      const [rawBasket, rawStaples, rawProfile, rawShoppingList, headers] = await Promise.all([
        AsyncStorage.getItem(PANTRY_BASKET_KEY),
        AsyncStorage.getItem(PANTRY_STAPLES_KEY),
        AsyncStorage.getItem(USER_PROFILE_KEY),
        AsyncStorage.getItem(SHOPPING_LIST_KEY),
        getFunctionHeaders(),
      ]);

      const pantryBasket: string[] = rawBasket ? JSON.parse(rawBasket) : [];
      const pantryStaples: string[] = rawStaples ? JSON.parse(rawStaples) : [];
      const allPantryItems = [...pantryBasket, ...pantryStaples];
      const pantryContext = allPantryItems.length > 0
        ? ` Pantry also has: ${allPantryItems.join(', ')}.`
        : '';

      const userProfile: UserProfile | null = rawProfile ? JSON.parse(rawProfile) : null;
      const profileContext = userProfile?.onboardingComplete
        ? ` User profile: ${buildProfilePrompt(userProfile)}.`
        : '';

      type RawShoppingItem = { name: string; bought: boolean };
      const shoppingList: RawShoppingItem[] = rawShoppingList ? JSON.parse(rawShoppingList) : [];
      const toBuyNames = shoppingList.filter((i) => !i.bought).map((i) => i.name);
      const shoppingContext = toBuyNames.length > 0
        ? ` User is also planning to buy: ${toBuyNames.join(', ')}.`
        : '';

      const generateOne = async (diet: Diet, _index: number): Promise<{ diet: Diet; recipe: RecipeResult }> => {
        const goal = [
          `Vibe: ${selectedVibe}.`,
          diet !== 'No Preference' ? `Nutrition focus: ${diet}.` : '',
          DIVERSITY_NOTE,
          pantryContext,
          shoppingContext,
          profileContext,
        ].filter(Boolean).join(' ');
        const response = await fetch(GENERATE_FINAL_MEAL_FUNCTION_URL, {
          method: 'POST',
          headers,
          body: JSON.stringify({ ingredients: editableIngredients, goal }),
        });
        if (!response.ok) {
          const errorBody = await readErrorBody(response);
          throw new Error(getBackendErrorMessage(errorBody));
        }
        const data = await response.json();
        if (!isRecipeResult(data)) throw new Error('Missing recipe data');
        return { diet, recipe: data as RecipeResult };
      };

      // Stagger requests 400 ms apart so they don't all hit OpenAI simultaneously
      const settled = await Promise.allSettled(
        DIETS.map((diet, index) =>
          new Promise<{ diet: Diet; recipe: RecipeResult }>((resolve, reject) =>
            setTimeout(() => generateOne(diet, index).then(resolve, reject), index * 400)
          )
        ),
      );

      const results: Partial<Record<Diet, RecipeResult>> = {};
      const failedDiets: Array<{ diet: Diet }> = [];

      for (const [i, result] of settled.entries()) {
        if (result.status === 'fulfilled') {
          results[result.value.diet] = result.value.recipe;
        } else {
          failedDiets.push({ diet: DIETS[i] });
        }
      }

      // Retry failed diets sequentially with a 1 s gap each
      for (const { diet } of failedDiets) {
        try {
          await new Promise(r => setTimeout(r, 1000));
          const { recipe } = await generateOne(diet, 0);
          results[diet] = recipe;
        } catch {
          // Leave that diet blank — fallback message shown in UI
        }
      }

      if (Object.keys(results).length === 0) {
        throw new Error('All meal generations failed');
      }

      setRecipeResults(results);
      setSelectedDiet(DIETS.find(d => results[d]) ?? 'No Preference');
      setShowNutritionFocus(true);
    } catch (error) {
      console.log('Final meal generation failed:', error);
      showTryAgainAlert(
        'Could not generate recipe',
        getRecipeFailureMessage(error),
        handleGenerateFinalMeal,
      );
    } finally {
      setIsWorking(false);
      setIsGenerating(false);
    }
  };

  const handleSaveRecipe = async () => {
    const currentRecipe = recipeResults[selectedDiet];
    if (!currentRecipe || !user || !supabase) {
      return;
    }

    try {
      const { error } = await supabase.from('recipes').insert({
        user_id: user.id,
        title: currentRecipe.title,
        description: currentRecipe.description,
        ingredients: currentRecipe.ingredients,
        steps: currentRecipe.steps,
        time_minutes: currentRecipe.timeMinutes,
      });

      if (error) {
        throw error;
      }

      Alert.alert('Recipe saved', 'Your recipe is now available in the Saved tab.');
    } catch (error) {
      console.log('Failed to save recipe:', error);
      showTryAgainAlert(
        'Could not save recipe',
        'Please try saving again.',
        handleSaveRecipe,
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StatusBar style="light" backgroundColor={INK} />
      <View style={[styles.hero, { paddingTop: TOP_INSET + 22 }]}>
        <Text style={styles.eyebrow}>So Chef...</Text>
        <Text style={styles.title}>What's in the kitchen?</Text>
      </View>
      <ScrollView
        ref={scrollRef}
        style={styles.screen}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScroll={(e) => { scrollYRef.current = e.nativeEvent.contentOffset.y; }}
        scrollEventThrottle={16}>
        <View style={styles.content}>
          <View style={styles.vibeSectionHeader}>
            <Ionicons name="color-palette-outline" size={14} color={BRAND_ORANGE} />
            <Text style={styles.sectionTitle}>Pick a Vibe</Text>
            <View style={styles.sectionDividerLine} />
            <TouchableOpacity onPress={() => setShowVibeInfo(true)} style={styles.infoIconButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="information-circle-outline" size={18} color={MUTED} />
            </TouchableOpacity>
          </View>
          <View style={styles.vibeRow}>
            {VIBES.map((vibe) => {
              const isSelected = selectedVibe === vibe;
              const details = VIBE_DETAILS[vibe];
              return (
                <TouchableOpacity
                  key={vibe}
                  style={[
                    styles.vibeChip,
                    {
                      backgroundColor: isSelected ? details.accent : details.bg,
                      borderColor: details.accent,
                    },
                  ]}
                  onPress={() => handleVibePress(vibe)}
                  activeOpacity={0.85}
                  disabled={isWorking}>
                  <Ionicons name={details.icon} size={17} color={isSelected ? details.bg : details.accent} />
                  <Text style={[styles.vibeChipLabel, { color: isSelected ? details.bg : details.accent }]}>{vibe}</Text>
                  <Text style={[styles.vibeChipTime, { color: isSelected ? details.bg : details.accent }]}>{details.eyebrow}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {!(isDetecting || hasTriedDetection || editableIngredients.length > 0) ? (
            <>
              <View style={styles.vibeSectionHeader}>
                <Ionicons name="camera-outline" size={14} color={BRAND_ORANGE} />
                <Text style={styles.sectionTitle}>Add a Photo</Text>
                <View style={styles.sectionDividerLine} />
              </View>
              <View style={styles.photoActionRow}>
                <View style={styles.photoActionButton}>
                  <Button
                    title="Upload Photo"
                    onPress={handleUploadPhoto}
                    disabled={isWorking}
                    variant="secondary"
                    icon="image-outline"
                  />
                </View>
                <View style={styles.photoActionButton}>
                  <Button title="Take Photo" onPress={handleTakePhoto} disabled={isWorking} icon="camera-outline" />
                </View>
              </View>

              {selectedImageUri ? (
                <View style={styles.previewFrame}>
                  <Image source={{ uri: selectedImageUri }} style={styles.previewImage} />
                  <View style={styles.previewBadge}>
                    <Ionicons name="checkmark-circle" size={15} color={SAGE} />
                    <Text style={styles.previewBadgeText}>Photo ready</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.redoButton}
                    onPress={() => {
                      setSelectedImageUri(null);
                      resetIngredientFlow();
                    }}
                    activeOpacity={0.85}
                    disabled={isWorking}>
                    <Ionicons name="refresh-outline" size={17} color={SURFACE} />
                  </TouchableOpacity>
                </View>
              ) : (
                <Card style={styles.placeholderBox}>
                  <View style={styles.placeholderIcon}>
                    <Ionicons name="camera-outline" size={30} color={BRAND_ORANGE} />
                  </View>
                  <Text style={styles.placeholderTitle}>No photo selected</Text>
                  <Text style={styles.helperText}>
                    Upload a grocery photo to start detecting ingredients.
                  </Text>
                  <Text style={styles.placeholderHint}>
                    Spread items out, labels facing up, bright lighting. One photo does it.
                  </Text>
                </Card>
              )}
            </>
          ) : null}

          {isDetecting ? (
            <View style={styles.detectingCard}>
              {/* Row 1: A[i]Sous */}
              <View style={styles.detectingWordmarkRow}>
                <Text style={styles.detectingBrandText}>A</Text>
                <View style={styles.detectingISlot}>
                  <Animated.View style={[styles.detectingChefHat, { transform: [{ translateY: hatTranslateY }, { rotate: hatRotate }] }]}>
                    <View style={[styles.detectingHatPuff, styles.detectingHatPuffLeft]} />
                    <View style={[styles.detectingHatPuff, styles.detectingHatPuffCenter]} />
                    <View style={[styles.detectingHatPuff, styles.detectingHatPuffRight]} />
                    <View style={styles.detectingHatBand} />
                  </Animated.View>
                  <View style={styles.detectingIStem} />
                </View>
                <Text style={styles.detectingBrandText}> Sous</Text>
              </View>
              {/* Row 2: Chef */}
              <Text style={[styles.detectingBrandText, styles.detectingSecondLine]}>Chef</Text>
            </View>
          ) : null}

          {!isDetecting && detectionFeedback ? (
            <Card style={styles.feedbackCard}>
              <Text style={styles.feedbackTitle}>Detection Results</Text>
              <Text style={styles.helperText}>{detectionFeedback}</Text>
              <View style={styles.photoActionRow}>
                <View style={styles.photoActionButton}>
                  <Button
                    title="Retake Photo"
                    onPress={handleTakePhoto}
                    disabled={isWorking}
                    variant="secondary"
                    icon="camera-reverse-outline"
                  />
                </View>
                <View style={styles.photoActionButton}>
                  <Button
                    title="Upload Another"
                    onPress={handleUploadPhoto}
                    disabled={isWorking}
                    variant="secondary"
                    icon="images-outline"
                  />
                </View>
              </View>
            </Card>
          ) : null}

          {!isDetecting && (hasTriedDetection || editableIngredients.length > 0) ? (
            <View style={styles.resultsContainer}>
              <View style={styles.reviewSectionHeader}>
                <Ionicons name="checkmark-circle-outline" size={14} color={BRAND_ORANGE} />
                <Text style={styles.sectionTitle}>Review Ingredients</Text>
                <View style={styles.sectionDividerLine} />
                <TouchableOpacity
                  style={styles.retakeButton}
                  onPress={() => {
                    setSelectedImageUri(null);
                    resetIngredientFlow();
                  }}
                  activeOpacity={0.85}
                  disabled={isWorking}>
                  <Ionicons name="refresh-outline" size={13} color={BRAND_ORANGE} />
                  <Text style={styles.retakeButtonText}>Retake Photo</Text>
                </TouchableOpacity>
              </View>

              <Card>
                <View
                  style={styles.reviewIngredientsContainer}
                  onLayout={(e) => {
                    const newHeight = e.nativeEvent.layout.height;
                    if (inputFocusedRef.current && newHeight > ingredientListHeightRef.current && ingredientListHeightRef.current > 0) {
                      const delta = newHeight - ingredientListHeightRef.current;
                      scrollRef.current?.scrollTo({ y: scrollYRef.current + delta, animated: true });
                    }
                    ingredientListHeightRef.current = newHeight;
                  }}>
                  {editableIngredients.length > 0 ? (
                    editableIngredients.map((ingredient) => (
                      <View key={ingredient} style={styles.reviewIngredientChip}>
                        <Text style={styles.reviewIngredientName}>{toTitleCase(ingredient)}</Text>
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => handleRemoveIngredient(ingredient)}
                          activeOpacity={0.85}
                          disabled={isWorking}>
                          <Ionicons name="close" size={8} color={SURFACE} />
                        </TouchableOpacity>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyText}>
                      No ingredients confirmed yet. Add what you can see, or retake the photo for a
                      cleaner shot.
                    </Text>
                  )}
                </View>
              </Card>

              {possibleIngredients.length > 0 ? (
                <Card style={styles.suggestionCard}>
                  <Text style={styles.feedbackTitle}>Possible Items to Check</Text>
                  <Text style={styles.helperText}>
                    Selected ones are already in your review list. Tap any others that belong in
                    the recipe, or remove wrong items above.
                  </Text>
                  <View style={styles.suggestionWrap}>
                    {possibleIngredients.map((ingredient) => {
                      const isAdded = editableIngredients.some(
                        (item) => item.toLowerCase() === ingredient.name.toLowerCase(),
                      );

                      return (
                        <TouchableOpacity
                          key={`possible-${ingredient.name}`}
                          style={[styles.suggestionChip, isAdded && styles.suggestionChipSelected]}
                          onPress={() => handleAddSuggestedIngredient(ingredient)}
                          activeOpacity={0.85}
                          disabled={isWorking || isAdded}>
                          <Text style={styles.suggestionChipText}>{toTitleCase(ingredient.name)}</Text>
                          <View style={styles.chipMetaRow}>
                            {isAdded ? <Ionicons name="checkmark" size={13} color={SAGE} /> : null}
                            <Text style={styles.suggestionChipMeta}>
                              {formatConfidence(ingredient.confidence)}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </Card>
              ) : null}


              <View style={styles.addIngredientBar}>
                <TextInput
                  style={styles.addIngredientInput}
                  placeholder="Add ingredient"
                  placeholderTextColor={MUTED}
                  value={newIngredient}
                  onChangeText={setNewIngredient}
                  editable={!isWorking}
                  onFocus={() => {
                    inputFocusedRef.current = true;
                    scrollRef.current?.scrollTo({ y: scrollYRef.current + 165, animated: true });
                  }}
                  onBlur={() => { inputFocusedRef.current = false; }}
                />
                <TouchableOpacity
                  style={styles.addIngredientBtn}
                  onPress={handleAddIngredient}
                  activeOpacity={0.85}
                  disabled={isWorking}>
                  <Ionicons name="add" size={14} color={SURFACE} />
                </TouchableOpacity>
              </View>

              {isGenerating ? (
                <View style={styles.detectingCard}>
                  <View style={styles.detectingWordmarkRow}>
                    <Text style={styles.detectingBrandText}>A</Text>
                    <View style={styles.detectingISlot}>
                      <Animated.View style={[styles.detectingChefHat, { transform: [{ translateY: hatTranslateY }, { rotate: hatRotate }] }]}>
                        <View style={[styles.detectingHatPuff, styles.detectingHatPuffLeft]} />
                        <View style={[styles.detectingHatPuff, styles.detectingHatPuffCenter]} />
                        <View style={[styles.detectingHatPuff, styles.detectingHatPuffRight]} />
                        <View style={styles.detectingHatBand} />
                      </Animated.View>
                      <View style={styles.detectingIStem} />
                    </View>
                    <Text style={styles.detectingBrandText}> Sous</Text>
                  </View>
                  <Text style={[styles.detectingBrandText, styles.detectingSecondLine]}>Chef</Text>
                </View>
              ) : (
                <Button
                  title="Generate Final Meal"
                  onPress={handleGenerateFinalMeal}
                  disabled={isWorking}
                  icon="flame-outline"
                />
              )}
            </View>
          ) : null}

          {showNutritionFocus ? (
            <View style={styles.dietSection}>
              <View style={styles.vibeSectionHeader}>
                <Ionicons name="pulse-outline" size={14} color={BRAND_ORANGE} />
                <Text style={styles.sectionTitle}>Nutrition Focus</Text>
                <View style={styles.sectionDividerLine} />
                <TouchableOpacity onPress={() => setShowDietInfo(true)} style={styles.infoIconButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="information-circle-outline" size={18} color={MUTED} />
                </TouchableOpacity>
              </View>
              <View style={styles.vibeRow}>
                {DIETS.map((diet) => {
                  const isSelected = selectedDiet === diet;
                  const details = DIET_DETAILS[diet];
                  return (
                    <TouchableOpacity
                      key={diet}
                      style={[
                        styles.vibeChip,
                        { backgroundColor: isSelected ? details.accent : details.bg, borderColor: details.accent },
                      ]}
                      onPress={() => handleDietPress(diet)}
                      activeOpacity={0.85}>
                      <Ionicons name={details.icon} size={17} color={isSelected ? details.bg : details.accent} />
                      <Text style={[styles.vibeChipLabel, { color: isSelected ? details.bg : details.accent }]} numberOfLines={2}>{diet}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}

          {recipeResults[selectedDiet] && user ? (
            <View style={styles.resultsContainer}>
              <Button
                title="Save Recipe"
                onPress={handleSaveRecipe}
                variant="success"
                disabled={isWorking}
                icon="bookmark-outline"
              />
            </View>
          ) : null}

          {showNutritionFocus && !recipeResults[selectedDiet] ? (
            <View style={styles.resultsContainer}>
              <View style={[styles.card, { alignItems: 'center', paddingVertical: 24 }]}>
                <Text style={{ color: MUTED, fontSize: 13, textAlign: 'center' }}>
                  No recipe generated for this focus. Select another option above.
                </Text>
              </View>
            </View>
          ) : null}
          {recipeResults[selectedDiet] ? (
            <View style={styles.resultsContainer}>
              <RecipeCard
                recipe={recipeResults[selectedDiet]!}
                vibe={selectedVibe}
                diet={selectedDiet}
                isFav={favoriteIds.has(recipeResults[selectedDiet]!.title)}
                onToggleFav={() => toggleFavorite(recipeResults[selectedDiet]!.title, recipeResults[selectedDiet]!, selectedDiet)}
              />
            </View>
          ) : null}
        </View>
      </ScrollView>

      <Modal
        visible={showDietInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDietInfo(false)}>
        <TouchableOpacity style={styles.vibeInfoOverlay} activeOpacity={1} onPress={() => setShowDietInfo(false)}>
          <View style={styles.vibeInfoPanel}>
            <Text style={styles.vibeInfoTitle}>Nutrition Focus</Text>
            {DIETS.map((diet) => {
              const details = DIET_DETAILS[diet];
              return (
                <View key={diet} style={styles.vibeInfoRow}>
                  <View style={[styles.vibeInfoIconWrap, { backgroundColor: `${details.accent}22` }]}>
                    <Ionicons name={details.icon} size={16} color={details.accent} />
                  </View>
                  <View style={styles.vibeInfoText}>
                    <Text style={[styles.vibeInfoName, { color: details.accent }]}>{diet}</Text>
                    <Text style={styles.vibeInfoDesc}>{details.description}</Text>
                  </View>
                </View>
              );
            })}
            <TouchableOpacity onPress={() => setShowDietInfo(false)} style={styles.vibeInfoClose}>
              <Text style={styles.vibeInfoCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showVibeInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowVibeInfo(false)}>
        <TouchableOpacity style={styles.vibeInfoOverlay} activeOpacity={1} onPress={() => setShowVibeInfo(false)}>
          <View style={styles.vibeInfoPanel}>
            <Text style={styles.vibeInfoTitle}>Cooking Vibes</Text>
            {VIBES.map((vibe) => {
              const details = VIBE_DETAILS[vibe];
              return (
                <View key={vibe} style={styles.vibeInfoRow}>
                  <View style={[styles.vibeInfoIconWrap, { backgroundColor: `${details.accent}22` }]}>
                    <Ionicons name={details.icon} size={16} color={details.accent} />
                  </View>
                  <View style={styles.vibeInfoText}>
                    <Text style={[styles.vibeInfoName, { color: details.accent }]}>{vibe} · {details.eyebrow}</Text>
                    <Text style={styles.vibeInfoDesc}>{details.description}</Text>
                  </View>
                </View>
              );
            })}
            <TouchableOpacity onPress={() => setShowVibeInfo(false)} style={styles.vibeInfoClose}>
              <Text style={styles.vibeInfoCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

