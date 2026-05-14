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

