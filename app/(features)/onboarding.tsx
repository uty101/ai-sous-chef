import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  UserProfile,
  DEFAULT_PROFILE,
  CookingLevel,
  SpiceTolerance,
  WeeklyBudget,
  DailyTimeAvailable,
  ShoppingFrequency,
  HouseholdSize,
  KitchenEquipment,
  LearningGoal,
  HealthGoal,
  MealType,
  DietaryPreference,
  Allergy,
  COOKING_LEVEL_OPTIONS,
  SPICE_OPTIONS,
  BUDGET_OPTIONS,
  TIME_OPTIONS,
  EQUIPMENT_OPTIONS,
  LEARNING_GOAL_OPTIONS,
  HEALTH_GOAL_OPTIONS,
  DIETARY_OPTIONS,
  ALLERGY_OPTIONS,
  SHOPPING_FREQ_OPTIONS,
  MEAL_TYPE_OPTIONS,
} from '@/constants/user-profile';

// ─── Palette ────────────────────────────────────────────────────────────────
const PRIMARY = '#1B1F23';
const ACCENT = '#FFBA35';
const CREAM = '#FAFAF7';
const MUTED = '#8A8FA3';
const CARD_BG = '#FFFFFF';
const BORDER = '#E2E3EA';

const { width: SCREEN_W } = Dimensions.get('window');

const STORAGE_KEY = 'ai_souschef_user_profile';

