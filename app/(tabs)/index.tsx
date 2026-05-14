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

