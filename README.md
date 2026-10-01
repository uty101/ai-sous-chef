# AI Sous Chef

A mobile cooking assistant built with Expo and React Native. Photograph what is in your fridge, and AI Sous Chef identifies the ingredients, then writes recipes to match your diet, skill level and taste profile.

## Features

- **Ingredient scanning.** Take a photo or pick one from your library. A vision model lists what it sees, with confidence scores; likely items are added automatically and uncertain ones are offered as suggestions.
- **Recipe generation.** Choose a vibe (Quick, Easy, Everyday, Gourmet or Michelin) and get a recipe for each of five nutrition focuses at once. Switching between them costs no extra request.
- **Personalised steps.** Method steps are rewritten for your cooking level and kitchen, then cached on the device for 7 days.
- **Pantry and shopping list.** Keep a basket of what you have and a list of staples, get quick meal ideas from leftovers, and build a shopping list.
- **Calendar.** Plan meals by day and look back at what you cooked.
- **Saved recipes.** Favourite recipes are grouped by date and searchable.
- **Trending dishes.** The Home screen shows dishes that are popular online, found through web search and refreshed daily.
- **Profile.** Onboarding captures cooking level, spice tolerance, budget, equipment and goals. You can also record allergies (the 14 UK major allergens), dislikes and nutrition targets.
- **Settings.** Metric or imperial units, servings, skill level, dark mode and daily meal reminders.

## Tech stack

| Layer | Technology |
|---|---|
| App | Expo SDK 54, React Native 0.81, React 19, TypeScript |
| Navigation | Expo Router (file-based routing) |
| Storage | AsyncStorage on the device |
| Backend | Supabase (auth, database, Deno edge functions) |
| AI | OpenAI, called only from edge functions |
| Search | Tavily web search for trending dishes |
| Notifications | expo-notifications (local, scheduled on the device) |

## How it works

```
Phone app ──photo / ingredients──▶ Supabase edge functions ──▶ OpenAI
    ▲                                         │
    └──────────── JSON recipe ◀───────────────┘
```

The OpenAI key never ships in the app. It is stored as a Supabase secret, and the app calls four edge functions:

| Function | Purpose |
|---|---|
| `generate-meal` | Detects ingredients in a photo |
| `generate-final-meal` | Writes a full recipe from ingredients, vibe and diet |
| `personalise-steps` | Rewrites recipe steps for the user's profile |
| `get-viral-dishes` | Finds trending dishes and caches them in the `viral_dishes` table |

If the Supabase environment variables are missing, the app still runs, but the AI features are switched off.

## Project structure

```
app/
  _layout.tsx         Root layout: brand intro, settings, Me panel context
  (tabs)/             Home, AI Sous Chef, Pantry, Calendar, Saved (plus the hidden Me tab)
  (features)/         Onboarding, Allergies, Dislikes, Nutrition, Settings, Shopping List
  camera.tsx          Full-screen camera for ingredient scanning
components/           Shared UI: tab bar, Me panel, brand intro, feature page template
constants/            Data types, user profile model, Supabase config, brand tokens
supabase/functions/   Edge functions (Deno)
utils/                Unit conversion
```

## Getting started

### Prerequisites

- Node.js 20 or later
- The Expo Go app on your phone, or an Android emulator or iOS simulator
- A Supabase project with an OpenAI API key (and a Tavily API key for trending dishes)

### 1. Install

```bash
git clone https://github.com/uty101/ai-sous-chef.git
cd ai-sous-chef
npm install
```

### 2. Configure the app

Copy `.env.example` to `.env` and fill in your Supabase details:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Configure the backend

Set the secrets the edge functions need, then deploy them:

```bash
npx supabase secrets set OPENAI_API_KEY=... TAVILY_API_KEY=...
npx supabase functions deploy generate-meal
npx supabase functions deploy generate-final-meal
npx supabase functions deploy personalise-steps
npx supabase functions deploy get-viral-dishes
```

Optional secrets choose the models: `OPENAI_MODEL`, `OPENAI_PREVIEW_MODEL` and `OPENAI_FINAL_MODEL`.

On Windows, `app-set-openai-key.cmd` prompts for the OpenAI key and stores it as a secret without writing it to disk.

### 4. Run

```bash
npm start              # Expo dev server; scan the QR code with Expo Go
npm run android        # Android emulator
npm run ios            # iOS simulator
npm run lint           # ESLint
```

Windows helper scripts are also included:

| Script | What it does |
|---|---|
| `app-phone.cmd` | Starts Expo on your Wi-Fi address and a free port, for testing on a phone |
| `app-phone-tunnel.cmd` | Starts Expo through an ngrok tunnel when your network blocks LAN connections |
| `app-preview.cmd` | Starts a local preview |
| `app-stop.cmd` | Stops any running Expo servers |

## Writing style

All app copy and AI prompts follow the same rules:

- UK English spelling (colour, courgette, aubergine, coriander, chilli)
- Specific cuisines (Japanese, Lebanese, West African) rather than broad labels
- Recipe titles of 2 to 4 words

## Commit history

Commits follow the [Conventional Commits](https://www.conventionalcommits.org) format, `type(scope): summary`, with a body explaining what changed and why. Common types are `feat` (new behaviour), `style` (visual changes), `fix`, `chore`, `build` and `docs`.
