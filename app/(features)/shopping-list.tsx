import AsyncStorage from '@react-native-async-storage/async-storage';
import { brandType } from '@/constants/brand';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const SHOPPING_LIST_KEY = 'shopping_list_items';
export { SHOPPING_LIST_KEY as SHOPPING_KEY };

const BRAND_ORANGE = '#FF5C35';
const CREAM = '#FFF8F0';
const SURFACE = '#FFFFFF';
const INK = '#1C1F2E';
const MUTED = '#8E93A8';
const SAGE = '#FFBA35';

type ShoppingItem = {
  name: string;
  bought: boolean;
};

export default function ShoppingListScreen() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItem, setNewItem] = useState('');
  const [loaded, setLoaded] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(SHOPPING_LIST_KEY).then((raw) => {
      setItems(raw ? JSON.parse(raw) : []);
      loadedRef.current = true;
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (loadedRef.current) {
      AsyncStorage.setItem(SHOPPING_LIST_KEY, JSON.stringify(items));
    }
  }, [items]);

  const addItem = () => {
    const trimmed = newItem.trim();
    if (!trimmed) return;
    const exists = items.some((i) => i.name.toLowerCase() === trimmed.toLowerCase());
    if (!exists) {
      setItems((prev) => [...prev, { name: trimmed, bought: false }]);
    }
    setNewItem('');
  };

  const toggleBought = (name: string) => {
    setItems((prev) =>
      prev.map((i) => (i.name === name ? { ...i, bought: !i.bought } : i)),
    );
  };

  const removeItem = (name: string) => {
    setItems((prev) => prev.filter((i) => i.name !== name));
  };

  const clearBought = () => {
    setItems((prev) => prev.filter((i) => !i.bought));
  };

  const toBuyItems = items.filter((i) => !i.bought);
  const boughtItems = items.filter((i) => i.bought);

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
                <Text style={styles.eyebrow}>Weekly needs</Text>
                <Text style={styles.title}>Shopping List</Text>
              </View>
              <View style={styles.heroIcon}>
                <Ionicons name="cart-outline" size={28} color={BRAND_ORANGE} />
              </View>
            </View>
            <Text style={styles.subtitle}>
              Add what you need to pick up. Ticked items feed into your AI meal suggestions.
            </Text>
            <View style={styles.heroStats}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{loaded ? toBuyItems.length : '—'}</Text>
                <Text style={styles.heroStatLabel}>To buy</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{loaded ? boughtItems.length : '—'}</Text>
                <Text style={styles.heroStatLabel}>Bought</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{loaded ? items.length : '—'}</Text>
                <Text style={styles.heroStatLabel}>Total</Text>
              </View>
            </View>
          </View>

          <View style={styles.addCard}>
            <TextInput
              style={styles.input}
              placeholder="Add item"
              placeholderTextColor={MUTED}
              value={newItem}
              onChangeText={setNewItem}
              onSubmitEditing={addItem}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.addButton} onPress={addItem} activeOpacity={0.85}>
              <Ionicons name="add" size={22} color={SURFACE} />
            </TouchableOpacity>
          </View>

          {toBuyItems.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>To Buy</Text>
              <View style={styles.cardStack}>
                {toBuyItems.map((item) => (
                  <View key={item.name} style={styles.itemRow}>
                    <TouchableOpacity
                      onPress={() => toggleBought(item.name)}
                      activeOpacity={0.7}
                      style={styles.checkCircle}>
                      <Ionicons name="ellipse-outline" size={22} color={MUTED} />
                    </TouchableOpacity>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <TouchableOpacity onPress={() => removeItem(item.name)} activeOpacity={0.7}>
                      <Ionicons name="close-circle-outline" size={20} color={MUTED} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          {boughtItems.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Bought</Text>
                <TouchableOpacity onPress={clearBought} activeOpacity={0.7}>
                  <Text style={styles.clearLabel}>Remove all</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.cardStack}>
                {boughtItems.map((item) => (
                  <View key={item.name} style={[styles.itemRow, styles.itemRowBought]}>
                    <TouchableOpacity
                      onPress={() => toggleBought(item.name)}
                      activeOpacity={0.7}
                      style={styles.checkCircle}>
                      <Ionicons name="checkmark-circle" size={22} color={SAGE} />
                    </TouchableOpacity>
                    <Text style={[styles.itemName, styles.itemNameBought]}>{item.name}</Text>
                    <TouchableOpacity onPress={() => removeItem(item.name)} activeOpacity={0.7}>
                      <Ionicons name="close-circle-outline" size={20} color={MUTED} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          {items.length === 0 && (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="cart-outline" size={32} color={BRAND_ORANGE} />
              </View>
              <Text style={styles.emptyTitle}>List is empty</Text>
              <Text style={styles.emptyHint}>Add items above. Everything here feeds into your AI meal suggestions.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

