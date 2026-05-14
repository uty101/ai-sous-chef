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

const MOCK_SAVED_RECIPES: SavedRecipe[] = [
  // ── This Week ──────────────────────────────────────────────
  {
    id: 'mock-1',
    createdAt: new Date(Date.now() - 1 * 864e5).toISOString(),
    title: 'Garlic Spinach Egg Fried Rice',
    cuisine: 'Chinese',
    description: 'Day-old rice tossed in a hot wok with egg, garlic, spinach, and soy. Ready in under 20 minutes.',
    timeMinutes: 18,
    ingredients: ['200g cooked rice (day-old works best)', '2 eggs, beaten', '2 garlic cloves, minced', 'Handful of spinach', '2 tbsp soy sauce', '1 tsp sesame oil', '1 tbsp vegetable oil', 'Spring onions to serve'],
    steps: ['Heat vegetable oil in a wok over high heat until smoking.', 'Add garlic and stir-fry 30 seconds.', 'Push garlic aside, pour in eggs and scramble until just set.', 'Add rice and break up any clumps. Toss constantly for 3 min.', 'Add spinach and soy sauce. Toss until wilted.', 'Finish with sesame oil and spring onions.'],
    nutrition: { calories: 360, protein: 14, carbs: 52, fats: 10 },
  },
  {
    id: 'mock-2',
    createdAt: new Date(Date.now() - 3 * 864e5).toISOString(),
    title: 'Lemon Herb Salmon',
    cuisine: 'Scandinavian',
    description: 'Flaky salmon fillets pan-seared with lemon, dill, and garlic. Light, fast, and packed with omega-3s.',
    timeMinutes: 22,
    ingredients: ['2 salmon fillets (approx. 180g each)', '1 lemon, sliced and juiced', '2 garlic cloves, minced', '1 tbsp fresh dill, chopped', '1 tbsp butter', 'Salt and black pepper'],
    steps: ['Pat salmon fillets dry and season generously with salt and pepper.', 'Heat olive oil and butter in a non-stick skillet over medium-high heat.', 'Place salmon skin-side up in the pan. Cook 4 minutes until golden.', 'Flip and add minced garlic. Cook 3 more minutes.', 'Add lemon slices and squeeze over the juice. Baste with pan juices.', 'Remove from heat, scatter with fresh dill, and serve immediately.'],
    nutrition: { calories: 390, protein: 38, carbs: 6, fats: 22 },
  },
  {
    id: 'mock-3',
    createdAt: new Date(Date.now() - 5 * 864e5).toISOString(),
    title: 'Chicken Tikka Masala',
    cuisine: 'Indian',
    description: 'Tender marinated chicken in a rich aromatic tomato-cream sauce. A classic that never disappoints.',
    timeMinutes: 40,
    ingredients: ['500g chicken breast, diced', '200g Greek yogurt', '2 tsp garam masala', '1 tsp ground cumin', '400g chopped tomatoes', '1 onion, diced', '3 garlic cloves, minced', '100ml single cream', 'Fresh coriander to garnish'],
    steps: ['Mix chicken with yogurt, garam masala, and cumin. Marinate 15 minutes.', 'Pan-fry over high heat until lightly charred. Set aside.', 'Fry onion in butter for 5 minutes until golden.', 'Add garlic and spices. Cook 2 minutes.', 'Add tomatoes and simmer 10 minutes.', 'Add chicken and cream. Simmer 8 minutes. Garnish with coriander.'],
    nutrition: { calories: 480, protein: 44, carbs: 18, fats: 24 },
  },
  {
    id: 'mock-4',
    createdAt: new Date(Date.now() - 6 * 864e5).toISOString(),
    title: 'Lemon Chickpea Bowls',
    cuisine: 'Lebanese',
    description: 'Warmly spiced chickpeas and wilted spinach in a bright lemon-garlic dressing.',
    timeMinutes: 25,
    ingredients: ['1 x 400g tin chickpeas, drained', 'Handful of spinach', '2 garlic cloves, minced', '1 lemon, juiced and zested', '2 tbsp olive oil', '1 tsp ground cumin', 'Salt and black pepper', 'Fresh parsley to serve'],
    steps: ['Heat olive oil in a pan over medium heat.', 'Add garlic and cumin. Cook 1 min until fragrant.', 'Add chickpeas. Toss and cook 5 min until lightly golden.', 'Add spinach and lemon juice. Stir until wilted.', 'Season and finish with lemon zest and parsley.'],
    nutrition: { calories: 350, protein: 15, carbs: 40, fats: 14 },
  },
  // ── This Month ─────────────────────────────────────────────
  {
    id: 'mock-5',
    createdAt: new Date(Date.now() - 8 * 864e5).toISOString(),
    title: 'Pasta Pomodoro',
    cuisine: 'Italian',
    description: 'The simplest Italian pasta. Ripe tomatoes, good olive oil, and fresh basil. Nothing more needed.',
    timeMinutes: 15,
    ingredients: ['200g spaghetti', '400g chopped tomatoes', '3 garlic cloves, sliced', '4 tbsp olive oil', 'Handful of fresh basil', 'Salt and black pepper'],
    steps: ['Cook pasta in well-salted boiling water.', 'Heat olive oil. Add garlic and cook 2–3 min until golden.', 'Add tomatoes. Season and simmer 10 min.', 'Reserve a cup of pasta water, then drain.', 'Toss pasta into sauce with a splash of pasta water. Top with basil.'],
    nutrition: { calories: 420, protein: 12, carbs: 68, fats: 14 },
  },
  {
    id: 'mock-6',
    createdAt: new Date(Date.now() - 10 * 864e5).toISOString(),
    title: 'Tomato & Onion Omelette',
    cuisine: 'French',
    description: 'A soft, golden omelette packed with sweet tomatoes and onion. Fast protein any time of day.',
    timeMinutes: 12,
    ingredients: ['3 eggs', '1 tomato, diced', '1/2 onion, finely diced', '1 tsp olive oil', 'Salt and black pepper', 'Fresh herbs to serve'],
    steps: ['Beat eggs with salt and pepper.', 'Sauté onion in olive oil for 3 min until soft.', 'Add tomato and cook 2 min.', 'Pour eggs over the vegetables. Cook on low without stirring.', 'When nearly set, fold in half and slide onto a plate.'],
    nutrition: { calories: 260, protein: 18, carbs: 8, fats: 16 },
  },
  {
    id: 'mock-7',
    createdAt: new Date(Date.now() - 11 * 864e5).toISOString(),
    title: 'Soy Glazed Tofu Rice Bowl',
    cuisine: 'Japanese',
    description: 'Crispy tofu in a sticky soy glaze over steamed rice. Simple, satisfying, plant-based.',
    timeMinutes: 22,
    ingredients: ['200g firm tofu, cubed', '150g steamed rice', '2 tbsp soy sauce', '1 tsp sesame oil', '1 garlic clove, minced', '1 tsp honey', '1 tbsp vegetable oil', 'Sesame seeds and spring onions to serve'],
    steps: ['Press tofu dry with a cloth and cube it.', 'Mix soy sauce, sesame oil, garlic, and honey for the glaze.', 'Heat oil in a pan. Fry tofu 5 min until crispy on all sides.', 'Pour glaze over tofu. Toss and cook 2 min until sticky.', 'Serve over rice with sesame seeds and spring onions.'],
    nutrition: { calories: 400, protein: 20, carbs: 48, fats: 14 },
  },
  // ── Last Month ─────────────────────────────────────────────
  {
    id: 'mock-8',
    createdAt: new Date(Date.now() - 20 * 864e5).toISOString(),
    title: 'Avocado Toast & Eggs',
    cuisine: 'Australian',
    description: 'Creamy smashed avocado on crispy sourdough, topped with a fried egg and chilli.',
    timeMinutes: 12,
    ingredients: ['2 slices sourdough bread', '1 ripe avocado', '2 eggs', '1/2 lemon, juiced', 'Pinch of chilli flakes', 'Salt and black pepper'],
    steps: ['Toast bread until golden and crisp.', 'Mash avocado with lemon juice, salt, and pepper.', 'Fry eggs to your liking.', 'Spread avocado over each slice of toast.', 'Top with a fried egg and a pinch of chilli flakes.'],
    nutrition: { calories: 340, protein: 16, carbs: 28, fats: 22 },
  },
  {
    id: 'mock-9',
    createdAt: new Date(Date.now() - 28 * 864e5).toISOString(),
    title: 'Garlic Yogurt Chicken',
    cuisine: 'Turkish',
    description: 'Marinated chicken thighs grilled and served over garlicky yogurt with a paprika butter drizzle.',
    timeMinutes: 35,
    ingredients: ['4 chicken thighs, boneless', '200g Greek yogurt', '3 garlic cloves, minced', '1 lemon, juiced', '1 tsp smoked paprika', '1 tbsp butter', 'Salt, cumin, and black pepper', 'Fresh parsley to serve'],
    steps: ['Mix chicken with half the yogurt, garlic, lemon, cumin, and salt. Marinate 15 min.', 'Grill or pan-fry chicken over high heat 6–7 min per side until cooked through.', 'Mix remaining yogurt with garlic. Spread on a serving plate.', 'Slice rested chicken and place on top of yogurt.', 'Melt butter with paprika. Drizzle over. Top with parsley.'],
    nutrition: { calories: 460, protein: 38, carbs: 10, fats: 26 },
  },
  {
    id: 'mock-10',
    createdAt: new Date(Date.now() - 35 * 864e5).toISOString(),
    title: 'Pasta Arrabiata',
    cuisine: 'Italian',
    description: 'Penne in a bold garlicky tomato sauce with just the right amount of heat.',
    timeMinutes: 18,
    ingredients: ['200g penne', '400g chopped tomatoes', '3 garlic cloves, sliced', '1 tsp dried chilli flakes', '3 tbsp olive oil', 'Fresh basil to serve', 'Salt to taste'],
    steps: ['Cook pasta in well-salted boiling water.', 'Heat oil in a pan. Add garlic and chilli flakes. Cook 2 minutes.', 'Pour in tomatoes. Season and simmer 8 minutes.', 'Drain pasta. Toss into sauce with a splash of pasta water.', 'Serve with fresh basil.'],
    nutrition: { calories: 420, protein: 14, carbs: 68, fats: 13 },
  },
  // ── Older ──────────────────────────────────────────────────
  {
    id: 'mock-11',
    createdAt: new Date(Date.now() - 55 * 864e5).toISOString(),
    title: 'Chickpea & Spinach Stew',
    cuisine: 'Moroccan',
    description: 'A hearty, warmly spiced stew of chickpeas and spinach simmered in a rich tomato base.',
    timeMinutes: 30,
    ingredients: ['1 x 400g tin chickpeas, drained', 'Handful of spinach', '400g chopped tomatoes', '1 onion, diced', '3 garlic cloves, minced', '1 tsp cumin', '1 tsp smoked paprika', '1/2 tsp turmeric', '2 tbsp olive oil', 'Salt and black pepper', 'Fresh coriander to serve'],
    steps: ['Heat olive oil in a pot. Cook onion 5 min until soft.', 'Add garlic, cumin, paprika, and turmeric. Cook 2 min.', 'Add chopped tomatoes. Simmer 8 min.', 'Add chickpeas. Simmer 10 more min.', 'Stir in spinach until wilted. Season and top with coriander.'],
    nutrition: { calories: 320, protein: 14, carbs: 44, fats: 10 },
  },
  {
    id: 'mock-12',
    createdAt: new Date(Date.now() - 80 * 864e5).toISOString(),
    title: 'Greek Salad Bowl',
    cuisine: 'Greek',
    description: 'Crisp vegetables, briny olives, and chunky feta in a punchy oregano dressing.',
    timeMinutes: 10,
    ingredients: ['200g cucumber, diced', '200g cherry tomatoes, halved', '1/2 red onion, sliced', '100g Kalamata olives', '150g feta cheese', '2 tbsp olive oil', '1 tsp dried oregano'],
    steps: ['Combine cucumber, tomatoes, red onion, and olives in a bowl.', 'Whisk olive oil, red wine vinegar, and oregano.', 'Pour dressing over vegetables and toss gently.', 'Arrange feta chunks on top.', 'Season and serve immediately.'],
    nutrition: { calories: 290, protein: 10, carbs: 12, fats: 22 },
  },
  {
    id: 'mock-13',
    createdAt: new Date(Date.now() - 100 * 864e5).toISOString(),
    title: 'Classic Egg Fried Rice',
    cuisine: 'Chinese',
    description: 'The ultimate leftover rice dish. Eggs, soy sauce, and high heat make this better than a takeaway.',
    timeMinutes: 15,
    ingredients: ['300g cooked rice (cold)', '3 eggs, beaten', '2 garlic cloves, minced', '2 tbsp soy sauce', '1 tsp sesame oil', '1 tbsp vegetable oil', 'Spring onions to serve'],
    steps: ['Heat oil in a wok over the highest heat until smoking.', 'Add garlic, stir-fry 30 seconds.', 'Add cold rice, breaking up clumps. Toss constantly for 3 min.', 'Push rice to the side. Pour in eggs and scramble until just set.', 'Mix eggs into rice. Add soy sauce and sesame oil. Toss well. Top with spring onions.'],
    nutrition: { calories: 380, protein: 16, carbs: 54, fats: 12 },
  },
];

function isRecipeResult(value: unknown): value is RecipeResult {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.title === 'string' &&
    typeof item.description === 'string' &&
    Array.isArray(item.ingredients) &&
    item.ingredients.every((e) => typeof e === 'string') &&
    Array.isArray(item.steps) &&
    item.steps.every((e) => typeof e === 'string') &&
    typeof item.timeMinutes === 'number'
  );
}

function normalizeSavedRecipe(value: unknown): SavedRecipe | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  const mappedRecipe: RecipeResult = {
    title: typeof item.title === 'string' ? item.title : '',
    description: typeof item.description === 'string' ? item.description : '',
    ingredients: Array.isArray(item.ingredients)
      ? item.ingredients.filter((e): e is string => typeof e === 'string')
      : [],
    steps: Array.isArray(item.steps)
      ? item.steps.filter((e): e is string => typeof e === 'string')
      : [],
    timeMinutes: typeof item.time_minutes === 'number' ? item.time_minutes : 0,
    cuisine: typeof item.cuisine === 'string' ? item.cuisine : undefined,
    nutrition: (() => {
      const n = item.nutrition as any;
      if (!n || typeof n !== 'object') return undefined;
      const cal = typeof n.calories === 'number' ? n.calories : null;
      const pro = typeof n.protein === 'number' ? n.protein : null;
      const carb = typeof n.carbs === 'number' ? n.carbs : null;
      const fat = typeof n.fats === 'number' ? n.fats : null;
      if (cal == null && pro == null && carb == null && fat == null) return undefined;
      return { calories: cal ?? 0, protein: pro ?? 0, carbs: carb ?? 0, fats: fat ?? 0 };
    })(),
  };
  if (!isRecipeResult(mappedRecipe) || typeof item.id !== 'string') return null;
  return {
    id: item.id,
    createdAt: typeof item.created_at === 'string' ? item.created_at : '',
    ...mappedRecipe,
  };
}

function MacroRow({
  calories, protein, carbs, fats, accent,
}: {
  calories: number | null; protein: number | null;
  carbs: number | null; fats: number | null; accent: string;
}) {
  const val = (v: number | null, unit?: string) => v != null ? `${v}${unit ?? ''}` : '—';
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

function MealSheet({ meal, onClose, isFav, onToggleFav }: {
  meal: SavedRecipeCard;
  onClose: () => void;
  isFav: boolean;
  onToggleFav: () => void;
}) {
  const [displaySteps, setDisplaySteps] = useState<string[]>(meal.steps);
  const [stepsLoading, setStepsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    personaliseSteps({ title: meal.title, ingredients: meal.ingredients, steps: meal.steps, timeMinutes: meal.timeMinutes }, deriveVibe(meal.timeMinutes))
      .then(steps => { if (!cancelled) { setDisplaySteps(steps); setStepsLoading(false); } })
      .catch(() => { if (!cancelled) setStepsLoading(false); });
    return () => { cancelled = true; };
  }, [meal.id]);

  return (
    <View style={styles.sheetOverlay}>
      <View style={[styles.sheetPanel, { backgroundColor: meal.bg }]}>
        {/* Header — tags + actions on same row */}
        <View style={styles.sheetHeader}>
          <View style={styles.sheetHeaderTags}>
            <View style={[styles.sheetTimeBadge, { backgroundColor: 'rgba(255,255,255,0.65)' }]}>
              <Ionicons name="time-outline" size={13} color={MUTED} />
              <Text style={styles.sheetTimeBadgeText}>{meal.timeMinutes} min</Text>
            </View>
            <View style={[styles.sheetTimeBadge, { backgroundColor: 'rgba(255,255,255,0.65)' }]}>
              <Text style={styles.sheetTimeBadgeText}>{meal.cuisine ?? 'International'}</Text>
            </View>
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

        <ScrollView contentContainerStyle={styles.sheetScrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.sheetTitleRow}>
            <Text style={[styles.sheetTitle, { color: meal.accent, textShadowColor: DARK, textShadowOffset: { width: 0.25, height: 0.25 }, textShadowRadius: 0 }]}>{meal.title}</Text>
            <TouchableOpacity onPress={onToggleFav} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} activeOpacity={0.7}>
              <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={22} color={isFav ? PRIMARY : meal.accent} />
            </TouchableOpacity>
          </View>

          <Text style={styles.sheetDescription} numberOfLines={1}>{meal.description}</Text>

          <View style={[styles.sheetDivider, { backgroundColor: meal.accent + '30' }]} />

          <Text style={[styles.sheetSectionHead, { color: meal.accent }]}>Ingredients</Text>
          {meal.ingredients.map((ing, i) => (
            <View key={i} style={styles.sheetListRow}>
              <Text style={[styles.sheetBullet, { color: meal.accent }]}>{'•'}</Text>
              <Text style={styles.sheetListText}>{ing}</Text>
            </View>
          ))}

          <View style={[styles.sheetDivider, { backgroundColor: meal.accent + '30' }]} />

          <Text style={[styles.sheetSectionHead, { color: meal.accent }]}>Steps</Text>
          {stepsLoading ? (
            <ActivityIndicator size="small" color={meal.accent} style={{ marginVertical: 12 }} />
          ) : (
            displaySteps.map((step, i) => (
              <View key={i} style={styles.sheetListRow}>
                <View style={[styles.sheetStepCircle, { backgroundColor: meal.accent }]}>
                  <Text style={styles.sheetStepCircleText}>{i + 1}</Text>
                </View>
                <Text style={styles.sheetListText}>{step}</Text>
              </View>
            ))
          )}

          <View style={[styles.sheetDivider, { backgroundColor: meal.accent + '30' }]} />
          <Text style={[styles.sheetSectionHead, { color: meal.accent }]}>Nutritional Info</Text>
          <View style={[styles.sheetMacroGrid, { backgroundColor: 'rgba(255,255,255,0.65)', borderColor: meal.accent + '30' }]}>
            <View style={styles.sheetMacroCell}>
              <Text style={[styles.sheetMacroValue, { color: meal.accent }]}>{meal.nutrition?.calories ?? '—'}</Text>
              <Text style={styles.sheetMacroLabel}>Calories</Text>
            </View>
            <View style={[styles.sheetMacroDivider, { backgroundColor: meal.accent + '30' }]} />
            <View style={styles.sheetMacroCell}>
              <Text style={[styles.sheetMacroValue, { color: meal.accent }]}>{meal.nutrition?.protein != null ? `${meal.nutrition.protein}g` : '—'}</Text>
              <Text style={styles.sheetMacroLabel}>Protein</Text>
            </View>
            <View style={[styles.sheetMacroDivider, { backgroundColor: meal.accent + '30' }]} />
            <View style={styles.sheetMacroCell}>
              <Text style={[styles.sheetMacroValue, { color: meal.accent }]}>{meal.nutrition?.carbs != null ? `${meal.nutrition.carbs}g` : '—'}</Text>
              <Text style={styles.sheetMacroLabel}>Carbs</Text>
            </View>
            <View style={[styles.sheetMacroDivider, { backgroundColor: meal.accent + '30' }]} />
            <View style={styles.sheetMacroCell}>
              <Text style={[styles.sheetMacroValue, { color: meal.accent }]}>{meal.nutrition?.fats != null ? `${meal.nutrition.fats}g` : '—'}</Text>
              <Text style={styles.sheetMacroLabel}>Fats</Text>
            </View>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    </View>
  );
}

function RecipeCard({ recipe, isFav, onPress }: {
  recipe: SavedRecipeCard;
  isFav: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.recCard, { backgroundColor: recipe.bg }]}
      onPress={onPress}
      activeOpacity={0.88}>
      <View style={styles.recCardTop}>
        <View style={[styles.cuisineChip, { backgroundColor: `${recipe.accent}22` }]}>
          <Text style={[styles.cuisineChipText, { color: recipe.accent }]}>{recipe.cuisine ?? 'International'}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={styles.timeBadge}>
            <Ionicons name="time-outline" size={11} color={MUTED} />
            <Text style={styles.timeBadgeText}>{recipe.timeMinutes} min</Text>
          </View>
          {isFav && <Ionicons name="heart" size={11} color={PRIMARY} />}
        </View>
      </View>
      <Text style={[styles.recCardTitle, { color: recipe.accent }]} numberOfLines={2}>
        {recipe.title}
      </Text>
      <MacroRow
        calories={recipe.nutrition?.calories ?? null}
        protein={recipe.nutrition?.protein ?? null}
        carbs={recipe.nutrition?.carbs ?? null}
        fats={recipe.nutrition?.fats ?? null}
        accent={recipe.accent}
      />
    </TouchableOpacity>
  );
}

export default function SavedScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isFetchingRecipes, setIsFetchingRecipes] = useState(false);
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<SavedRecipeCard | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [storedRecipes, setStoredRecipes] = useState<SavedRecipeCard[]>([]);

  const loadAndSeedRecipes = useCallback(async () => {
    const seeded = await AsyncStorage.getItem(SAVED_SEEDED_KEY);
    if (!seeded) {
      const seedData: Record<string, SavedRecipeCard> = {};
      for (const r of MOCK_SAVED_RECIPES) {
        seedData[r.id] = { ...r, ...recipeColors(r.id) };
      }
      await AsyncStorage.setItem(SAVED_RECIPES_DATA_KEY, JSON.stringify(seedData));
      await AsyncStorage.setItem(SAVED_SEEDED_KEY, '1');
      // Sync seeded IDs into FAVORITES_KEY so other tabs show filled hearts
      const rawFavs = await AsyncStorage.getItem(FAVORITES_KEY);
      const favSet = new Set<string>(rawFavs ? JSON.parse(rawFavs) : []);
      Object.keys(seedData).forEach(id => favSet.add(id));
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify([...favSet]));
    }
    const raw = await AsyncStorage.getItem(SAVED_RECIPES_DATA_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Record<string, SavedRecipeCard>;
        // Running cuisine check — infer any missing or generic labels and persist corrections
        let dirty = false;
        for (const id of Object.keys(parsed)) {
          const r = parsed[id];
          if (!r.cuisine || r.cuisine === 'International') {
            const inferred = inferCuisine(r.title, r.description, r.ingredients);
            if (inferred) {
              parsed[id] = { ...r, cuisine: inferred };
              dirty = true;
            }
          }
        }
        if (dirty) await AsyncStorage.setItem(SAVED_RECIPES_DATA_KEY, JSON.stringify(parsed));
        setStoredRecipes(
          Object.values(parsed).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
      } catch {}
    }
  }, []);

  const isFocused = useIsFocused();
  useEffect(() => {
    if (isFocused) loadAndSeedRecipes();
  }, [isFocused, loadAndSeedRecipes]);

  const removeStoredRecipe = async (id: string) => {
    const [raw, rawFavs] = await Promise.all([
      AsyncStorage.getItem(SAVED_RECIPES_DATA_KEY),
      AsyncStorage.getItem(FAVORITES_KEY),
    ]);
    const parsed: Record<string, SavedRecipeCard> = raw ? JSON.parse(raw) : {};
    delete parsed[id];
    const favs: string[] = rawFavs ? JSON.parse(rawFavs) : [];
    await Promise.all([
      AsyncStorage.setItem(SAVED_RECIPES_DATA_KEY, JSON.stringify(parsed)),
      AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favs.filter(f => f !== id))),
    ]);
    setStoredRecipes(prev => prev.filter(r => r.id !== id));
  };

  useEffect(() => {
    AsyncStorage.getItem(FAVORITES_KEY).then((stored) => {
      if (stored) {
        try { setFavoriteIds(new Set(JSON.parse(stored) as string[])); } catch {}
      }
    });
  }, []);

  const toggleFavorite = (recipeId: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(recipeId)) { next.delete(recipeId); } else { next.add(recipeId); }
      AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  const fetchSavedRecipes = async (currentUser: User) => {
    if (!supabase) { setSavedRecipes([]); return; }
    setIsFetchingRecipes(true);
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const normalized = Array.isArray(data)
        ? data.map(normalizeSavedRecipe).filter((r): r is SavedRecipe => r !== null)
        : [];
      setSavedRecipes(normalized);
    } catch (err) {
      console.log('Failed to fetch saved recipes:', err);
    } finally {
      setIsFetchingRecipes(false);
    }
  };

  useEffect(() => {
    const supabaseClient = supabase;
    if (!supabaseClient) { setIsAuthLoading(false); return; }

    const loadInitialSession = async () => {
      const { data, error } = await supabaseClient.auth.getUser();
      if (error && error.name !== 'AuthSessionMissingError') console.log('Failed to load user:', error);
      const currentUser = data.user ?? null;
      setUser(currentUser);
      if (currentUser) await fetchSavedRecipes(currentUser);
      else setSavedRecipes([]);
      setIsAuthLoading(false);
    };

    loadInitialSession();

    const { data: authListener } = supabaseClient.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) { await fetchSavedRecipes(currentUser); }
      else { setSavedRecipes([]); setSelectedRecipe(null); }
      setIsAuthLoading(false);
    });

    return () => { authListener.subscription.unsubscribe(); };
  }, []);

  const baseRecipes = savedRecipes.length > 0 ? savedRecipes : storedRecipes;
  const baseWithColors = withColors(baseRecipes);
  const normalizedSearch = searchQuery.trim().toLowerCase();

  const visibleRecipes = baseWithColors.filter((recipe) =>
    !normalizedSearch ||
    recipe.title.toLowerCase().includes(normalizedSearch) ||
    recipe.description.toLowerCase().includes(normalizedSearch),
  );

  const groups = groupRecipesByDate(visibleRecipes);

  if (isAuthLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { paddingTop: TOP_INSET }]} edges={['bottom']}>
        <View style={styles.loadingScreen}>
          <ActivityIndicator size="large" color="red" />
          <Text style={styles.loadingText}>TEST TEST Loading your saved recipes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StatusBar style="light" backgroundColor={DARK} />
      <View style={[styles.hero, { paddingTop: TOP_INSET + 22 }]}>
        <Text style={styles.eyebrow}>Recipe library TEST</Text>
        <Text style={styles.title}>Saved Recipes TEST</Text>
      </View>

      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}>
        <View style={styles.content}>

          {/* Search */}
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={16} color={MUTED} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search saved recipes"
              placeholderTextColor={MUTED}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={16} color={MUTED} />
              </TouchableOpacity>
            )}
          </View>

          {/* Date-grouped recipe sections */}
          {groups.length > 0 ? (
            groups.map(({ label, data }) => (
              <View key={label} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="bookmark-outline" size={14} color={PRIMARY} />
                  <Text style={styles.sectionTitle}>{label}</Text>
                  <View style={styles.sectionDividerLine} />
                  {isFetchingRecipes && label === groups[0].label ? (
                    <ActivityIndicator size="small" color={PRIMARY} />
                  ) : (
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>{data.length}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.cardList}>
                  {data.map((recipe) => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      isFav={savedRecipes.length > 0 ? favoriteIds.has(recipe.id) : true}
                      onPress={() => setSelectedRecipe(recipe)}
                    />
                  ))}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="bookmarks-outline" size={28} color={MUTED} />
              <Text style={styles.emptyTitle}>No matching recipes</Text>
              <Text style={styles.emptySubtitle}>Try a different search or filter.</Text>
            </View>
          )}

          {/* Login nudge */}
          {!user && SUPABASE_ENABLED && (
            <View style={styles.nudgeCard}>
              <Ionicons name="bookmark-outline" size={20} color={PRIMARY} />
              <Text style={styles.nudgeText}>Log in to save your own generated recipes here.</Text>
            </View>
          )}

        </View>
      </ScrollView>

      {/* Meal detail modal */}
      <Modal
        visible={!!selectedRecipe}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedRecipe(null)}>
        {selectedRecipe && (
          <MealSheet
            meal={selectedRecipe}
            onClose={() => setSelectedRecipe(null)}
            isFav={savedRecipes.length > 0 ? favoriteIds.has(selectedRecipe.id) : true}
            onToggleFav={() => {
              if (savedRecipes.length > 0) { toggleFavorite(selectedRecipe.id); }
              else { removeStoredRecipe(selectedRecipe.id); setSelectedRecipe(null); }
            }}
          />
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

  loadingScreen: {
    flex: 1,
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
  },
  loadingText: { color: MUTED, fontSize: 14 },

  // Hero
  hero: {
    backgroundColor: DARK,
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

  // Search
  searchBox: {
    minHeight: 46,
    backgroundColor: SURFACE,
    borderRadius: 22,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E2E3EA',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: { flex: 1, color: DARK, fontSize: 14 },

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
    textShadowColor: PRIMARY,
    textShadowOffset: { width: 0.35, height: 0.35 },
    textShadowRadius: 0,
  },
  countBadge: {
    backgroundColor: '#FFE8E2',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countBadgeText: { color: PRIMARY, fontSize: 10, fontWeight: '700' },

  // Vertical card list — 2 columns
  cardList: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },

  // Recipe card
  recCard: {
    width: '48%',
    borderRadius: 20,
    padding: 12,
    gap: 7,
    overflow: 'hidden',
  },
  recCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cuisineChip: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  cuisineChipText: { fontSize: 8, fontWeight: '800', textTransform: 'uppercase' },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timeBadgeText: { color: MUTED, fontSize: 10, fontWeight: '600' },
  recCardTitle: {
    ...brandType,
    fontSize: 13,
    lineHeight: 17,
    minHeight: 34,
    textTransform: 'uppercase',
    textShadowOffset: { width: 0.25, height: 0.25 },
    textShadowRadius: 0,
  },

  // Fav badge
  favBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // MacroRow
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 12,
    paddingVertical: 5,
  },
  macroItem: { flex: 1, alignItems: 'center', gap: 1 },
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

  // Empty state
  emptyCard: {
    minHeight: 120,
    backgroundColor: SURFACE,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E3EA',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 20,
  },
  emptyTitle: {
    ...brandType,
    color: DARK,
    fontSize: 16,
    textTransform: 'uppercase',
  },
  emptySubtitle: { color: MUTED, fontSize: 13 },

  // Login nudge
  nudgeCard: {
    backgroundColor: SURFACE,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#FFE1D8',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nudgeText: { flex: 1, color: DARK, fontSize: 14, lineHeight: 20 },

  // Meal sheet modal
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
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
  sheetHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
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
  sheetTitleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6, gap: 10 },
  sheetTitle: {
    ...brandType,
    color: DARK,
    fontSize: 22,
    lineHeight: 26,
    textTransform: 'uppercase',
    flex: 1,
  },
  sheetDescription: { color: MUTED, fontSize: 14, lineHeight: 20, marginBottom: 10 },
  sheetDivider: { height: 1, backgroundColor: '#E2E3EA', marginVertical: 10 },
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
  sheetListText: { flex: 1, color: DARK, fontSize: 14, lineHeight: 20 },
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
});
