import AsyncStorage from '@react-native-async-storage/async-storage';
import { brandType } from '@/constants/brand';
import { useMePanel } from '@/contexts/me-panel-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, router } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
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

const SETTINGS_KEY = '@sous_chef_settings';

type SkillLevel = 'beginner' | 'home_cook' | 'advanced';

type Settings = {
  units: 'metric' | 'imperial';
  notifications: boolean;
  darkMode: boolean;
  servings: number;
  skillLevel: SkillLevel;
};

const DEFAULT_SETTINGS: Settings = {
  units: 'metric',
  notifications: true,
  darkMode: false,
  servings: 2,
  skillLevel: 'home_cook',
};

