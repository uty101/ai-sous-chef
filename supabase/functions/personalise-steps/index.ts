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

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const { title, ingredients, steps, vibe, profileContext } = await request.json();

    if (!title || !Array.isArray(steps) || steps.length === 0) {
      return jsonResponse({ error: 'title and steps are required' }, 400);
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) return jsonResponse({ error: 'Missing OpenAI API key' }, 500);

    const vibeHint = VIBE_INSTRUCTIONS[vibe] ?? VIBE_INSTRUCTIONS['Everyday'];
    const profileHint = profileContext
      ? `Cook profile: ${profileContext}.\n` +
        `Apply every aspect of this profile when rewriting:\n` +
        `- Cooking level dictates depth and tone — beginners get reassurance and visual cues, advanced cooks get precise technique language\n` +
        `- Only reference equipment listed in their profile; never assume tools they don't have\n` +
        `- Respect all dietary preferences, allergies, and disliked ingredients — never suggest substitutes that violate them\n` +
        `- Spice notes should match their stated tolerance\n` +
        `- If their learning goals include world cuisines or a specific technique, briefly surface the relevant cultural or technical context in the appropriate step\n` +
        `- If their health goals relate to this dish (e.g. build muscle, eat healthier), add a single relevant note where it fits naturally — never force it`
      : '';

    const prompt =
      `Rewrite the cooking steps for "${title}" to suit this specific user and their selected cooking vibe.\n\n` +
      `Ingredients: ${(ingredients ?? []).join(', ')}.\n\n` +
      `Original steps:\n${steps.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}\n\n` +
      `Vibe: ${vibe}. ${vibeHint}\n\n` +
      `${profileHint}\n\n` +
      `Rules:\n` +
      `- Return roughly the same number of steps (±2 of the original)\n` +
      `- Keep the same cooking method and final dish — only change wording, detail level, and tone\n` +
      `- UK English throughout (chilli, courgette, coriander, aubergine, prawns, etc.)\n` +
      `- Write each step as a direct instruction, not a sentence about the user\n` +
      `- Never use a hyphen as a punctuation mark or sentence connector (e.g. do not write "heat the pan - add garlic"); hyphens are only acceptable in compound words (e.g. "medium-high") and numeric ranges (e.g. "4-5 minutes")\n` +
      `- Return valid JSON only`;

    const openAIResponse = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input: [{ role: 'user', content: [{ type: 'input_text', text: prompt }] }],
        text: {
          format: {
            type: 'json_schema',
            name: 'personalised_steps',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                steps: { type: 'array', items: { type: 'string' } },
              },
              required: ['steps'],
              additionalProperties: false,
            },
          },
        },
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      return jsonResponse({ error: 'OpenAI request failed', details: errorText.slice(0, 500) }, 502);
    }

    const openAIData = await openAIResponse.json();
    const messageItem = openAIData?.output?.find((item: any) => item.type === 'message');
    const outputText = messageItem?.content?.find((item: any) => item.type === 'output_text')?.text ?? null;

    if (!outputText) return jsonResponse({ error: 'No output from OpenAI' }, 500);

    let parsed: unknown;
    try { parsed = JSON.parse(outputText); } catch { return jsonResponse({ error: 'Invalid JSON from OpenAI' }, 500); }

    if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as any).steps)) {
      return jsonResponse({ error: 'Invalid response shape' }, 500);
    }

    return jsonResponse(parsed);
  } catch (error) {
    console.error('personalise-steps failed:', error);
    return jsonResponse({ error: 'Something went wrong' }, 500);
  }
});
