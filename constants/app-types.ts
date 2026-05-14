// Shared data types for pantry, shopping list, and meal planning

export type PantryCategory =
  | 'produce'
  | 'protein'
  | 'dairy'
  | 'grains'
  | 'condiments'
  | 'frozen'
  | 'tinned'
  | 'spices'
  | 'other';

export const PANTRY_CATEGORY_LABELS: Record<PantryCategory, string> = {
  produce: 'Produce',
  protein: 'Protein',
  dairy: 'Dairy',
  grains: 'Grains & Pasta',
  condiments: 'Condiments & Sauces',
  frozen: 'Frozen',
  tinned: 'Tinned & Jars',
  spices: 'Spices & Herbs',
  other: 'Other',
};

export type PantryItem = {
  id: string;
  name: string;
  category: PantryCategory;
  quantity?: string;
  expiresAt?: string;
  isStaple: boolean;
  addedAt: string;
};

export type ShoppingItem = {
  id: string;
  name: string;
  quantity?: string;
  category?: PantryCategory;
  checked: boolean;
  addedBy: 'user' | 'ai' | 'recipe';
  recipeId?: string;
  addedAt: string;
};

export type PlannedMealEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  recipeId?: string;
  timeMinutes?: number;
  vibe?: string;
  diet?: string;
  servings: number;
  uses: string[];
  notes?: string;
  source: 'ai' | 'saved' | 'manual';
};

export type WeekPlan = Record<string, PlannedMealEntry>;

export type RecipeEntry = {
  id: string;
  userId: string;
  title: string;
  description: string;
  ingredients: string[];
  steps: string[];
  timeMinutes: number;
  vibe?: string;
  diet?: string;
  nutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  createdAt: string;
  savedAt?: string;
};

export type NutritionSnapshot = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fibre?: number;
};

// AI meal plan request — sent to the backend when generating a week plan
export type WeekPlanRequest = {
  pantryItems: string[];
  shoppingItems: string[];
  userProfilePrompt: string; // from buildProfilePrompt()
  daysToFill: number;
  existingPlan?: WeekPlan;
};

// AI shopping suggestion — returned when filling gaps from a weekly plan
export type ShoppingSuggestion = {
  name: string;
  reason: string;
  category: PantryCategory;
  requiredFor: string[]; // recipe titles
};
