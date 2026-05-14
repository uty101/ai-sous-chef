import AsyncStorage from '@react-native-async-storage/async-storage';
import { brandType } from '@/constants/brand';
import { useMePanel } from '@/contexts/me-panel-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, router } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
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

const STORAGE_KEY = '@sous_chef_allergens';

type Allergen = { id: string; label: string; emoji: string };

const ALLERGENS: Allergen[] = [
  { id: 'gluten',    label: 'Gluten',     emoji: '🌾' },
  { id: 'dairy',     label: 'Dairy',      emoji: '🥛' },
  { id: 'eggs',      label: 'Eggs',       emoji: '🥚' },
  { id: 'peanuts',   label: 'Peanuts',    emoji: '🥜' },
  { id: 'tree_nuts', label: 'Tree Nuts',  emoji: '🌰' },
  { id: 'fish',      label: 'Fish',       emoji: '🐟' },
  { id: 'shellfish', label: 'Shellfish',  emoji: '🦐' },
  { id: 'soya',      label: 'Soya',       emoji: '🫘' },
  { id: 'sesame',    label: 'Sesame',     emoji: '🌿' },
  { id: 'mustard',   label: 'Mustard',    emoji: '🌼' },
  { id: 'celery',    label: 'Celery',     emoji: '🥬' },
  { id: 'sulphites', label: 'Sulphites',  emoji: '🍷' },
  { id: 'lupin',     label: 'Lupin',      emoji: '🌸' },
  { id: 'molluscs',  label: 'Molluscs',   emoji: '🦑' },
];

