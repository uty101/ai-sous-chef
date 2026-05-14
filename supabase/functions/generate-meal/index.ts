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

function isIngredientSource(value: unknown): value is IngredientSource {
  return value === 'vision' || value === 'label' || value === 'mixed';
}

function parseIngredient(value: unknown): Ingredient | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const item = value as Record<string, unknown>;

  if (
    typeof item.name !== 'string' ||
    typeof item.confidence !== 'number' ||
    !isIngredientSource(item.source) ||
    item.confidence < 0 ||
    item.confidence > 1
  ) {
    return null;
  }

  return {
    name: item.name.trim(),
    confidence: item.confidence,
    source: item.source,
  };
}

function parseIngredientArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(parseIngredient).filter((item): item is Ingredient => item !== null && item.name.length > 0);
}

function parseUnresolvedItems(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const item = entry as Record<string, unknown>;

      if (typeof item.labelHint !== 'string' || typeof item.reason !== 'string') {
        return null;
      }

      return {
        labelHint: item.labelHint.trim(),
        reason: item.reason.trim(),
      };
    })
    .filter(
      (item): item is UnresolvedItem =>
        item !== null && item.labelHint.length > 0 && item.reason.length > 0,
    );
}

function parseQualityWarnings(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeIngredientName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/^(fresh|raw|whole|packaged|a packet of|packet of|bag of|bottle of|jar of)\s+/, '');
}

function normalizeDetectionResponse(value: unknown): DetectionResponse | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const allIngredients = [
    ...parseIngredientArray(candidate.confirmedIngredients),
    ...parseIngredientArray(candidate.possibleIngredients),
  ];
  const byName = new Map<string, Ingredient>();

  for (const ingredient of allIngredients) {
    const normalizedName = normalizeIngredientName(ingredient.name);
    const existingIngredient = byName.get(normalizedName);

    if (!existingIngredient || ingredient.confidence > existingIngredient.confidence) {
      byName.set(normalizedName, {
        ...ingredient,
        name: ingredient.name.trim().replace(/\s+/g, ' '),
      });
    }
  }

  const dedupedIngredients = Array.from(byName.values()).sort((a, b) => b.confidence - a.confidence);
  const confirmedIngredients = dedupedIngredients.filter(
    (ingredient) => ingredient.confidence >= AUTO_CONFIRM_CONFIDENCE,
  );
  const possibleIngredients = dedupedIngredients.filter(
    (ingredient) => ingredient.confidence < AUTO_CONFIRM_CONFIDENCE,
  );

  return {
    confirmedIngredients,
    possibleIngredients,
    unresolvedItems: parseUnresolvedItems(candidate.unresolvedItems),
    qualityWarnings: parseQualityWarnings(candidate.qualityWarnings),
  };
}

function getDetectionSchema() {
  const ingredientSchema = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      confidence: { type: 'number' },
      source: {
        type: 'string',
        enum: ['vision', 'label', 'mixed'],
      },
    },
    required: ['name', 'confidence', 'source'],
    additionalProperties: false,
  };

  return {
    confirmedIngredients: {
      type: 'array',
      items: ingredientSchema,
    },
    possibleIngredients: {
      type: 'array',
      items: ingredientSchema,
    },
    unresolvedItems: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          labelHint: { type: 'string' },
          reason: { type: 'string' },
        },
        required: ['labelHint', 'reason'],
        additionalProperties: false,
      },
    },
    qualityWarnings: {
      type: 'array',
      items: { type: 'string' },
    },
  };
}

function getResponseSchema(_mode: DetectionMode) {
  const detectionProperties = getDetectionSchema();

  return {
    type: 'object',
    properties: detectionProperties,
    required: ['confirmedIngredients', 'possibleIngredients', 'unresolvedItems', 'qualityWarnings'],
    additionalProperties: false,
  };
}

function buildPrompt(goal: string, mode: DetectionMode) {
  const basePrompt =
    'You are the ingredient detection layer for a mobile cooking app. ' +
    'Your outcome is a comprehensive, user-reviewable grocery inventory from one photo. ' +
    'Prioritize recall: include every visible food, drink, sauce, spice, packaged grocery, fresh ingredient, and cooking staple that has visual or label evidence. ' +
    'Do not invent hidden items, but do include partially visible items when shape, color, packaging, or readable text gives useful evidence. ' +
    'For packaged foods, read visible labels and normalize brands/products into simple ingredient names when possible, for example "pasta", "tomato sauce", "shredded cheese", "tortillas", "rice", "yogurt", or "chicken stock". ' +
    'If the exact product flavor or variety is uncertain, use the broader useful ingredient category instead of dropping it. ' +
    'If several examples of the same food are visible, return one ingredient name rather than duplicates. ' +
    'Use the source "vision" when the visual item itself is the main evidence, "label" when readable packaging text is the main evidence, and "mixed" when both matter. ' +
    'Place strong detections in confirmedIngredients. Put useful but less certain detections in possibleIngredients rather than omitting them. ' +
    'Do not repeat the same ingredient in both lists. ' +
    'If there are packaged or unclear foods you cannot confidently normalize, put them in unresolvedItems with a short labelHint and reason. ' +
    'If the photo quality causes issues, add short notes to qualityWarnings such as "glare on packaging", "items overlap", or "label text unreadable". ';

  if (mode === 'preview') {
    return (
      basePrompt +
      `This is a live camera preview for the "${goal}" goal. Prioritize fast, concise detection. Return valid JSON only.`
    );
  }

  return (
    basePrompt +
    `This is the final photo scan for the "${goal}" goal. Spend the effort on visual ingredient detection only; do not generate meal ideas. ` +
    'Success means the user sees almost everything visible in the photo, even if some items are marked possible for review. Return valid JSON only.'
  );
}

function getOpenAIRequestBody(imageUri: string, goal: string, mode: DetectionMode) {
  const imageContent =
    mode === 'preview'
      ? {
          type: 'input_image',
          image_url: imageUri,
          detail: 'low',
        }
      : {
          type: 'input_image',
          image_url: imageUri,
        };

  return {
    model: mode === 'preview' ? OPENAI_PREVIEW_MODEL : OPENAI_MODEL,
    reasoning: {
      effort: mode === 'preview' ? 'low' : 'medium',
    },
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: buildPrompt(goal, mode),
          },
          imageContent,
        ],
      },
    ],
    text: {
      verbosity: 'low',
      format: {
        type: 'json_schema',
        name: mode === 'preview' ? 'ingredient_preview' : 'ingredient_detection',
        strict: true,
        schema: getResponseSchema(mode),
      },
    },
  };
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const { imageUri, goal, mode: rawMode } = await request.json();
    const mode: DetectionMode = rawMode === 'preview' ? 'preview' : 'detect';

    if (!imageUri || !goal) {
      return jsonResponse({ error: 'imageUri and goal are required' }, 400);
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      return debugError('missing_openai_key', 'Missing OpenAI API key');
    }

    const openAIResponse = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(getOpenAIRequestBody(imageUri, goal, mode)),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      const details = getSafeOpenAIError(errorText);
      console.error('OpenAI request failed:', errorText);
      return jsonResponse(
        {
          error: 'OpenAI request failed',
          stage: 'openai_request_failed',
          details,
        },
        502,
      );
    }

    const openAIData = await openAIResponse.json();
    const outputText = extractOutputText(openAIData);

    if (!outputText) {
      return debugError('openai_no_output_text', 'OpenAI response did not contain output text', 500, {
        responsePreview: safePreview(openAIData),
      });
    }

    let parsedResult: unknown;

    try {
      parsedResult = parseJsonOutput(outputText);
    } catch (error) {
      return debugError('openai_invalid_json', 'OpenAI returned invalid JSON', 500, {
        outputPreview: outputText.slice(0, 800),
        parseError: error instanceof Error ? error.message : String(error),
      });
    }

    const detectionResult = normalizeDetectionResponse(parsedResult);

    if (!detectionResult) {
      return debugError('openai_invalid_detection_shape', 'OpenAI returned unexpected detection JSON shape', 500, {
        parsedPreview: safePreview(parsedResult),
      });
    }

    return jsonResponse(detectionResult);
  } catch (error) {
    return debugError('function_exception', 'Ingredient detection function failed', 500, {
      message: error instanceof Error ? error.message : String(error),
    });
  }
});
