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

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function safePreview(value: unknown, maxLength = 800) {
  try {
    return JSON.stringify(value).slice(0, maxLength);
  } catch {
    return String(value).slice(0, maxLength);
  }
}

function debugError(stage: string, message: string, status = 500, extra?: Record<string, unknown>) {
  console.error(`${stage}: ${message}`, extra ?? '');
  return jsonResponse(
    {
      error: message,
      stage,
      ...(extra ? { details: extra } : {}),
    },
    status,
  );
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

function extractOutputText(openAIResponse: any) {
  if (typeof openAIResponse?.output_text === 'string') {
    return openAIResponse.output_text;
  }

  const messageItem = openAIResponse?.output?.find((item: any) => item.type === 'message');
  const outputTextItem = messageItem?.content?.find(
    (item: any) =>
      (item.type === 'output_text' || item.type === 'text') && typeof item.text === 'string',
  );

  if (outputTextItem?.text) {
    return outputTextItem.text;
  }

  const contentTextItem = openAIResponse?.output
    ?.flatMap((item: any) => item.content ?? [])
    ?.find(
      (item: any) =>
        (item.type === 'output_text' || item.type === 'text') && typeof item.text === 'string',
    );

  return contentTextItem?.text ?? null;
}

function parseJsonOutput(outputText: string) {
  try {
    return JSON.parse(outputText);
  } catch {
    const jsonMatch = outputText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('No JSON object found in model output');
    }

    return JSON.parse(jsonMatch[0]);
  }
}

