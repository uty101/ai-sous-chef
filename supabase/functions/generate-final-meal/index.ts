// Supabase Edge Functions run on Deno.
// This function receives a corrected ingredient list and a meal goal,
// then asks OpenAI to build a practical recipe.

type Nutrition = { calories: number; protein: number; carbs: number; fats: number };

type RecipeResponse = {
  title: string;
  description: string;
  cuisine: string;
  ingredients: string[];
  steps: string[];
  timeMinutes: number;
  nutrition: Nutrition;
};

const OPENAI_API_URL = 'https://api.openai.com/v1/responses';
const OPENAI_MODEL = Deno.env.get('OPENAI_FINAL_MODEL') ?? Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

