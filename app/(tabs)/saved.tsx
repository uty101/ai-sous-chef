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

const CARD_PALETTES = [
  { accent: '#FF5C35', bg: '#FFE8E2' },
  { accent: '#FFBA35', bg: '#FFF3D0' },
  { accent: '#34A853', bg: '#E8F8EE' },
  { accent: '#3B82F6', bg: '#EBF3FF' },
  { accent: '#7C3AED', bg: '#F0EBFF' },
  { accent: '#0F7B6C', bg: '#E0F5F3' },
  { accent: '#D4318A', bg: '#FDE8F4' },
];

// Keyword-based cuisine inference — runs on any recipe missing a specific cuisine.
// Ordered from most-specific to most-generic so narrower patterns win first.
const CUISINE_RULES: Array<{ pattern: RegExp; cuisine: string }> = [
  { pattern: /\bpho\b|banh mi|bun cha|nuoc cham/, cuisine: 'Vietnamese' },
  { pattern: /pad thai|tom yum|green curry|red curry|lemongrass|galangal|kaffir lime|nam pla/, cuisine: 'Thai' },
  { pattern: /kimchi|bulgogi|bibimbap|gochujang|japchae|tteok|doenjang|sundubu/, cuisine: 'Korean' },
  { pattern: /\bmiso\b|ramen|teriyaki|\bsoba\b|\budon\b|tempura|katsu|dashi|mirin|edamame|yakitori|tonkatsu|onigiri/, cuisine: 'Japanese' },
  { pattern: /\bwok\b|fried rice|dim sum|hoisin|oyster sauce|chow mein|szechuan|char siu|wonton/, cuisine: 'Chinese' },
  { pattern: /tikka|masala|biryani|\bdal\b|garam masala|paneer|tandoori|korma|vindaloo|saag|aloo/, cuisine: 'Indian' },
  { pattern: /injera|berbere|doro wat|niter kibbeh/, cuisine: 'Ethiopian' },
  { pattern: /jollof|suya|egusi|plantain|palm oil|fufu|waakye/, cuisine: 'West African' },
  { pattern: /tagine|harissa|ras el hanout|\bcouscous\b|chermoula|bastilla/, cuisine: 'Moroccan' },
  { pattern: /hummus|falafel|shawarma|kibbeh|fattoush|tabbouleh|labneh|\bsumac\b/, cuisine: 'Lebanese' },
  { pattern: /shakshuka|za.atar|msemen/, cuisine: 'Middle Eastern' },
  { pattern: /kebab|\bdoner\b|\bkofta\b|kofte|\bpilav\b|lahmacun|börek|baklava/, cuisine: 'Turkish' },
  { pattern: /souvlaki|moussaka|tzatziki|spanakopita|\bfeta\b|kalamata|gyros|dolmades/, cuisine: 'Greek' },
  { pattern: /ceviche|lomo saltado|aji amarillo/, cuisine: 'Peruvian' },
  { pattern: /feijoada|churrasco|pão de queijo/, cuisine: 'Brazilian' },
  { pattern: /taco|burrito|enchilada|quesadilla|guacamole|jalapeño|chipotle|\btortilla\b|fajita|carnitas|tamale/, cuisine: 'Mexican' },
  { pattern: /paella|\bchorizo\b|gazpacho|tortilla española|albondigas/, cuisine: 'Spanish' },
  { pattern: /crêpe|beurre blanc|coq au vin|ratatouille|bouillabaisse|french onion|dauphinoise|confit/, cuisine: 'French' },
  { pattern: /\bdill\b.*salmon|gravlax|herring|lingonberry|smørrebrød/, cuisine: 'Scandinavian' },
  { pattern: /fish and chips|shepherd.s pie|bangers|yorkshire pudding|scotch egg|full english|bubble and squeak/, cuisine: 'British' },
  { pattern: /penne|pasta|spaghetti|tagliatelle|fettuccine|rigatoni|\bgnocchi\b|\brisotto\b|carbonara|bolognese|arrabbiata|pomodoro|parmigiana|mozzarella|lasagne|ravioli|pesto|focaccia|tiramisu/, cuisine: 'Italian' },
];

function inferCuisine(title: string, description: string, ingredients: string[]): string | undefined {
  const text = `${title} ${description} ${ingredients.join(' ')}`.toLowerCase();
  for (const { pattern, cuisine } of CUISINE_RULES) {
    if (pattern.test(text)) return cuisine;
  }
  return undefined;
}

function recipeColors(id: string): { accent: string; bg: string } {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xffff;
  return CARD_PALETTES[hash % CARD_PALETTES.length];
}

function withColors(recipes: SavedRecipe[]): SavedRecipeCard[] {
  return recipes.map((r) => ({ ...r, ...recipeColors(r.id) }));
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 7)}wk ago`;
}

function groupRecipesByDate(recipes: SavedRecipeCard[]): { label: string; data: SavedRecipeCard[] }[] {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const groups: { label: string; data: SavedRecipeCard[] }[] = [
    { label: 'This Week', data: [] },
    { label: 'This Month', data: [] },
    { label: 'Last Month', data: [] },
    { label: 'Older', data: [] },
  ];

  for (const r of recipes) {
    const d = new Date(r.createdAt);
    if (d >= sevenDaysAgo) {
      groups[0].data.push(r);
    } else if (d >= thisMonthStart) {
      groups[1].data.push(r);
    } else if (d >= lastMonthStart) {
      groups[2].data.push(r);
    } else {
      groups[3].data.push(r);
    }
  }

  return groups.filter((g) => g.data.length > 0);
}

