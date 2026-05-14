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

