import { brandType } from '@/constants/brand';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PRIMARY = '#FF5C35';
const BG = '#FFF8F0';
const SURFACE = '#FFFFFF';
const DARK = '#1C1F2E';
const MUTED = '#8E93A8';
const GOLD = '#FFBA35';

const profileSections = [
  {
    title: 'General Settings',
    icon: 'settings-outline' as const,
    meta: 'Account, app controls, data',
    tone: PRIMARY,
    route: undefined as string | undefined,
  },
  {
    title: 'Allergies',
    icon: 'medical-outline' as const,
    meta: 'Strict avoid list for recipes',
    tone: GOLD,
    route: undefined as string | undefined,
  },
  {
    title: 'Dislikes',
    icon: 'close-circle-outline' as const,
    meta: 'Foods to avoid unless selected',
    tone: GOLD,
    route: undefined as string | undefined,
  },
  {
    title: 'Nutrition',
    icon: 'pulse-outline' as const,
    meta: 'Simple goals, not medical tracking',
    tone: PRIMARY,
    route: undefined as string | undefined,
  },
  {
    title: 'Recent Recipes',
    icon: 'time-outline' as const,
    meta: 'Your last 5 cooked meals',
    tone: PRIMARY,
    route: '/recent-recipes' as string | undefined,
  },
];

export default function MeScreen() {
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
                <Text style={styles.eyebrow}>Your defaults</Text>
                <Text style={styles.title}>Me</Text>
              </View>
              <View style={styles.heroIcon}>
                <Ionicons name="person-outline" size={28} color={PRIMARY} />
              </View>
            </View>
            <Text style={styles.subtitle}>
              Settings, allergies, dislikes, and lightweight nutrition preferences live here.
            </Text>
          </View>

          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>AI</Text>
            </View>
            <View style={styles.profileCopy}>
              <Text style={styles.profileName}>Sous Chef Profile</Text>
              <Text style={styles.profileMeta}>Personalisation placeholders for now</Text>
            </View>
          </View>

          <View style={styles.cardStack}>
            {profileSections.map((section) => (
              <TouchableOpacity
                key={section.title}
                style={styles.row}
                activeOpacity={0.85}
                onPress={section.route ? () => router.push(section.route as any) : undefined}>
                <View style={[styles.rowIcon, { backgroundColor: `${section.tone}1A` }]}>
                  <Ionicons name={section.icon} size={21} color={section.tone} />
                </View>
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle}>{section.title}</Text>
                  <Text style={styles.rowMeta}>{section.meta}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={MUTED} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  screen: { flex: 1, backgroundColor: BG },
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 92,
  },
  content: { gap: 16 },
  hero: {
    backgroundColor: DARK,
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
  heroCopy: { flex: 1 },
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
  profileCard: {
    minHeight: 88,
    backgroundColor: SURFACE,
    borderRadius: 24,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E2E3EA',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 22,
    backgroundColor: '#FFE1D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...brandType,
    color: PRIMARY,
    fontSize: 18,
  },
  profileCopy: { flex: 1 },
  profileName: {
    ...brandType,
    color: DARK,
    fontSize: 17,
    textTransform: 'uppercase',
  },
  profileMeta: {
    color: MUTED,
    fontSize: 13,
    marginTop: 4,
  },
  cardStack: { gap: 10 },
  row: {
    minHeight: 74,
    backgroundColor: SURFACE,
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E3EA',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCopy: { flex: 1, gap: 3 },
  rowTitle: {
    ...brandType,
    color: DARK,
    fontSize: 15,
    textTransform: 'uppercase',
  },
  rowMeta: {
    color: MUTED,
    fontSize: 12,
  },
});
