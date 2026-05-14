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

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow POST requests.
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    // Read the corrected ingredients and goal from the request body.
    const { ingredients, goal } = await request.json();

    if (!Array.isArray(ingredients) || ingredients.length === 0 || !goal) {
      return jsonResponse({ error: 'ingredients and goal are required' }, 400);
    }

    const cleanedIngredients = ingredients
      .filter((item) => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);

    if (cleanedIngredients.length === 0) {
      return jsonResponse({ error: 'ingredients and goal are required' }, 400);
    }

    // Read the API key from the server-side environment only.
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      console.error('Missing OPENAI_API_KEY secret');
      return jsonResponse({ error: 'Missing OpenAI API key', stage: 'missing_openai_key' }, 500);
    }

    // Ask OpenAI for a concrete, usable recipe with realistic steps and timing.
    const openAIResponse = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text:
                  `Create a recipe for the goal "${goal}" using these ingredients: ${cleanedIngredients.join(', ')}. ` +
                  'Return one realistic recipe with a short user-friendly description, a practical ingredient list with amounts, clear cooking steps, and a reasonable total time in minutes. ' +
                  'Give the dish a short, clean title — 2 to 4 words maximum, the dish name only (e.g. "Chicken Fried Rice", "Lentil Soup", "Prawn Tacos"). Never list ingredients in the title, never use "with", "and", or descriptive clauses. ' +
                  'Include the specific cuisine name as a single proper noun or short phrase (e.g. "Japanese", "Lebanese", "West African", "British", "Peruvian") — be specific, never use vague labels like "International" or "Fusion". ' +
                  'Make the steps specific and actionable, not vague. ' +
                  'Keep the recipe simple and usable for a home cook. ' +
                  'Include estimated nutrition per serving (calories, protein in g, carbs in g, fats in g). ' +
                  'Never use a hyphen as a punctuation mark or sentence connector (e.g. do not write "heat the pan - add garlic"). Hyphens are only acceptable inside compound words (e.g. "medium-high", "pan-fry") and numeric ranges (e.g. "4-5 minutes"). ' +
                  'Return valid JSON only.',
              },
            ],
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'final_recipe',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                cuisine: { type: 'string' },
                ingredients: {
                  type: 'array',
                  items: { type: 'string' },
                },
                steps: {
                  type: 'array',
                  items: { type: 'string' },
                },
                timeMinutes: { type: 'number' },
                nutrition: {
                  type: 'object',
                  properties: {
                    calories: { type: 'number' },
                    protein: { type: 'number' },
                    carbs: { type: 'number' },
                    fats: { type: 'number' },
                  },
                  required: ['calories', 'protein', 'carbs', 'fats'],
                  additionalProperties: false,
                },
              },
              required: ['title', 'description', 'cuisine', 'ingredients', 'steps', 'timeMinutes', 'nutrition'],
              additionalProperties: false,
            },
          },
        },
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI request failed:', errorText);
      return jsonResponse(
        {
          error: 'OpenAI request failed',
          stage: 'openai_request_failed',
          details: getSafeOpenAIError(errorText),
        },
        502,
      );
    }

    const openAIData = await openAIResponse.json();
    const outputText = extractOutputText(openAIData);

    if (!outputText) {
      console.error('OpenAI response did not contain output text:', openAIData);
      return jsonResponse({ error: 'OpenAI response had no output text', stage: 'openai_no_output_text' }, 500);
    }

    let parsedResult: unknown;

    try {
      parsedResult = JSON.parse(outputText);
    } catch (error) {
      console.error('OpenAI returned invalid JSON:', outputText, error);
      return jsonResponse({ error: 'OpenAI returned invalid JSON', stage: 'openai_invalid_json' }, 500);
    }

    if (!isValidRecipeResponse(parsedResult)) {
      console.error('OpenAI returned unexpected JSON shape:', parsedResult);
      return jsonResponse({ error: 'OpenAI returned unexpected JSON shape', stage: 'openai_invalid_recipe_shape' }, 500);
    }

    return jsonResponse(parsedResult);
  } catch (error) {
    console.error('generate-final-meal failed:', error);
    return jsonResponse({ error: 'Something went wrong', stage: 'function_exception' }, 500);
  }
});
