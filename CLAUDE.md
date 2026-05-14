# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start                  # Expo dev server (defaults to web/QR)
npm run android            # Android emulator
npm run ios                # iOS simulator
npm run lint               # ESLint via expo lint

app-phone.cmd              # Smart LAN launcher — finds free port, uses Wi-Fi IP
app-phone-tunnel.cmd       # Tunnel mode (ngrok v3 required — see project memory)
app-set-openai-key.cmd     # Saves OpenAI API key as a Supabase Edge Function secret (never written to project files)
```

Supabase edge functions are deployed with:
```bash
npx supabase functions deploy <function-name>
```

There are no tests.

## Environment Setup

Copy `.env.example` to `.env` and fill in Supabase credentials:
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

The OpenAI API key is **never** stored in `.env` — it lives as a Supabase secret. Run `app-set-openai-key.cmd` once to set it. All AI calls go through Supabase Edge Functions; the client never calls OpenAI directly.

If `EXPO_PUBLIC_SUPABASE_URL` or `EXPO_PUBLIC_SUPABASE_ANON_KEY` are missing, `constants/supabase.ts` exports `SUPABASE_ENABLED = false` and `supabase = null`, and all AI features degrade silently.

## Architecture

### Navigation (Expo Router v6, file-based)

```
app/
  _layout.tsx          Root layout — BrandIntro gate, MePanelContext provider, dark mode/units state
  (tabs)/
    _layout.tsx        Tab layout — 5 visible tabs + floating "Menu" button that opens MePanel
    index.tsx          Home
    ai-souschef.tsx    Main cook screen (largest screen — ingredient detection + recipe generation)
    saved.tsx
    pantry.tsx
    calendar.tsx
    me.tsx             Hidden from tab bar; accessed only via MePanel
  (features)/
    _layout.tsx        Stack navigator for profile/settings screens
    onboarding.tsx
    allergies.tsx
    dislikes.tsx
    settings.tsx
    ...
  camera.tsx           Full-screen modal (fullScreenModal presentation)
```

The `(features)` group contains screens that slide up over the tab bar. The `me.tsx` tab is registered with `href: null` — it is never reachable from the tab bar; the floating Menu button in `(tabs)/_layout.tsx` opens the `MePanel` slide-down instead.

### State and Persistence

There is no Redux, Zustand, or other state manager. All persistence is AsyncStorage with named keys:

| Key | Contents |
|-----|----------|
| `@sous_chef_settings` | `{ units, darkMode }` |
| `ai_souschef_user_profile` | `UserProfile` JSON |
| `pantry_basket` / `pantry_staples` | `string[]` |
| `shopping_list_items` | `ShoppingItem[]` |
| `saved_favorites` | `string[]` (recipe IDs) |
| `saved_recipes_data` | `Record<id, RecipeEntry>` |
| `psteps_v1_<hash>` | Personalised steps cache (7-day TTL) |

The only React context is `MePanelContext` (`contexts/me-panel-context.tsx`), which carries `meOpen/openMe/closeMe`, `units`/`setUnits`, and `darkMode`/`setDarkMode`. Access it with `useMePanel()` or `useUnits()`.

### AI Flow (ai-souschef.tsx)

The main cook screen works in two phases:

1. **Ingredient detection** — sends a base64 JPEG to `generate-meal` edge function (OpenAI vision). Returns `confirmedIngredients` (≥0.6 confidence) and `possibleIngredients`. Items ≥0.45 are auto-added to the editable list; lower items are shown as tappable suggestions.

2. **Recipe generation** — fires 5 parallel requests to `generate-final-meal` (one per diet variant), staggered 400 ms apart to avoid OpenAI rate limits. Failed diets are retried sequentially with a 1 s gap. The result is a `Partial<Record<Diet, RecipeResult>>`.

After generation, `RecipeCard` immediately calls `personaliseSteps()` (`constants/personalise-steps.ts`) which rewrites steps via the `personalise-steps` edge function, with a 7-day AsyncStorage cache keyed by `title | vibe | profileContext` hash.

### Supabase Edge Functions (`supabase/functions/`)

All functions are Deno TypeScript. They share the same pattern: CORS preflight handling, JSON schema enforcement via OpenAI structured outputs, and a `jsonResponse()` helper.

| Function | Purpose | Models |
|----------|---------|--------|
| `generate-meal` | Image → ingredient list | `OPENAI_VISION_MODEL` (preview: `OPENAI_PREVIEW_MODEL`) |
| `generate-final-meal` | Ingredients → recipe | `OPENAI_FINAL_MODEL` |
| `personalise-steps` | Rewrite steps for vibe + profile | `OPENAI_FINAL_MODEL` |
| `get-viral-dishes` | Tavily search → 4 trending dish cards | `OPENAI_FINAL_MODEL`; results cached in `viral_dishes` Supabase table |

### Types and Constants

- `constants/app-types.ts` — shared data types: `PantryItem`, `ShoppingItem`, `PlannedMealEntry`, `RecipeEntry`, `WeekPlan`, etc.
- `constants/user-profile.ts` — `UserProfile` type, all option arrays, and `buildProfilePrompt()` which serialises a profile into a compact prompt string injected into every AI call
- `constants/feature-pages.ts` — static content for `FeaturePage` preview cards (marketing screens for not-yet-built features)
- `constants/brand.ts` — `brandType` style object (heavy condensed font); used everywhere for headings
- `constants/theme.ts` — `Colors` (light/dark) and `Fonts` (platform-specific system font stacks)
- `utils/units.ts` — `convertText()` converts metric units inline in recipe text when the user is in imperial mode

### Colour Palette

Inline constants are used throughout (no theme object for these):
- Orange `#FF5C35` — primary brand / CTA
- Cream `#FFF8F0` — screen background
- Ink `#1C1F2E` — primary text / hero backgrounds
- Gold `#FFBA35` — secondary accent / nutrition badges

## Copy and AI Prompt Rules

These rules are enforced in all edge function prompts and must be applied to any new UI copy or AI prompt changes:

- **UK English** throughout: chilli, courgette, aubergine, coriander, prawns, colour, flavour, -ise suffixes
- **No hyphens as sentence connectors** — hyphens only in compound words (e.g. `medium-high`, `pan-fry`) and numeric ranges (e.g. `4-5 minutes`)
- **No em dashes** — split with a full stop instead
- **Cuisine specificity** — always name the specific country or tradition (e.g. "Japanese", "Lebanese", "West African"); never use broad labels like "Asian", "Mediterranean", or "Fusion"
- **Recipe titles** — 2 to 4 words maximum, dish name only; never include "with", "and", or ingredient lists in the title
