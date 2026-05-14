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

const VIRAL_POOL_PLACEHOLDER: MealDetail[] = [
  {
    id: 'vp1', title: 'Viral Feta Pasta', platform: 'tiktok', views: '2.4M', cuisine: 'Italian', timeMinutes: 35,
    description: 'The pasta that broke the internet. Roasted cherry tomatoes and a whole block of feta baked together into a silky, tangy sauce.',
    ingredients: ['200g penne or rigatoni', '200g block feta cheese', '400g cherry tomatoes', '3 garlic cloves', 'Fresh basil'],
    steps: ['Preheat oven to 200°C.', 'Place cherry tomatoes in a baking dish, nestle feta block in the centre. Add garlic and a generous drizzle of olive oil.', 'Bake 30 min until tomatoes burst and feta is golden.', 'Cook pasta in salted water, reserve a cup of pasta water, drain.', 'Smash feta and tomatoes into a sauce, toss in pasta with splashes of pasta water until silky. Top with basil.'],
    nutrition: { calories: 540, protein: 20, carbs: 62, fats: 24 }, accent: '#7C3AED', bg: '#F0EBFF',
  },
  {
    id: 'v2', title: 'One-Pan Garlic Chicken', platform: 'instagram', views: '890K', cuisine: 'French', timeMinutes: 25,
    description: 'Crispy-skinned chicken in a garlicky butter sauce. One pan, minimal washing up, maximum flavour.',
    ingredients: ['4 chicken thighs, bone-in skin-on', '6 garlic cloves', 'Handful of spinach'],
    steps: ['Season chicken with smoked paprika, salt, and pepper.', 'Heat oil in an oven-safe pan. Sear skin-side down 6 min until crispy.', 'Flip, add garlic and butter.', 'Oven at 200°C for 15 min.', 'Remove, stir spinach into pan juices until wilted. Serve over spinach.'],
    nutrition: { calories: 460, protein: 38, carbs: 4, fats: 30 }, accent: '#FF5C35', bg: '#FFE8E2',
  },
  {
    id: 'v3', title: 'Protein Egg Bowl', platform: 'tiktok', views: '1.1M', cuisine: 'Japanese', timeMinutes: 15,
    description: 'The high-protein bowl everyone is making. Fried eggs on warm rice with crispy broccoli and a punchy soy drizzle.',
    ingredients: ['150g cooked rice', '2 eggs', '100g broccoli florets'],
    steps: ['Steam broccoli 4 min.', 'Fry eggs in butter to your liking.', 'Warm rice.', 'Bowl up: rice, broccoli, egg on top.', 'Drizzle soy sauce and sesame oil. Scatter chilli flakes.'],
    nutrition: { calories: 370, protein: 22, carbs: 42, fats: 14 }, accent: '#34A853', bg: '#E8F8EE',
  },
  {
    id: 'v4', title: 'Marry Me Chicken', platform: 'tiktok', views: '3.2M', cuisine: 'Italian', timeMinutes: 30,
    description: 'So good it will get you a proposal. Pan-seared chicken in a sun-dried tomato cream sauce with parmesan.',
    ingredients: ['4 chicken breasts', '100g sun-dried tomatoes', '150ml double cream', '40g parmesan, grated'],
    steps: ['Season and sear chicken in oil 4 min each side. Set aside.', 'In same pan, sauté garlic. Add sun-dried tomatoes and chilli flakes.', 'Pour in cream and half the parmesan. Simmer 3 min.', 'Return chicken to pan, coat in sauce. Cook 8 min until done through.', 'Finish with remaining parmesan and fresh basil.'],
    nutrition: { calories: 520, protein: 48, carbs: 10, fats: 28 }, accent: '#FF5C35', bg: '#FFE8E2',
  },
  {
    id: 'v5', title: 'Crispy Smash Burger', platform: 'tiktok', views: '5.1M', cuisine: 'American', timeMinutes: 20,
    description: 'The smash burger that took over the internet. Thin, lacey-edged patties with melted cheese and a secret sauce.',
    ingredients: ['400g beef mince (20% fat)', '4 burger buns', '4 slices cheddar cheese'],
    steps: ['Divide mince into 4 loose balls. Season.', 'Heat cast iron pan very high. Place ball in pan and SMASH flat immediately.', 'Cook 2 min. Do not touch. Add cheese.', 'Flip, cook 30 sec. Remove.', 'Sauce the bun: mayo, ketchup, mustard, diced gherkins. Stack and serve immediately.'],
    nutrition: { calories: 680, protein: 42, carbs: 36, fats: 38 }, accent: '#D4900A', bg: '#FFF3D0',
  },
  {
    id: 'v6', title: 'Pasta alla Vodka', platform: 'instagram', views: '1.8M', cuisine: 'Italian', timeMinutes: 25,
    description: 'A silky tomato-cream sauce with a hidden vodka depth. The sauce that made pasta cool again.',
    ingredients: ['320g rigatoni', '400g canned tomatoes', '100ml double cream', '40g parmesan'],
    steps: ['Cook pasta in well-salted water.', 'Sauté shallots and garlic in butter. Add tomato paste, cook 2 min.', 'Add canned tomatoes. Simmer 10 min.', 'Blend sauce smooth. Return to pan.', 'Stir in cream and parmesan. Toss with drained pasta.'],
    nutrition: { calories: 560, protein: 18, carbs: 72, fats: 18 }, accent: '#FF5C35', bg: '#FFE8E2',
  },
  {
    id: 'v7', title: 'Chicken Shawarma Wraps', platform: 'instagram', views: '760K', cuisine: 'Lebanese', timeMinutes: 35,
    description: 'Marinated, charred chicken with garlic sauce and pickles in a warm flatbread. Street food at home.',
    ingredients: ['600g chicken thighs', '4 flatbreads', '100g Greek yogurt'],
    steps: ['Marinate chicken: cumin, coriander, paprika, garlic, lemon juice, yogurt. 30 min min.', 'Grill or pan-fry on high heat 5 min each side until charred.', 'Rest 5 min, slice thin.', 'Mix garlic sauce: yogurt, garlic, lemon.', 'Warm flatbreads. Fill with chicken, sauce, cucumber, tomatoes.'],
    nutrition: { calories: 490, protein: 38, carbs: 40, fats: 18 }, accent: '#D4900A', bg: '#FFF3D0',
  },
  {
    id: 'v8', title: 'Air Fryer Salmon', platform: 'tiktok', views: '2.1M', cuisine: 'Japanese', timeMinutes: 15,
    description: 'Perfectly flaky salmon in 10 minutes flat. A honey-soy glaze that caramelises beautifully in the air fryer.',
    ingredients: ['2 salmon fillets', '2 tbsp honey', '1 tbsp soy sauce'],
    steps: ['Pat salmon dry. Season with salt and pepper.', 'Mix honey and soy. Brush half over fillets.', 'Air fry 200°C for 8–10 min.', 'Brush with remaining glaze halfway through.', 'Serve over rice with spring onions and sesame seeds.'],
    nutrition: { calories: 340, protein: 36, carbs: 14, fats: 14 }, accent: '#2563EB', bg: '#EBF3FF',
  },
  {
    id: 'v9', title: 'Shakshuka', platform: 'instagram', views: '620K', cuisine: 'Tunisian', timeMinutes: 25,
    description: 'Eggs poached in a spiced tomato and pepper sauce. The brunch dish that everyone needs in their weekly rotation.',
    ingredients: ['4 eggs', '400g canned tomatoes', '2 red peppers', '1 onion'],
    steps: ['Soften sliced onion and peppers in olive oil 8 min.', 'Add garlic, cumin, paprika, chilli. Cook 2 min.', 'Add canned tomatoes. Simmer 10 min until thickened.', 'Make 4 wells, crack in eggs.', 'Cover and cook 5–7 min until whites set. Top with feta and herbs.'],
    nutrition: { calories: 280, protein: 16, carbs: 18, fats: 14 }, accent: '#FF5C35', bg: '#FFE8E2',
  },
  {
    id: 'v10', title: 'Crispy Rice Tuna Bowl', platform: 'tiktok', views: '4.3M', cuisine: 'Japanese', timeMinutes: 20,
    description: 'Pan-fried crispy rice topped with spicy tuna. The viral TikTok bite that tastes like high-end sushi.',
    ingredients: ['200g cooked sushi rice', '200g fresh tuna', '1 avocado'],
    steps: ['Pack cold rice into a mould, slice into rectangles.', 'Pan-fry in sesame oil until golden and crispy both sides.', 'Mix diced tuna with sriracha, mayo, and soy sauce.', 'Top crispy rice with avocado slice and spicy tuna.', 'Finish with sesame seeds and spring onion.'],
    nutrition: { calories: 410, protein: 28, carbs: 38, fats: 16 }, accent: '#0F7B6C', bg: '#E0F5F3',
  },
  {
    id: 'v11', title: 'Korean Corn Cheese', platform: 'tiktok', views: '1.5M', cuisine: 'Korean', timeMinutes: 10,
    description: 'Sweet corn mixed with creamy mayo and melted mozzarella. The simplest dish that became an obsession.',
    ingredients: ['400g sweetcorn', '150g mozzarella', '3 tbsp mayonnaise'],
    steps: ['Drain corn well. Mix with mayo, a pinch of sugar, and salt.', 'Transfer to an oven-safe dish.', 'Top generously with torn mozzarella.', 'Grill under broiler 5–7 min until golden and bubbly.', 'Serve immediately with toasted bread or as a side.'],
    nutrition: { calories: 320, protein: 12, carbs: 28, fats: 18 }, accent: '#D4900A', bg: '#FFF3D0',
  },
  {
    id: 'v12', title: 'Greek Yogurt Tzatziki Bowl', platform: 'instagram', views: '440K', cuisine: 'Greek', timeMinutes: 10,
    description: 'A cool, creamy bowl with cucumber, lemon, and herb-spiked yogurt. Pairs with everything, ready in minutes.',
    ingredients: ['200g Greek yogurt', '½ cucumber', '1 lemon', '1 garlic clove'],
    steps: ['Grate cucumber and squeeze out all excess moisture.', 'Combine yogurt, cucumber, garlic, lemon juice.', 'Season well. Mix thoroughly.', 'Drizzle with olive oil.', 'Serve with warm flatbread, grilled chicken, or roasted vegetables.'],
    nutrition: { calories: 180, protein: 14, carbs: 12, fats: 8 }, accent: '#FFBA35', bg: '#FFF3D0',
  },
  {
    id: 'v13', title: 'Baked Oats', platform: 'tiktok', views: '3.7M', cuisine: 'British', timeMinutes: 25,
    description: 'The breakfast that tastes like cake. Blended oats baked into a warm, fluffy single-serve situation.',
    ingredients: ['80g rolled oats', '1 banana', '1 egg', '150ml milk'],
    steps: ['Blend oats until fine.', 'Add banana, egg, milk, baking powder, and a pinch of salt. Blend smooth.', 'Stir in chocolate chips or blueberries.', 'Pour into greased ramekin or small baking dish.', 'Bake 200°C for 20 min until set and golden on top.'],
    nutrition: { calories: 380, protein: 14, carbs: 58, fats: 10 }, accent: '#D4900A', bg: '#FFF3D0',
  },
  {
    id: 'v14', title: 'Butter Chicken Naan Pizza', platform: 'tiktok', views: '980K', cuisine: 'Indian', timeMinutes: 20,
    description: 'Butter chicken sauce as the base, mozzarella on top, baked on naan. Two classics colliding.',
    ingredients: ['2 naan breads', '200ml butter chicken sauce', '150g mozzarella', '200g cooked chicken'],
    steps: ['Preheat oven to 220°C.', 'Spread butter chicken sauce generously over each naan.', 'Top with sliced cooked chicken.', 'Cover with torn mozzarella.', 'Bake 10–12 min until cheese is bubbling and edges are crisp.'],
    nutrition: { calories: 560, protein: 34, carbs: 48, fats: 22 }, accent: '#FF5C35', bg: '#FFE8E2',
  },
  {
    id: 'v15', title: 'Birria Quesatacos', platform: 'tiktok', views: '6.2M', cuisine: 'Mexican', timeMinutes: 45,
    description: 'Slow-braised beef dipped in consommé, fried until crispy, and stuffed with cheese. The messiest, best taco.',
    ingredients: ['600g beef brisket', '6 corn tortillas', '150g cheddar or mozzarella'],
    steps: ['Braise beef with dried chillies, garlic, onion, and beef stock 2–3 hours until shreddable.', 'Shred beef. Reserve braising liquid (consommé).', 'Dip tortilla in consommé, place in hot pan.', 'Add beef and cheese. Fold over and fry until crispy.', 'Serve with a bowl of warm consommé for dipping.'],
    nutrition: { calories: 620, protein: 46, carbs: 30, fats: 32 }, accent: '#7C3AED', bg: '#F0EBFF',
  },
  {
    id: 'v16', title: 'Cottage Cheese Flatbread', platform: 'tiktok', views: '2.9M', cuisine: 'American', timeMinutes: 20,
    description: 'High-protein flatbread made with just cottage cheese and eggs. The macro-friendly wrap that broke TikTok.',
    ingredients: ['200g cottage cheese', '2 eggs'],
    steps: ['Blend cottage cheese and eggs until completely smooth.', 'Line a baking tray with parchment. Pour mixture into a thin layer.', 'Bake 180°C for 25–30 min until golden and firm.', 'Remove and cool 5 min before filling.', 'Fill with your choice: turkey, avocado, spinach, or hummus.'],
    nutrition: { calories: 210, protein: 24, carbs: 4, fats: 10 }, accent: '#1E8C45', bg: '#E8F8EE',
  },
  {
    id: 'v17', title: 'Spicy Vodka Rigatoni', platform: 'instagram', views: '1.4M', cuisine: 'Italian', timeMinutes: 30,
    description: 'Gigi Hadid\'s pasta. A spicy, creamy tomato sauce with caramelised shallots and parmesan. Rich beyond belief.',
    ingredients: ['320g rigatoni', '400g canned tomatoes', '100ml cream', '2 shallots', '30g parmesan'],
    steps: ['Sauté shallots in butter until jammy, 10 min.', 'Add garlic and chilli flakes. Cook 2 min.', 'Add tomato paste, cook until caramelised. Add canned tomatoes.', 'Simmer 15 min, stir in cream and half the parmesan.', 'Toss drained pasta in sauce. Finish with remaining parmesan.'],
    nutrition: { calories: 570, protein: 20, carbs: 70, fats: 20 }, accent: '#FF5C35', bg: '#FFE8E2',
  },
  {
    id: 'v18', title: 'Japanese Milk Bread French Toast', platform: 'instagram', views: '550K', cuisine: 'Japanese', timeMinutes: 15,
    description: 'Thick-cut milk bread soaked in a creamy egg custard and fried to a perfect golden crust.',
    ingredients: ['4 thick slices white bread', '3 eggs', '80ml milk', '1 tbsp sugar'],
    steps: ['Whisk eggs, milk, sugar, and a pinch of cinnamon together.', 'Soak bread slices for 2 min each side until fully absorbed.', 'Melt butter in pan on medium-low heat.', 'Fry each slice 3 min per side until deep golden.', 'Serve with maple syrup, fresh berries, or whipped cream.'],
    nutrition: { calories: 340, protein: 14, carbs: 44, fats: 12 }, accent: '#D4900A', bg: '#FFF3D0',
  },
  {
    id: 'v19', title: 'Spicy Garlic Edamame', platform: 'tiktok', views: '870K', cuisine: 'Japanese', timeMinutes: 10,
    description: 'Restaurant-style spicy garlic edamame at home. The snack you will make on repeat.',
    ingredients: ['400g edamame in pods', '4 garlic cloves', '1 red chilli'],
    steps: ['Boil edamame 4 min, drain.', 'Heat oil, fry sliced garlic until golden. Add chilli.', 'Toss in edamame. Add soy sauce, sesame oil.', 'Cook 2 min on high heat.', 'Finish with a squeeze of lemon and sesame seeds.'],
    nutrition: { calories: 180, protein: 14, carbs: 12, fats: 8 }, accent: '#1E8C45', bg: '#E8F8EE',
  },
  {
    id: 'v20', title: 'Halloumi & Avocado Toast', platform: 'instagram', views: '480K', cuisine: 'Cypriot', timeMinutes: 12,
    description: 'Pan-fried halloumi on smashed avocado toast with chilli flakes and a drizzle of honey.',
    ingredients: ['2 slices sourdough', '200g halloumi', '1 ripe avocado'],
    steps: ['Slice halloumi 1cm thick. Fry in dry pan 2–3 min per side until golden.', 'Toast sourdough until crispy.', 'Smash avocado with lemon, salt, and pepper.', 'Spread avocado on toast. Top with halloumi slices.', 'Finish with chilli flakes, a drizzle of honey, and black pepper.'],
    nutrition: { calories: 480, protein: 22, carbs: 30, fats: 30 }, accent: '#0F7B6C', bg: '#E0F5F3',
  },
];

const MOCK_RECENT_RECIPES: MealDetail[] = [
  {
    id: 'm1',
    title: 'Lemon Herb Salmon',
    timeMinutes: 22,
    cuisine: 'Scandinavian',
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
    cuisine: 'Indian',
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
    cuisine: 'Australian',
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
    cuisine: 'Italian',
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
    cuisine: 'Greek',
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
      'Arrange feta chunks on top. Keep them chunky, do not crumble.',
      'Season with salt and pepper. Serve immediately or chill briefly.',
    ],
    nutrition: { calories: 290, protein: 10, carbs: 12, fats: 22 },
    accent: '#7C3AED',
    bg: '#F0EBFF',
  },
];

function parseViews(views: string | undefined): number {
  if (!views) return 0;
  const n = parseFloat(views);
  if (views.toUpperCase().includes('M')) return n * 1_000_000;
  if (views.toUpperCase().includes('K')) return n * 1_000;
  return n;
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 7)}wk ago`;
}


const ING_SKIP = new Set([
  // salt
  'salt','sea salt','kosher salt','table salt','flaky salt','rock salt','salt and pepper','salt and black pepper',
  // pepper (spice)
  'pepper','black pepper','white pepper','ground pepper','cracked pepper','peppercorns','black peppercorns','mixed peppercorns',
  // spices
  'chilli flakes','chili flakes','red pepper flakes','cayenne','cayenne pepper',
  'paprika','smoked paprika','sweet paprika','paprika powder',
  'cumin','ground cumin','cumin seeds','coriander','ground coriander','coriander seeds',
  'turmeric','ground turmeric','garam masala','curry powder','allspice','cardamom','ground cardamom',
  'cloves','ground cloves','nutmeg','ground nutmeg','mace',
  'cinnamon','ground cinnamon','cinnamon sticks','cinnamon stick',
  'oregano','dried oregano','thyme','dried thyme','rosemary','dried rosemary',
  'basil','dried basil','bay leaf','bay leaves','sage','dried sage','tarragon','dried tarragon',
  'mixed herbs','dried herbs','italian seasoning','herbes de provence','zaatar','za\'atar',
  'star anise','fennel seeds','mustard seeds','nigella seeds','sesame seeds',
  'chaat masala','ras el hanout','five spice','chinese five spice','berbere',
  // oils & fats
  'olive oil','extra virgin olive oil','oil','vegetable oil','sunflower oil',
  'sesame oil','toasted sesame oil','coconut oil','rapeseed oil','canola oil',
  'groundnut oil','peanut oil','cooking oil','spray oil','avocado oil','grapeseed oil','truffle oil',
  'butter','unsalted butter','salted butter',
  // sugars & sweeteners
  'sugar','white sugar','brown sugar','caster sugar','icing sugar','demerara sugar','muscovado sugar',
  'honey','maple syrup','agave','agave syrup','golden syrup','treacle','molasses',
  // flours & starches
  'flour','plain flour','self-raising flour','bread flour','whole wheat flour','wholemeal flour',
  'cornflour','cornstarch','arrowroot','tapioca starch',
  // water
  'water','boiling water','cold water',
  // sauces & condiments used as seasoning
  'soy sauce','tamari','fish sauce','oyster sauce','worcestershire sauce','hoisin sauce',
  'hot sauce','chilli sauce','sriracha','tabasco','sambal',
  'ketchup','tomato ketchup',
  'vinegar','red wine vinegar','white wine vinegar','balsamic vinegar','apple cider vinegar','rice vinegar','sherry vinegar','malt vinegar',
  'miso','white miso','red miso','miso paste',
  'tomato paste','tomato puree','tomato concentrate',
  // stocks
  'stock','chicken stock','beef stock','vegetable stock','fish stock','dashi','broth','chicken broth','beef broth','bouillon','stock cube','stock cubes',
  // citrus juices as seasoning
  'lemon juice','lime juice','orange juice',
  // baking agents
  'baking powder','baking soda','bicarbonate of soda','bicarb','yeast','dried yeast','instant yeast',
  // alcohol as cooking liquid
  'wine','red wine','white wine','dry white wine',
]);

// Ordered: specific patterns before generic. First match wins.
const ING_CATCH: Array<[RegExp, string]> = [
  // PASTA
  [/\b(spaghetti|spaghettini|penne|rigatoni|linguine|tagliatelle|fettuccine|fusilli|farfalle|pappardelle|bucatini|orzo|conchiglie|shells|lasagne|lasagna|vermicelli|capellini|angel.hair|macaroni|tortellini|ravioli|orecchiette|cavatappi|rotini|ziti|ditalini|paccheri|strozzapreti|trofie|mafaldine|cavatelli|cannelloni|manicotti|pasta)\b/i, 'Pasta'],
  // NOODLES — specific before generic
  [/\budon\b/i, 'Udon'],
  [/\bsoba\b/i, 'Soba'],
  [/\bramen\b/i, 'Ramen'],
  [/\b(rice noodles?|flat rice noodles?|rice stick noodles?|ho fun|pad thai noodles?)\b/i, 'Rice Noodles'],
  [/\b(glass noodles?|cellophane noodles?|bean thread noodles?)\b/i, 'Glass Noodles'],
  [/\b(egg noodles?|lo mein|chow mein)\b/i, 'Egg Noodles'],
  [/\bnoodles?\b/i, 'Noodles'],
  // RICE — arborio before generic rice
  [/\b(arborio|carnaroli|vialone)\b/i, 'Risotto Rice'],
  [/\b(basmati|jasmine|long.grain|short.grain|wild rice|black rice|red rice|glutinous|sticky rice|sushi rice|bomba|white rice|brown rice|rice)\b/i, 'Rice'],
  // POULTRY
  [/\bchicken\b/i, 'Chicken'],
  [/\b(duck breast|duck leg|duck confit|duck)\b/i, 'Duck'],
  [/\bturkey\b/i, 'Turkey'],
  // BEEF
  [/\b(sirloin|ribeye|rib.eye|fillet steak|tenderloin|rump steak|t.bone|porterhouse|flank steak|skirt steak|hanger steak|brisket|short ribs|beef cheeks?|beef mince|minced beef|ground beef|beef)\b/i, 'Beef'],
  // LAMB
  [/\b(lamb chops?|lamb cutlets?|lamb shank|rack of lamb|leg of lamb|lamb mince|minced lamb|lamb)\b/i, 'Lamb'],
  // CURED PORK — before generic pork
  [/\b(streaky bacon|back bacon|smoked bacon|bacon)\b/i, 'Bacon'],
  [/\bchorizo\b/i, 'Chorizo'],
  [/\bpancetta\b/i, 'Pancetta'],
  [/\bprosciutto\b/i, 'Prosciutto'],
  [/\b(salami|pepperoni)\b/i, 'Salami'],
  [/\b(serrano ham|parma ham|honey roast ham|ham)\b/i, 'Ham'],
  // GENERIC PORK
  [/\b(pork belly|pork loin|pork chops?|pork shoulder|pork ribs?|pork fillet|pork tenderloin|pork mince|minced pork|ground pork|pulled pork|pork)\b/i, 'Pork'],
  // FISH
  [/\bsalmon\b/i, 'Salmon'],
  [/\b(cod|codfish)\b/i, 'Cod'],
  [/\btuna\b/i, 'Tuna'],
  [/\b(sea bass|seabass)\b/i, 'Sea Bass'],
  [/\b(sea bream|seabream|dorade)\b/i, 'Sea Bream'],
  [/\bmackerel\b/i, 'Mackerel'],
  [/\bhaddock\b/i, 'Haddock'],
  [/\btilapia\b/i, 'Tilapia'],
  [/\btrout\b/i, 'Trout'],
  [/\bhalibut\b/i, 'Halibut'],
  [/\bmonkfish\b/i, 'Monkfish'],
  [/\bsnapper\b/i, 'Snapper'],
  [/\b(mahi.mahi|mahi)\b/i, 'Mahi-Mahi'],
  [/\bsardines?\b/i, 'Sardines'],
  // SEAFOOD
  [/\b(king prawns?|tiger prawns?|jumbo prawns?|prawns?|shrimps?)\b/i, 'Prawns'],
  [/\bscallops?\b/i, 'Scallops'],
  [/\bmussels?\b/i, 'Mussels'],
  [/\bclams?\b/i, 'Clams'],
  [/\b(squid|calamari)\b/i, 'Squid'],
  [/\boctopus\b/i, 'Octopus'],
  [/\b(crab|crabmeat)\b/i, 'Crab'],
  [/\blobster\b/i, 'Lobster'],
  [/\banchov(y|ies)\b/i, 'Anchovies'],
  // VEG — specific before generic
  [/\b(spring onions?|scallions?|green onions?)\b/i, 'Spring Onion'],
  [/\bshallots?\b/i, 'Shallots'],
  [/\b(red onion|yellow onion|white onion|brown onion|onions?)\b/i, 'Onion'],
  [/\bgarlic\b/i, 'Garlic'],
  [/\bginger\b/i, 'Ginger'],
  [/\bleeks?\b/i, 'Leek'],
  [/\b(button mushrooms?|cremini|chestnut mushrooms?|portobello|shiitake|oyster mushrooms?|porcini|wild mushrooms?|mushrooms?)\b/i, 'Mushrooms'],
  [/\b(red pepper|green pepper|yellow pepper|orange pepper|bell pepper|capsicum|peppers?)\b/i, 'Pepper'],
  [/\b(red chilli|green chilli|bird.?s? eye chilli|jalape[nñ]o|habanero|scotch bonnet|chillies|chilis?)\b/i, 'Chilli'],
  [/\bsun.dried tomatoes?\b/i, 'Sun-Dried Tomatoes'],
  [/\b(cherry tomatoes?|grape tomatoes?|roma tomatoes?|plum tomatoes?|heirloom tomatoes?|vine tomatoes?|canned tomatoes?|chopped tomatoes?|tinned tomatoes?|passata|tomatoes?)\b/i, 'Tomatoes'],
  [/\b(sweet potatoes?|yams?)\b/i, 'Sweet Potato'],
  [/\b(new potatoes?|baby potatoes?|roasting potatoes?|baking potatoes?|russet|yukon gold|maris piper|king edward|jersey royals?|potatoes?)\b/i, 'Potato'],
  [/\b(courgettes?|zucchinis?)\b/i, 'Courgette'],
  [/\b(aubergines?|eggplants?)\b/i, 'Aubergine'],
  [/\b(baby spinach|spinach)\b/i, 'Spinach'],
  [/\b(savoy cabbage|napa cabbage|chinese cabbage|pointed cabbage|red cabbage|white cabbage|cabbages?)\b/i, 'Cabbage'],
  [/\b(bok choy|pak choi|bok choi|pak choy)\b/i, 'Pak Choi'],
  [/\b(kale|cavolo nero|tuscan kale|curly kale)\b/i, 'Kale'],
  [/\b(tenderstem broccoli|broccolini|broccoli)\b/i, 'Broccoli'],
  [/\b(cauliflower|cauli)\b/i, 'Cauliflower'],
  [/\b(baby carrots?|carrots?)\b/i, 'Carrot'],
  [/\bcelery\b/i, 'Celery'],
  [/\basparagus\b/i, 'Asparagus'],
  [/\b(sugar snap peas?|mangetout|snow peas?|garden peas?|frozen peas?|peas?)\b/i, 'Peas'],
  [/\b(sweetcorn|corn on the cob|corn)\b/i, 'Corn'],
  [/\bavocados?\b/i, 'Avocado'],
  [/\bcucumber\b/i, 'Cucumber'],
  [/\b(beetroot|beets?)\b/i, 'Beetroot'],
  [/\bfennel\b/i, 'Fennel'],
  [/\b(globe artichokes?|artichokes?)\b/i, 'Artichoke'],
  [/\b(butternut squash|acorn squash|delicata squash|squash|pumpkin)\b/i, 'Squash'],
  [/\bceleriac\b/i, 'Celeriac'],
  [/\bparsnips?\b/i, 'Parsnip'],
  [/\bradishes?\b/i, 'Radish'],
  [/\bbrussels sprouts?\b/i, 'Brussels Sprouts'],
  // LEGUMES
  [/\b(chickpeas?|garbanzo beans?)\b/i, 'Chickpeas'],
  [/\b(red lentils?|green lentils?|black lentils?|puy lentils?|beluga lentils?|lentils?)\b/i, 'Lentils'],
  [/\b(red kidney beans?|kidney beans?)\b/i, 'Kidney Beans'],
  [/\bblack beans?\b/i, 'Black Beans'],
  [/\b(cannellini beans?|haricot beans?|navy beans?|white beans?)\b/i, 'Cannellini Beans'],
  [/\b(butter beans?|lima beans?)\b/i, 'Butter Beans'],
  [/\bborlotti beans?\b/i, 'Borlotti Beans'],
  [/\bedamame\b/i, 'Edamame'],
  // TOFU
  [/\b(firm tofu|silken tofu|extra.firm tofu|tofu)\b/i, 'Tofu'],
  // EGGS
  [/\beggs?\b/i, 'Eggs'],
  // DAIRY — specific before generic
  [/\bcoconut cream\b/i, 'Coconut Cream'],
  [/\bcoconut milk\b/i, 'Coconut Milk'],
  [/\b(whole milk|semi.skimmed milk|skimmed milk|full.fat milk|oat milk|almond milk|soy milk|milk)\b/i, 'Milk'],
  [/\b(sour cream|creme fraiche|crème fraîche)\b/i, 'Sour Cream'],
  [/\b(double cream|heavy cream|single cream|whipping cream|cooking cream|cream)\b/i, 'Cream'],
  [/\b(greek yogh?urt|natural yogh?urt|plain yogh?urt|yogh?urt)\b/i, 'Yogurt'],
  // CHEESE
  [/\b(feta cheese|feta)\b/i, 'Feta'],
  [/\b(parmesan|parmigiano)\b/i, 'Parmesan'],
  [/\b(buffalo mozzarella|fresh mozzarella|mozzarella)\b/i, 'Mozzarella'],
  [/\bcheddar\b/i, 'Cheddar'],
  [/\b(goat.?s? cheese|chèvre|chevre)\b/i, 'Goat Cheese'],
  [/\bricotta\b/i, 'Ricotta'],
  [/\bburrata\b/i, 'Burrata'],
  [/\bhalloumi\b/i, 'Halloumi'],
  [/\bpecorino\b/i, 'Pecorino'],
  [/\b(gorgonzola|stilton|roquefort|blue cheese)\b/i, 'Blue Cheese'],
  [/\bcream cheese\b/i, 'Cream Cheese'],
  [/\bcottage cheese\b/i, 'Cottage Cheese'],
  [/\b(gruy[eè]re)\b/i, 'Gruyère'],
  [/\b(emmental|emmenthal)\b/i, 'Emmental'],
  [/\bgouda\b/i, 'Gouda'],
  [/\bbrie\b/i, 'Brie'],
  [/\bcamembert\b/i, 'Camembert'],
  [/\bmanchego\b/i, 'Manchego'],
  // BREAD — specific before generic
  [/\bsourdough\b/i, 'Sourdough'],
  [/\bciabatta\b/i, 'Ciabatta'],
  [/\bfocaccia\b/i, 'Focaccia'],
  [/\b(baguette|french stick)\b/i, 'Baguette'],
  [/\bnaan\b/i, 'Naan'],
  [/\bpitta?\b/i, 'Pitta'],
  [/\bflatbread\b/i, 'Flatbread'],
  [/\btortillas?\b/i, 'Tortilla'],
  [/\bbrioche\b/i, 'Brioche'],
  [/\bbagels?\b/i, 'Bagel'],
  [/\b(rye bread|pumpernickel)\b/i, 'Rye Bread'],
  [/\bread\b/i, 'Bread'],
  // GRAINS
  [/\bquinoa\b/i, 'Quinoa'],
  [/\bcouscous\b/i, 'Couscous'],
  [/\b(bulgur|bulgar)\b/i, 'Bulgur Wheat'],
  [/\bfarro\b/i, 'Farro'],
  [/\b(pearl barley|barley)\b/i, 'Barley'],
  [/\b(polenta|cornmeal)\b/i, 'Polenta'],
  [/\b(rolled oats?|porridge oats?|oatmeal|oats?)\b/i, 'Oats'],
  // CITRUS
  [/\blemons?\b/i, 'Lemon'],
  [/\blimes?\b/i, 'Lime'],
  [/\boranges?\b/i, 'Orange'],
  // NUTS
  [/\b(pine nuts?|pignoli)\b/i, 'Pine Nuts'],
  [/\b(flaked almonds?|ground almonds?|almonds?)\b/i, 'Almonds'],
  [/\bwalnuts?\b/i, 'Walnuts'],
  [/\b(cashews?|cashew nuts?)\b/i, 'Cashews'],
  [/\bpistachios?\b/i, 'Pistachios'],
  [/\b(peanuts?|groundnuts?)\b/i, 'Peanuts'],
  [/\bhazelnuts?\b/i, 'Hazelnuts'],
  // CONDIMENTS THAT ARE REAL INGREDIENTS
  [/\btahini\b/i, 'Tahini'],
  [/\bharissa\b/i, 'Harissa'],
  [/\bpesto\b/i, 'Pesto'],
  [/\b(dijon mustard|wholegrain mustard|english mustard|mustard)\b/i, 'Mustard'],
  [/\b(kalamata olives?|black olives?|green olives?|olives?)\b/i, 'Olives'],
  [/\bcapers?\b/i, 'Capers'],
  [/\b(dark chocolate|milk chocolate|white chocolate|chocolate)\b/i, 'Chocolate'],
];

function ingredientName(ing: string): string | null {
  const name = ing
    .replace(/^[\d/. ×x-]+\s*(g|kg|ml|l|oz|lb|lbs|tbsp|tsp|cups?|cans?|tins?|slices?|bunch|pinch|dash|handfuls?|cloves?|heads?)?\s+/i, '')
    .replace(/^(a|an|some|handful of|pinch of|dash of|can of|tin of|knob of|splash of|drizzle of|glug of|squeeze of|juice of|zest of)\s+/i, '')
    .replace(/,.*$/, '')
    .replace(/\(.*?\)/g, '')
    .trim()
    .toLowerCase();

  if (ING_SKIP.has(name)) return null;
  if (/\b(to taste|to serve|to garnish|optional|for garnish|for serving)\b/i.test(name)) return null;
  if (/\boil\b/i.test(name)) return null;

  for (const [pattern, label] of ING_CATCH) {
    if (pattern.test(name)) return label;
  }

  // fallback: strip descriptors, collapse spaces
  const cleaned = name
    .replace(/\b(fresh|dried|canned|tinned|ripe|boneless|skinless|large|medium|small|finely|roughly|thinly|sliced|diced|chopped|minced|cooked|raw|ground|smoked|frozen|peeled|pitted|halved|quartered|crushed|grated|roasted|whole|can)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned ? cleaned.replace(/^\w/, c => c.toUpperCase()) : null;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function MacroRow({ calories, protein, carbs, fats, accent }: {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
  accent: string;
}) {
  const val = (v: number | null, unit?: string) =>
    v != null ? `${v}${unit ?? ''}` : '—';
  return (
    <View style={styles.macroRow}>
      <View style={styles.macroItem}>
        <Text style={[styles.macroValue, { color: accent }]}>{val(calories)}</Text>
        <Text style={styles.macroLabel}>cal</Text>
      </View>
      <View style={styles.macroDivider} />
      <View style={styles.macroItem}>
        <Text style={[styles.macroValue, { color: accent }]}>{val(protein, 'g')}</Text>
        <Text style={styles.macroLabel}>protein</Text>
      </View>
      <View style={styles.macroDivider} />
      <View style={styles.macroItem}>
        <Text style={[styles.macroValue, { color: accent }]}>{val(carbs, 'g')}</Text>
        <Text style={styles.macroLabel}>carbs</Text>
      </View>
      <View style={styles.macroDivider} />
      <View style={styles.macroItem}>
        <Text style={[styles.macroValue, { color: accent }]}>{val(fats, 'g')}</Text>
        <Text style={styles.macroLabel}>fats</Text>
      </View>
    </View>
  );
}

const FAVORITES_KEY = 'saved_favorites';
const SAVED_RECIPES_DATA_KEY = 'saved_recipes_data';

function MealSheet({ meal, onClose, isFav, onToggleFav }: { meal: MealDetail; onClose: () => void; isFav: boolean; onToggleFav: () => void }) {
  const units = useUnits();
  const [displaySteps, setDisplaySteps] = useState<string[]>(meal.steps);
  const [stepsLoading, setStepsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const vibe = meal.goal === 'Quick' ? 'Quick' : deriveVibe(meal.timeMinutes);
    personaliseSteps({ title: meal.title, ingredients: meal.ingredients, steps: meal.steps, timeMinutes: meal.timeMinutes }, vibe)
      .then(steps => { if (!cancelled) { setDisplaySteps(steps); setStepsLoading(false); } })
      .catch(() => { if (!cancelled) setStepsLoading(false); });
    return () => { cancelled = true; };
  }, [meal.title]);

  const goalLabel = meal.goal
    ? meal.goal.split(' ').pop()!
    : null;

  const pillLabel = goalLabel
    ? goalLabel
    : meal.platform === 'tiktok'
    ? 'TikTok'
    : meal.platform === 'instagram'
    ? 'Instagram'
    : null;

  const pillBg = meal.platform === 'tiktok'
    ? DARK
    : meal.platform === 'instagram'
    ? '#E1306C'
    : meal.accent;

  return (
    <View style={styles.sheetOverlay}>
      <View style={[styles.sheetPanel, { backgroundColor: meal.bg }]}>
      {/* Header — tags + close button on same row */}
      <View style={styles.sheetHeader}>
        <View style={styles.sheetHeaderTags}>
          {pillLabel ? (
            <View style={[styles.sheetGoalPill, { backgroundColor: pillBg }]}>
              {(meal.platform === 'tiktok' || meal.platform === 'instagram') && (
                <Ionicons
                  name={meal.platform === 'tiktok' ? 'musical-notes' : 'logo-instagram'}
                  size={11}
                  color="#FFF"
                  style={{ marginRight: 4 }}
                />
              )}
              <Text style={styles.sheetGoalPillText}>{pillLabel}</Text>
            </View>
          ) : null}
          <View style={[styles.sheetTimeBadge, { backgroundColor: 'rgba(255,255,255,0.65)' }]}>
            <Ionicons name="time-outline" size={13} color={MUTED} />
            <Text style={styles.sheetTimeBadgeText}>{meal.timeMinutes} min</Text>
          </View>
          {meal.cuisine ? (
            <View style={[styles.sheetTimeBadge, { backgroundColor: 'rgba(255,255,255,0.65)' }]}>
              <Text style={styles.sheetTimeBadgeText}>{meal.cuisine}</Text>
            </View>
          ) : null}
          {meal.views ? (
            <View style={[styles.sheetTimeBadge, { backgroundColor: 'rgba(255,255,255,0.65)' }]}>
              <Text style={styles.sheetTimeBadgeText}>{meal.views} views</Text>
            </View>
          ) : null}
          {meal.createdAt ? (
            <View style={[styles.sheetTimeBadge, { backgroundColor: 'rgba(255,255,255,0.65)' }]}>
              <Text style={styles.sheetTimeBadgeText}>{timeAgo(meal.createdAt)}</Text>
            </View>
          ) : null}
        </View>
        <TouchableOpacity style={[styles.sheetCloseBtn, { backgroundColor: 'rgba(255,255,255,0.7)' }]} onPress={onClose} activeOpacity={0.8}>
          <Ionicons name="close" size={20} color={meal.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.sheetScrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Title */}
        <View style={styles.sheetTitleRow}>
          <Text style={[styles.sheetTitle, { color: meal.accent, textShadowColor: DARK, textShadowOffset: { width: 0.25, height: 0.25 }, textShadowRadius: 0 }]}>{meal.title}</Text>
          <TouchableOpacity onPress={onToggleFav} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} activeOpacity={0.7}>
            <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={22} color={isFav ? '#FF5C35' : meal.accent} />
          </TouchableOpacity>
        </View>

        {/* Description */}
        <Text style={styles.sheetDescription} numberOfLines={1}>{meal.description}</Text>

        {/* Divider */}
        <View style={[styles.sheetDivider, { backgroundColor: meal.accent + '30' }]} />

        {/* Ingredients */}
        <Text style={[styles.sheetSectionHead, { color: meal.accent }]}>Ingredients</Text>
        {meal.ingredients.map((ing, i) => (
          <View key={i} style={styles.sheetListRow}>
            <Text style={[styles.sheetBullet, { color: meal.accent }]}>{'•'}</Text>
            <Text style={styles.sheetListText}>{convertText(ing, units)}</Text>
          </View>
        ))}

        {/* Divider */}
        <View style={[styles.sheetDivider, { backgroundColor: meal.accent + '30' }]} />

        {/* Steps */}
        <Text style={[styles.sheetSectionHead, { color: meal.accent }]}>Steps</Text>
        {stepsLoading ? (
          <ActivityIndicator size="small" color={meal.accent} style={{ marginVertical: 12 }} />
        ) : (
          displaySteps.map((step, i) => (
            <View key={i} style={styles.sheetListRow}>
              <View style={[styles.sheetStepCircle, { backgroundColor: meal.accent }]}>
                <Text style={styles.sheetStepCircleText}>{i + 1}</Text>
              </View>
              <Text style={styles.sheetListText}>{convertText(step, units)}</Text>
            </View>
          ))
        )}

        {/* Divider */}
        <View style={[styles.sheetDivider, { backgroundColor: meal.accent + '30' }]} />

        {/* Nutrition */}
        <Text style={[styles.sheetSectionHead, { color: meal.accent }]}>Nutritional Info</Text>
        <View style={[styles.sheetMacroGrid, { backgroundColor: 'rgba(255,255,255,0.65)', borderColor: meal.accent + '30' }]}>
          <View style={styles.sheetMacroCell}>
            <Text style={[styles.sheetMacroValue, { color: meal.accent }]}>{meal.nutrition.calories}</Text>
            <Text style={styles.sheetMacroLabel}>Calories</Text>
          </View>
          <View style={[styles.sheetMacroDivider, { backgroundColor: meal.accent + '30' }]} />
          <View style={styles.sheetMacroCell}>
            <Text style={[styles.sheetMacroValue, { color: meal.accent }]}>{meal.nutrition.protein}g</Text>
            <Text style={styles.sheetMacroLabel}>Protein</Text>
          </View>
          <View style={[styles.sheetMacroDivider, { backgroundColor: meal.accent + '30' }]} />
          <View style={styles.sheetMacroCell}>
            <Text style={[styles.sheetMacroValue, { color: meal.accent }]}>{meal.nutrition.carbs}g</Text>
            <Text style={styles.sheetMacroLabel}>Carbs</Text>
          </View>
          <View style={[styles.sheetMacroDivider, { backgroundColor: meal.accent + '30' }]} />
          <View style={styles.sheetMacroCell}>
            <Text style={[styles.sheetMacroValue, { color: meal.accent }]}>{meal.nutrition.fats}g</Text>
            <Text style={styles.sheetMacroLabel}>Fats</Text>
          </View>
        </View>

        {/* Bottom padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
      </View>
    </View>
  );
}

function TrendCardItem({ t, onPress }: { t: MealDetail; onPress: () => void }) {
  const [showDesc, setShowDesc] = useState(false);
  return (
    <TouchableOpacity
      style={[styles.trendCard, { backgroundColor: t.bg }]}
      onPress={onPress}
      activeOpacity={0.88}>
      <View style={styles.trendTop}>
        <View style={[styles.platformBadge, { backgroundColor: t.platform === 'tiktok' ? DARK : '#E1306C' }]}>
          <Ionicons name={t.platform === 'tiktok' ? 'musical-notes' : 'logo-instagram'} size={11} color="#FFF" />
          <Text style={styles.platformLabel}>{t.platform === 'tiktok' ? 'TikTok' : 'Instagram'}</Text>
        </View>
        <Text style={[styles.trendViews, { color: t.accent }]}>{t.views} views</Text>
      </View>
      <View style={styles.trendTitleRow}>
        <Text style={[styles.trendTitle, { color: t.accent, textShadowColor: DARK }]} numberOfLines={2}>{t.title}</Text>
        <TouchableOpacity
          onPress={() => setShowDesc(v => !v)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.trendInfoBtn}>
          <Ionicons
            name={showDesc ? 'information-circle' : 'information-circle-outline'}
            size={16}
            color={t.accent}
          />
        </TouchableOpacity>
      </View>
      {showDesc && (
        <View style={[styles.trendDescBubble, { backgroundColor: t.accent + '18', borderColor: t.accent + '30' }]}>
          <Text style={styles.trendDescText}>{t.description}</Text>
        </View>
      )}
      <View style={styles.timeBadge}>
        <Ionicons name="time-outline" size={11} color={MUTED} />
        <Text style={styles.timeBadgeText}>{t.timeMinutes} min</Text>
      </View>
      {t.cuisine ? <View style={[styles.cuisineChip, { alignSelf: 'flex-end' }]}><Text style={styles.cuisineChipText}>{t.cuisine}</Text></View> : null}
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [recipes, setRecipes] = useState<MealDetail[]>([]);
  const [isLoading, setIsLoading] = useState(!!supabase);
  const [promptIdx] = useState(() => Math.floor(Math.random() * DAILY_PROMPTS.length));
  const [selectedMeal, setSelectedMeal] = useState<MealDetail | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [viralDishes, setViralDishes] = useState<MealDetail[]>(() => VIRAL_POOL_PLACEHOLDER.slice(0, 4));
  const [viralLoading, setViralLoading] = useState(!!GET_VIRAL_DISHES_FUNCTION_URL);

  const isFocused = useIsFocused();
  useEffect(() => {
    AsyncStorage.getItem(FAVORITES_KEY).then((stored) => {
      if (stored) { try { setFavoriteIds(new Set(JSON.parse(stored) as string[])); } catch {} }
    });
  }, [isFocused]);

  const toggleFavorite = (id: string, fullData?: MealDetail) => {
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
              cuisine: fullData.cuisine, bg: fullData.bg, accent: fullData.accent,
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
    if (!GET_VIRAL_DISHES_FUNCTION_URL) {
      setViralDishes(VIRAL_POOL_PLACEHOLDER.slice(0, 4));
      setViralLoading(false);
      return;
    }
    fetch(GET_VIRAL_DISHES_FUNCTION_URL)
      .then(r => r.json())
      .then((data: any[]) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped: MealDetail[] = data.map((d: any) => ({
            id: d.id,
            title: d.title,
            description: d.description ?? '',
            cuisine: d.cuisine,
            timeMinutes: d.time_minutes ?? 30,
            ingredients: d.ingredients ?? [],
            steps: d.steps ?? [],
            nutrition: d.nutrition ?? { calories: 0, protein: 0, carbs: 0, fats: 0 },
            accent: d.accent ?? '#FF5C35',
            bg: d.bg ?? '#FFE8E2',
            platform: d.platform,
            views: d.views,
          }));
          setViralDishes(mapped);
        } else {
          setViralDishes(VIRAL_POOL_PLACEHOLDER.slice(0, 4));
        }
      })
      .catch(() => setViralDishes(VIRAL_POOL_PLACEHOLDER.slice(0, 4)))
      .finally(() => setViralLoading(false));
  }, []);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    const load = async () => {
      const { data } = await supabase!.auth.getUser();
      const currentUser = data.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const { data: rows } = await supabase!
          .from('recipes')
          .select('id, title, time_minutes, created_at')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (Array.isArray(rows)) {
          setRecipes(
            rows.map((r) => ({
              id: r.id,
              title: r.title,
              timeMinutes: r.time_minutes ?? 0,
              createdAt: r.created_at,
              description: '',
              ingredients: [],
              steps: [],
              nutrition: { calories: 0, protein: 0, carbs: 0, fats: 0 },
              accent: MUTED,
              bg: SURFACE,
            }))
          );
        }
      }

      setIsLoading(false);
    };

    load();

    const { data: authListener } = supabase!.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (!currentUser) {
        setRecipes([]);
        setIsLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const greeting = getGreeting();
  const prompt = DAILY_PROMPTS[promptIdx];
  const displayedRecipes = recipes.length > 0 ? recipes : MOCK_RECENT_RECIPES;

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StatusBar style="light" backgroundColor={DARK} />
      <View style={[styles.hero, { paddingTop: TOP_INSET + 22 }]}>
        <Text style={styles.eyebrow}>{greeting}, Chef</Text>
        <Text style={styles.title}>What are we cooking today?</Text>
      </View>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}>
        <View style={styles.content}>

          {/* From Your Pantry */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="basket-outline" size={14} color={PRIMARY} />
              <Text style={styles.sectionTitle}>From Your Pantry</Text>
              <View style={styles.sectionDividerLine} />
              <TouchableOpacity
                style={styles.pantryBadge}
                onPress={() => router.push('/(tabs)/pantry')}
                activeOpacity={0.8}>
                <Text style={styles.pantryBadgeText}>15 items</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.cardScrollWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardScroll}>
                {PANTRY_RECS.map((rec) => (
                  <TouchableOpacity
                    key={rec.id}
                    style={[styles.recCard, { backgroundColor: rec.bg, height: 220 }]}
                    onPress={() => setSelectedMeal(rec)}
                    activeOpacity={0.88}>
                    <View style={styles.recCardBody}>
                      <View style={styles.recCardTop}>
                        <View style={[styles.goalPill, { backgroundColor: rec.accent }]}>
                          <Text style={styles.goalPillText}>{rec.goal?.split(' ').pop()}</Text>
                        </View>
                        <View style={styles.timeBadge}>
                          <Ionicons name="time-outline" size={11} color={MUTED} />
                          <Text style={styles.timeBadgeText}>{rec.timeMinutes} min</Text>
                        </View>
                      </View>
                      <Text style={[styles.recCardTitle, { color: rec.accent, textShadowColor: DARK }]} numberOfLines={2}>{rec.title}</Text>
                      <View style={styles.ingredientPillRow}>
                        {rec.ingredients
                          .map((ing) => ({ ing, name: ingredientName(ing) }))
                          .filter((x): x is { ing: string; name: string } => x.name !== null)
                          .slice(0, 6)
                          .map(({ ing, name }) => (
                            <View key={ing} style={[styles.ingredientPill, { backgroundColor: `${rec.accent}22` }]}>
                              <Text style={[styles.ingredientPillText, { color: rec.accent }]}>{name}</Text>
                            </View>
                          ))}
                      </View>
                      {rec.cuisine ? <View style={[styles.cuisineChip, { alignSelf: 'flex-end' }]}><Text style={styles.cuisineChipText}>{rec.cuisine}</Text></View> : null}
                    </View>
                    <MacroRow
                      calories={rec.nutrition.calories}
                      protein={rec.nutrition.protein}
                      carbs={rec.nutrition.carbs}
                      fats={rec.nutrition.fats}
                      accent={rec.accent}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Recent Recipes */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="restaurant-outline" size={14} color={PRIMARY} />
              <Text style={styles.sectionTitle}>Recent Recipes</Text>
              <View style={styles.sectionDividerLine} />
              <TouchableOpacity onPress={() => router.push('/(tabs)/me')} activeOpacity={0.8}>
                <View style={styles.pantryBadge}>
                  <Text style={styles.pantryBadgeText}>{displayedRecipes.length} recipes</Text>
                </View>
              </TouchableOpacity>
              {user && recipes.length > 0 && (
                <TouchableOpacity onPress={() => router.push('/(tabs)/saved')} activeOpacity={0.8}>
                  <Text style={styles.sectionLink}>See all</Text>
                </TouchableOpacity>
              )}
            </View>
            {isLoading ? (
              <View style={styles.emptyCard}>
                <ActivityIndicator size="small" color={PRIMARY} />
                <Text style={styles.emptySubtitle}>Loading your recipes...</Text>
              </View>
            ) : (
              <View style={styles.cardScrollWrapper}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.cardScroll}>
                  {displayedRecipes.map((recipe) => (
                    <TouchableOpacity
                      key={recipe.id}
                      style={[styles.recCard, { backgroundColor: recipe.bg || SURFACE, height: 220 }]}
                      onPress={() => setSelectedMeal(recipe)}
                      activeOpacity={0.88}>
                      <View style={styles.recCardBody}>
                        <View style={styles.recCardTop}>
                          <View style={styles.agopill}>
                            <Text style={styles.agoPillText}>{recipe.createdAt ? timeAgo(recipe.createdAt) : ''}</Text>
                          </View>
                          {recipe.timeMinutes > 0 && (
                            <View style={styles.timeBadge}>
                              <Ionicons name="time-outline" size={11} color={MUTED} />
                              <Text style={styles.timeBadgeText}>{recipe.timeMinutes} min</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.recCardTitle, { color: recipe.accent || MUTED, textShadowColor: DARK }]} numberOfLines={2}>{recipe.title}</Text>
                        <View style={styles.ingredientPillRow}>
                          {recipe.ingredients
                            .map((ing) => ({ ing, name: ingredientName(ing) }))
                            .filter((x): x is { ing: string; name: string } => x.name !== null)
                            .slice(0, 6)
                            .map(({ ing, name }) => (
                              <View key={ing} style={[styles.ingredientPill, { backgroundColor: `${recipe.accent || MUTED}22` }]}>
                                <Text style={[styles.ingredientPillText, { color: recipe.accent || MUTED }]}>{name}</Text>
                              </View>
                            ))}
                        </View>
                        {recipe.cuisine ? <View style={[styles.cuisineChip, { alignSelf: 'flex-end' }]}><Text style={styles.cuisineChipText}>{recipe.cuisine}</Text></View> : null}
                      </View>
                      <MacroRow
                        calories={recipe.nutrition.calories}
                        protein={recipe.nutrition.protein}
                        carbs={recipe.nutrition.carbs}
                        fats={recipe.nutrition.fats}
                        accent={recipe.accent || MUTED}
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Daily spark */}
          <TouchableOpacity
            style={[styles.promptCard, { backgroundColor: prompt.bg }]}
            onPress={() => router.push(prompt.route as any)}
            activeOpacity={0.85}>
            <View style={styles.promptIcon}>
              <Ionicons name={prompt.icon as any} size={20} color={prompt.color} />
            </View>
            <View style={styles.promptCopy}>
              <Text style={styles.promptText}>{prompt.text}</Text>
              <Text style={[styles.promptAction, { color: prompt.color }]}>{prompt.action} →</Text>
            </View>
          </TouchableOpacity>

          {/* Blowing Up — viral dishes from yesterday */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="flame-outline" size={14} color={PRIMARY} />
              <Text style={styles.sectionTitle}>Blowing Up</Text>
              <View style={styles.sectionDividerLine} />
              <Text style={styles.sectionMeta}>From yesterday</Text>
            </View>
            {viralLoading ? (
              <View style={styles.emptyCard}>
                <ActivityIndicator size="small" color={PRIMARY} />
                <Text style={styles.emptySubtitle}>Fetching what's trending...</Text>
              </View>
            ) : (
              <View style={styles.cardScrollWrapper}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.cardScroll}>
                  {viralDishes.slice().sort((a, b) => parseViews(b.views) - parseViews(a.views)).map((t) => (
                    <TrendCardItem key={t.id} t={t} onPress={() => setSelectedMeal(t)} />
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

        </View>
      </ScrollView>

      {/* Meal Detail Modal */}
      <Modal
        visible={!!selectedMeal}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedMeal(null)}>
        {selectedMeal && (
          <MealSheet meal={selectedMeal} onClose={() => setSelectedMeal(null)} isFav={favoriteIds.has(selectedMeal.id)} onToggleFav={() => toggleFavorite(selectedMeal.id, selectedMeal)} />
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: DARK },
  screen: { flex: 1, backgroundColor: BG },
  container: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 85 },
  content: { gap: 22 },

  // Hero
  hero: {
    backgroundColor: DARK,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    gap: 12,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  heroCopy: { flex: 1 },
  heroIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    color: GOLD,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    textShadowColor: DARK,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
  title: {
    ...brandType,
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 30,
    marginTop: 2,
    textTransform: 'uppercase',
    textShadowColor: DARK,
    textShadowOffset: { width: 1.5, height: 1.5 },
    textShadowRadius: 0,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    lineHeight: 20,
  },

  // Sections
  section: { gap: 12 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E3EA',
  },
  sectionTitle: {
    ...brandType,
    color: PRIMARY,
    fontSize: 16,
    textTransform: 'uppercase',
    textShadowColor: DARK,
    textShadowOffset: { width: 0.25, height: 0.25 },
    textShadowRadius: 0,
  },
  sectionMeta: {
    ...brandType,
    color: MUTED,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  sectionLink: {
    ...brandType,
    color: PRIMARY,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  pantryBadge: {
    backgroundColor: '#FFE8E2',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pantryBadgeText: {
    color: PRIMARY,
    fontSize: 10,
    fontWeight: '700',
  },

  // Horizontal card scroll
  cardScrollWrapper: { marginHorizontal: -16 },
  cardScroll: { paddingHorizontal: 16, gap: 12 },

  // Rec card (pantry + recent)
  recCard: {
    width: 224,
    height: 210,
    borderRadius: 24,
    padding: 16,
    gap: 10,
    overflow: 'hidden',
  },
  recCardBody: {
    flex: 1,
    gap: 10,
    overflow: 'hidden',
  },
  recCardLight: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: '#EDE8E0',
  },
  recCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cuisineChip: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.07)',
    alignSelf: 'flex-start',
  },
  cuisineChipText: { color: DARK, fontSize: 9, fontWeight: '700' },
  goalPill: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  goalPillText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  agopill: {
    backgroundColor: '#F0EBE3',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  agoPillText: {
    color: DARK,
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timeBadgeText: {
    color: MUTED,
    fontSize: 10,
    fontWeight: '600',
  },
  recCardTitle: {
    ...brandType,
    color: DARK,
    fontSize: 14,
    lineHeight: 18,
    textTransform: 'uppercase',
    textShadowOffset: { width: 0.25, height: 0.25 },
    textShadowRadius: 0,
  },
  ingredientPillRow: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    alignContent: 'flex-start',
    overflow: 'hidden',
  },
  ingredientPill: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  ingredientPillText: {
    fontSize: 10,
    fontWeight: '600',
  },

  // Macros
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 12,
    paddingVertical: 5,
    marginTop: 2,
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
  },
  macroValue: {
    ...brandType,
    fontSize: 9,
    textTransform: 'uppercase',
  },
  macroLabel: {
    color: MUTED,
    fontSize: 7,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  macroDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },

  // Daily prompt card
  promptCard: {
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  promptIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptCopy: { flex: 1, gap: 4 },
  promptText: {
    color: DARK,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  promptAction: {
    ...brandType,
    fontSize: 12,
    textTransform: 'uppercase',
  },

  // Trending card
  trendCard: {
    width: 210,
    borderRadius: 24,
    padding: 16,
    gap: 10,
  },
  trendTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  platformLabel: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  trendViews: {
    fontSize: 10,
    fontWeight: '700',
  },
  trendDesc: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  trendTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  trendTitle: {
    ...brandType,
    flex: 1,
    color: DARK,
    fontSize: 14,
    lineHeight: 18,
    textTransform: 'uppercase',
    textShadowOffset: { width: 0.35, height: 0.35 },
    textShadowRadius: 0,
  },
  trendInfoBtn: {
    paddingTop: 1,
  },
  trendDescBubble: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  trendDescText: {
    color: DARK,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },

  // Empty states
  emptyCard: {
    minHeight: 120,
    backgroundColor: SURFACE,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
  },
  emptyIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFE8E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...brandType,
    color: DARK,
    fontSize: 15,
    textTransform: 'uppercase',
  },
  emptySubtitle: {
    color: MUTED,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Modal sheet
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sheetPanel: {
    backgroundColor: SURFACE,
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
  sheetCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0EBE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  sheetTitleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6, gap: 10 },
  sheetTitle: {
    ...brandType,
    color: DARK,
    fontSize: 22,
    textTransform: 'uppercase',
    lineHeight: 26,
    flex: 1,
  },
  sheetTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  sheetTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0EBE3',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sheetTimeBadgeText: {
    color: MUTED,
    fontSize: 13,
    fontWeight: '600',
  },
  sheetDescription: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  sheetDivider: {
    height: 1,
    backgroundColor: '#EDE8E0',
    marginVertical: 10,
  },
  sheetSectionHead: {
    ...brandType,
    color: DARK,
    fontSize: 14,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  sheetListRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
    paddingRight: 8,
  },
  sheetBullet: {
    fontSize: 15,
    lineHeight: 20,
    marginRight: 8,
    minWidth: 14,
  },
  sheetStepCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  sheetStepCircleText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  sheetListText: {
    flex: 1,
    color: DARK,
    fontSize: 14,
    lineHeight: 20,
  },
  sheetMacroGrid: {
    flexDirection: 'row',
    backgroundColor: '#FFF8F0',
    borderRadius: 14,
    paddingVertical: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#FFE1D8',
  },
  sheetMacroCell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  sheetMacroDivider: {
    width: 1,
    backgroundColor: '#FFE1D8',
  },
  sheetMacroValue: {
    ...brandType,
    fontSize: 14,
  },
  sheetMacroLabel: {
    color: MUTED,
    fontSize: 9,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
});
