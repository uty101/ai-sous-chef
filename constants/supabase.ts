import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';

export const SUPABASE_URL = supabaseUrl;
export const SUPABASE_ANON_KEY = supabaseAnonKey;
export const STORAGE_BUCKET = 'meal-images';
export const SUPABASE_ENABLED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
export const DETECT_INGREDIENTS_FUNCTION_URL = SUPABASE_ENABLED
  ? `${SUPABASE_URL}/functions/v1/generate-meal`
  : '';
export const GENERATE_FINAL_MEAL_FUNCTION_URL = SUPABASE_ENABLED
  ? `${SUPABASE_URL}/functions/v1/generate-final-meal`
  : '';
export const GET_VIRAL_DISHES_FUNCTION_URL = SUPABASE_ENABLED
  ? `${SUPABASE_URL}/functions/v1/get-viral-dishes`
  : '';
export const PERSONALISE_STEPS_FUNCTION_URL = SUPABASE_ENABLED
  ? `${SUPABASE_URL}/functions/v1/personalise-steps`
  : '';

export const supabase = SUPABASE_ENABLED
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
