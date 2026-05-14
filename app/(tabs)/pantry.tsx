import AsyncStorage from '@react-native-async-storage/async-storage';
import { brandType } from '@/constants/brand';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, initialWindowMetrics } from 'react-native-safe-area-context';

type QuickMeal = {
  title: string;
  cuisine: string;
  timeMinutes: number;
  description: string;
  steps: string[];
  keys: string[];
  accent: string;
  bg: string;
};

const QUICK_MEALS: QuickMeal[] = [
  {
    title: 'Garlic Egg Fried Rice',
    cuisine: 'Chinese',
    timeMinutes: 12,
    description: 'Leftover rice tossed in a hot wok with egg, garlic and soy. Ready in minutes.',
    steps: [
      'Heat a splash of oil in a wok or large pan on high heat.',
      'Add minced garlic and fry 30 seconds until fragrant.',
      'Push to the side, crack in eggs and scramble lightly.',
      'Add cold cooked rice, breaking up any clumps.',
      'Splash in soy sauce, toss everything together for 2–3 minutes.',
    ],
    keys: ['rice', 'eggs', 'garlic', 'soy sauce'],
    accent: '#FFBA35',
    bg: '#FFF3D0',
  },
  {
    title: 'Spicy Chickpea Stir-Fry',
    cuisine: 'Lebanese',
    timeMinutes: 15,
    description: 'Crispy chickpeas with chilli and garlic. Great over rice or scooped with flatbread.',
    steps: [
      'Drain and dry chickpeas well with a paper towel.',
      'Heat oil in a pan over high heat. Add chickpeas, cook 5–6 min until crispy.',
      'Add garlic and chilli flakes, stir 1 minute.',
      'Season with salt and a squeeze of lemon if you have one.',
      'Serve over rice or with bread.',
    ],
    keys: ['chickpeas', 'garlic', 'chilli flakes'],
    accent: '#FF5C35',
    bg: '#FFE8E2',
  },
  {
    title: 'One-Pan Tomato Chicken',
    cuisine: 'Greek',
    timeMinutes: 25,
    description: 'Chicken thighs braised with tomatoes and garlic. Simple, hearty, no-fuss.',
    steps: [
      'Season chicken with salt and pepper.',
      'Brown in an oiled pan 4 min per side, remove and set aside.',
      'Add garlic to pan, cook 1 min. Add chopped tomatoes.',
      'Nestle chicken back in, cover and simmer 15 minutes.',
      'Taste for seasoning and serve straight from the pan.',
    ],
    keys: ['chicken', 'tomatoes', 'garlic'],
    accent: '#FF5C35',
    bg: '#FFE8E2',
  },
  {
    title: 'Spinach & Egg Scramble',
    cuisine: 'French',
    timeMinutes: 10,
    description: 'Wilted spinach folded into soft scrambled eggs. Fast, filling, done.',
    steps: [
      'Heat a little oil or butter in a pan over medium heat.',
      'Add spinach and cook until just wilted, about 2 minutes.',
      'Beat eggs with a pinch of salt, pour into the pan.',
      'Stir gently with a spatula until just set. Keep them soft.',
      'Season and eat immediately.',
    ],
    keys: ['spinach', 'eggs'],
    accent: '#34A853',
    bg: '#E8F8EE',
  },
  {
    title: 'Pasta Aglio e Olio',
    cuisine: 'Italian',
    timeMinutes: 15,
    description: 'Spaghetti with olive oil, garlic and chilli. The most satisfying pantry pasta.',
    steps: [
      'Cook pasta in well-salted boiling water until al dente. Reserve a cup of pasta water.',
      'Heat olive oil gently in a pan, add sliced garlic and chilli flakes.',
      'Cook 2 min until garlic is just golden. Do not burn.',
      'Add drained pasta and a splash of pasta water. Toss vigorously.',
      'Serve immediately with extra chilli if you like.',
    ],
    keys: ['pasta', 'garlic', 'olive oil', 'chilli flakes'],
    accent: '#3B82F6',
    bg: '#EBF3FF',
  },
  {
    title: 'Yogurt Flatbread with Garlic',
    cuisine: 'Turkish',
    timeMinutes: 20,
    description: 'Two-ingredient flatbreads from yogurt and flour. Fresher and faster than you think.',
    steps: [
      'Mix 200g Greek yogurt with 200g self-raising flour (or plain flour + pinch of baking powder). Knead into a soft dough.',
      'Divide into 4 balls, roll each thin.',
      'Dry-fry in a hot pan 2 min per side until charred spots form.',
      'Brush with garlic-infused oil and a sprinkle of salt.',
      'Serve warm with anything you have.',
    ],
    keys: ['greek yogurt', 'garlic'],
    accent: '#7C3AED',
    bg: '#F0EBFF',
  },
  {
    title: 'Tomato & Egg Drop Soup',
    cuisine: 'Chinese',
    timeMinutes: 10,
    description: 'A silky, warming soup from just tomatoes and eggs. A Chinese home staple.',
    steps: [
      'Chop tomatoes and fry in oil for 3 minutes until they break down.',
      'Add 500ml water or stock, bring to a gentle simmer.',
      'Beat 2 eggs and pour slowly into the simmering soup in a thin stream, stirring gently.',
      'Season with soy sauce, salt and a drop of sesame oil if you have it.',
      'Serve immediately.',
    ],
    keys: ['tomatoes', 'eggs', 'soy sauce'],
    accent: '#FF5C35',
    bg: '#FFE8E2',
  },
  {
    title: 'Garlicky Soy Chicken',
    cuisine: 'Japanese',
    timeMinutes: 20,
    description: 'Chicken thighs glazed in a sticky soy-garlic sauce. Pairs perfectly with rice.',
    steps: [
      'Mix 3 tbsp soy sauce with 1 tsp sugar or honey.',
      'Heat oil in a pan, add chicken skin-side down. Cook 6 min until golden.',
      'Flip, add garlic, cook 2 more minutes.',
      'Pour in soy mix, let it bubble and reduce into a glaze, about 3 minutes.',
      'Serve over rice with the pan juices.',
    ],
    keys: ['chicken', 'soy sauce', 'garlic', 'rice'],
    accent: '#FFBA35',
    bg: '#FFF3D0',
  },
];

const BRAND_ORANGE = '#FF5C35';
const CREAM = '#FFF8F0';
const SURFACE = '#FFFFFF';
const INK = '#1C1F2E';
const MUTED = '#8E93A8';
const GOLD = '#FFBA35';

const BASKET_KEY = 'pantry_basket';
const STAPLES_KEY = 'pantry_staples';
const SHOPPING_MODAL_KEY = 'shopping_list_modal_v2';
const TEAL = '#2A9D8F';

const TOP_INSET = initialWindowMetrics?.insets.top ?? 0;

type ShoppingItem = { name: string; selected: boolean };

const SUGGESTION_POOL: Array<{ name: string; category: string }> = [
  // Protein
  { name: 'Chicken breast', category: 'Protein' },
  { name: 'Chicken thighs', category: 'Protein' },
  { name: 'Salmon fillets', category: 'Protein' },
  { name: 'Eggs', category: 'Protein' },
  { name: 'Minced beef', category: 'Protein' },
  { name: 'Prawns', category: 'Protein' },
  { name: 'Tofu', category: 'Protein' },
  { name: 'Tuna', category: 'Protein' },
  { name: 'Lamb chops', category: 'Protein' },
  { name: 'Cod fillets', category: 'Protein' },
  { name: 'Paneer', category: 'Protein' },
  { name: 'Pork tenderloin', category: 'Protein' },
  { name: 'Tempeh', category: 'Protein' },
  // Fruit
  { name: 'Banana', category: 'Fruit' },
  { name: 'Apples', category: 'Fruit' },
  { name: 'Mango', category: 'Fruit' },
  { name: 'Strawberries', category: 'Fruit' },
  { name: 'Blueberries', category: 'Fruit' },
  { name: 'Raspberries', category: 'Fruit' },
  { name: 'Grapes', category: 'Fruit' },
  { name: 'Oranges', category: 'Fruit' },
  { name: 'Melon', category: 'Fruit' },
  { name: 'Pomegranate', category: 'Fruit' },
  // Veg
  { name: 'Spinach', category: 'Veg' },
  { name: 'Broccoli', category: 'Veg' },
  { name: 'Tomatoes', category: 'Veg' },
  { name: 'Cherry tomatoes', category: 'Veg' },
  { name: 'Avocado', category: 'Veg' },
  { name: 'Red onion', category: 'Veg' },
  { name: 'White onion', category: 'Veg' },
  { name: 'Mushrooms', category: 'Veg' },
  { name: 'Courgette', category: 'Veg' },
  { name: 'Red pepper', category: 'Veg' },
  { name: 'Cucumber', category: 'Veg' },
  { name: 'Kale', category: 'Veg' },
  { name: 'Leek', category: 'Veg' },
  { name: 'Carrot', category: 'Veg' },
  { name: 'Sweet potato', category: 'Veg' },
  { name: 'Aubergine', category: 'Veg' },
  { name: 'Celery', category: 'Veg' },
  { name: 'Beetroot', category: 'Veg' },
  { name: 'Asparagus', category: 'Veg' },
  // Grains & Carbs
  { name: 'Pasta', category: 'Grains' },
  { name: 'Rice', category: 'Grains' },
  { name: 'Sourdough', category: 'Grains' },
  { name: 'Oats', category: 'Grains' },
  { name: 'Quinoa', category: 'Grains' },
  { name: 'Naan', category: 'Grains' },
  { name: 'Couscous', category: 'Grains' },
  { name: 'Tortillas', category: 'Grains' },
  { name: 'Bread', category: 'Grains' },
  // Dairy
  { name: 'Greek yogurt', category: 'Dairy' },
  { name: 'Cheddar', category: 'Dairy' },
  { name: 'Feta', category: 'Dairy' },
  { name: 'Mozzarella', category: 'Dairy' },
  { name: 'Double cream', category: 'Dairy' },
  { name: 'Parmesan', category: 'Dairy' },
  { name: 'Milk', category: 'Dairy' },
  { name: 'Cream cheese', category: 'Dairy' },
  { name: 'Halloumi', category: 'Dairy' },
  { name: 'Butter', category: 'Dairy' },
  // Tins & Pantry
  { name: 'Chickpeas', category: 'Tins' },
  { name: 'Chopped tomatoes', category: 'Tins' },
  { name: 'Coconut milk', category: 'Tins' },
  { name: 'Black beans', category: 'Tins' },
  { name: 'Red lentils', category: 'Tins' },
  { name: 'Kidney beans', category: 'Tins' },
  { name: 'Coconut cream', category: 'Tins' },
  { name: 'Passata', category: 'Tins' },
];

const CATEGORY_ACCENT: Record<string, { accent: string; bg: string }> = {
  Protein: { accent: '#FF5C35', bg: '#FFCFC4' },
  Fruit:   { accent: '#E03A6A', bg: '#FFC2D4' },
  Veg:     { accent: '#5A8A2A', bg: '#C8E89A' },
  Dairy:   { accent: '#2A8A7A', bg: '#A8E0DA' },
  Grains:  { accent: '#CC8A00', bg: '#FFE099' },
  Tins:    { accent: '#8A3A20', bg: '#F0B8A0' },
  Other:   { accent: '#6A6F80', bg: '#D8DAE8' },
};

const CATEGORY_ORDER = ['Protein', 'Fruit', 'Veg', 'Dairy', 'Grains', 'Tins', 'Other'];

const WEEK_QUOTAS: Record<string, number> = {
  Protein: 4,
  Veg: 6,
  Fruit: 3,
  Dairy: 3,
  Grains: 3,
  Tins: 3,
};

function generateCuratedList(pantryAll: string[]): ShoppingItem[] {
  const pantryLower = pantryAll.map((s) => s.toLowerCase());
  const available = SUGGESTION_POOL
    .filter((s) => {
      const n = s.name.toLowerCase();
      return !pantryLower.some((p) => p.includes(n) || n.includes(p));
    })
    .map((s) => {
      const n = s.name.toLowerCase();
      const score = QUICK_MEALS.reduce(
        (acc, meal) => acc + meal.keys.filter((k) => n.includes(k) || k.includes(n)).length,
        0,
      );
      return { ...s, score };
    })
    .sort((a, b) => b.score - a.score);

  const countByCat: Record<string, number> = {};
  const picked: typeof available = [];
  for (const item of available) {
    const quota = WEEK_QUOTAS[item.category] ?? 0;
    if (quota > 0 && (countByCat[item.category] ?? 0) < quota) {
      picked.push(item);
      countByCat[item.category] = (countByCat[item.category] ?? 0) + 1;
    }
  }
  return picked.map((item) => ({ name: item.name, selected: false }));
}

function categorizeIngredient(name: string): string {
  const n = name.toLowerCase();
  const has = (k: string) => n.includes(k);
  const any = (...ks: string[]) => ks.some(has);

  // Protein — meat, fish, seafood, eggs, plant proteins
  if (any('chicken','beef','lamb','pork','duck','turkey','venison','brisket','steak','mince','sausage','bacon','ham','prosciutto','chorizo','pancetta','salami','pepperoni')) return 'Protein';
  if (any('salmon','tuna','cod','sea bass','mackerel','haddock','tilapia','trout','halibut','snapper','sardine','anchov','prawn','shrimp','scallop','mussel','clam','squid','crab','lobster','oyster','fish','seafood')) return 'Protein';
  if (any('egg','tofu','paneer','tempeh','seitan','quorn')) return 'Protein';
  if (any('chickpea','lentil','black bean','kidney bean','butter bean','cannellini','borlotti','edamame')) return 'Protein';

  // Fruit
  if (any('apple','banana','strawberr','blueberr','raspberr','blackberr','gooseberr','berry','berries','mango','orange','grape','pear','peach','plum','cherry','cherries','watermelon','melon','pineapple','kiwi','grapefruit','fig','pomegranate','lychee','papaya','guava','apricot','nectarine','passion fruit','clementine','mandarin','satsuma')) return 'Fruit';

  // Dairy — check before veg to catch "cream" / "butter" correctly
  if (any('milk','yogurt','yoghurt','cheddar','mozzarella','feta','parmesan','brie','gouda','ricotta','halloumi','cottage cheese','mascarpone','burrata','gruyere','gruyère','emmental','manchego','kefir','creme fraiche','crème fraîche','sour cream','ice cream','custard','cheese','cream','butter','ghee')) return 'Dairy';

  // Veg — leafy, brassica, alliums, nightshades, root, other
  if (any('spinach','kale','lettuce','cabbage','rocket','watercress','chard','pak choi','bok choy','radicchio','endive','chicory')) return 'Veg';
  if (any('broccoli','cauliflower','courgette','zucchini','aubergine','eggplant','cucumber','celery','fennel','asparagus','artichoke')) return 'Veg';
  if (any('pepper','tomato','leek','onion','shallot','spring onion','scallion','garlic','ginger','chilli','chili')) return 'Veg';
  if (any('potato','sweet potato','carrot','parsnip','beetroot','beet','turnip','swede','celeriac','radish','squash','pumpkin','butternut','yam')) return 'Veg';
  if (any('mushroom','avocado','corn','sweetcorn','pea','mangetout','bean sprout','brussels','sprout','okra')) return 'Veg';

  // Grains & Carbs
  if (any('pasta','spaghetti','penne','rigatoni','linguine','fettuccine','tagliatelle','fusilli','orzo','rice','noodle','bread','sourdough','naan','pitta','tortilla','bagel','baguette','ciabatta','focaccia','oat','quinoa','couscous','bulgur','barley','farro','polenta','flour','cracker','cereal','granola','brioche','rye','wrap')) return 'Grains';

  // Tins & Pantry
  if (any('coconut milk','coconut cream','chopped tomato','passata','tomato paste','tomato puree','tomato purée','canned','tinned','stock','broth','pickle','harissa','tahini','pesto','miso','olive','caper','sun-dried','sundried')) return 'Tins';

  return 'Other';
}

const SPELLING_VARIANTS: Record<string, string> = {
  // US → UK
  chili: 'chilli',
  'chili flakes': 'chilli flakes',
  zucchini: 'courgette',
  eggplant: 'aubergine',
  shrimp: 'prawns',
  cilantro: 'coriander',
  arugula: 'rocket',
  scallion: 'spring onion',
  scallions: 'spring onions',
  'ground beef': 'mince',
  'ground meat': 'mince',
};

function dedupeIngredients(ingredients: string[]): string[] {
  // 1. Normalise spelling variants
  const normalised = ingredients.map((k) => SPELLING_VARIANTS[k.toLowerCase()] ?? k);

  // 2. Exact deduplicate (case-insensitive, first occurrence wins)
  const seen = new Set<string>();
  const deduped = normalised.filter((k) => {
    const lower = k.toLowerCase();
    if (seen.has(lower)) return false;
    seen.add(lower);
    return true;
  });

  // 3. Remove any entry that is a substring of a longer entry in the same list
  const lowers = deduped.map((k) => k.toLowerCase());
  return deduped.filter((k, i) =>
    !lowers.some((other, j) => j !== i && other.includes(lowers[i]) && other.length > lowers[i].length),
  );
}

