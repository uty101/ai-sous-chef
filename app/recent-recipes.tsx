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

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 7)}wk ago`;
}

function MealSheet({ meal, onClose }: { meal: MealDetail; onClose: () => void }) {
  const units = useUnits();
  const sheetY = useRef(new Animated.Value(0)).current;
  const dismissRef = useRef<() => void>(() => {});
  const dismiss = () => {
    Animated.timing(sheetY, { toValue: 900, duration: 240, useNativeDriver: true }).start(() => onClose());
  };
  dismissRef.current = dismiss;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 5,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) sheetY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 120 || gs.vy > 0.5) {
          dismissRef.current();
        } else {
          Animated.spring(sheetY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  return (
    <Animated.View style={{ flex: 1, transform: [{ translateY: sheetY }] }}>
      <SafeAreaView style={sheet.container}>
        <View style={sheet.handleArea} {...panResponder.panHandlers}>
          <View style={sheet.handle} />
        </View>
        <View style={sheet.header}>
          <View style={[sheet.goalPill, { backgroundColor: meal.accent }]}>
            <Text style={sheet.goalPillText}>{meal.timeMinutes} min</Text>
          </View>
          <TouchableOpacity style={sheet.closeBtn} onPress={dismiss} activeOpacity={0.8}>
            <Ionicons name="close" size={20} color={DARK} />
          </TouchableOpacity>
        </View>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={sheet.scrollContent}
          showsVerticalScrollIndicator={false}>
          <Text style={sheet.title}>{meal.title}</Text>
          {meal.createdAt ? (
            <Text style={[sheet.meta, { marginBottom: 12 }]}>{timeAgo(meal.createdAt)}</Text>
          ) : null}
          <Text style={sheet.description}>{meal.description}</Text>
          <View style={sheet.divider} />
          <Text style={sheet.sectionHead}>Ingredients</Text>
          {meal.ingredients.map((ing, i) => (
            <View key={i} style={sheet.listRow}>
              <Text style={[sheet.bullet, { color: meal.accent }]}>{'•'}</Text>
              <Text style={sheet.listText}>{convertText(ing, units)}</Text>
            </View>
          ))}
          <View style={sheet.divider} />
          <Text style={sheet.sectionHead}>Steps</Text>
          {meal.steps.map((step, i) => (
            <View key={i} style={sheet.listRow}>
              <Text style={[sheet.stepNum, { color: meal.accent }]}>{i + 1}.</Text>
              <Text style={sheet.listText}>{convertText(step, units)}</Text>
            </View>
          ))}
          <View style={sheet.divider} />
          <Text style={sheet.sectionHead}>Nutritional Info</Text>
          <View style={sheet.macroGrid}>
            {[
              { label: 'Calories', value: `${meal.nutrition.calories}` },
              { label: 'Protein', value: `${meal.nutrition.protein}g` },
              { label: 'Carbs', value: `${meal.nutrition.carbs}g` },
              { label: 'Fats', value: `${meal.nutrition.fats}g` },
            ].map((m, i, arr) => (
              <View key={m.label} style={{ flexDirection: 'row', flex: 1 }}>
                <View style={sheet.macroCell}>
                  <Text style={[sheet.macroValue, { color: meal.accent }]}>{m.value}</Text>
                  <Text style={sheet.macroLabel}>{m.label}</Text>
                </View>
                {i < arr.length - 1 && <View style={sheet.macroDivider} />}
              </View>
            ))}
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Animated.View>
  );
}

export default function RecentRecipesScreen() {
  const { openMe } = useMePanel();
  const navigation = useNavigation();
  const [selectedMeal, setSelectedMeal] = useState<MealDetail | null>(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => openMe());
    return unsubscribe;
  }, [navigation, openMe]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: true }} />
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.hero}>
          <TouchableOpacity style={styles.heroBackBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.heroTitle}>Recent Recipes</Text>
        </View>

        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}>
          {RECENT_RECIPES.map((recipe) => (
            <TouchableOpacity
              key={recipe.id}
              style={[styles.card, { backgroundColor: recipe.bg }]}
              onPress={() => setSelectedMeal(recipe)}
              activeOpacity={0.88}>
              <View style={styles.cardTop}>
                <View style={styles.agoPill}>
                  <Text style={styles.agoPillText}>
                    {recipe.createdAt ? timeAgo(recipe.createdAt) : ''}
                  </Text>
                </View>
                <View style={styles.timeBadge}>
                  <Ionicons name="time-outline" size={13} color={MUTED} />
                  <Text style={styles.timeBadgeText}>{recipe.timeMinutes} min</Text>
                </View>
              </View>
              <Text style={styles.cardTitle}>{recipe.title}</Text>
              <Text style={styles.cardDesc} numberOfLines={2}>{recipe.description}</Text>
              <View style={styles.macroRow}>
                {[
                  { label: 'cal', value: recipe.nutrition.calories },
                  { label: 'protein', value: `${recipe.nutrition.protein}g` },
                  { label: 'carbs', value: `${recipe.nutrition.carbs}g` },
                  { label: 'fats', value: `${recipe.nutrition.fats}g` },
                ].map((m, i, arr) => (
                  <View key={m.label} style={{ flexDirection: 'row', flex: 1 }}>
                    <View style={styles.macroItem}>
                      <Text style={[styles.macroValue, { color: recipe.accent }]}>{m.value}</Text>
                      <Text style={styles.macroLabel}>{m.label}</Text>
                    </View>
                    {i < arr.length - 1 && <View style={styles.macroDivider} />}
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
        </SafeAreaView>

      <Modal
        visible={!!selectedMeal}
        animationType="slide"
        onRequestClose={() => setSelectedMeal(null)}>
        {selectedMeal && (
          <MealSheet meal={selectedMeal} onClose={() => setSelectedMeal(null)} />
        )}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: PRIMARY },
  screen: { flex: 1, backgroundColor: BG },
  hero: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 10,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 8,
  },
  heroBackBtn: {
    padding: 4,
    marginTop: -5,
  },
  heroTitle: {
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
  container: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 14,
  },
  card: {
    borderRadius: 24,
    padding: 16,
    gap: 10,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  agoPill: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  agoPillText: {
    color: DARK,
    fontSize: 11,
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
    fontSize: 12,
    fontWeight: '600',
  },
  cardTitle: {
    ...brandType,
    color: DARK,
    fontSize: 20,
    lineHeight: 26,
    textTransform: 'uppercase',
  },
  cardDesc: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 18,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 16,
    paddingVertical: 8,
    marginTop: 2,
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
  },
  macroValue: {
    ...brandType,
    fontSize: 13,
    textTransform: 'uppercase',
  },
  macroLabel: {
    color: MUTED,
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  macroDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
});

const sheet = StyleSheet.create({
  container: { flex: 1, backgroundColor: SURFACE },
  handleArea: { paddingTop: 12, paddingBottom: 4, alignItems: 'center' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D0D3E0' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  goalPill: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  goalPillText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0EBE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  title: {
    ...brandType,
    color: DARK,
    fontSize: 28,
    textTransform: 'uppercase',
    lineHeight: 34,
    marginBottom: 4,
  },
  meta: { color: MUTED, fontSize: 13, fontWeight: '600' },
  description: { color: MUTED, fontSize: 15, lineHeight: 22, marginBottom: 16 },
  divider: { height: 1, backgroundColor: '#EDE8E0', marginVertical: 16 },
  sectionHead: {
    ...brandType,
    color: DARK,
    fontSize: 16,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingRight: 8,
  },
  bullet: { fontSize: 18, lineHeight: 22, marginRight: 10, minWidth: 16 },
  stepNum: { fontSize: 15, fontWeight: '700', lineHeight: 22, marginRight: 10, minWidth: 24 },
  listText: { flex: 1, color: DARK, fontSize: 15, lineHeight: 22 },
  macroGrid: {
    flexDirection: 'row',
    backgroundColor: '#FFF8F0',
    borderRadius: 18,
    paddingVertical: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FFE1D8',
  },
  macroCell: { flex: 1, alignItems: 'center', gap: 3 },
  macroDivider: { width: 1, backgroundColor: '#FFE1D8' },
  macroValue: { ...brandType, fontSize: 17 },
  macroLabel: { color: MUTED, fontSize: 10, textTransform: 'uppercase', fontWeight: '700' },
});
