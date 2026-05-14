import AsyncStorage from '@react-native-async-storage/async-storage';
import { PERSONALISE_STEPS_FUNCTION_URL, SUPABASE_ANON_KEY, SUPABASE_ENABLED } from './supabase';
import { buildProfilePrompt, type UserProfile } from './user-profile';

const USER_PROFILE_KEY = 'ai_souschef_user_profile';
const CACHE_PREFIX = 'psteps_v1_';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function deriveVibe(timeMinutes: number): string {
  if (timeMinutes <= 20) return 'Quick';
  if (timeMinutes <= 30) return 'Easy';
  if (timeMinutes <= 45) return 'Everyday';
  if (timeMinutes <= 60) return 'Gourmet';
  return 'Michelin';
}

function cacheKey(title: string, vibe: string, profileContext: string): string {
  const raw = `${title}|${vibe}|${profileContext}`;
  let h = 0;
  for (let i = 0; i < raw.length; i++) h = (Math.imul(31, h) + raw.charCodeAt(i)) | 0;
  return `${CACHE_PREFIX}${Math.abs(h)}`;
}

export async function personaliseSteps(
  recipe: { title: string; ingredients: string[]; steps: string[]; timeMinutes: number },
  vibeOverride?: string,
): Promise<string[]> {
  if (!SUPABASE_ENABLED || !PERSONALISE_STEPS_FUNCTION_URL) return recipe.steps;

  try {
    const rawProfile = await AsyncStorage.getItem(USER_PROFILE_KEY);
    const profile: UserProfile | null = rawProfile ? JSON.parse(rawProfile) : null;
    const profileContext = profile?.onboardingComplete ? buildProfilePrompt(profile) : '';
    const vibe = vibeOverride ?? deriveVibe(recipe.timeMinutes);
    const key = cacheKey(recipe.title, vibe, profileContext);

    const cached = await AsyncStorage.getItem(key);
    if (cached) {
      const { steps, ts } = JSON.parse(cached);
      if (Date.now() - ts < CACHE_TTL_MS && Array.isArray(steps)) return steps;
    }

    const response = await fetch(PERSONALISE_STEPS_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        title: recipe.title,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        vibe,
        profileContext,
      }),
    });

    if (!response.ok) return recipe.steps;

    const data = await response.json();
    if (!Array.isArray(data.steps) || data.steps.length === 0) return recipe.steps;

    await AsyncStorage.setItem(key, JSON.stringify({ steps: data.steps, ts: Date.now() }));
    return data.steps;
  } catch {
    return recipe.steps;
  }
}
