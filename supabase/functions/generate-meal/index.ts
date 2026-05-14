// Supabase Edge Functions run on Deno.
// This function analyzes a grocery image and returns structured detection results.
// Preview mode is cheap and approximate; detect mode prioritizes ingredient recall.

type IngredientSource = 'vision' | 'label' | 'mixed';
type DetectionMode = 'preview' | 'detect';

type Ingredient = {
  name: string;
  confidence: number;
  source: IngredientSource;
};

type UnresolvedItem = {
  labelHint: string;
  reason: string;
};

type DetectionResponse = {
  confirmedIngredients: Ingredient[];
  possibleIngredients: Ingredient[];
  unresolvedItems: UnresolvedItem[];
  qualityWarnings: string[];
};

const OPENAI_API_URL = 'https://api.openai.com/v1/responses';
const OPENAI_MODEL = Deno.env.get('OPENAI_VISION_MODEL') ?? Deno.env.get('OPENAI_MODEL') ?? 'gpt-5.4';
const OPENAI_PREVIEW_MODEL = Deno.env.get('OPENAI_PREVIEW_MODEL') ?? 'gpt-5.4-mini';
const AUTO_CONFIRM_CONFIDENCE = 0.6;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

