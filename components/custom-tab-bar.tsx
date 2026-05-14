import Ionicons from '@expo/vector-icons/Ionicons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brandFontFamily } from '@/constants/brand';

const BAR_BG = '#1C1F2E';
const ORANGE = '#FF5C35';
const ACTIVE = '#FFBA35';
const INACTIVE = 'rgba(255,255,255,0.45)';
const CREAM = '#FFF8F0';

const FAB_SIZE = 62;
const BAR_HEIGHT = 88;
// How many px of the FAB circle sit inside the bar from the top.
// The rest (FAB_SIZE - FAB_IN_BAR) protrudes above.
const FAB_IN_BAR = 32;

type TabDef = {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const LEFT: TabDef[] = [
  { name: 'index', label: 'Home', icon: 'home-outline' },
  { name: 'calendar', label: 'Calendar', icon: 'calendar-outline' },
];

const RIGHT: TabDef[] = [
  { name: 'pantry', label: 'Pantry', icon: 'basket-outline' },
  { name: 'saved', label: 'Saved', icon: 'bookmark-outline' },
];

const CENTER: TabDef = {
  name: 'ai-souschef',
  label: 'AI Sous Chef',
  icon: 'sparkles-outline',
};

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const activeRoute = state.routes[state.index]?.name ?? '';

  const goTo = (name: string) => {
    const route = state.routes.find((r) => r.name === name);
    if (!route) return;
    const isFocused = activeRoute === name;
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });
    if (!isFocused && !event.defaultPrevented) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigation as any).navigate(name);
    }
  };

  const renderTab = ({ name, label, icon }: TabDef) => {
    const active = activeRoute === name;
    const color = active ? ACTIVE : INACTIVE;
    return (
      <TouchableOpacity
        key={name}
        style={styles.tab}
        onPress={() => goTo(name)}
        activeOpacity={0.8}>
        <Ionicons name={icon} size={22} color={color} />
        <Text style={[styles.tabLabel, { color }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const centerActive = activeRoute === CENTER.name;
  const fabBg = centerActive ? ACTIVE : ORANGE;
  const fabIconColor = centerActive ? BAR_BG : '#FFFFFF';

  return (
    <View
      style={[styles.outerWrapper, { bottom: Math.max(0, insets.bottom - 35) }]}
      pointerEvents="box-none">
      {/*
        Transparent spacer whose height equals the amount the FAB protrudes
        above the bar. This keeps the FAB within the outerWrapper's layout
        bounds so Android touch targets work correctly.
      */}
      <View style={styles.fabSpacer} pointerEvents="none" />

      {/* Dark pill bar */}
      <View style={styles.bar}>
        <View style={styles.side}>{LEFT.map(renderTab)}</View>

        {/* Centre slot — shows "AI Sous" + "Chef" stacked below the FAB */}
        <View style={styles.centerSlot}>
          <Text style={[styles.tabLabel, { color: centerActive ? ACTIVE : INACTIVE }]}>
            AI Sous
          </Text>
          <Text style={[styles.tabLabel, styles.chefLine, { color: centerActive ? ACTIVE : INACTIVE }]}>
            Chef
          </Text>
        </View>

        <View style={styles.side}>{RIGHT.map(renderTab)}</View>
      </View>

      {/*
        FAB circle — position:absolute, top:0 so it aligns with the top of
        the outerWrapper (i.e. top of the spacer). It renders last in JSX so
        it sits on top of everything in z-order.
      */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: fabBg }]}
        onPress={() => goTo(CENTER.name)}
        activeOpacity={0.85}>
        <Ionicons name={CENTER.icon} size={28} color={fabIconColor} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    position: 'absolute',
    left: -11,
    right: -11,
    alignItems: 'center',
  },
  // Height = amount FAB protrudes above bar
  fabSpacer: {
    height: FAB_SIZE - FAB_IN_BAR,
    width: '100%',
  },
  bar: {
    width: '100%',
    height: BAR_HEIGHT,
    backgroundColor: BAR_BG,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingBottom: 10,
    shadowColor: BAR_BG,
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  side: {
    flex: 2,
    flexDirection: 'row',
    height: '100%',
    alignItems: 'center',
  },
  centerSlot: {
    width: 80,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 14,
  },
  chefLine: {
    marginTop: 1,
    letterSpacing: 0.5,
  },
  tab: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    fontFamily: brandFontFamily,
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  fab: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: CREAM,
    shadowColor: ORANGE,
    shadowOpacity: 0.55,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 14,
    zIndex: 10,
  },
});
