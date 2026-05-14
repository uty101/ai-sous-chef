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

function extractOutputText(openAIResponse: any) {
  const messageItem = openAIResponse?.output?.find((item: any) => item.type === 'message');
  const outputTextItem = messageItem?.content?.find((item: any) => item.type === 'output_text');
  return outputTextItem?.text ?? null;
}

function getSafeOpenAIError(errorText: string) {
  try {
    const parsed = JSON.parse(errorText) as {
      error?: { message?: string; type?: string; code?: string };
    };

    return {
      message: parsed.error?.message?.slice(0, 500) ?? 'OpenAI request failed',
      type: parsed.error?.type ?? 'unknown',
      code: parsed.error?.code ?? 'unknown',
    };
  } catch {
    return {
      message: errorText.slice(0, 500),
      type: 'unknown',
      code: 'unknown',
    };
  }
}

function isValidRecipeResponse(value: unknown): value is RecipeResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.title === 'string' &&
    typeof candidate.description === 'string' &&
    typeof candidate.cuisine === 'string' &&
    Array.isArray(candidate.ingredients) &&
    candidate.ingredients.every((item) => typeof item === 'string') &&
    Array.isArray(candidate.steps) &&
    candidate.steps.every((item) => typeof item === 'string') &&
    typeof candidate.timeMinutes === 'number' &&
    candidate.nutrition !== null &&
    typeof candidate.nutrition === 'object' &&
    typeof (candidate.nutrition as any).calories === 'number'
  );
}

