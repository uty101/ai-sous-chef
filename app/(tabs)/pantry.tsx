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

const CHIP_PALETTE = [
  { bg: '#FFE8E2', text: '#FF5C35' },
  { bg: '#FFF3D0', text: '#D4900A' },
  { bg: '#E8F8EE', text: '#1E8C45' },
  { bg: '#EBF3FF', text: '#2563EB' },
  { bg: '#F0EBFF', text: '#6D28D9' },
  { bg: '#E0F5F3', text: '#0F7B6C' },
  { bg: '#FDE8F4', text: '#B0318A' },
];

function chipColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffff;
  return CHIP_PALETTE[hash % CHIP_PALETTE.length];
}

const DEFAULT_BASKET = ['Chicken thighs', 'Spinach', 'Greek yogurt', 'Rice', 'Tomatoes', 'Eggs'];
const DEFAULT_STAPLES = ['Olive oil', 'Garlic', 'Soy sauce', 'Chilli flakes', 'Pasta', 'Chickpeas'];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function CategoryChips({ items, onRemove, allCollapsed = false }: { items: string[]; onRemove: (item: string) => void; allCollapsed?: boolean }) {
  const groups = CATEGORY_ORDER
    .map((cat) => ({ cat, catItems: items.filter((i) => categorizeIngredient(i) === cat) }))
    .filter(({ catItems }) => catItems.length > 0);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggle = (cat: string) => setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }));

  useEffect(() => {
    const next: Record<string, boolean> = {};
    CATEGORY_ORDER.forEach(c => { next[c] = allCollapsed; });
    setCollapsed(next);
  }, [allCollapsed]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.columnsRow}>
      {groups.map(({ cat, catItems }) => {
        const colors = CATEGORY_ACCENT[cat];
        const isCollapsed = collapsed[cat] ?? false;
        return (
          <View key={cat} style={styles.column}>
            <TouchableOpacity
              style={[styles.columnHeader, { backgroundColor: colors.bg }]}
              onPress={() => toggle(cat)}
              activeOpacity={0.75}>
              <Text style={[styles.columnHeaderText, { color: colors.accent }]} numberOfLines={1}>
                {cat}
              </Text>
              <View style={[styles.columnCount, { backgroundColor: colors.accent }]}>
                <Text style={styles.columnCountText}>{catItems.length}</Text>
              </View>
              <Ionicons
                name={isCollapsed ? 'chevron-down' : 'chevron-up'}
                size={11}
                color={colors.accent}
              />
            </TouchableOpacity>
            {!isCollapsed && (
              <View style={styles.columnItems}>
                {catItems.map((item) => (
                  <View key={item} style={[styles.columnChip, { borderColor: colors.accent + '55' }]}>
                    <Text style={[styles.columnChipText, { color: colors.accent }]} numberOfLines={2}>
                      {item}
                    </Text>
                    <TouchableOpacity
                      style={[styles.columnChipRemove, { backgroundColor: colors.accent }]}
                      onPress={() => onRemove(item)}
                      activeOpacity={0.85}>
                      <Ionicons name="close" size={8} color={SURFACE} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

function ShoppingListModal({
  visible,
  onClose,
  pantryAll,
  onAddToPantry,
}: {
  visible: boolean;
  onClose: () => void;
  pantryAll: string[];
  onAddToPantry: (items: string[]) => void;
}) {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItem, setNewItem] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const loadedRef = useRef(false);
  const snapshotRef = useRef<ShoppingItem[]>([]);

  useEffect(() => {
    if (!visible) return;
    AsyncStorage.getItem(SHOPPING_MODAL_KEY).then((raw) => {
      const loaded = raw ? JSON.parse(raw) : generateCuratedList(pantryAll);
      setItems(loaded);
      snapshotRef.current = loaded;
      loadedRef.current = true;
    });
  }, [visible]);

  useEffect(() => {
    if (loadedRef.current) AsyncStorage.setItem(SHOPPING_MODAL_KEY, JSON.stringify(items));
  }, [items]);

  const refreshList = () => {
    const fresh = generateCuratedList(pantryAll);
    setItems(fresh);
    snapshotRef.current = fresh;
  };

  const resetList = () => setItems(snapshotRef.current);

  const addItem = (name?: string) => {
    const trimmed = (name ?? newItem).trim();
    if (!trimmed) return;
    const exists = items.some((i) => i.name.toLowerCase() === trimmed.toLowerCase());
    if (!exists) setItems((prev) => [...prev, { name: trimmed, selected: false }]);
    if (!name) setNewItem('');
  };

  const toggleSelected = (name: string) =>
    setItems((prev) => prev.map((i) => (i.name === name ? { ...i, selected: !i.selected } : i)));

  const removeItem = (name: string) =>
    setItems((prev) => prev.filter((i) => i.name !== name));

  const addToPantry = () => {
    onAddToPantry(items.filter((i) => i.selected).map((i) => i.name));
    setItems((prev) => prev.filter((i) => !i.selected));
  };

  const selectedCount = items.filter((i) => i.selected).length;

  const itemsWithCategory = items.map((item) => ({
    ...item,
    category:
      SUGGESTION_POOL.find((s) => s.name === item.name)?.category ??
      categorizeIngredient(item.name),
  }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={shopStyles.overlay}>
        <View style={shopStyles.panel}>

          {/* Header */}
          <View style={shopStyles.header}>
            <View style={shopStyles.headerLeft}>
              <Text style={shopStyles.headerEyebrow}>7 day plan</Text>
              <View style={shopStyles.headerTitleRow}>
                <Text style={shopStyles.headerTitle}>Shopping List</Text>
                <TouchableOpacity
                  onPress={() => setShowInfo(true)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.7}>
                  <Ionicons name="information-circle-outline" size={17} color={MUTED} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={shopStyles.headerActions}>
              <TouchableOpacity style={shopStyles.refreshBtn} onPress={refreshList} activeOpacity={0.8}>
                <Ionicons name="refresh-outline" size={17} color={TEAL} />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={shopStyles.closeBtn} activeOpacity={0.8}>
                <Ionicons name="close" size={20} color={INK} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={shopStyles.scrollContent}
            keyboardShouldPersistTaps="handled">

            {/* Select all / Reset row */}
            {items.length > 0 && (
              <View style={shopStyles.listActionsRow}>
                <TouchableOpacity
                  style={shopStyles.selectAllBtn}
                  onPress={() => {
                    const allSelected = items.every((i) => i.selected);
                    setItems((prev) => prev.map((i) => ({ ...i, selected: !allSelected })));
                  }}
                  activeOpacity={0.8}>
                  <Ionicons
                    name={items.every((i) => i.selected) ? 'checkmark-circle' : 'checkmark-circle-outline'}
                    size={14}
                    color={TEAL}
                  />
                  <Text style={shopStyles.selectAllText}>
                    {items.every((i) => i.selected) ? 'Deselect all' : 'Select all'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={resetList} activeOpacity={0.7}>
                  <Text style={shopStyles.resetText}>Undo changes</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Add bar */}
            <View style={shopStyles.addBar}>
              <TextInput
                style={shopStyles.addBarInput}
                placeholder="Add item"
                placeholderTextColor={MUTED}
                value={newItem}
                onChangeText={setNewItem}
                onSubmitEditing={() => addItem()}
                returnKeyType="done"
              />
              <TouchableOpacity style={shopStyles.addBarBtn} onPress={() => addItem()} activeOpacity={0.85}>
                <Ionicons name="add" size={14} color={SURFACE} />
              </TouchableOpacity>
            </View>

            {/* Curated list grouped by category */}
            {CATEGORY_ORDER
              .map((cat) => ({ cat, catItems: itemsWithCategory.filter((i) => i.category === cat) }))
              .filter(({ catItems }) => catItems.length > 0)
              .map(({ cat, catItems }) => {
                const colors = CATEGORY_ACCENT[cat];
                return (
                  <View key={cat} style={shopStyles.categoryGroup}>
                    <View style={shopStyles.categoryHeader}>
                      <View style={[shopStyles.categoryDot, { backgroundColor: colors.accent }]} />
                      <Text style={[shopStyles.categoryLabel, { color: colors.accent }]}>{cat}</Text>
                    </View>
                    <View style={shopStyles.chipWrap}>
                      {catItems.map((item) => (
                        <TouchableOpacity
                          key={item.name}
                          style={[
                            shopStyles.chip,
                            item.selected
                              ? { backgroundColor: colors.accent }
                              : { backgroundColor: colors.bg },
                          ]}
                          onPress={() => toggleSelected(item.name)}
                          activeOpacity={0.8}>
                          <Ionicons
                            name={item.selected ? 'checkmark-circle' : 'ellipse-outline'}
                            size={13}
                            color={item.selected ? SURFACE : colors.accent}
                          />
                          <Text
                            style={[
                              shopStyles.chipText,
                              { color: item.selected ? SURFACE : colors.accent },
                            ]}>
                            {item.name}
                          </Text>
                          <TouchableOpacity
                            style={[
                              shopStyles.chipRemove,
                              {
                                backgroundColor: item.selected
                                  ? 'rgba(255,255,255,0.3)'
                                  : `${colors.accent}30`,
                              },
                            ]}
                            onPress={() => removeItem(item.name)}
                            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                            activeOpacity={0.85}>
                            <Ionicons
                              name="close"
                              size={8}
                              color={item.selected ? SURFACE : colors.accent}
                            />
                          </TouchableOpacity>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                );
              })}

            {items.length === 0 && (
              <View style={shopStyles.empty}>
                <Ionicons name="cart-outline" size={28} color={TEAL} />
                <Text style={shopStyles.emptyText}>Your list is empty. Add items above.</Text>
              </View>
            )}

          </ScrollView>

          {/* Sticky footer */}
          {selectedCount > 0 && (
            <View style={shopStyles.footer}>
              <TouchableOpacity style={shopStyles.addToPantryBtn} onPress={addToPantry} activeOpacity={0.85}>
                <Ionicons name="bag-add-outline" size={15} color={SURFACE} />
                <Text style={shopStyles.addToPantryText}>Add {selectedCount} to Pantry</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>
      </View>

      {/* Info overlay */}
      <Modal visible={showInfo} transparent animationType="fade" onRequestClose={() => setShowInfo(false)}>
        <TouchableOpacity style={shopStyles.infoOverlay} activeOpacity={1} onPress={() => setShowInfo(false)}>
          <View style={shopStyles.infoPanel}>
            <Text style={shopStyles.infoPanelTitle}>Your Curated List</Text>
            <Text style={shopStyles.infoPanelBody}>
              This list is built around your pantry gaps, your meal history and your goals.
            </Text>
            <Text style={shopStyles.infoPanelBody}>
              Tap items to select them, then hit "Add to Pantry" to move them straight into your basket.
            </Text>
            <Text style={shopStyles.infoPanelBody}>
              Use the refresh icon in the top corner to generate a fresh list based on your latest pantry and goals.
            </Text>
            <TouchableOpacity onPress={() => setShowInfo(false)} style={shopStyles.infoPanelClose}>
              <Text style={shopStyles.infoPanelCloseText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </Modal>
  );
}

export default function PantryTabScreen() {
  const [basketItems, setBasketItems] = useState<string[]>([]);
  const [stapleItems, setStapleItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState('');
  const [newStaple, setNewStaple] = useState('');
  const [basketAllCollapsed, setBasketAllCollapsed] = useState(true);
  const [staplesAllCollapsed, setStaplesAllCollapsed] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [showLeftoversInfo, setShowLeftoversInfo] = useState(false);
  const [showShoppingList, setShowShoppingList] = useState(false);

  const basketLoaded = useRef(false);
  const staplesLoaded = useRef(false);

  useEffect(() => {
    const loadStorage = async () => {
      const [storedBasket, storedStaples] = await Promise.all([
        AsyncStorage.getItem(BASKET_KEY),
        AsyncStorage.getItem(STAPLES_KEY),
      ]);
      setBasketItems(storedBasket !== null ? JSON.parse(storedBasket) : DEFAULT_BASKET);
      setStapleItems(storedStaples !== null ? JSON.parse(storedStaples) : DEFAULT_STAPLES);
      basketLoaded.current = true;
      staplesLoaded.current = true;
      setLoaded(true);
    };
    loadStorage();
  }, []);


  useEffect(() => {
    if (basketLoaded.current) {
      AsyncStorage.setItem(BASKET_KEY, JSON.stringify(basketItems));
    }
  }, [basketItems]);

  useEffect(() => {
    if (staplesLoaded.current) {
      AsyncStorage.setItem(STAPLES_KEY, JSON.stringify(stapleItems));
    }
  }, [stapleItems]);

  const addBasketItem = () => {
    const trimmed = newItem.trim();
    if (!trimmed) return;
    setBasketItems((items) => {
      const exists = items.some((i) => i.toLowerCase() === trimmed.toLowerCase());
      return exists ? items : [...items, trimmed];
    });
    setNewItem('');
  };

  const removeBasketItem = (item: string) => {
    setBasketItems((items) => items.filter((i) => i !== item));
  };

  const addStaple = () => {
    const trimmed = newStaple.trim();
    if (!trimmed) return;
    setStapleItems((items) => {
      const exists = items.some((i) => i.toLowerCase() === trimmed.toLowerCase());
      return exists ? items : [...items, trimmed];
    });
    setNewStaple('');
  };

  const removeStaple = (item: string) => {
    setStapleItems((items) => items.filter((i) => i !== item));
  };

  const clearBasket = () => {
    setBasketItems([]);
  };

  const clearStaples = () => {
    setStapleItems([]);
  };

  const addShoppedToPantry = (bought: string[]) => {
    setBasketItems((prev) => {
      const next = [...prev];
      for (const name of bought) {
        if (!next.some((i) => i.toLowerCase() === name.toLowerCase())) next.push(name);
      }
      return next;
    });
  };

  const pantryAll = [...basketItems, ...stapleItems];

  const leftoverSuggestion = useMemo(() => {
    if (!loaded) return null;
    const all = [...basketItems, ...stapleItems].map((s) => s.toLowerCase());
    if (all.length === 0) return null;
    let best: QuickMeal | null = null;
    let bestScore = 0;
    for (const meal of QUICK_MEALS) {
      const score = meal.keys.filter((k) => all.some((i) => i.includes(k) || k.includes(i))).length;
      if (score > bestScore) { bestScore = score; best = meal; }
    }
    return best ?? QUICK_MEALS[0];
  }, [loaded, basketItems, stapleItems]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StatusBar style="light" backgroundColor={INK} />
      <View style={[styles.hero, { paddingTop: TOP_INSET + 22 }]}>
        <Text style={styles.eyebrow}>Ingredient bank</Text>
        <Text style={styles.title}>Pantry</Text>
      </View>

      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}>
        <View style={styles.content}>

          {/* Action row */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionBtnGold}
              onPress={() => router.push('/camera')}
              activeOpacity={0.85}>
              <Ionicons name="camera-outline" size={14} color={INK} />
              <Text style={styles.actionBtnGoldText}>Scan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtnTeal}
              onPress={() => setShowShoppingList(true)}
              activeOpacity={0.85}>
              <Ionicons name="cart-outline" size={14} color={SURFACE} />
              <Text style={styles.actionBtnTealText}>Shopping</Text>
            </TouchableOpacity>
          </View>

          {/* This Week's Basket */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="basket-outline" size={14} color={BRAND_ORANGE} />
              <SectionTitle>This Week&apos;s Basket</SectionTitle>
              <View style={styles.sectionDividerLine} />
              <View style={styles.sectionActions}>
                {basketItems.length > 0 && (
                  <TouchableOpacity style={styles.headerPill} onPress={() => setBasketAllCollapsed(v => !v)} activeOpacity={0.7}>
                    <Text style={styles.headerPillText}>{basketAllCollapsed ? 'Open all' : 'Collapse all'}</Text>
                  </TouchableOpacity>
                )}
                {basketItems.length > 0 && (
                  <TouchableOpacity style={styles.headerPill} onPress={clearBasket} activeOpacity={0.7}>
                    <Text style={styles.headerPillText}>Clear all</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.addBar}>
              <TextInput
                style={styles.addBarInput}
                placeholder="Add ingredient"
                placeholderTextColor={MUTED}
                value={newItem}
                onChangeText={setNewItem}
                onSubmitEditing={addBasketItem}
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.addBarBtn} onPress={addBasketItem} activeOpacity={0.85}>
                <Ionicons name="add" size={14} color={SURFACE} />
              </TouchableOpacity>
            </View>

            {basketItems.length === 0 ? (
              <View style={styles.emptyChipState}>
                <Text style={styles.emptyChipText}>Your basket is empty. Add ingredients above.</Text>
              </View>
            ) : (
              <CategoryChips items={basketItems} onRemove={removeBasketItem} allCollapsed={basketAllCollapsed} />
            )}
          </View>

          {/* Staples */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="archive-outline" size={14} color={BRAND_ORANGE} />
              <SectionTitle>Staples</SectionTitle>
              <View style={styles.sectionDividerLine} />
              <View style={styles.sectionActions}>
                {stapleItems.length > 0 && (
                  <TouchableOpacity style={styles.headerPill} onPress={() => setStaplesAllCollapsed(v => !v)} activeOpacity={0.7}>
                    <Text style={styles.headerPillText}>{staplesAllCollapsed ? 'Open all' : 'Collapse all'}</Text>
                  </TouchableOpacity>
                )}
                {stapleItems.length > 0 && (
                  <TouchableOpacity style={styles.headerPill} onPress={clearStaples} activeOpacity={0.7}>
                    <Text style={styles.headerPillText}>Clear all</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.addBar}>
              <TextInput
                style={styles.addBarInput}
                placeholder="Add staple"
                placeholderTextColor={MUTED}
                value={newStaple}
                onChangeText={setNewStaple}
                onSubmitEditing={addStaple}
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.addBarBtn} onPress={addStaple} activeOpacity={0.85}>
                <Ionicons name="add" size={14} color={SURFACE} />
              </TouchableOpacity>
            </View>

            {stapleItems.length === 0 ? (
              <View style={styles.emptyChipState}>
                <Text style={styles.emptyChipText}>No staples yet. Add some above.</Text>
              </View>
            ) : (
              <CategoryChips items={stapleItems} onRemove={removeStaple} allCollapsed={staplesAllCollapsed} />
            )}
          </View>

          {/* Leftovers Lab */}
          <View style={styles.section}>
            <View style={styles.labTitleRow}>
              <Ionicons name="flask-outline" size={14} color={BRAND_ORANGE} />
              <SectionTitle>Leftovers Lab</SectionTitle>
              <View style={styles.sectionDividerLine} />
              <TouchableOpacity
                onPress={() => setShowLeftoversInfo(true)}
                activeOpacity={0.7}
                style={styles.infoIconButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="information-circle-outline" size={18} color={MUTED} />
              </TouchableOpacity>
            </View>

            {!leftoverSuggestion ? (
              <View style={styles.emptyChipState}>
                <Text style={styles.emptyChipText}>Add items to your basket above to get started.</Text>
              </View>
            ) : (
              <View style={[styles.labResultCard, { backgroundColor: leftoverSuggestion.bg }]}>
                <View style={styles.labResultHeader}>
                  <View style={styles.labResultTitleRow}>
                    <Text style={[styles.labResultTitle, { color: leftoverSuggestion.accent }]}>{leftoverSuggestion.title}</Text>
                    <View style={styles.labPillRow}>
                      <View style={styles.labPill}>
                        <Text style={[styles.labPillText, { color: leftoverSuggestion.accent }]}>{leftoverSuggestion.cuisine}</Text>
                      </View>
                      <View style={styles.labPill}>
                        <Ionicons name="time-outline" size={11} color={leftoverSuggestion.accent} />
                        <Text style={[styles.labPillText, { color: leftoverSuggestion.accent }]}>{leftoverSuggestion.timeMinutes}m</Text>
                      </View>
                    </View>
                  </View>
                </View>
                <View style={styles.labIngredientRow}>
                  {dedupeIngredients(leftoverSuggestion.keys)
                    .slice(0, 5)
                    .map((key) => (
                      <View key={key} style={[styles.labIngredientPill, { backgroundColor: `${leftoverSuggestion.accent}22` }]}>
                        <Text style={[styles.labIngredientPillText, { color: leftoverSuggestion.accent }]}>
                          {key.replace(/\b\w/g, c => c.toUpperCase())}
                        </Text>
                      </View>
                    ))}
                </View>
                <View style={[styles.labDivider, { backgroundColor: `${leftoverSuggestion.accent}30` }]} />
                <Text style={[styles.labStepsLabel, { color: leftoverSuggestion.accent }]}>How to make it</Text>
                {leftoverSuggestion.steps.map((step, i) => (
                  <View key={i} style={styles.labStep}>
                    <Text style={[styles.labStepNum, { backgroundColor: leftoverSuggestion.accent }]}>{i + 1}</Text>
                    <Text style={styles.labStepText}>{step}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

        </View>
      </ScrollView>

      <ShoppingListModal
        visible={showShoppingList}
        onClose={() => setShowShoppingList(false)}
        pantryAll={pantryAll}
        onAddToPantry={addShoppedToPantry}
      />

      <Modal
        visible={showLeftoversInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLeftoversInfo(false)}>
        <TouchableOpacity style={styles.infoOverlay} activeOpacity={1} onPress={() => setShowLeftoversInfo(false)}>
          <View style={styles.infoPanel}>
            <Text style={styles.infoPanelTitle}>Leftovers Lab</Text>
            <Text style={styles.infoPanelBody}>
              Based on what's in your basket and staples, the Leftovers Lab picks one quick, fun dish you can make right now. No shopping needed.
            </Text>
            <Text style={styles.infoPanelBody}>
              The suggestion updates automatically whenever your basket or staples change.
            </Text>
            <TouchableOpacity onPress={() => setShowLeftoversInfo(false)} style={styles.infoPanelClose}>
              <Text style={styles.infoPanelCloseText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: INK,
  },
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
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    lineHeight: 20,
  },
  heroStats: {
    minHeight: 62,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 22,
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  heroStatValue: {
    ...brandType,
    color: SURFACE,
    fontSize: 15,
    textTransform: 'uppercase',
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    marginTop: 3,
    textAlign: 'center',
  },
  heroStatDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.22)',
  },

  screen: {
    flex: 1,
    backgroundColor: CREAM,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 92,
  },
  content: {
    gap: 20,
  },

  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtnPrimary: {
    flex: 1,
    minHeight: 36,
    borderRadius: 18,
    backgroundColor: BRAND_ORANGE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    gap: 5,
  },
  actionBtnPrimaryText: {
    ...brandType,
    color: SURFACE,
    fontSize: 12,
    textTransform: 'uppercase',
    textShadowColor: INK,
    textShadowOffset: { width: 0.35, height: 0.35 },
    textShadowRadius: 0,
  },
  actionBtnSecondary: {
    flex: 1,
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: CREAM,
    borderWidth: 1,
    borderColor: '#E2E3EA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    gap: 6,
  },
  actionBtnSecondaryText: {
    ...brandType,
    color: BRAND_ORANGE,
    fontSize: 13,
    textTransform: 'uppercase',
    textShadowColor: INK,
    textShadowOffset: { width: 0.35, height: 0.35 },
    textShadowRadius: 0,
  },
  actionBtnGold: {
    flex: 1,
    minHeight: 36,
    borderRadius: 18,
    backgroundColor: GOLD,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    gap: 5,
  },
  actionBtnGoldText: {
    ...brandType,
    color: INK,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  actionBtnTeal: {
    flex: 1,
    minHeight: 36,
    borderRadius: 18,
    backgroundColor: '#2A9D8F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    gap: 5,
  },
  actionBtnTealText: {
    ...brandType,
    color: SURFACE,
    fontSize: 12,
    textTransform: 'uppercase',
    textShadowColor: INK,
    textShadowOffset: { width: 0.35, height: 0.35 },
    textShadowRadius: 0,
  },

  section: {
    gap: 10,
  },
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
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    ...brandType,
    color: BRAND_ORANGE,
    fontSize: 16,
    textTransform: 'uppercase',
    textShadowColor: INK,
    textShadowOffset: { width: 0.25, height: 0.25 },
    textShadowRadius: 0,
  },
  headerPill: {
    backgroundColor: '#FFE8E2',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  headerPillText: {
    color: BRAND_ORANGE,
    fontSize: 10,
    fontWeight: '700',
  },

  addBar: {
    minHeight: 36,
    backgroundColor: SURFACE,
    borderRadius: 18,
    paddingLeft: 12,
    paddingRight: 4,
    borderWidth: 1,
    borderColor: '#E2E3EA',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addBarInput: {
    flex: 1,
    color: INK,
    fontSize: 12,
  },
  addBarBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BRAND_ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyChipState: {
    minHeight: 52,
    backgroundColor: CREAM,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E3EA',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  emptyChipText: {
    color: MUTED,
    fontSize: 13,
  },

  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  columnsRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    alignItems: 'flex-start',
  },
  column: {
    width: 112,
  },
  columnHeader: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  columnHeaderText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    flex: 1,
  },
  columnCount: {
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  columnCountText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  columnItems: {
    marginTop: 6,
    gap: 5,
  },
  columnChip: {
    backgroundColor: SURFACE,
    borderRadius: 9,
    borderWidth: 1.5,
    paddingLeft: 8,
    paddingRight: 4,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  columnChipText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
  },
  columnChipRemove: {
    width: 15,
    height: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catChipContainer: {
    gap: 8,
  },
  catGroup: {
    gap: 0,
    overflow: 'hidden',
  },
  catHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  catCount: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  catCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  catDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  catLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  basketChip: {
    minHeight: 30,
    borderRadius: 15,
    paddingLeft: 10,
    paddingRight: 4,
    backgroundColor: CREAM,
    borderWidth: 1,
    borderColor: '#E2E3EA',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  basketChipText: {
    color: INK,
    fontSize: 11,
    fontWeight: '700',
  },
  chipRemoveBtn: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: BRAND_ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labResultCard: {
    borderRadius: 24,
    padding: 16,
    gap: 10,
  },
  labResultHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  labResultTitleRow: {
    flex: 1,
    gap: 8,
  },
  labResultTitle: {
    ...brandType,
    color: INK,
    fontSize: 16,
    textTransform: 'uppercase',
  },
  labPillRow: {
    flexDirection: 'row',
    gap: 6,
  },
  labPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  labPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  labIngredientRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  labIngredientPill: {
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  labIngredientPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  labResultDesc: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 19,
  },
  labDivider: {
    height: 1,
    backgroundColor: '#E2E3EA',
  },
  labStepsLabel: {
    ...brandType,
    color: INK,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  labStep: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  labStepNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    color: SURFACE,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 20,
    overflow: 'hidden',
  },
  labStepText: {
    flex: 1,
    color: INK,
    fontSize: 13,
    lineHeight: 19,
  },

  cardStack: {
    gap: 8,
  },
  stapleRow: {
    minHeight: 60,
    backgroundColor: SURFACE,
    borderRadius: 20,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E2E3EA',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: INK,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  stapleIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#FFF3D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stapleTitle: {
    ...brandType,
    flex: 1,
    color: INK,
    fontSize: 14,
    textTransform: 'uppercase',
  },

  leftoversCard: {
    backgroundColor: SURFACE,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E3EA',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: INK,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  leftoversIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#FFF3D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftoversCopy: {
    flex: 1,
    gap: 3,
  },
  leftoversTitle: {
    ...brandType,
    color: INK,
    fontSize: 15,
    textTransform: 'uppercase',
  },
  leftoversSubtitle: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 18,
  },

  shoppingCard: {
    backgroundColor: SURFACE,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFE1D8',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: BRAND_ORANGE,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  shoppingIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#FFE8E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shoppingTitle: {
    ...brandType,
    color: INK,
    fontSize: 15,
    textTransform: 'uppercase',
  },

  labTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoIconButton: {
    padding: 2,
  },
  infoOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  infoPanel: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    gap: 12,
  },
  infoPanelTitle: {
    ...brandType,
    fontSize: 18,
    color: INK,
    textTransform: 'uppercase',
  },
  infoPanelBody: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 21,
  },
  infoPanelClose: {
    alignSelf: 'center',
    marginTop: 4,
    padding: 8,
  },
  infoPanelCloseText: {
    color: BRAND_ORANGE,
    fontWeight: '700',
    fontSize: 14,
  },
});

const shopStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    paddingTop: 24,
    paddingBottom: 24,
  },
  panel: {
    backgroundColor: SURFACE,
    borderRadius: 28,
    maxHeight: '96%',
    width: '100%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDE8',
  },
  headerLeft: { flex: 1 },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerEyebrow: {
    color: TEAL,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  headerTitle: {
    ...brandType,
    color: INK,
    fontSize: 22,
    textTransform: 'uppercase',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refreshBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0F5F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0EDE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 16,
    gap: 16,
    paddingBottom: 32,
  },
  listActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  selectAllText: {
    color: TEAL,
    fontSize: 12,
    fontWeight: '700',
  },
  resetText: {
    color: MUTED,
    fontSize: 12,
    fontWeight: '600',
  },
  addBar: {
    minHeight: 36,
    backgroundColor: CREAM,
    borderRadius: 18,
    paddingLeft: 12,
    paddingRight: 4,
    borderWidth: 1,
    borderColor: '#E2E3EA',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addBarInput: {
    flex: 1,
    color: INK,
    fontSize: 12,
  },
  addBarBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryGroup: { gap: 6 },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  categoryLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minHeight: 30,
    borderRadius: 15,
    paddingLeft: 8,
    paddingRight: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  chipRemove: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 32,
  },
  emptyText: {
    color: MUTED,
    fontSize: 13,
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0EDE8',
  },
  addToPantryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: TEAL,
    borderRadius: 22,
    paddingVertical: 12,
  },
  addToPantryText: {
    ...brandType,
    color: SURFACE,
    fontSize: 14,
    textTransform: 'uppercase',
  },
  infoOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  infoPanel: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    gap: 12,
  },
  infoPanelTitle: {
    ...brandType,
    fontSize: 18,
    color: INK,
    textTransform: 'uppercase',
  },
  infoPanelBody: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 21,
  },
  infoPanelClose: {
    alignSelf: 'center',
    marginTop: 4,
    padding: 8,
  },
  infoPanelCloseText: {
    color: TEAL,
    fontWeight: '700',
    fontSize: 14,
  },
});
