import {
  DETECT_INGREDIENTS_FUNCTION_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_ENABLED,
} from '@/constants/supabase';
import { brandType } from '@/constants/brand';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Ingredient = {
  name: string;
  confidence: number;
  source: 'vision' | 'label' | 'mixed';
};

type DetectionPreviewResponse = {
  confirmedIngredients: Ingredient[];
  possibleIngredients: Ingredient[];
};

const PREVIEW_SCAN_MAX_EDGE = 900;

function isIngredient(value: unknown): value is Ingredient {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Record<string, unknown>;
  return (
    typeof item.name === 'string' &&
    typeof item.confidence === 'number' &&
    (item.source === 'vision' || item.source === 'label' || item.source === 'mixed')
  );
}

function isDetectionPreviewResponse(value: unknown): value is DetectionPreviewResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Record<string, unknown>;
  return (
    Array.isArray(item.confirmedIngredients) &&
    item.confirmedIngredients.every(isIngredient) &&
    Array.isArray(item.possibleIngredients) &&
    item.possibleIngredients.every(isIngredient)
  );
}

