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

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const MOCK_PANTRY = [
  'Eggs', 'Rice', 'Garlic', 'Spinach', 'Pasta',
  'Tomatoes', 'Chicken', 'Soy sauce', 'Greek yogurt',
  'Lemon', 'Chickpeas', 'Tofu', 'Onion', 'Olive oil',
];

// Full recipe detail for each mock history meal
const MOCK_RECIPE_DETAILS: Record<string, Omit<RecipeDetail, 'id' | 'createdAt'>> = {
  'Garlic Lemon Chicken': {
    title: 'Garlic Lemon Chicken',
    timeMinutes: 22,
    description: 'Juicy chicken breast with wilted spinach in a bright garlic-lemon pan sauce.',
    ingredients: ['300g chicken breast', 'Handful of spinach', '3 garlic cloves, minced', '1 lemon, juiced and zested', '1 tbsp olive oil', 'Salt and black pepper'],
    steps: ['Season chicken with salt and pepper on both sides.', 'Heat olive oil in a pan over medium-high heat. Cook chicken 6 min per side until golden.', 'Remove chicken to rest. Add garlic to pan, cook 1 min.', 'Add spinach and lemon juice. Stir until wilted.', 'Slice chicken and serve over spinach with pan juices drizzled over.'],
    nutrition: { calories: 380, protein: 42, carbs: 6, fats: 18 },
  },
  'Broccoli Rice Bowl': {
    title: 'Broccoli Rice Bowl',
    timeMinutes: 25,
    description: 'A wholesome bowl of fluffy rice, roasted broccoli, and a fried egg with soy and sesame.',
    ingredients: ['150g white or brown rice', '200g broccoli, cut into florets', '2 eggs', '1 tbsp olive oil', '1 tbsp soy sauce', '1 tsp sesame oil', 'Sesame seeds to garnish'],
    steps: ['Cook rice per package instructions.', 'Toss broccoli with olive oil and roast at 200°C for 15 min until crispy at the edges.', 'Fry eggs to your liking in a little butter.', 'Assemble: rice base, roasted broccoli, egg on top.', 'Drizzle with soy sauce and sesame oil. Scatter sesame seeds.'],
    nutrition: { calories: 420, protein: 16, carbs: 58, fats: 14 },
  },
  'Tofu Noodle Stir Fry': {
    title: 'Tofu Noodle Stir Fry',
    timeMinutes: 20,
    description: 'Crispy tofu and tender noodles tossed in a punchy soy-garlic sauce.',
    ingredients: ['200g firm tofu, cubed', '200g noodles (egg or rice)', '2 garlic cloves, sliced', '2 tbsp soy sauce', '1 tsp sesame oil', '1 tbsp vegetable oil', '1 tsp chilli flakes', 'Spring onions to serve'],
    steps: ['Press tofu dry with a cloth, then cube it.', 'Cook noodles per package instructions. Drain and set aside.', 'Heat oil in a wok over high heat. Fry tofu 4–5 min until golden on all sides. Remove.', 'Add garlic to the wok. Cook 1 min.', 'Add noodles, soy sauce, and sesame oil. Toss well.', 'Return tofu, add chilli flakes, toss everything together. Top with spring onions.'],
    nutrition: { calories: 460, protein: 22, carbs: 52, fats: 16 },
  },
  'Pasta Arrabiata': {
    title: 'Pasta Arrabiata',
    timeMinutes: 18,
    description: 'A fiery Italian classic. Penne in a bold, garlicky tomato sauce with just the right amount of heat.',
    ingredients: ['200g penne or rigatoni', '400g canned chopped tomatoes', '3 garlic cloves, thinly sliced', '1 tsp dried chilli flakes', '3 tbsp olive oil', 'Salt to taste', 'Fresh basil leaves to serve'],
    steps: ['Bring a large pot of well-salted water to the boil. Cook pasta per package instructions.', 'While pasta cooks, heat olive oil in a wide pan over medium heat.', 'Add sliced garlic and chilli flakes. Cook 2 min until golden and fragrant.', 'Pour in chopped tomatoes. Season with salt and simmer 8 minutes until thickened.', 'Reserve a cup of pasta water, then drain the pasta.', 'Toss pasta into the sauce, adding pasta water to loosen. Top with fresh basil.'],
    nutrition: { calories: 490, protein: 14, carbs: 72, fats: 16 },
  },
  'Protein Egg Scramble': {
    title: 'Protein Egg Scramble',
    timeMinutes: 10,
    description: 'Creamy, fluffy eggs scrambled with fresh spinach and melted cheddar. The fastest protein hit.',
    ingredients: ['3 large eggs', 'Handful of fresh spinach', '30g cheddar, grated', '1 tsp butter', 'Salt and black pepper'],
    steps: ['Whisk eggs with a pinch of salt and pepper.', 'Melt butter in a non-stick pan over low heat.', 'Pour in eggs and gently fold slowly as they cook.', 'Just before set, add spinach and cheddar. Fold in.', 'Remove from heat while slightly soft. Residual heat finishes them. Serve immediately.'],
    nutrition: { calories: 310, protein: 24, carbs: 2, fats: 22 },
  },
  'Lemon Chickpea Bowls': {
    title: 'Lemon Chickpea Bowls',
    timeMinutes: 25,
    description: 'Warmly spiced chickpeas and wilted spinach in a bright lemon-garlic dressing.',
    ingredients: ['1 x 400g tin chickpeas, drained', 'Handful of fresh spinach', '2 garlic cloves, minced', '1 lemon, juiced and zested', '2 tbsp olive oil', '1 tsp ground cumin', 'Salt and black pepper', 'Fresh parsley to serve'],
    steps: ['Heat olive oil in a pan over medium heat.', 'Add garlic and cumin. Cook 1 min until fragrant.', 'Add chickpeas. Toss well and cook 5 min until lightly golden.', 'Add spinach and lemon juice. Stir until wilted.', 'Season with salt and pepper. Finish with lemon zest and parsley.'],
    nutrition: { calories: 350, protein: 15, carbs: 40, fats: 14 },
  },
  'Loaded Tortilla Skillet': {
    title: 'Loaded Tortilla Skillet',
    timeMinutes: 30,
    description: 'Eggs baked over a spiced tomato and onion base with crispy tortilla strips.',
    ingredients: ['4 eggs', '1 white onion, sliced', '2 tomatoes, chopped', '2 flour tortillas, cut into strips', '1 tbsp olive oil', '1 tsp smoked paprika', '1 tsp ground cumin', 'Salt and chilli flakes', 'Fresh coriander and 1 lime to serve'],
    steps: ['Heat olive oil in a pan. Fry tortilla strips until crispy. Remove and set aside.', 'Cook onion in the same pan over medium heat for 5 min until soft.', 'Add tomatoes, paprika, and cumin. Cook 5 min until pulpy.', 'Make four wells. Crack an egg into each. Cover and cook on low 4–5 min until whites are just set.', 'Top with tortilla strips, coriander, and a squeeze of lime.'],
    nutrition: { calories: 410, protein: 20, carbs: 38, fats: 20 },
  },
  'Greek Yogurt Bowl': {
    title: 'Greek Yogurt Bowl',
    timeMinutes: 10,
    description: 'Thick Greek yogurt with cucumber, garlic, and lemon. A clean, refreshing bowl.',
    ingredients: ['250g full-fat Greek yogurt', '1 small cucumber, grated and squeezed dry', '1 garlic clove, minced', '1 lemon, juiced', '1 tbsp olive oil', '1 tbsp fresh dill or mint, chopped', 'Salt and black pepper', 'Warm pitta to serve'],
    steps: ['Combine Greek yogurt, grated cucumber, garlic, and lemon juice in a bowl.', 'Mix well. Season with salt and pepper.', 'Drizzle with olive oil and top with fresh dill or mint.', 'Serve immediately with warm pitta.'],
    nutrition: { calories: 230, protein: 18, carbs: 14, fats: 12 },
  },
  'Black Bean Rice Bowl': {
    title: 'Black Bean Rice Bowl',
    timeMinutes: 20,
    description: 'Seasoned black beans and fluffy rice with cumin, smoked paprika, and a squeeze of lime.',
    ingredients: ['150g long-grain rice', '1 x 400g tin black beans, drained', '1 onion, diced', '2 garlic cloves, minced', '1 tbsp olive oil', '1 tsp ground cumin', '1 tsp smoked paprika', '1 lime, juiced', 'Fresh coriander to serve', 'Salt to taste'],
    steps: ['Cook rice per package instructions.', 'Heat olive oil in a pan. Cook onion 5 min until soft.', 'Add garlic, cumin, and paprika. Cook 1 min.', 'Add black beans with a splash of water. Cook 5 min.', 'Season with salt and lime juice. Serve over rice topped with coriander.'],
    nutrition: { calories: 450, protein: 16, carbs: 80, fats: 8 },
  },
  'Chicken Tikka Masala': {
    title: 'Chicken Tikka Masala',
    timeMinutes: 40,
    description: 'Tender chicken in a rich tomato and cream sauce. A British-Indian classic that never fails.',
    ingredients: ['400g chicken breast, cubed', '1 onion, finely chopped', '3 garlic cloves, minced', '150g Greek yogurt', '400g canned chopped tomatoes', '100ml double cream', '1 tbsp vegetable oil', '2 tsp garam masala', '1 tsp turmeric', '1 tsp cumin', '1 tsp paprika', 'Salt to taste', 'Fresh coriander to serve'],
    steps: ['Marinate chicken in yogurt, half the spices, and a pinch of salt for 10 min.', 'Heat oil in a wide pan. Cook onion 8 min until golden.', 'Add garlic and remaining spices. Cook 2 min.', 'Add marinated chicken. Cook on high heat 5 min, turning.', 'Pour in chopped tomatoes. Simmer 15 min.', 'Stir in cream. Simmer 5 more min. Top with coriander.'],
    nutrition: { calories: 490, protein: 40, carbs: 20, fats: 24 },
  },
  'Pasta Pomodoro': {
    title: 'Pasta Pomodoro',
    timeMinutes: 15,
    description: 'The simplest Italian pasta. Ripe tomatoes, good olive oil, and fresh basil. Nothing more needed.',
    ingredients: ['200g spaghetti or penne', '400g chopped tomatoes (fresh or canned)', '3 garlic cloves, sliced', '4 tbsp olive oil', 'Handful of fresh basil', 'Salt and black pepper'],
    steps: ['Cook pasta in well-salted boiling water per package instructions.', 'Heat olive oil in a wide pan over medium heat.', 'Add garlic. Cook gently 2–3 min until golden.', 'Add tomatoes. Season and simmer 10 min until thickened.', 'Reserve a cup of pasta water, then drain the pasta.', 'Toss pasta into the sauce with a splash of pasta water. Top with fresh basil.'],
    nutrition: { calories: 420, protein: 12, carbs: 68, fats: 14 },
  },
  'Avocado Toast & Eggs': {
    title: 'Avocado Toast & Eggs',
    timeMinutes: 12,
    description: 'Creamy smashed avocado on crispy toast with a perfectly fried egg. Fast, fresh, and filling.',
    ingredients: ['2 thick slices sourdough bread', '1 ripe avocado', '2 eggs', '1 lemon, juiced', 'Salt, black pepper, and chilli flakes', '1 tsp butter'],
    steps: ['Toast the bread until golden and crisp.', 'Scoop avocado flesh into a bowl. Mash with lemon juice, salt, and pepper.', 'Melt butter in a non-stick pan over medium heat. Fry eggs to your liking.', 'Spread avocado generously over the toast.', 'Top with egg and a pinch of chilli flakes.'],
    nutrition: { calories: 390, protein: 18, carbs: 30, fats: 24 },
  },
};

const MEAL_POOL: PlannedMeal[] = [
  { id: 'p1',  title: 'Lemon Chickpea Bowls',    cuisine: 'Mediterranean', timeMinutes: 25, goal: 'Healthy',      accent: GREEN,        bg: '#E8F8EE', uses: ['Chickpeas', 'Lemon', 'Garlic', 'Spinach'] },
  { id: 'p2',  title: 'Tofu Noodle Stir Fry',    cuisine: 'East Asian',    timeMinutes: 20, goal: 'Quick',        accent: BRAND_ORANGE, bg: '#FFE8E2', uses: ['Tofu', 'Soy sauce', 'Garlic'] },
  { id: 'p3',  title: 'Garlic Lemon Chicken',     cuisine: 'European',      timeMinutes: 22, goal: 'Protein',      accent: BRAND_ORANGE, bg: '#FFE8E2', uses: ['Chicken', 'Garlic', 'Lemon', 'Spinach'] },
  { id: 'p4',  title: 'Loaded Tortilla Skillet',  cuisine: 'Mexican',       timeMinutes: 30, goal: 'Quick',        accent: GOLD,         bg: '#FFF3D0', uses: ['Eggs', 'Onion', 'Tomatoes'] },
  { id: 'p5',  title: 'Greek Yogurt Bowl',         cuisine: 'Mediterranean', timeMinutes: 10, goal: 'Healthy',      accent: GREEN,        bg: '#E8F8EE', uses: ['Greek yogurt', 'Lemon', 'Garlic'] },
  { id: 'p6',  title: 'Protein Egg Scramble',     cuisine: 'Any',           timeMinutes: 10, goal: 'Protein', accent: BRAND_ORANGE, bg: '#FFE8E2', uses: ['Eggs', 'Spinach', 'Garlic'] },
  { id: 'p7',  title: 'Black Bean Rice Bowl',      cuisine: 'Mexican',       timeMinutes: 20, goal: 'Healthy',      accent: BLUE,         bg: '#EBF3FF', uses: ['Rice', 'Onion', 'Garlic'] },
  { id: 'p8',  title: 'Pasta Arrabiata',           cuisine: 'Italian',       timeMinutes: 18, goal: 'Quick',        accent: GOLD,         bg: '#FFF3D0', uses: ['Pasta', 'Tomatoes', 'Garlic', 'Olive oil'] },
  { id: 'p9',  title: 'Broccoli Rice Bowl',        cuisine: 'Asian',         timeMinutes: 25, goal: 'Healthy',      accent: GREEN,        bg: '#E8F8EE', uses: ['Rice', 'Eggs', 'Soy sauce'] },
  { id: 'p10', title: 'Chicken Tikka Masala',      cuisine: 'Indian',        timeMinutes: 40, goal: 'Protein', accent: BRAND_ORANGE, bg: '#FFE8E2', uses: ['Chicken', 'Onion', 'Garlic', 'Greek yogurt'] },
  { id: 'p11', title: 'Pasta Pomodoro',            cuisine: 'Italian',       timeMinutes: 15, goal: 'Quick',        accent: GOLD,         bg: '#FFF3D0', uses: ['Pasta', 'Tomatoes', 'Garlic', 'Olive oil'] },
  { id: 'p12', title: 'Avocado Toast & Eggs',      cuisine: 'Any',           timeMinutes: 12, goal: 'Healthy',      accent: GREEN,        bg: '#E8F8EE', uses: ['Eggs', 'Lemon'] },
];

const MEAL_ELEVATIONS: Record<string, ElevationHint[]> = {
  'Lemon Chickpea Bowls': [
    { ingredient: 'Feta',       label: 'Gourmet',       result: 'Greek Chickpea Bowl',       note: 'Crumbled feta adds salty creaminess and makes this fully Mediterranean.',           accent: BLUE,         bg: '#EBF3FF' },
    { ingredient: 'Chicken',    label: 'Protein',  result: 'Chickpea Chicken Bowl',      note: 'Grilled chicken alongside the chickpeas doubles the protein in minutes.',            accent: BRAND_ORANGE, bg: '#FFE8E2' },
    { ingredient: 'Tahini',     label: 'Flavour',result: 'Levantine Chickpea Bowl',   note: 'A tahini drizzle transforms the dressing into a nutty, restaurant-quality sauce.',   accent: GOLD,         bg: '#FFF3D0' },
  ],
  'Tofu Noodle Stir Fry': [
    { ingredient: 'Egg',          label: 'Quick', result: 'Egg Fried Noodles',        note: 'Crack two eggs into the wok and you have a classic egg-fried noodle in seconds.',     accent: GOLD,         bg: '#FFF3D0' },
    { ingredient: 'Peanut butter',label: 'New',   result: 'Peanut Satay Noodles',     note: 'A spoonful with soy and lime creates a rich Thai-style satay sauce.',                 accent: BRAND_ORANGE, bg: '#FFE8E2' },
    { ingredient: 'Broccoli',     label: 'Veg',     result: 'Tofu Broccoli Noodles',    note: 'Blanched broccoli florets bulk this up and add colour and nutrients.',                accent: GREEN,        bg: '#E8F8EE' },
  ],
  'Garlic Lemon Chicken': [
    { ingredient: 'Capers',       label: 'Gourmet',       result: 'Chicken Piccata',          note: 'A handful of capers in the pan sauce and you have a classic Italian piccata.',        accent: GOLD,         bg: '#FFF3D0' },
    { ingredient: 'Double cream', label: 'Comfort',  result: 'Creamy Garlic Chicken',    note: 'A splash of cream turns the pan sauce into something deeply indulgent.',              accent: BLUE,         bg: '#EBF3FF' },
    { ingredient: 'Chilli flakes',label: 'Heat',    result: 'Spicy Lemon Chicken',      note: 'A pinch of chilli flakes adds a fiery kick that lifts the whole dish.',               accent: BRAND_ORANGE, bg: '#FFE8E2' },
  ],
  'Loaded Tortilla Skillet': [
    { ingredient: 'Avocado',     label: 'Fresh', result: 'Huevos Rancheros',         note: 'Sliced avocado on top makes this a proper Mexican brunch classic.',                   accent: GREEN,        bg: '#E8F8EE' },
    { ingredient: 'Black beans', label: 'Hearty',  result: 'Bean & Egg Skillet',       note: 'Canned black beans add plant protein and turn this into a full dinner.',              accent: BRAND_ORANGE, bg: '#FFE8E2' },
    { ingredient: 'Cheddar',     label: 'Comfort',result: 'Cheesy Tortilla Bake',     note: 'Grated cheddar melted over the top makes this incredibly satisfying.',                accent: GOLD,         bg: '#FFF3D0' },
  ],
  'Greek Yogurt Bowl': [
    { ingredient: 'Honey',      label: 'Sweet',   result: 'Honey Yogurt Parfait',     note: 'A drizzle of honey and some granola turns this into a proper breakfast parfait.',     accent: GOLD,         bg: '#FFF3D0' },
    { ingredient: 'Berries',    label: 'Antioxidant',result: 'Berry Yogurt Bowl',       note: 'Fresh or frozen berries add colour and sweetness with no extra effort.',              accent: BLUE,         bg: '#EBF3FF' },
    { ingredient: 'Cucumber',   label: 'Savoury',   result: 'Tzatziki Bowl',            note: 'Grated cucumber, dill, and garlic turn the yogurt into a proper tzatziki.',          accent: GREEN,        bg: '#E8F8EE' },
  ],
  'Protein Egg Scramble': [
    { ingredient: 'Smoked salmon',label: 'Luxury', result: 'Smoked Salmon Scramble',  note: 'Folds of smoked salmon turn a simple scramble into a weekend brunch moment.',         accent: GOLD,         bg: '#FFF3D0' },
    { ingredient: 'Feta',         label: 'Mediterranean',  result: 'Greek Scrambled Eggs',    note: 'Crumbled feta and a handful of olives give this a Mediterranean edge.',              accent: BLUE,         bg: '#EBF3FF' },
    { ingredient: 'Chorizo',      label: 'Smoky',   result: 'Chorizo Egg Scramble',    note: 'Crispy chorizo adds smokiness and spice that make this unforgettable.',               accent: BRAND_ORANGE, bg: '#FFE8E2' },
  ],
  'Black Bean Rice Bowl': [
    { ingredient: 'Avocado',    label: 'Creamy',  result: 'Burrito Bowl',             note: 'Sliced avocado and a squeeze of lime turns this into a proper burrito bowl.',         accent: GREEN,        bg: '#E8F8EE' },
    { ingredient: 'Chicken',    label: 'Protein',    result: 'Black Bean Chicken',       note: 'Grilled spiced chicken on top makes this a complete, filling meal.',                  accent: BRAND_ORANGE, bg: '#FFE8E2' },
    { ingredient: 'Sour cream', label: 'Comfort', result: 'Loaded Rice Bowl',         note: 'A dollop of sour cream and grated cheddar completes the Tex-Mex experience.',        accent: GOLD,         bg: '#FFF3D0' },
  ],
  'Pasta Arrabiata': [
    { ingredient: 'Chicken',    label: 'Protein',    result: 'Chicken Arrabbiata',       note: 'Sliced chicken breast turns this from a quick dish into a protein-packed main.',      accent: BRAND_ORANGE, bg: '#FFE8E2' },
    { ingredient: 'Anchovies',  label: 'Gourmet',   result: 'Pasta Puttanesca',         note: 'Two anchovies melt into the sauce and add incredible umami depth.',                   accent: GOLD,         bg: '#FFF3D0' },
    { ingredient: 'Courgette',  label: 'Veg',       result: 'Pasta Primavera',          note: 'Ribboned courgette and cherry tomatoes make this lighter and colourful.',             accent: GREEN,        bg: '#E8F8EE' },
  ],
  'Broccoli Rice Bowl': [
    { ingredient: 'Salmon',     label: 'Omega-3',   result: 'Salmon Rice Bowl',         note: 'A pan-fried salmon fillet turns this into a restaurant-worthy bowl.',                 accent: BLUE,         bg: '#EBF3FF' },
    { ingredient: 'Miso paste', label: 'Umami',   result: 'Miso Broccoli Bowl',       note: 'A spoon of miso stirred into the sauce adds deep, complex savouriness.',              accent: GOLD,         bg: '#FFF3D0' },
    { ingredient: 'Avocado',    label: 'Creamy',   result: 'Green Power Bowl',         note: 'Sliced avocado alongside the broccoli creates a vibrant green power bowl.',           accent: GREEN,        bg: '#E8F8EE' },
  ],
  'Chicken Tikka Masala': [
    { ingredient: 'Naan bread', label: 'Complete',   result: 'Tikka Masala with Naan',   note: 'Fresh or frozen naan makes this a proper restaurant experience at home.',             accent: GOLD,         bg: '#FFF3D0' },
    { ingredient: 'Spinach',    label: 'Healthy',       result: 'Saag Chicken Masala',      note: 'A big handful of spinach wilted in turns this into a saag-style curry.',              accent: GREEN,        bg: '#E8F8EE' },
    { ingredient: 'Paneer',     label: 'Veggie',result: 'Mixed Tikka Masala',       note: 'Half chicken, half paneer gives extra texture. Great for sharing.',                  accent: BLUE,         bg: '#EBF3FF' },
  ],
  'Pasta Pomodoro': [
    { ingredient: 'Burrata',    label: 'Luxury',  result: 'Burrata Pomodoro',         note: 'A ball of burrata on top transforms this simple pasta into pure indulgence.',         accent: GOLD,         bg: '#FFF3D0' },
    { ingredient: 'Prawns',     label: 'Seafood',   result: 'Prawn Pomodoro',           note: 'Tiger prawns in the tomato sauce make this a classic Italian seafood pasta.',         accent: BLUE,         bg: '#EBF3FF' },
    { ingredient: 'Nduja',      label: 'Spicy',    result: 'Nduja Pasta',              note: 'A spoonful of spreadable nduja melts in for a fiery Calabrian kick.',                 accent: BRAND_ORANGE, bg: '#FFE8E2' },
  ],
  'Avocado Toast & Eggs': [
    { ingredient: 'Smoked salmon',label: 'Luxury', result: 'Smoked Salmon Avo Toast', note: 'Draped smoked salmon turns this into a proper café-style brunch.',                    accent: GOLD,         bg: '#FFF3D0' },
    { ingredient: 'Feta',         label: 'Mediterranean',  result: 'Avo Toast with Feta',     note: 'Crumbled feta and chilli flakes take the flavour to another level.',                  accent: BLUE,         bg: '#EBF3FF' },
    { ingredient: 'Chilli oil',   label: 'Spicy',     result: 'Spicy Avo Toast',         note: 'A drizzle of chilli oil adds heat and makes this instantly more exciting.',            accent: BRAND_ORANGE, bg: '#FFE8E2' },
  ],
};

function getMockHistory(): HistoryEntry[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysBackToMonday = (dayOfWeek + 6) % 7;

  const mockMeals = [
    { title: 'Garlic Lemon Chicken',  timeMinutes: 22 },
    { title: 'Broccoli Rice Bowl',    timeMinutes: 25 },
    { title: 'Tofu Noodle Stir Fry',  timeMinutes: 20 },
    { title: 'Pasta Arrabiata',       timeMinutes: 18 },
    { title: 'Protein Egg Scramble',  timeMinutes: 10 },
  ];

  return Array.from({ length: Math.min(daysBackToMonday, mockMeals.length) }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (daysBackToMonday - i));
    d.setHours(19, 0, 0, 0);
    return {
      id: `mock-hist-${i}`,
      title: mockMeals[i].title,
      createdAt: d.toISOString(),
      timeMinutes: mockMeals[i].timeMinutes,
    };
  });
}

// Score meals by how many ingredients the user already has, then spread
// them across the upcoming days without repeating consecutively.
// Skips dates the user has manually overridden.
function buildAutoWeekPlan(
  pantry: string[],
  overrides: Set<string>,
): Record<string, PlannedMeal> {
  const pantryLower = pantry.map((p) => p.toLowerCase());

  const ranked = [...MEAL_POOL].sort((a, b) => {
    const scoreA = a.uses.filter((u) => pantryLower.includes(u.toLowerCase())).length;
    const scoreB = b.uses.filter((u) => pantryLower.includes(u.toLowerCase())).length;
    return scoreB - scoreA;
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const plan: Record<string, PlannedMeal> = {};

  for (let i = 0; i <= DAYS_FORWARD; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const key = d.toDateString();
    if (!overrides.has(key)) {
      plan[key] = ranked[i % ranked.length];
    }
  }

  return plan;
}

function elevationToMeal(e: ElevationHint, base: PlannedMeal): PlannedMeal {
  return {
    id: `elev-${e.ingredient.replace(/\s+/g, '-').toLowerCase()}`,
    title: e.result,
    cuisine: base.cuisine,
    timeMinutes: base.timeMinutes,
    goal: e.label,
    accent: e.accent,
    bg: e.bg,
    uses: [e.ingredient, ...base.uses],
  };
}

function getSuggestionsForDay(date: Date): PlannedMeal[] {
  const offset = date.getDay() * 3;
  return [
    MEAL_POOL[offset % MEAL_POOL.length],
    MEAL_POOL[(offset + 1) % MEAL_POOL.length],
    MEAL_POOL[(offset + 2) % MEAL_POOL.length],
  ];
}

function getDateRange(): DateEntry[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: DAYS_BACK + 1 + DAYS_FORWARD }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - DAYS_BACK + i);
    const isToday = d.toDateString() === today.toDateString();
    return { date: d, isToday, isPast: d < today && !isToday };
  });
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function formatDayLabel(date: Date): string {
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return 'Today';
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

const FAVORITES_KEY = 'saved_favorites';
const SAVED_RECIPES_DATA_KEY = 'saved_recipes_data';

function RecipeSheet({ recipe, onClose, isFav, onToggleFav }: { recipe: RecipeDetail; onClose: () => void; isFav: boolean; onToggleFav: () => void }) {
  const units = useUnits();
  const accent = recipe.accent ?? BRAND_ORANGE;
  const bg = recipe.bg ?? CREAM;
  const pillLabel = recipe.goal ? recipe.goal.split(' ').pop()! : null;

  // Steps update when the parent populates them via the API call in handleOpenPlannedMeal.
  // No secondary personalise-steps call here — that would add a second network round-trip
  // and delay steps appearing by another 5-10 s for no meaningful gain in a calendar popup.
  const displaySteps = recipe.steps;
  const stepsLoading = recipe.steps.length === 0;

  return (
    <View style={styles.sheetOverlay}>
      <View style={[styles.sheetPanel, { backgroundColor: bg }]}>
        {/* Header — tags + close button on same row */}
        <View style={styles.sheetHeader}>
          <View style={styles.sheetHeaderTags}>
            {pillLabel ? (
              <View style={[styles.sheetGoalPill, { backgroundColor: accent }]}>
                <Text style={styles.sheetGoalPillText}>{pillLabel}</Text>
              </View>
            ) : null}
            <View style={[styles.sheetTimeBadge, { backgroundColor: 'rgba(255,255,255,0.65)' }]}>
              <Ionicons name="time-outline" size={13} color={MUTED} />
              <Text style={styles.sheetTimeBadgeText}>{recipe.timeMinutes} min</Text>
            </View>
            {recipe.cuisine ? (
              <View style={[styles.sheetTimeBadge, { backgroundColor: 'rgba(255,255,255,0.65)' }]}>
                <Text style={styles.sheetTimeBadgeText}>{recipe.cuisine}</Text>
              </View>
            ) : null}
            {recipe.createdAt ? (
              <View style={[styles.sheetTimeBadge, { backgroundColor: 'rgba(255,255,255,0.65)' }]}>
                <Ionicons name="checkmark-circle" size={13} color={GREEN} />
                <Text style={styles.sheetTimeBadgeText}>{formatRelativeDate(recipe.createdAt)}</Text>
              </View>
            ) : null}
          </View>
          <TouchableOpacity style={[styles.sheetCloseBtn, { backgroundColor: 'rgba(255,255,255,0.7)' }]} onPress={onClose} activeOpacity={0.8}>
            <Ionicons name="close" size={20} color={accent} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.sheetScrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.sheetTitleRow}>
            <Text style={[styles.sheetTitle, { color: accent, textShadowColor: INK, textShadowOffset: { width: 0.25, height: 0.25 }, textShadowRadius: 0 }]}>{recipe.title}</Text>
            <TouchableOpacity onPress={onToggleFav} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} activeOpacity={0.7}>
              <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={22} color={isFav ? BRAND_ORANGE : accent} />
            </TouchableOpacity>
          </View>

          {recipe.description !== '' && (
            <Text style={styles.sheetDescription} numberOfLines={1}>{recipe.description}</Text>
          )}

          <View style={[styles.sheetDivider, { backgroundColor: accent + '30' }]} />

          <Text style={[styles.sheetSectionHead, { color: accent }]}>Ingredients</Text>
          {recipe.ingredients.map((ing, i) => (
            <View key={i} style={styles.sheetListRow}>
              <Text style={[styles.sheetBullet, { color: accent }]}>{'•'}</Text>
              <Text style={styles.sheetListText}>{convertText(ing, units)}</Text>
            </View>
          ))}

          <View style={[styles.sheetDivider, { backgroundColor: accent + '30' }]} />

          <Text style={[styles.sheetSectionHead, { color: accent }]}>Steps</Text>
          {stepsLoading ? (
            <ActivityIndicator size="small" color={accent} style={{ marginVertical: 12 }} />
          ) : (
            displaySteps.map((step, i) => (
              <View key={i} style={styles.sheetListRow}>
                <View style={[styles.sheetStepCircle, { backgroundColor: accent }]}>
                  <Text style={styles.sheetStepCircleText}>{i + 1}</Text>
                </View>
                <Text style={styles.sheetListText}>{convertText(step, units)}</Text>
              </View>
            ))
          )}

          <View style={[styles.sheetDivider, { backgroundColor: accent + '30' }]} />
          <Text style={[styles.sheetSectionHead, { color: accent }]}>Nutritional Info</Text>
          <View style={[styles.sheetMacroGrid, { backgroundColor: 'rgba(255,255,255,0.65)', borderColor: accent + '30' }]}>
            <View style={styles.sheetMacroCell}>
              <Text style={[styles.sheetMacroValue, { color: accent }]}>{recipe.nutrition?.calories ?? '—'}</Text>
              <Text style={styles.sheetMacroLabel}>Calories</Text>
            </View>
            <View style={[styles.sheetMacroDivider, { backgroundColor: accent + '30' }]} />
            <View style={styles.sheetMacroCell}>
              <Text style={[styles.sheetMacroValue, { color: accent }]}>{recipe.nutrition?.protein != null ? `${recipe.nutrition.protein}g` : '—'}</Text>
              <Text style={styles.sheetMacroLabel}>Protein</Text>
            </View>
            <View style={[styles.sheetMacroDivider, { backgroundColor: accent + '30' }]} />
            <View style={styles.sheetMacroCell}>
              <Text style={[styles.sheetMacroValue, { color: accent }]}>{recipe.nutrition?.carbs != null ? `${recipe.nutrition.carbs}g` : '—'}</Text>
              <Text style={styles.sheetMacroLabel}>Carbs</Text>
            </View>
            <View style={[styles.sheetMacroDivider, { backgroundColor: accent + '30' }]} />
            <View style={styles.sheetMacroCell}>
              <Text style={[styles.sheetMacroValue, { color: accent }]}>{recipe.nutrition?.fats != null ? `${recipe.nutrition.fats}g` : '—'}</Text>
              <Text style={styles.sheetMacroLabel}>Fats</Text>
            </View>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    </View>
  );
}

export default function CalendarScreen() {
  const dates = getDateRange();
  const scrollRef = useRef<ScrollView>(null);

  const [history, setHistory] = useState<HistoryEntry[]>(getMockHistory());
  const [isLoading, setIsLoading] = useState(true);
  const [pantry] = useState<string[]>(MOCK_PANTRY);
  const [userOverrides, setUserOverrides] = useState<Set<string>>(new Set());
  const [extraSuggestions, setExtraSuggestions] = useState<Record<string, PlannedMeal[]>>({});
  const [weekPlan, setWeekPlan] = useState<Record<string, PlannedMeal>>(
    () => buildAutoWeekPlan(MOCK_PANTRY, new Set()),
  );
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetail | null>(null);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  // Rebuild auto-plan whenever pantry or overrides change; preserve user-chosen days
  useEffect(() => {
    setWeekPlan((prev) => {
      const auto = buildAutoWeekPlan(pantry, userOverrides);
      return { ...prev, ...auto };
    });
  }, [pantry, userOverrides]);

  const TODAY_OFFSET = DAYS_BACK * (CELL_WIDTH + CELL_GAP);

  useEffect(() => {
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ x: TODAY_OFFSET, y: 0, animated: false });
    }, 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!supabase) { setIsLoading(false); return; }

    const load = async () => {
      const { data: userData } = await supabase!.auth.getUser();
      const user = userData.user;
      if (!user) { setIsLoading(false); return; }

      const { data: recipes } = await supabase!
        .from('recipes')
        .select('id, title, time_minutes, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (Array.isArray(recipes) && recipes.length > 0) {
        setHistory(recipes.map((r) => ({
          id: r.id,
          title: r.title,
          createdAt: r.created_at,
          timeMinutes: r.time_minutes ?? 0,
        })));
      }
      setIsLoading(false);
    };

    load();

    const { data: authListener } = supabase!.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) { setHistory(getMockHistory()); setIsLoading(false); }
    });

    return () => { authListener.subscription.unsubscribe(); };
  }, []);

  const isFocused = useIsFocused();
  useEffect(() => {
    AsyncStorage.getItem(FAVORITES_KEY).then((stored) => {
      if (stored) { try { setFavoriteIds(new Set(JSON.parse(stored) as string[])); } catch {} }
    });
  }, [isFocused]);

  const toggleFavorite = (id: string, fullData?: RecipeDetail) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      const adding = !next.has(id);
      if (adding) { next.add(id); } else { next.delete(id); }
      AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify([...next]));
      if (fullData) {
        AsyncStorage.getItem(SAVED_RECIPES_DATA_KEY).then(raw => {
          const data: Record<string, object> = raw ? JSON.parse(raw) : {};
          if (adding) {
            data[id] = {
              id: fullData.id, title: fullData.title, description: fullData.description,
              ingredients: fullData.ingredients, steps: fullData.steps,
              timeMinutes: fullData.timeMinutes, nutrition: fullData.nutrition,
              cuisine: fullData.cuisine,
              bg: fullData.bg ?? CREAM, accent: fullData.accent ?? BRAND_ORANGE,
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

  async function handleOpenRecipe(entry: HistoryEntry) {
    // Mock entries: look up from local data
    if (entry.id.startsWith('mock-hist-')) {
      const detail = MOCK_RECIPE_DETAILS[entry.title];
      if (detail) {
        setSelectedRecipe({ ...detail, id: entry.id, createdAt: entry.createdAt });
      }
      return;
    }

    // Real Supabase entry: fetch full recipe
    if (!supabase) return;
    setRecipeLoading(true);
    const { data } = await supabase
      .from('recipes')
      .select('id, title, time_minutes, created_at, description, ingredients, steps')
      .eq('id', entry.id)
      .single();

    if (data) {
      setSelectedRecipe({
        id: data.id,
        title: data.title,
        timeMinutes: data.time_minutes ?? 0,
        createdAt: data.created_at,
        description: data.description ?? '',
        ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
        steps: Array.isArray(data.steps) ? data.steps : [],
      });
    }
    setRecipeLoading(false);
  }

  async function handleOpenPlannedMeal(meal: PlannedMeal) {
    // Check mock data first — opens instantly
    const mockDetail = MOCK_RECIPE_DETAILS[meal.title];
    if (mockDetail) {
      setSelectedRecipe({
        ...mockDetail,
        id: meal.id,
        accent: meal.accent,
        bg: meal.bg,
        cuisine: meal.cuisine,
        goal: meal.goal,
      });
      return;
    }

    // Open the modal immediately with stub data so the user sees it straight away.
    // The API call below fills in steps, description, and nutrition in the background.
    setSelectedRecipe({
      id: meal.id,
      title: meal.title,
      description: '',
      ingredients: meal.uses,
      steps: [],
      timeMinutes: meal.timeMinutes,
      accent: meal.accent,
      bg: meal.bg,
      cuisine: meal.cuisine,
      goal: meal.goal,
    });

    if (!GENERATE_FINAL_MEAL_FUNCTION_URL) return;
    setRecipeLoading(true);
    try {
      const ingredients = meal.uses.length > 0 ? meal.uses : ['mixed pantry ingredients'];
      const goal = `${meal.goal} (${meal.cuisine})`;
      const response = await fetch(GENERATE_FINAL_MEAL_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ ingredients, goal }),
      });
      if (!response.ok) { setRecipeLoading(false); return; }
      const data = await response.json();
      if (!data?.steps) { setRecipeLoading(false); return; }
      setSelectedRecipe({
        id: meal.id,
        title: meal.title,
        timeMinutes: data.timeMinutes ?? meal.timeMinutes,
        description: data.description ?? '',
        ingredients: data.ingredients ?? meal.uses,
        steps: data.steps ?? [],
        accent: meal.accent,
        bg: meal.bg,
        cuisine: meal.cuisine,
        goal: meal.goal,
        nutrition: data.nutrition,
      });
    } catch {
      // silently fail — modal stays open with stub data
    }
    setRecipeLoading(false);
  }

  const recipesByDate = history.reduce<Record<string, HistoryEntry>>((acc, r) => {
    const key = new Date(r.createdAt).toDateString();
    if (!acc[key]) acc[key] = r;
    return acc;
  }, {});

  const selectedKey = selectedDate.toDateString();
  const plannedMeal = weekPlan[selectedKey] ?? null;
  const historyMeal = recipesByDate[selectedKey] ?? null;
  const isPast = selectedDate < new Date() && selectedKey !== new Date().toDateString();

  const extras = extraSuggestions[selectedKey] ?? [];
  const base = getSuggestionsForDay(selectedDate);
  const allSuggestions = [
    ...extras.filter((m) => m.id !== plannedMeal?.id),
    ...base.filter((m) => !extras.find((e) => e.id === m.id) && m.id !== plannedMeal?.id),
  ];

const selectedMonth = `${MONTH_NAMES[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StatusBar style="light" backgroundColor={INK} />
      <View style={[styles.hero, { paddingTop: TOP_INSET + 22 }]}>
        <Text style={styles.eyebrow}>Plan and remember</Text>
        <Text style={styles.title}>Calendar</Text>
      </View>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}>
        <View style={styles.content}>

          {/* Date strip */}
          <View style={styles.section}>
            <View style={styles.stripHeader}>
              <SectionTitle>Your Week</SectionTitle>
              <Text style={styles.monthLabel}>{selectedMonth}</Text>
            </View>

            <ScrollView
              ref={scrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.dateScrollView}
              contentContainerStyle={styles.dateScrollContent}
>
              {dates.map(({ date, isToday, isPast: cellIsPast }, idx) => {
                const planned = weekPlan[date.toDateString()];
                const cooked = recipesByDate[date.toDateString()];
                const isSelected = date.toDateString() === selectedKey;
                const prevDate = idx > 0 ? dates[idx - 1].date : null;
                const showMonthTick = prevDate && date.getMonth() !== prevDate.getMonth();

                return (
                  <View key={idx} style={styles.dateCellWrapper}>
                    {showMonthTick && (
                      <Text style={styles.monthTick}>{MONTH_NAMES[date.getMonth()]}</Text>
                    )}
                    <TouchableOpacity
                      style={[
                        styles.dateCell,
                        isToday && styles.dateCellToday,
                        !isToday && isSelected && styles.dateCellSelected,
                        !cellIsPast && planned && !isSelected && styles.dateCellPlanned,
                        cellIsPast && cooked && !isSelected && styles.dateCellCooked,
                      ]}
                      onPress={() => setSelectedDate(date)}
                      activeOpacity={0.8}>
                      <Text style={[
                        styles.dateCellDay,
                        (isToday || isSelected) && styles.dateCellDayActive,
                        cellIsPast && !cooked && !isSelected && styles.dateCellDayPast,
                      ]}>
                        {DAY_NAMES[date.getDay()].slice(0, 3)}
                      </Text>
                      <Text style={[
                        styles.dateCellNum,
                        (isToday || isSelected) && styles.dateCellNumActive,
                        cellIsPast && !cooked && !isSelected && styles.dateCellNumPast,
                      ]}>
                        {date.getDate()}
                      </Text>
                      {!cellIsPast && planned && !isSelected ? (
                        <View style={styles.dotOrange} />
                      ) : cellIsPast && cooked && !isSelected ? (
                        <View style={styles.dotGold} />
                      ) : isSelected ? (
                        <View style={[styles.dotOrange, { backgroundColor: 'rgba(255,255,255,0.6)' }]} />
                      ) : (
                        <View style={styles.dotEmpty} />
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>

            <View style={styles.weekLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: BRAND_ORANGE }]} />
                <Text style={styles.legendText}>Planned</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: GOLD }]} />
                <Text style={styles.legendText}>Cooked</Text>
              </View>
              <View style={styles.legendItem}>
                <Text style={styles.legendHint}>← scroll to see past meals</Text>
              </View>
            </View>
          </View>


          {/* Inline day detail */}
          <View style={styles.section}>
            {isPast ? (
              historyMeal ? (
                <TouchableOpacity
                  style={styles.cookedCard}
                  onPress={() => handleOpenRecipe(historyMeal)}
                  activeOpacity={0.85}>
                  <View style={styles.cookedIcon}>
                    <Ionicons name="checkmark-circle" size={22} color={GREEN} />
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={styles.cookedTitle}>{historyMeal.title}</Text>
                    <Text style={styles.cookedMeta}>
                      {formatRelativeDate(historyMeal.createdAt)}
                      {historyMeal.timeMinutes > 0 ? ` · ${historyMeal.timeMinutes} min` : ''}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={MUTED} />
                </TouchableOpacity>
              ) : (
                <View style={styles.emptyPastCard}>
                  <Ionicons name="time-outline" size={18} color={MUTED} />
                  <Text style={styles.emptyPastText}>Nothing logged for this day</Text>
                </View>
              )
            ) : (
              <>
                {plannedMeal && (
                  <>
                    <View style={styles.rowDivider}>
                      <Ionicons name="restaurant-outline" size={14} color={BRAND_ORANGE} />
                      <Text style={[styles.rowDividerLabel, { color: BRAND_ORANGE }]}>What we're cooking</Text>
                      <View style={styles.rowDividerLine} />
                    </View>
                    <TouchableOpacity
                      style={[styles.plannedCard, { backgroundColor: plannedMeal.bg }]}
                      onPress={() => handleOpenPlannedMeal(plannedMeal)}
                      activeOpacity={0.88}>
                      <Text style={[styles.plannedTitle, { color: plannedMeal.accent }]}>{plannedMeal.title}</Text>
                      <View style={styles.metaRow}>
                        <View style={[styles.goalChip, { backgroundColor: plannedMeal.accent }]}>
                          <Text style={styles.goalChipText}>{plannedMeal.goal?.split(' ').pop()}</Text>
                        </View>
                        <Text style={styles.metaDot}>·</Text>
                        <Text style={styles.metaText}>{plannedMeal.cuisine}</Text>
                        <Text style={styles.metaDot}>·</Text>
                        <Ionicons name="time-outline" size={12} color={MUTED} />
                        <Text style={styles.metaText}>{plannedMeal.timeMinutes} min</Text>
                      </View>
                      {plannedMeal.uses.length > 0 && (
                        <View style={styles.usesRow}>
                          <Ionicons name="basket-outline" size={12} color={plannedMeal.accent} />
                          <Text style={[styles.usesText, { color: plannedMeal.accent }]} numberOfLines={1}>
                            {plannedMeal.uses.join(', ')}
                          </Text>
                        </View>
                      )}
                      {userOverrides.has(selectedKey) && (
                        <View style={styles.plannedActions}>
                          <TouchableOpacity
                            style={styles.removeBtn}
                            onPress={() => {
                              setWeekPlan((prev) => { const next = { ...prev }; delete next[selectedKey]; return next; });
                              setUserOverrides((prev) => { const next = new Set(prev); next.delete(selectedKey); return next; });
                              setExtraSuggestions((prev) => { const next = { ...prev }; delete next[selectedKey]; return next; });
                            }}
                            activeOpacity={0.85}>
                            <Text style={styles.removeBtnText}>Remove</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </TouchableOpacity>
                  </>
                )}

                <View style={styles.rowDivider}>
                  <Ionicons name="swap-horizontal-outline" size={14} color={BRAND_ORANGE} />
                  <Text style={[styles.rowDividerLabel, { color: BRAND_ORANGE }]}>
                    {plannedMeal ? 'Switch it up' : 'Suggested for you'}
                  </Text>
                  <View style={styles.rowDividerLine} />
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.suggestionScrollView}
                  contentContainerStyle={styles.suggestionScrollContent}>
                  {allSuggestions.map((meal) => (
                    <TouchableOpacity key={meal.id} style={[styles.suggestionCard, { backgroundColor: meal.bg }]} onPress={() => handleOpenPlannedMeal(meal)} activeOpacity={0.88}>
                      <Text style={[styles.suggestionTitle, { color: meal.accent }]} numberOfLines={2}>{meal.title}</Text>
                      <View style={styles.suggestionCardBottom}>
                        <View style={styles.metaRow}>
                          <View style={[styles.goalChip, { backgroundColor: meal.accent }]}>
                            <Text style={styles.goalChipText}>{meal.goal?.split(' ').pop()}</Text>
                          </View>
                          <Text style={styles.metaDot}>·</Text>
                          <Ionicons name="time-outline" size={11} color={MUTED} />
                          <Text style={styles.metaText}>{meal.timeMinutes} min</Text>
                        </View>
                        {meal.uses.length > 0 && (
                          <View style={styles.usesRow}>
                            <Ionicons name="basket-outline" size={12} color={meal.accent} />
                            <Text style={[styles.usesText, { color: meal.accent }]} numberOfLines={1}>
                              {meal.uses.join(', ')}
                            </Text>
                          </View>
                        )}
                        <View style={styles.plannedActions}>
                          <TouchableOpacity
                            style={styles.cookBtn}
                            onPress={() => {
                              if (plannedMeal) {
                                setExtraSuggestions((prev) => {
                                  const existing = prev[selectedKey] ?? [];
                                  if (existing.find((x) => x.id === plannedMeal.id)) return prev;
                                  return { ...prev, [selectedKey]: [plannedMeal, ...existing] };
                                });
                              }
                              setWeekPlan((prev) => ({ ...prev, [selectedKey]: meal }));
                              setUserOverrides((prev) => { const next = new Set(prev); next.add(selectedKey); return next; });
                            }}
                            activeOpacity={0.85}>
                            <Ionicons name="swap-horizontal-outline" size={12} color={SURFACE} />
                            <Text style={styles.cookBtnText}>{plannedMeal ? 'Switch' : 'Plan'}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {plannedMeal && (MEAL_ELEVATIONS[plannedMeal.title]?.length ?? 0) > 0 && (
                  <>
                    <View style={styles.rowDivider}>
                      <Ionicons name="sparkles-outline" size={14} color={BRAND_ORANGE} />
                      <Text style={[styles.rowDividerLabel, { color: BRAND_ORANGE }]}>One ingredient away</Text>
                      <View style={styles.rowDividerLine} />
                    </View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.suggestionScrollView}
                      contentContainerStyle={styles.suggestionScrollContent}>
                      {MEAL_ELEVATIONS[plannedMeal.title].map((e) => (
                        <TouchableOpacity key={e.ingredient} style={[styles.elevateCard, { backgroundColor: e.bg }]} onPress={() => handleOpenPlannedMeal(elevationToMeal(e, plannedMeal))} activeOpacity={0.88}>
                          <Text style={[styles.elevateResult, { color: e.accent }]}>{e.result}</Text>
                          <Text style={styles.elevateNote} numberOfLines={2}>{e.note}</Text>
                          <View style={[styles.elevateIngredientChip, { borderColor: e.accent }]}>
                            <Ionicons name="add-circle-outline" size={12} color={e.accent} />
                            <Text style={[styles.elevateIngredientText, { color: e.accent }]}>{e.ingredient}</Text>
                          </View>
                          <TouchableOpacity
                            style={styles.switchBtn}
                            onPress={() => {
                              const meal = elevationToMeal(e, plannedMeal);
                              setExtraSuggestions((prev) => {
                                const existing = prev[selectedKey] ?? [];
                                if (existing.find((x) => x.id === plannedMeal.id)) return prev;
                                return { ...prev, [selectedKey]: [plannedMeal, ...existing] };
                              });
                              setWeekPlan((prev) => ({ ...prev, [selectedKey]: meal }));
                              setUserOverrides((prev) => { const next = new Set(prev); next.add(selectedKey); return next; });
                            }}
                            activeOpacity={0.85}>
                            <Ionicons name="swap-horizontal-outline" size={12} color={SURFACE} />
                            <Text style={styles.switchBtnText}>Switch</Text>
                          </TouchableOpacity>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </>
                )}
              </>
            )}
          </View>

        </View>
      </ScrollView>

      <Modal
        visible={!!selectedRecipe}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedRecipe(null)}>
        {selectedRecipe && (
          <RecipeSheet recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} isFav={favoriteIds.has(selectedRecipe.id)} onToggleFav={() => toggleFavorite(selectedRecipe.id, selectedRecipe)} />
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: INK },
  screen: { flex: 1, backgroundColor: CREAM },
  container: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 92 },
  content: { gap: 20 },

  hero: {
    backgroundColor: INK,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    gap: 12,
  },
  eyebrow: {
    color: GOLD,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    textShadowColor: INK,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
  title: {
    ...brandType,
    color: SURFACE,
    fontSize: 24,
    lineHeight: 30,
    marginTop: 2,
    textTransform: 'uppercase',
    textShadowColor: INK,
    textShadowOffset: { width: 1.5, height: 1.5 },
    textShadowRadius: 0,
  },

  section: { gap: 10 },
  sectionTitle: {
    ...brandType,
    color: INK,
    fontSize: 18,
    textTransform: 'uppercase',
    textShadowColor: BRAND_ORANGE,
    textShadowOffset: { width: 0.35, height: 0.35 },
    textShadowRadius: 0,
  },

  stripHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthLabel: { color: MUTED, fontSize: 13, fontWeight: '700' },
  dateScrollView: { marginHorizontal: -16 },
  dateScrollContent: { paddingLeft: 16, paddingRight: 75, flexDirection: 'row', gap: CELL_GAP, alignItems: 'flex-end' },
  dateCellWrapper: { alignItems: 'center' },
  monthTick: { color: BRAND_ORANGE, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', marginBottom: 4 },
  dateCell: {
    width: CELL_WIDTH,
    height: 60,
    backgroundColor: SURFACE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E3EA',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dateCellToday: { backgroundColor: INK, borderColor: INK },
  dateCellSelected: { backgroundColor: BRAND_ORANGE, borderColor: BRAND_ORANGE },
  dateCellPlanned: { borderColor: BRAND_ORANGE, borderWidth: 2 },
  dateCellCooked: { borderColor: GOLD, borderWidth: 2 },
  dateCellDay: { ...brandType, color: MUTED, fontSize: 9, textTransform: 'uppercase' },
  dateCellDayActive: { color: GOLD },
  dateCellDayPast: { color: '#D0D3E0' },
  dateCellNum: { ...brandType, color: INK, fontSize: 14, textTransform: 'uppercase' },
  dateCellNumActive: { color: SURFACE },
  dateCellNumPast: { color: '#D0D3E0' },
  dotOrange: { width: 6, height: 6, borderRadius: 3, backgroundColor: BRAND_ORANGE },
  dotGold: { width: 6, height: 6, borderRadius: 3, backgroundColor: GOLD },
  dotEmpty: { width: 6, height: 6 },

  weekLegend: { flexDirection: 'row', gap: 14, paddingLeft: 2, alignItems: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 3.5 },
  legendText: { color: MUTED, fontSize: 12, fontWeight: '600' },
  legendHint: { color: '#C0C3D0', fontSize: 11, fontStyle: 'italic' },

  pantryCard: {
    backgroundColor: SURFACE,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E3EA',
    padding: 16,
    gap: 12,
  },
  pantryCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pantryCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pantryCardTitle: { ...brandType, color: INK, fontSize: 14, textTransform: 'uppercase' },
  pantryEditLink: { ...brandType, color: BRAND_ORANGE, fontSize: 12, textTransform: 'uppercase' },
  pantryChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pantryChip: {
    backgroundColor: '#FFF8F0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#FFE1D8',
  },
  pantryChipMore: { backgroundColor: SURFACE, borderColor: BRAND_ORANGE },
  pantryChipText: { color: INK, fontSize: 12, fontWeight: '700' },
  pantryNote: { color: MUTED, fontSize: 12, lineHeight: 17 },

  dayDetailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  suggestSubtitle: { color: MUTED, fontSize: 13, lineHeight: 18, marginBottom: 2 },
  emptyPastCard: {
    minHeight: 64,
    backgroundColor: SURFACE,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E3EA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyPastText: { color: MUTED, fontSize: 13, fontWeight: '600' },

  chipRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  goalChip: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  goalChipText: { color: SURFACE, fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  cuisineChip: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: 'rgba(0,0,0,0.07)' },
  cuisineChipText: { color: INK, fontSize: 9, fontWeight: '700' },

  plannedCard: { borderRadius: 24, padding: 12, gap: 8 },
  plannedTitle: { ...brandType, fontSize: 14, textTransform: 'uppercase', lineHeight: 18, textShadowColor: INK, textShadowOffset: { width: 0.25, height: 0.25 }, textShadowRadius: 0 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: MUTED, fontSize: 11, fontWeight: '600' },
  usesRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  usesText: { fontSize: 10, fontWeight: '700', flex: 1 },
  plannedActions: { flexDirection: 'row', gap: 8, marginTop: 2 },
  cookBtn: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: BRAND_ORANGE,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cookBtnText: { color: SURFACE, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  removeBtn: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  removeBtnText: { color: INK, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },

  cookedCard: {
    backgroundColor: '#F4FBF6',
    borderRadius: 24,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#C6EDD2',
  },
  cookedIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DFF3E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cookedTitle: { ...brandType, color: INK, fontSize: 14, lineHeight: 18, textTransform: 'uppercase', textShadowColor: INK, textShadowOffset: { width: 0.25, height: 0.25 }, textShadowRadius: 0 },
  cookedMeta: { color: MUTED, fontSize: 11 },

  suggestionScrollView: { marginHorizontal: -16 },
  suggestionScrollContent: { paddingHorizontal: 16, flexDirection: 'row', gap: 12 },
  suggestionCard: { width: 200, borderRadius: 24, padding: 12, gap: 8 },
  suggestionTitle: { ...brandType, fontSize: 14, textTransform: 'uppercase', lineHeight: 18, minHeight: 36, textShadowColor: INK, textShadowOffset: { width: 0.25, height: 0.25 }, textShadowRadius: 0 },
  suggestionCardBottom: { gap: 7 },
  suggestionCardButtons: { flexDirection: 'row', gap: 6, marginTop: 2 },
  planOnlyBtn: {
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planOnlyBtnText: { color: INK, fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },

  // Recipe sheet (popup modal)
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sheetPanel: {
    borderRadius: 28,
    maxHeight: '88%',
    width: '100%',
    overflow: 'hidden',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  sheetHeaderTags: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  sheetCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetScrollContent: { paddingHorizontal: 20, paddingBottom: 24 },
  sheetTitleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6, gap: 10 },
  sheetTitle: {
    ...brandType,
    color: INK,
    fontSize: 22,
    textTransform: 'uppercase',
    lineHeight: 26,
    flex: 1,
  },
  sheetTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sheetTimeBadgeText: { color: MUTED, fontSize: 13, fontWeight: '600' },
  sheetDescription: { color: MUTED, fontSize: 14, lineHeight: 20, marginBottom: 10 },
  sheetDivider: { height: 1, backgroundColor: '#EDE8E0', marginVertical: 10 },
  sheetSectionHead: {
    ...brandType,
    color: INK,
    fontSize: 14,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  sheetListRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 5, paddingRight: 8 },
  sheetBullet: { fontSize: 15, lineHeight: 20, marginRight: 8, minWidth: 14 },
  sheetStepCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  sheetStepCircleText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  sheetListText: { flex: 1, color: INK, fontSize: 14, lineHeight: 20 },
  sheetGoalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sheetGoalPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  sheetMacroGrid: {
    flexDirection: 'row',
    borderRadius: 14,
    paddingVertical: 10,
    marginTop: 6,
    borderWidth: 1,
  },
  sheetMacroCell: { flex: 1, alignItems: 'center', gap: 2 },
  sheetMacroDivider: { width: 1 },
  sheetMacroValue: { ...brandType, fontSize: 14 },
  sheetMacroLabel: { color: MUTED, fontSize: 9, textTransform: 'uppercase', fontWeight: '700' },

  elevateHeader: { gap: 3, marginTop: 4 },
  elevateTitle: { ...brandType, color: INK, fontSize: 12, textTransform: 'uppercase' },
  elevateSubtitle: { color: MUTED, fontSize: 10, lineHeight: 15 },
  elevateCard: { width: 200, borderRadius: 24, padding: 12, paddingBottom: 44, gap: 8 },
  elevateIngredientRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  elevateIngredientChip: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(255,255,255,0.65)',
  },
  elevateIngredientText: { fontSize: 9, fontWeight: '800' },
  elevateResult: { ...brandType, fontSize: 14, textTransform: 'uppercase', lineHeight: 18, textShadowColor: INK, textShadowOffset: { width: 0.25, height: 0.25 }, textShadowRadius: 0 },
  elevateNote: { color: MUTED, fontSize: 11, lineHeight: 16 },

  switchBtn: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: BRAND_ORANGE,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  switchBtnText: { color: SURFACE, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },

  metaDot: { color: MUTED, fontSize: 11, marginHorizontal: 2 },

  rowDivider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  rowDividerLabel: { ...brandType, fontSize: 16, textTransform: 'uppercase', textShadowColor: INK, textShadowOffset: { width: 0.25, height: 0.25 }, textShadowRadius: 0 },
  rowDividerLine: { flex: 1, height: 1, backgroundColor: '#E2E3EA' },
});
