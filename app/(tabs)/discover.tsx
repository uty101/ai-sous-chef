import { brandType } from '@/constants/brand';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BRAND_ORANGE = '#FF5C35';
const SURFACE = '#FFFFFF';
const CREAM = '#FFF8F0';
const INK = '#1C1F2E';
const MUTED = '#8E93A8';
const SAGE = '#FFBA35';
const GOLD = '#FFBA35';

type InspirationCard = {
  title: string;
  meta: string;
  detail: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: Href;
  tone?: 'orange' | 'sage' | 'gold';
};

const inspirationCards: InspirationCard[] = [
  {
    title: 'Leftovers Lab',
    meta: 'Remix',
    detail: 'Turn cooked odds and ends into a fresh second meal.',
    icon: 'flask-outline',
    route: '/leftovers-lab',
  },
  {
    title: 'Weekly Plan',
    meta: 'Plan',
    detail: 'Build dinners from current ingredients and saved favorites.',
    icon: 'calendar-outline',
    route: '/weekly-plan',
    tone: 'sage',
  },
  {
    title: 'Shopping List',
    meta: 'Shop',
    detail: 'See missing ingredients grouped by aisle-style categories.',
    icon: 'cart-outline',
    route: '/shopping-list',
    tone: 'gold',
  },
  {
    title: 'Nutrition Snapshot',
    meta: 'Simple',
    detail: 'Quick protein, calories, time, and serving estimates.',
    icon: 'pulse-outline',
    route: '/nutrition-snapshot',
    tone: 'sage',
  },
  {
    title: 'Recipe History',
    meta: 'Recent',
    detail: 'Find generated ideas that were not saved yet.',
    icon: 'time-outline',
    route: '/recipe-history',
  },
  {
    title: 'Cooking Mode',
    meta: 'Hands-free',
    detail: 'Big steps, timers, checkboxes, and focused cooking controls.',
    icon: 'play-circle-outline',
    route: '/cooking-mode',
    tone: 'gold',
  },
];

function getToneColor(tone: InspirationCard['tone']) {
  if (tone === 'sage') {
    return SAGE;
  }

  if (tone === 'gold') {
    return GOLD;
  }

  return BRAND_ORANGE;
}

export default function DiscoverScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.hero}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroCopy}>
                <Text style={styles.eyebrow}>Inspiration</Text>
                <Text style={styles.title}>Discover</Text>
              </View>
              <View style={styles.heroIcon}>
                <Ionicons name="sparkles-outline" size={28} color={BRAND_ORANGE} />
              </View>
            </View>
            <Text style={styles.subtitle}>
              Seasonal-feeling ideas, useful tools, and the pages that make AI Sous Chef feel personal.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Explore Ideas</Text>

          <View style={styles.cardStack}>
            {inspirationCards.map((card) => {
              const toneColor = getToneColor(card.tone);

              return (
                <TouchableOpacity
                  key={card.title}
                  style={styles.card}
                  onPress={() => router.push(card.route)}
                  activeOpacity={0.85}>
                  <View style={[styles.itemIcon, { backgroundColor: `${toneColor}1A` }]}>
                    <Ionicons name={card.icon} size={21} color={toneColor} />
                  </View>
                  <View style={styles.itemCopy}>
                    <View style={styles.itemTitleRow}>
                      <Text style={styles.itemTitle}>{card.title}</Text>
                      <Text style={[styles.itemMeta, { color: toneColor }]}>{card.meta}</Text>
                    </View>
                    <Text style={styles.itemDetail}>{card.detail}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={MUTED} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: CREAM,
  },
  screen: {
    flex: 1,
    backgroundColor: CREAM,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 92,
  },
  content: {
    gap: 16,
  },
  hero: {
    backgroundColor: INK,
    borderRadius: 26,
    paddingHorizontal: 20,
    paddingVertical: 22,
    gap: 12,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  heroCopy: {
    flex: 1,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 20,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    color: GOLD,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    ...brandType,
    color: SURFACE,
    fontSize: 36,
    lineHeight: 42,
    textTransform: 'uppercase',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 15,
    lineHeight: 22,
  },
  sectionTitle: {
    ...brandType,
    color: INK,
    fontSize: 18,
    textTransform: 'uppercase',
  },
  cardStack: {
    gap: 10,
  },
  card: {
    minHeight: 82,
    backgroundColor: SURFACE,
    borderRadius: 24,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E2E3EA',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemCopy: {
    flex: 1,
    gap: 4,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  itemTitle: {
    ...brandType,
    flex: 1,
    color: INK,
    fontSize: 16,
    textTransform: 'uppercase',
  },
  itemMeta: {
    ...brandType,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  itemDetail: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 18,
  },
});




