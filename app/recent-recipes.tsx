import { brandType } from '@/constants/brand';
import { useMePanel } from '@/contexts/me-panel-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, router } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { useUnits } from '@/contexts/me-panel-context';
import { convertText } from '@/utils/units';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
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

type MealDetail = {
  id: string;
  title: string;
  description: string;
  timeMinutes: number;
  ingredients: string[];
  steps: string[];
  nutrition: { calories: number; protein: number; carbs: number; fats: number };
  accent: string;
  bg: string;
  createdAt?: string;
};

const RECENT_RECIPES: MealDetail[] = [
  {
    id: 'm1',
    title: 'Lemon Herb Salmon',
    timeMinutes: 22,
    createdAt: new Date(Date.now() - 1 * 864e5).toISOString(),
    description: 'Flaky salmon fillets pan-seared with fresh lemon, dill, and garlic. Light, fast, and packed with omega-3s.',
    ingredients: [
      '2 salmon fillets (approx. 180g each)',
      '1 lemon, sliced and juiced',
      '2 garlic cloves, minced',
      '1 tbsp olive oil',
      '1 tbsp fresh dill, chopped',
      '1 tbsp butter',
      'Salt and black pepper to taste',
    ],
    steps: [
      'Pat the salmon fillets dry and season generously with salt and pepper.',
      'Heat olive oil and butter in a non-stick skillet over medium-high heat.',
      'Place salmon skin-side up in the pan. Cook for 4 minutes until golden.',
      'Flip the salmon and add minced garlic to the pan. Cook for 3 more minutes.',
      'Add lemon slices and squeeze over the juice. Baste the salmon with pan juices.',
      'Remove from heat, scatter with fresh dill, and serve immediately.',
    ],
    nutrition: { calories: 390, protein: 38, carbs: 6, fats: 22 },
    accent: '#3B82F6',
    bg: '#EBF3FF',
  },
  {
    id: 'm2',
    title: 'Chicken Tikka Masala',
    timeMinutes: 40,
    createdAt: new Date(Date.now() - 2 * 864e5).toISOString(),
    description: 'Tender marinated chicken in a rich, aromatic tomato-cream sauce. A classic that never disappoints.',
    ingredients: [
      '500g chicken breast, diced',
      '1 cup plain yogurt',
      '2 tsp garam masala, divided',
      '1 tsp ground cumin',
      '1 tsp turmeric',
      '1 can (400ml) chopped tomatoes',
      '1 onion, diced',
      '3 garlic cloves, minced',
      '1 tbsp fresh ginger, grated',
      '2 tbsp butter or ghee',
      '100ml single cream',
      'Salt to taste',
      'Fresh coriander to garnish',
    ],
    steps: [
      'Mix chicken with yogurt, 1 tsp garam masala, cumin, and turmeric. Marinate 15 minutes.',
      'Grill or pan-fry the marinated chicken over high heat until lightly charred. Set aside.',
      'Melt butter in a large pan. Fry onion for 5 minutes until soft and golden.',
      'Add garlic and ginger. Cook 2 minutes until fragrant.',
      'Stir in remaining garam masala, then pour in chopped tomatoes. Simmer 10 minutes.',
      'Blend the sauce until smooth if desired. Return to pan.',
      'Add chicken and cream. Simmer gently for 8 minutes until cooked through.',
      'Season with salt, garnish with coriander, and serve with rice or naan.',
    ],
    nutrition: { calories: 480, protein: 44, carbs: 18, fats: 24 },
    accent: '#FF5C35',
    bg: '#FFE8E2',
  },
  {
    id: 'm3',
    title: 'Avocado Toast with Eggs',
    timeMinutes: 12,
    createdAt: new Date(Date.now() - 3 * 864e5).toISOString(),
    description: 'Creamy smashed avocado on crispy sourdough, topped with a perfectly fried egg and a kick of chilli.',
    ingredients: [
      '2 slices sourdough bread',
      '1 ripe avocado',
      '2 eggs',
      '1/2 lemon, juiced',
      'Pinch of chilli flakes',
      'Salt and black pepper',
      '1 tsp olive oil',
      'Fresh herbs to garnish (optional)',
    ],
    steps: [
      'Toast the bread until golden and crisp.',
      'Halve and pit the avocado. Scoop the flesh into a small bowl.',
      'Mash avocado with lemon juice, salt, and pepper until spreadable but still chunky.',
      'Heat olive oil in a small non-stick pan over medium heat. Fry eggs to your liking.',
      'Spread avocado mash generously over each slice of toast.',
      'Top each with a fried egg, a pinch of chilli flakes, and a final crack of salt.',
    ],
    nutrition: { calories: 340, protein: 16, carbs: 28, fats: 22 },
    accent: '#34A853',
    bg: '#E8F8EE',
  },
  {
    id: 'm4',
    title: 'Pasta Arrabiata',
    timeMinutes: 18,
    createdAt: new Date(Date.now() - 5 * 864e5).toISOString(),
    description: 'A fiery Italian classic. Penne in a bold, garlicky tomato sauce with just the right amount of heat.',
    ingredients: [
      '200g penne or rigatoni',
      '400g canned chopped tomatoes',
      '3 garlic cloves, thinly sliced',
      '1 tsp dried chilli flakes',
      '3 tbsp olive oil',
      'Salt to taste',
      'Fresh basil leaves to serve',
      'Grated Parmesan to serve',
    ],
    steps: [
      'Bring a large pot of well-salted water to the boil. Cook pasta per package instructions.',
      'While pasta cooks, heat olive oil in a wide pan over medium heat.',
      'Add sliced garlic and chilli flakes. Cook 2 minutes until golden and fragrant.',
      'Pour in chopped tomatoes. Season with salt and simmer 8 minutes until thickened.',
      'Reserve a cup of pasta water, then drain the pasta.',
      'Toss pasta into the sauce, adding pasta water to loosen.',
      'Serve immediately topped with fresh basil and grated Parmesan.',
    ],
    nutrition: { calories: 420, protein: 14, carbs: 68, fats: 13 },
    accent: '#FFBA35',
    bg: '#FFF3D0',
  },
  {
    id: 'm5',
    title: 'Greek Salad Bowl',
    timeMinutes: 10,
    createdAt: new Date(Date.now() - 7 * 864e5).toISOString(),
    description: 'Crisp vegetables, briny olives, and chunky feta in a punchy oregano dressing. Ready in minutes.',
    ingredients: [
      '200g cucumber, diced',
      '200g cherry tomatoes, halved',
      '1/2 red onion, thinly sliced',
      '100g Kalamata olives',
      '150g feta cheese, cut into chunks',
      '2 tbsp olive oil',
      '1 tbsp red wine vinegar',
      '1 tsp dried oregano',
      'Salt and black pepper',
    ],
    steps: [
      'Combine cucumber, cherry tomatoes, red onion, and olives in a large bowl.',
      'Whisk together olive oil, red wine vinegar, and oregano.',
      'Pour dressing over vegetables and toss gently to combine.',
      'Arrange feta chunks on top — keep them chunky, do not crumble.',
      'Season with salt and pepper. Serve immediately or chill briefly.',
    ],
    nutrition: { calories: 290, protein: 10, carbs: 12, fats: 22 },
    accent: '#7C3AED',
    bg: '#F0EBFF',
  },
];

