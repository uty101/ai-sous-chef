import { brandType } from '@/constants/brand';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BRAND_ORANGE = '#FF5C35';
const CREAM = '#FFF8F0';
const SURFACE = '#FFFFFF';
const INK = '#1C1F2E';
const MUTED = '#8E93A8';
const SAGE = '#FFBA35';
const GOLD = '#FFBA35';

export type FeatureAction = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route?: Href;
};

export type FeatureStat = {
  label: string;
  value: string;
};

export type FeatureSection = {
  title: string;
  description?: string;
  items: {
    title: string;
    meta?: string;
    detail?: string;
    icon: keyof typeof Ionicons.glyphMap;
    tone?: 'orange' | 'sage' | 'gold';
  }[];
};

export type FeaturePageContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  stats?: FeatureStat[];
  primaryAction?: FeatureAction;
  secondaryAction?: FeatureAction;
  sections: FeatureSection[];
};

function getToneColor(tone: FeatureSection['items'][number]['tone']) {
  if (tone === 'sage') {
    return SAGE;
  }

  if (tone === 'gold') {
    return GOLD;
  }

  return BRAND_ORANGE;
}

function handleAction(action?: FeatureAction) {
  if (!action?.route) {
    return;
  }

  router.push(action.route);
}

function ActionButton({ action, variant }: { action: FeatureAction; variant: 'primary' | 'secondary' }) {
  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      style={[styles.actionButton, isPrimary ? styles.actionPrimary : styles.actionSecondary]}
      onPress={() => handleAction(action)}
      activeOpacity={0.85}>
      <Ionicons name={action.icon} size={18} color={isPrimary ? SURFACE : BRAND_ORANGE} />
      <Text style={[styles.actionText, !isPrimary && styles.actionTextSecondary]}>{action.label}</Text>
    </TouchableOpacity>
  );
}

export function FeaturePage({ content }: { content: FeaturePageContent }) {
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
                <Text style={styles.eyebrow}>{content.eyebrow}</Text>
                <Text style={styles.title}>{content.title}</Text>
              </View>
              <View style={styles.heroIcon}>
                <Ionicons name={content.icon} size={28} color={BRAND_ORANGE} />
              </View>
            </View>
            <Text style={styles.subtitle}>{content.subtitle}</Text>

            {content.stats?.length ? (
              <View style={styles.statRail}>
                {content.stats.map((stat, index) => (
                  <View key={stat.label} style={styles.statCell}>
                    {index > 0 ? <View style={styles.statDivider} /> : null}
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          {content.primaryAction || content.secondaryAction ? (
            <View style={styles.actionRow}>
              {content.primaryAction ? (
                <View style={styles.actionSlot}>
                  <ActionButton action={content.primaryAction} variant="primary" />
                </View>
              ) : null}
              {content.secondaryAction ? (
                <View style={styles.actionSlot}>
                  <ActionButton action={content.secondaryAction} variant="secondary" />
                </View>
              ) : null}
            </View>
          ) : null}

          {content.sections.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.description ? <Text style={styles.sectionDescription}>{section.description}</Text> : null}

              <View style={styles.cardStack}>
                {section.items.map((item) => {
                  const toneColor = getToneColor(item.tone);

                  return (
                    <View key={`${section.title}-${item.title}`} style={styles.card}>
                      <View style={[styles.itemIcon, { backgroundColor: `${toneColor}1A` }]}>
                        <Ionicons name={item.icon} size={21} color={toneColor} />
                      </View>
                      <View style={styles.itemCopy}>
                        <View style={styles.itemTitleRow}>
                          <Text style={styles.itemTitle}>{item.title}</Text>
                          {item.meta ? <Text style={[styles.itemMeta, { color: toneColor }]}>{item.meta}</Text> : null}
                        </View>
                        {item.detail ? <Text style={styles.itemDetail}>{item.detail}</Text> : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
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
    fontSize: 34,
    lineHeight: 39,
    textTransform: 'uppercase',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 15,
    lineHeight: 22,
  },
  statRail: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 22,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  statDivider: {
    position: 'absolute',
    left: 0,
    top: 10,
    bottom: 10,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  statValue: {
    ...brandType,
    color: SURFACE,
    fontSize: 14,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    marginTop: 3,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionSlot: {
    flex: 1,
  },
  actionButton: {
    minHeight: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
  },
  actionPrimary: {
    backgroundColor: BRAND_ORANGE,
  },
  actionSecondary: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: '#E2E3EA',
  },
  actionText: {
    ...brandType,
    color: SURFACE,
    fontSize: 15,
    textTransform: 'uppercase',
  },
  actionTextSecondary: {
    color: BRAND_ORANGE,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    ...brandType,
    color: INK,
    fontSize: 18,
    textTransform: 'uppercase',
  },
  sectionDescription: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 20,
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




