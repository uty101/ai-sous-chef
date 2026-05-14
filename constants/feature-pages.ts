import type { FeaturePageContent } from '@/components/feature-page';

export const featurePages = {
  pantry: {
    eyebrow: 'Personal kitchen',
    title: 'Pantry',
    subtitle: 'Staples, favorites, dislikes, allergies, and preferences that make recipes feel made for you.',
    icon: 'basket-outline',
    stats: [
      { value: '18', label: 'Staples' },
      { value: '4', label: 'Preferences' },
      { value: '3', label: 'Always avoid' },
    ],
    primaryAction: { label: 'Cook From Pantry', icon: 'restaurant-outline', route: '/(tabs)/ai-souschef' },
    secondaryAction: { label: 'Taste Profile', icon: 'options-outline', route: '/taste-profile' },
    sections: [
      {
        title: 'Common Ingredients',
        description: 'A quick shelf view for the ingredients the app can lean on without asking every time.',
        items: [
          { title: 'Eggs, Greek Yogurt, Tofu', meta: 'Protein', detail: 'Reliable anchors for high-protein goals.', icon: 'barbell-outline' },
          { title: 'Rice, Pasta, Tortillas', meta: 'Base', detail: 'Fast foundations for bowls, wraps, and skillet meals.', icon: 'albums-outline', tone: 'gold' },
          { title: 'Garlic, Chili Flakes, Soy Sauce', meta: 'Flavor', detail: 'Staples that add depth without extra planning.', icon: 'flame-outline', tone: 'sage' },
        ],
      },
      {
        title: 'Guardrails',
        items: [
          { title: 'Allergies', meta: 'Pinned', detail: 'Keep strict avoid rules visible before recipe generation.', icon: 'medical-outline' },
          { title: 'Dislikes', meta: 'Editable', detail: 'Skip ingredients that technically work but never sound good.', icon: 'close-circle-outline', tone: 'gold' },
        ],
      },
    ],
  },
  'meal-goals': {
    eyebrow: 'Choose the brief',
    title: 'Meal Goals',
    subtitle: 'A polished goal selector for the kind of meal you want before scanning or generating.',
    icon: 'flag-outline',
    stats: [
      { value: '3', label: 'Live goals' },
      { value: '5', label: 'Coming next' },
      { value: '1 tap', label: 'To cook' },
    ],
    primaryAction: { label: 'Start Cooking', icon: 'flash-outline', route: '/(tabs)/ai-souschef' },
    sections: [
      {
        title: 'Active Goals',
        items: [
          { title: 'High Protein', meta: 'Fuel', detail: 'Lean, filling meals built around protein.', icon: 'barbell-outline' },
          { title: 'Healthy', meta: 'Balance', detail: 'Colorful plates with simple prep and lighter sauces.', icon: 'leaf-outline', tone: 'sage' },
          { title: 'Quick', meta: 'Fast', detail: 'Low-fuss ideas for busy weeknights.', icon: 'timer-outline', tone: 'gold' },
        ],
      },
      {
        title: 'Future Goals',
        items: [
          { title: 'Budget, Vegetarian, Low Carb', meta: 'Next', detail: 'Goal chips ready for richer personalization.', icon: 'sparkles-outline' },
          { title: 'Comfort Food', meta: 'Cozy', detail: 'For days when the app should optimize for joy.', icon: 'heart-outline', tone: 'gold' },
        ],
      },
    ],
  },
  'weekly-plan': {
    eyebrow: 'Plan ahead',
    title: 'Weekly Plan',
    subtitle: 'Generate a small meal plan from current ingredients, pantry staples, and saved favorites.',
    icon: 'calendar-outline',
    stats: [
      { value: '5', label: 'Dinners' },
      { value: '2', label: 'Leftovers' },
      { value: '1 list', label: 'Shopping' },
    ],
    primaryAction: { label: 'Shopping List', icon: 'cart-outline', route: '/shopping-list' },
    secondaryAction: { label: 'Saved Ideas', icon: 'bookmark-outline', route: '/(tabs)/saved' },
    sections: [
      {
        title: 'This Week',
        items: [
          { title: 'Mon: Lemon Chickpea Bowls', meta: '25 min', detail: 'Uses greens, rice, yogurt, and pantry spices.', icon: 'sunny-outline', tone: 'sage' },
          { title: 'Wed: Tofu Noodle Stir Fry', meta: '20 min', detail: 'A quick middle-of-week reset.', icon: 'restaurant-outline' },
          { title: 'Fri: Loaded Tortilla Skillet', meta: '30 min', detail: 'Turns odds and ends into something generous.', icon: 'flame-outline', tone: 'gold' },
        ],
      },
      {
        title: 'Plan Logic',
        items: [
          { title: 'Use Fresh First', meta: 'Smart', detail: 'Prioritizes produce and open ingredients before shelf-stable items.', icon: 'leaf-outline', tone: 'sage' },
          { title: 'Repeat Favorites', meta: 'Gentle', detail: 'Pulls in saved recipes without making the week feel repetitive.', icon: 'repeat-outline' },
        ],
      },
    ],
  },
  'shopping-list': {
    eyebrow: 'Missing pieces',
    title: 'Shopping List',
    subtitle: 'Ingredients missing from a recipe or weekly plan, grouped so grocery runs are painless.',
    icon: 'cart-outline',
    stats: [
      { value: '12', label: 'Items' },
      { value: '4', label: 'Groups' },
      { value: '3', label: 'Optional' },
    ],
    primaryAction: { label: 'Weekly Plan', icon: 'calendar-outline', route: '/weekly-plan' },
    sections: [
      {
        title: 'Grouped List',
        items: [
          { title: 'Produce', meta: '5', detail: 'Lemons, spinach, scallions, tomatoes, cilantro.', icon: 'leaf-outline', tone: 'sage' },
          { title: 'Dairy', meta: '2', detail: 'Feta and Greek yogurt for bowls and sauces.', icon: 'water-outline' },
          { title: 'Pantry', meta: '4', detail: 'Chickpeas, noodles, sesame oil, tortillas.', icon: 'archive-outline', tone: 'gold' },
        ],
      },
      {
        title: 'Helpful Bits',
        items: [
          { title: 'Already Have', meta: 'Hidden', detail: 'Pantry staples can be excluded from the list automatically.', icon: 'checkmark-circle-outline', tone: 'sage' },
          { title: 'Nice to Have', meta: 'Optional', detail: 'Garnishes and swaps stay separate from must-buy items.', icon: 'add-circle-outline' },
        ],
      },
    ],
  },
  'leftovers-lab': {
    eyebrow: 'Second life meals',
    title: 'Leftovers Lab',
    subtitle: 'Turn half a recipe, cooked bits, and lonely containers into fresh meal ideas.',
    icon: 'flask-outline',
    stats: [
      { value: '3', label: 'Remixes' },
      { value: '15m', label: 'Fastest' },
      { value: '0', label: 'Waste' },
    ],
    primaryAction: { label: 'Scan Leftovers', icon: 'camera-outline', route: '/camera' },
    sections: [
      {
        title: 'Remix Ideas',
        items: [
          { title: 'Roast Veg Wraps', meta: 'Lunch', detail: 'Add yogurt sauce, herbs, and tortillas.', icon: 'shuffle-outline', tone: 'sage' },
          { title: 'Rice Bowl Reset', meta: 'Dinner', detail: 'Crisp leftovers in a pan and finish with chili oil.', icon: 'flame-outline' },
          { title: 'Soup Starter', meta: 'Cozy', detail: 'Stretch cooked grains and veg with broth and beans.', icon: 'restaurant-outline', tone: 'gold' },
        ],
      },
      {
        title: 'Input Modes',
        items: [
          { title: 'Half Recipe', meta: 'Paste', detail: 'Tell the app what remains from a generated recipe.', icon: 'document-text-outline' },
          { title: 'Container Photo', meta: 'Scan', detail: 'Use vision when you do not want to type.', icon: 'scan-outline' },
        ],
      },
    ],
  },
  'cooking-mode': {
    eyebrow: 'At the stove',
    title: 'Cooking Mode',
    subtitle: 'A hands-free-friendly recipe view with big steps, timers, checkboxes, and less screen fuss.',
    icon: 'play-circle-outline',
    stats: [
      { value: 'Step 2', label: 'Current' },
      { value: '08:00', label: 'Timer' },
      { value: '4', label: 'Steps left' },
    ],
    primaryAction: { label: 'Open Recipe', icon: 'restaurant-outline', route: '/recipe-result' },
    sections: [
      {
        title: 'Current Step',
        items: [
          { title: 'Saute aromatics', meta: '8 min', detail: 'Cook garlic and scallions until fragrant, then add the greens.', icon: 'timer-outline' },
          { title: 'Hands-free controls', meta: 'Ready', detail: 'Large next/back targets and checkbox progress for messy hands.', icon: 'mic-outline', tone: 'sage' },
        ],
      },
      {
        title: 'Prep Support',
        items: [
          { title: 'Ingredient Checklist', meta: '6/9', detail: 'Tick off prepped items before heat starts.', icon: 'checkbox-outline', tone: 'gold' },
          { title: 'Built-in Timers', meta: 'Multi', detail: 'Keep simmer, bake, and rest timers near the step they belong to.', icon: 'alarm-outline' },
        ],
      },
    ],
  },
  'taste-profile': {
    eyebrow: 'Your defaults',
    title: 'Taste Profile',
    subtitle: 'Spice level, cuisines, diet, equipment, confidence, and serving sizes for better first drafts.',
    icon: 'options-outline',
    stats: [
      { value: 'Medium', label: 'Spice' },
      { value: '2', label: 'Servings' },
      { value: 'Skillet', label: 'Gear' },
    ],
    primaryAction: { label: 'Open Pantry', icon: 'basket-outline', route: '/pantry' },
    sections: [
      {
        title: 'Flavor Defaults',
        items: [
          { title: 'Cuisines', meta: 'Flexible', detail: 'Mediterranean, Indian-inspired, and East Asian weeknight ideas.', icon: 'globe-outline' },
          { title: 'Spice Level', meta: 'Medium', detail: 'Enough heat to matter, not enough to dominate.', icon: 'flame-outline', tone: 'gold' },
          { title: 'Diet Notes', meta: 'Editable', detail: 'A lightweight preference layer, not medical advice.', icon: 'leaf-outline', tone: 'sage' },
        ],
      },
      {
        title: 'Kitchen Context',
        items: [
          { title: 'Equipment', meta: 'Skillet', detail: 'Prioritize tools you actually use.', icon: 'hardware-chip-outline' },
          { title: 'Confidence', meta: 'Casual', detail: 'Steps can stay plain, practical, and forgiving.', icon: 'school-outline', tone: 'sage' },
        ],
      },
    ],
  },
  'recipe-history': {
    eyebrow: 'Nothing vanishes',
    title: 'Recipe History',
    subtitle: 'Generated-but-not-saved meals stay findable, so good ideas do not disappear after testing.',
    icon: 'time-outline',
    stats: [
      { value: '9', label: 'Recent' },
      { value: '3', label: 'Regenerate' },
      { value: '2', label: 'Saved' },
    ],
    primaryAction: { label: 'Saved Recipes', icon: 'bookmark-outline', route: '/(tabs)/saved' },
    sections: [
      {
        title: 'Recent Ideas',
        items: [
          { title: 'Tomato Egg Rice', meta: 'Today', detail: 'Generated from eggs, tomatoes, rice, and soy sauce.', icon: 'restaurant-outline' },
          { title: 'Green Yogurt Pasta', meta: 'Yesterday', detail: 'A quick healthy idea worth revisiting.', icon: 'leaf-outline', tone: 'sage' },
          { title: 'Chickpea Tortilla Crunch', meta: '2 days', detail: 'Not saved yet, but still available.', icon: 'time-outline', tone: 'gold' },
        ],
      },
    ],
  },
  'nutrition-snapshot': {
    eyebrow: 'Simple summary',
    title: 'Nutrition Snapshot',
    subtitle: 'Rough protein, calories, time, and servings kept lightweight and clearly non-medical.',
    icon: 'pulse-outline',
    stats: [
      { value: '31g', label: 'Protein' },
      { value: '520', label: 'Calories' },
      { value: '25m', label: 'Time' },
    ],
    primaryAction: { label: 'Recipe Result', icon: 'document-text-outline', route: '/recipe-result' },
    sections: [
      {
        title: 'Meal Snapshot',
        items: [
          { title: 'Protein', meta: 'Rough', detail: 'Estimate based on listed ingredients and servings.', icon: 'barbell-outline' },
          { title: 'Calories', meta: 'Approx', detail: 'A helpful planning number, not a clinical value.', icon: 'speedometer-outline', tone: 'gold' },
          { title: 'Balance', meta: 'Simple', detail: 'Quick read on veg, carbs, and protein anchors.', icon: 'analytics-outline', tone: 'sage' },
        ],
      },
    ],
  },
  settings: {
    eyebrow: 'App controls',
    title: 'Settings',
    subtitle: 'Account, Supabase status, data controls, and backend health for development builds.',
    icon: 'settings-outline',
    stats: [
      { value: 'Dev', label: 'Build' },
      { value: 'OK', label: 'Router' },
      { value: 'Check', label: 'Backend' },
    ],
    secondaryAction: { label: 'Cook', icon: 'restaurant-outline', route: '/(tabs)/ai-souschef' },
    sections: [
      {
        title: 'Account',
        items: [
          { title: 'Login State', meta: 'Cook tab', detail: 'Authentication stays close to recipe saving for now.', icon: 'person-circle-outline' },
          { title: 'Data Controls', meta: 'Planned', detail: 'Export, clear history, and saved recipe controls belong here.', icon: 'lock-closed-outline', tone: 'sage' },
        ],
      },
      {
        title: 'Developer Health',
        items: [
          { title: 'Supabase', meta: 'Configured', detail: 'Surface URL/key status and edge function checks.', icon: 'server-outline' },
          { title: 'OpenAI Backend', meta: 'Function', detail: 'Show model and function health for local testing.', icon: 'pulse-outline', tone: 'gold' },
        ],
      },
    ],
  },
  'ingredient-review': {
    eyebrow: 'Detection check',
    title: 'Ingredient Review',
    subtitle: 'A focused place for confirmed ingredients, confidence, possible items, edits, and exclusions.',
    icon: 'scan-circle-outline',
    stats: [
      { value: '8', label: 'Confirmed' },
      { value: '3', label: 'Possible' },
      { value: '2', label: 'Excluded' },
    ],
    primaryAction: { label: 'Generate Meal', icon: 'flame-outline', route: '/recipe-result' },
    secondaryAction: { label: 'Smart Camera', icon: 'camera-outline', route: '/camera' },
    sections: [
      {
        title: 'Confirmed',
        items: [
          { title: 'Tomatoes', meta: '96%', detail: 'Vision and label cues agree.', icon: 'checkmark-circle-outline', tone: 'sage' },
          { title: 'Eggs', meta: '92%', detail: 'High-confidence packaged item.', icon: 'checkmark-circle-outline', tone: 'sage' },
          { title: 'Spinach', meta: '84%', detail: 'Leafy green identified from image shape.', icon: 'leaf-outline' },
        ],
      },
      {
        title: 'Needs Review',
        items: [
          { title: 'Cilantro or Parsley', meta: '58%', detail: 'Tap to choose the correct herb.', icon: 'help-circle-outline', tone: 'gold' },
          { title: 'Exclude Mushrooms', meta: 'Avoid', detail: 'Keep disliked items out before generation.', icon: 'remove-circle-outline' },
        ],
      },
    ],
  },
  'recipe-result': {
    eyebrow: 'Ready to cook',
    title: 'Recipe Result',
    subtitle: 'Full recipe view with hero, timing, ingredients, steps, quick stats, save, share, and cooking mode.',
    icon: 'document-text-outline',
    stats: [
      { value: '25m', label: 'Time' },
      { value: '2', label: 'Servings' },
      { value: '31g', label: 'Protein-ish' },
    ],
    primaryAction: { label: 'Cooking Mode', icon: 'play-circle-outline', route: '/cooking-mode' },
    secondaryAction: { label: 'Save Later', icon: 'bookmark-outline', route: '/(tabs)/saved' },
    sections: [
      {
        title: 'Tomato Egg Rice Bowl',
        description: 'A bright, fast bowl built from common groceries and pantry sauce.',
        items: [
          { title: 'Ingredients', meta: '8', detail: 'Eggs, tomatoes, rice, scallions, soy sauce, chili oil, garlic, spinach.', icon: 'list-outline' },
          { title: 'Steps', meta: '5', detail: 'Prep, saute, scramble, fold through rice, finish with sauce.', icon: 'checkbox-outline', tone: 'sage' },
          { title: 'Save and Share', meta: 'Ready', detail: 'Recipe actions stay visible near the finished result.', icon: 'share-outline', tone: 'gold' },
        ],
      },
    ],
  },
} satisfies Record<string, FeaturePageContent>;

export type FeaturePageKey = keyof typeof featurePages;
