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
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const VIBE_INSTRUCTIONS: Record<string, string> = {
  Quick: 'Be ultra-concise. Batch steps that can happen simultaneously. Skip technique explanations — just say what to do and move on.',
  Easy: 'Write in a reassuring, encouraging tone. Explain why each step matters. Use simple language, no jargon. Include visual cues like "until golden" or "until bubbling".',
  Everyday: 'Practical and efficient. Include timing tips and what can be prepped ahead. Conversational but not patronising.',
  Gourmet: 'Include technique detail — temperatures, why timing matters, how to tell when something is ready. Add a plating tip at the end.',
  Michelin: 'Professional kitchen language. Precise temperatures, weights, and timings where relevant. Include finishing and plating notes.',
};

