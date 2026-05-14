import AsyncStorage from '@react-native-async-storage/async-storage';
import { brandType } from '@/constants/brand';
import { personaliseSteps, deriveVibe } from '@/constants/personalise-steps';
import { GET_VIRAL_DISHES_FUNCTION_URL, supabase } from '@/constants/supabase';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { User } from '@supabase/supabase-js';
import { router } from 'expo-router';
import { useUnits } from '@/contexts/me-panel-context';
import { convertText } from '@/utils/units';
import { StatusBar } from 'expo-status-bar';
import { useIsFocused } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
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

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getFirstName(user: { email?: string | null } | null): string | null {
  if (!user?.email) return null;
  const local = user.email.split('@')[0];
  const first = local.split(/[._]/)[0];
  return first.charAt(0).toUpperCase() + first.slice(1);
}

const DAILY_PROMPTS = [
  { icon: 'flask-outline', text: "Got leftovers? Turn them into something worth eating.", color: GOLD, bg: '#FFF3D0', action: 'Remix leftovers', route: '/leftovers-lab' },
  { icon: 'leaf-outline', text: "Try something lighter tonight. Your future self will thank you.", color: '#34A853', bg: '#E8F8EE', action: 'Cook healthy', route: '/(tabs)/ai-souschef' },
  { icon: 'flash-outline', text: "Busy evening? Find a meal ready in under 25 minutes.", color: '#3B82F6', bg: '#EBF3FF', action: 'Quick meals', route: '/(tabs)/ai-souschef' },
  { icon: 'calendar-outline', text: "Plan the week ahead. Less stress, better eating.", color: '#3B82F6', bg: '#EBF3FF', action: 'Plan my week', route: '/(tabs)/calendar' },
  { icon: 'barbell-outline', text: "High protein, big flavour. Scan what's in your fridge.", color: PRIMARY, bg: '#FFE8E2', action: 'Go high protein', route: '/(tabs)/ai-souschef' },
  { icon: 'camera-outline', text: "Scan your groceries and discover tonight's dinner.", color: PRIMARY, bg: '#FFE8E2', action: 'Scan now', route: '/(tabs)/ai-souschef' },
  { icon: 'options-outline', text: "Set your taste preferences for smarter meal suggestions.", color: '#34A853', bg: '#E8F8EE', action: 'Set preferences', route: '/taste-profile' },
];

type MealDetail = {
  id: string;
  title: string;
  description: string;
  goal?: string;
  cuisine?: string;
  timeMinutes: number;
  ingredients: string[];
  steps: string[];
  nutrition: { calories: number; protein: number; carbs: number; fats: number };
  accent: string;
  bg: string;
  createdAt?: string;
  platform?: 'tiktok' | 'instagram';
  views?: string;
};

const PANTRY_RECS: MealDetail[] = [
  {
    id: 'r1',
    title: 'Garlic Lemon Chicken',
    goal: 'High Protein',
    cuisine: 'Mediterranean',
    timeMinutes: 20,
    description: 'Juicy chicken breast with wilted spinach in a bright garlic-lemon pan sauce.',
    ingredients: [
      '300g chicken breast',
      'Handful of spinach',
      '3 garlic cloves, minced',
      '1 lemon, juiced and zested',
      '1 tbsp olive oil',
      'Salt and black pepper',
    ],
    steps: [
      'Season chicken with salt and pepper on both sides.',
      'Heat olive oil in a pan over medium-high heat. Cook chicken 6 min per side until golden.',
      'Remove chicken to rest. Add garlic to pan, cook 1 min.',
      'Add spinach and lemon juice. Stir until wilted.',
      'Slice chicken and serve over spinach with pan juices drizzled over.',
    ],
    nutrition: { calories: 380, protein: 42, carbs: 8, fats: 18 },
    accent: '#FF5C35',
    bg: '#FFE8E2',
  },
  {
    id: 'r2',
    title: 'Pasta Pomodoro',
    goal: 'Quick',
    cuisine: 'Italian',
    timeMinutes: 15,
    description: 'A silky, garlicky tomato sauce tossed with pasta. Simple, fast, and deeply satisfying.',
    ingredients: [
      '200g spaghetti or penne',
      '400g canned chopped tomatoes',
      '3 garlic cloves, sliced',
      '3 tbsp olive oil',
      'Salt and black pepper',
      'Fresh basil to serve',
    ],
    steps: [
      'Boil salted water and cook pasta per package instructions.',
      'Heat oil in a wide pan. Add garlic, cook 2 min until lightly golden.',
      'Add tomatoes, season well, simmer 8 minutes until thickened.',
      'Drain pasta (keep a cup of pasta water). Toss with sauce.',
      'Loosen with pasta water if needed. Top with fresh basil.',
    ],
    nutrition: { calories: 420, protein: 14, carbs: 68, fats: 12 },
    accent: '#FFBA35',
    bg: '#FFF3D0',
  },
  {
    id: 'r3',
    title: 'Broccoli Rice Bowl',
    goal: 'Healthy',
    cuisine: 'Japanese',
    timeMinutes: 25,
    description: 'A wholesome bowl of fluffy rice, roasted broccoli, and a fried egg with soy and sesame.',
    ingredients: [
      '150g white or brown rice',
      '200g broccoli, cut into florets',
      '2 eggs',
      '1 tbsp olive oil',
      '1 tbsp soy sauce',
      '1 tsp sesame oil',
      'Sesame seeds to garnish',
    ],
    steps: [
      'Cook rice per package instructions.',
      'Toss broccoli with olive oil and roast at 200°C for 15 min until crispy at the edges.',
      'Fry eggs to your liking in a little butter.',
      'Assemble: rice base, roasted broccoli, egg on top.',
      'Drizzle with soy sauce and sesame oil. Scatter sesame seeds.',
    ],
    nutrition: { calories: 310, protein: 16, carbs: 52, fats: 7 },
    accent: '#34A853',
    bg: '#E8F8EE',
  },
  {
    id: 'r4',
    title: 'Protein Egg Scramble',
    goal: 'High Protein',
    cuisine: 'American',
    timeMinutes: 10,
    description: 'Creamy, fluffy eggs scrambled with fresh spinach and melted cheddar. The fastest protein hit.',
    ingredients: [
      '3 large eggs',
      'Handful of fresh spinach',
      '30g cheddar, grated',
      '1 tsp butter',
      'Salt and black pepper',
    ],
    steps: [
      'Whisk eggs with a pinch of salt and pepper.',
      'Melt butter in a non-stick pan over low heat.',
      'Pour in eggs and gently fold slowly as they cook.',
      'Just before set, add spinach and cheddar. Fold in.',
      'Remove from heat while slightly soft. Residual heat finishes them. Serve immediately.',
    ],
    nutrition: { calories: 290, protein: 26, carbs: 4, fats: 18 },
    accent: '#FF5C35',
    bg: '#FFE8E2',
  },
  {
    id: 'r5',
    title: 'Black Bean Rice Bowl',
    goal: 'Healthy',
    cuisine: 'Mexican',
    timeMinutes: 20,
    description: 'A hearty plant-based bowl of seasoned black beans over fluffy rice with caramelised onion.',
    ingredients: [
      '150g rice',
      '1 can (400g) black beans, drained',
      '1 onion, diced',
      '2 garlic cloves, minced',
      '1 tsp ground cumin',
      '1 tbsp olive oil',
      'Salt and pepper to taste',
    ],
    steps: [
      'Cook rice per package instructions.',
      'Heat oil in a pan. Fry onion 5 min until soft and golden.',
      'Add garlic and cumin. Cook 1 min until fragrant.',
      'Add black beans, season, and simmer 5 min until warmed through.',
      'Serve beans and sauce over rice.',
    ],
    nutrition: { calories: 380, protein: 18, carbs: 58, fats: 8 },
    accent: '#3B82F6',
    bg: '#EBF3FF',
  },
];

