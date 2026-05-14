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

