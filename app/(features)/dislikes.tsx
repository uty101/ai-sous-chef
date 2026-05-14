import AsyncStorage from '@react-native-async-storage/async-storage';
import { brandType } from '@/constants/brand';
import { useMePanel } from '@/contexts/me-panel-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, router } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

const STORAGE_KEY = '@sous_chef_dislikes';

export default function DislikesScreen() {
  const { openMe } = useMePanel();
  const navigation = useNavigation();
  const [dislikes, setDislikes] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => openMe());
    return unsubscribe;
  }, [navigation, openMe]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val) setDislikes(JSON.parse(val));
    });
  }, []);

  const persist = async (next: string[]) => {
    setDislikes(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const addItem = () => {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed || dislikes.includes(trimmed)) return;
    persist([...dislikes, trimmed]);
    setInput('');
    Keyboard.dismiss();
  };

  const removeItem = (item: string) => {
    persist(dislikes.filter((d) => d !== item));
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: true }} />
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.hero}>
          <TouchableOpacity style={styles.heroBackBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.heroTitle}>Dislikes</Text>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: BG }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">

            <View style={styles.infoCard}>
              <Ionicons name="eye-off-outline" size={22} color={GOLD} />
              <Text style={styles.infoText}>
                These ingredients will be avoided in recipe suggestions unless you choose to include them.
              </Text>
            </View>

            <View style={styles.inputRow}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="e.g. olives, anchovies..."
                placeholderTextColor={MUTED}
                onSubmitEditing={addItem}
                returnKeyType="done"
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.addBtn, !input.trim() && styles.addBtnDisabled]}
                onPress={addItem}
                activeOpacity={0.8}
                disabled={!input.trim()}>
                <Ionicons name="add" size={22} color={SURFACE} />
              </TouchableOpacity>
            </View>

            {dislikes.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>😋</Text>
                <Text style={styles.emptyTitle}>No dislikes yet</Text>
                <Text style={styles.emptyMeta}>
                  Add ingredients you never want to see in recipes.
                </Text>
              </View>
            ) : (
              <View style={styles.list}>
                <Text style={styles.listHeader}>
                  {dislikes.length} item{dislikes.length !== 1 ? 's' : ''}
                </Text>
                {dislikes.map((item) => (
                  <View key={item} style={styles.tag}>
                    <Text style={styles.tagText}>{item}</Text>
                    <TouchableOpacity
                      onPress={() => removeItem(item)}
                      hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                      <Ionicons name="close-circle" size={20} color={MUTED} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
        </SafeAreaView>
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
    gap: 16,
  },
  infoCard: {
    backgroundColor: '#FFF0D8',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 4,
  },
  infoText: {
    flex: 1,
    color: DARK,
    fontSize: 13,
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 50,
    backgroundColor: SURFACE,
    borderRadius: 18,
    paddingHorizontal: 16,
    fontSize: 15,
    color: DARK,
    borderWidth: 1.5,
    borderColor: '#E2E3EA',
  },
  addBtn: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: { backgroundColor: '#FFD0C4' },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: {
    ...brandType,
    color: DARK,
    fontSize: 18,
    textTransform: 'uppercase',
  },
  emptyMeta: { color: MUTED, fontSize: 13, textAlign: 'center', lineHeight: 20 },
  list: { gap: 10 },
  listHeader: {
    ...brandType,
    color: MUTED,
    fontSize: 11,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  tag: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E3EA',
  },
  tagText: {
    color: DARK,
    fontSize: 15,
    textTransform: 'capitalize',
    fontWeight: '600',
    flex: 1,
  },
});
