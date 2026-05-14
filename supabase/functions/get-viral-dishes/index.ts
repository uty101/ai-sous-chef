// Supabase Edge Function — get-viral-dishes
// Fetches the four most viral food dishes from the previous day (2 TikTok, 2 Instagram)
// via Tavily web search + OpenAI formatting. Results are cached in the viral_dishes table.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENAI_API_URL = 'https://api.openai.com/v1/responses';
const TAVILY_API_URL = 'https://api.tavily.com/search';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

async function searchTavily(query: string, apiKey: string) {
  const res = await fetch(TAVILY_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: 'basic',
      include_answer: true,
      max_results: 8,
    }),
  });
  if (!res.ok) throw new Error(`Tavily error ${res.status}: ${await res.text()}`);
  return res.json();
}

function extractOutputText(openAIResponse: any): string | null {
  const msg = openAIResponse?.output?.find((i: any) => i.type === 'message');
  return msg?.content?.find((i: any) => i.type === 'output_text')?.text ?? null;
}

const dishSchema = {
  type: 'object',
  properties: {
    title:       { type: 'string' },
    description: { type: 'string' },
    cuisine:     { type: 'string' },
    timeMinutes: { type: 'number' },
    ingredients: { type: 'array', items: { type: 'string' } },
    steps:       { type: 'array', items: { type: 'string' } },
    nutrition: {
      type: 'object',
      properties: {
        calories: { type: 'number' },
        protein:  { type: 'number' },
        carbs:    { type: 'number' },
        fats:     { type: 'number' },
      },
      required: ['calories', 'protein', 'carbs', 'fats'],
      additionalProperties: false,
    },
    views:  { type: 'string' },
    accent: { type: 'string' },
    bg:     { type: 'string' },
  },
  required: ['title', 'description', 'cuisine', 'timeMinutes', 'ingredients', 'steps', 'nutrition', 'views', 'accent', 'bg'],
  additionalProperties: false,
};

async function buildDishesFromSearch(
  searchData: any,
  platform: 'tiktok' | 'instagram',
  date: string,
  openAIKey: string,
  model: string,
): Promise<any[]> {
  const snippets = (searchData.results ?? [])
    .map((r: any) => `${r.title}\n${r.content}`)
    .join('\n\n');
  const answer = searchData.answer ?? '';

  const prompt =
    `You are a food expert. The date is ${date}. ` +
    `Based on the search results below about trending food on ${platform === 'tiktok' ? 'TikTok' : 'Instagram'}, ` +
    `identify the TWO most viral food items (can be meals, snacks, drinks, or desserts) and write a complete recipe for each. They must be different dishes.\n\n` +
    `Search results:\n${answer}\n\n${snippets}\n\n` +
    `Rules:\n` +
    `- title must be 2 to 4 words maximum, the dish name only (e.g. "Birria Tacos", "Miso Salmon", "Smash Burgers") — never list ingredients in the title, never use "with", "and", or descriptive clauses\n` +
    `- cuisine must be a specific country or tradition (never "Asian", "Mediterranean", "Western" etc — always "Japanese", "Lebanese", "Italian", "Korean", etc.)\n` +
    `- description must be one punchy sentence under 120 characters\n` +
    `- never use a hyphen as a punctuation mark or sentence connector (e.g. do not write "fry the garlic - add sauce"); hyphens only in compound words (e.g. "deep-fried") and numeric ranges (e.g. "4-5 minutes")\n` +
    `- views should look like a real viral count e.g. "2.4M" or "890K"\n` +
    `- accent: a vibrant hex colour that matches the dish vibe\n` +
    `- bg: a very light pastel tint of the same hue\n` +
    `- the two dishes must have different accent colours\n` +
    `Return valid JSON only, no markdown fences.`;

  const res = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: [{ role: 'user', content: [{ type: 'input_text', text: prompt }] }],
      text: {
        format: {
          type: 'json_schema',
          name: 'viral_dishes',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              dishes: { type: 'array', items: dishSchema },
            },
            required: ['dishes'],
            additionalProperties: false,
          },
        },
      },
    }),
  });

  if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = extractOutputText(data);
  if (!text) throw new Error('OpenAI returned no output text');
  const parsed = JSON.parse(text);
  return parsed.dishes ?? [];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const tavilyKey   = Deno.env.get('TAVILY_API_KEY');
    const openAIKey   = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const model       = Deno.env.get('OPENAI_FINAL_MODEL') ?? Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini';

    if (!tavilyKey || !openAIKey) {
      return jsonResponse({ error: 'Missing API keys' }, 500);
    }

    const db = createClient(supabaseUrl, serviceKey);
    const yesterday = getYesterday();

    // Return cached results if all four slots are filled
    const { data: cached } = await db
      .from('viral_dishes')
      .select('*')
      .eq('viral_date', yesterday)
      .order('platform')
      .order('rank');

    const countByPlatform = (cached ?? []).reduce((acc: Record<string, number>, d: any) => {
      acc[d.platform] = (acc[d.platform] ?? 0) + 1;
      return acc;
    }, {});

    if ((countByPlatform['tiktok'] ?? 0) >= 2 && (countByPlatform['instagram'] ?? 0) >= 2) {
      return jsonResponse(cached);
    }

    const results = [...(cached ?? [])];
    const platforms: Array<'tiktok' | 'instagram'> = ['tiktok', 'instagram'];

    for (const platform of platforms) {
      if ((countByPlatform[platform] ?? 0) >= 2) continue;

      const query = `most viral trending food ${platform === 'tiktok' ? 'TikTok' : 'Instagram'} ${yesterday} recipe`;
      const searchData = await searchTavily(query, tavilyKey);
      const dishes = await buildDishesFromSearch(searchData, platform, yesterday, openAIKey, model);

      for (let i = 0; i < Math.min(dishes.length, 2); i++) {
        const dish = dishes[i];
        const rank = i + 1;

        const row = {
          viral_date:   yesterday,
          platform,
          rank,
          title:        dish.title,
          description:  dish.description,
          cuisine:      dish.cuisine,
          time_minutes: dish.timeMinutes,
          ingredients:  dish.ingredients,
          steps:        dish.steps,
          nutrition:    dish.nutrition,
          views:        dish.views,
          accent:       dish.accent,
          bg:           dish.bg,
        };

        const { data: inserted, error } = await db
          .from('viral_dishes')
          .insert(row)
          .select()
          .single();

        if (error) console.error(`Insert error for ${platform} rank ${rank}:`, error);
        if (inserted) results.push(inserted);
      }
    }

    return jsonResponse(results);
  } catch (err) {
    console.error('get-viral-dishes failed:', err);
    return jsonResponse({ error: 'Failed to fetch viral dishes' }, 500);
  }
});
