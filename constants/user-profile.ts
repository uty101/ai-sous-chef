export type CookingLevel =
  | 'never_cooked'
  | 'beginner'
  | 'home_cook'
  | 'confident'
  | 'advanced';

export type SpiceTolerance = 'none' | 'mild' | 'medium' | 'hot' | 'extreme';

export type WeeklyBudget = 'under_30' | '30_to_60' | '60_to_100' | 'over_100';

export type DailyTimeAvailable = 15 | 30 | 45 | 60 | 90;

export type ShoppingFrequency = 'daily' | 'twice_weekly' | 'weekly' | 'fortnightly';

export type HouseholdSize = 1 | 2 | 3 | 4 | 5;

export type KitchenEquipment =
  | 'hob'
  | 'oven'
  | 'microwave'
  | 'air_fryer'
  | 'instant_pot'
  | 'blender'
  | 'food_processor'
  | 'stand_mixer'
  | 'grill';

export type LearningGoal =
  | 'build_confidence'
  | 'knife_skills'
  | 'sauces_and_bases'
  | 'world_cuisines'
  | 'meal_prep'
  | 'baking'
  | 'plating'
  | 'nutrition';

export type HealthGoal =
  | 'lose_weight'
  | 'build_muscle'
  | 'eat_healthier'
  | 'save_money'
  | 'reduce_waste'
  | 'impress_people';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export type DietaryPreference =
  | 'no_preference'
  | 'vegan'
  | 'vegetarian'
  | 'pescatarian'
  | 'dairy_free'
  | 'gluten_free'
  | 'halal'
  | 'kosher';

export type Allergy =
  | 'nuts'
  | 'shellfish'
  | 'eggs'
  | 'soy'
  | 'wheat'
  | 'fish'
  | 'dairy'
  | 'sesame';

export type UserProfile = {
  cookingLevel: CookingLevel | null;
  spiceTolerance: SpiceTolerance | null;
  allergies: Allergy[];
  otherAllergies: string[];
  dietaryPreferences: DietaryPreference[];
  dislikedIngredients: string[];
  householdSize: HouseholdSize | null;
  includesKids: boolean;
  weeklyBudget: WeeklyBudget | null;
  kitchenEquipment: KitchenEquipment[];
  dailyTimeAvailable: DailyTimeAvailable | null;
  mealsCooked: MealType[];
  shoppingFrequency: ShoppingFrequency | null;
  learningGoals: LearningGoal[];
  healthGoals: HealthGoal[];
  onboardingComplete: boolean;
};

export const DEFAULT_PROFILE: UserProfile = {
  cookingLevel: null,
  spiceTolerance: null,
  allergies: [],
  otherAllergies: [],
  dietaryPreferences: ['no_preference'],
  dislikedIngredients: [],
  householdSize: null,
  includesKids: false,
  weeklyBudget: null,
  kitchenEquipment: ['hob', 'oven'],
  dailyTimeAvailable: null,
  mealsCooked: ['dinner'],
  shoppingFrequency: null,
  learningGoals: [],
  healthGoals: [],
  onboardingComplete: false,
};

export const COOKING_LEVEL_OPTIONS: { value: CookingLevel; label: string; description: string }[] = [
  { value: 'never_cooked', label: 'Never cooked', description: 'I mostly rely on ready meals or takeaways' },
  { value: 'beginner', label: 'Beginner', description: 'I can do the basics but still learning' },
  { value: 'home_cook', label: 'Home cook', description: 'I cook regularly and know my way around a kitchen' },
  { value: 'confident', label: 'Confident', description: 'I experiment and rarely need a recipe' },
  { value: 'advanced', label: 'Advanced', description: 'I use professional techniques and love a challenge' },
];

export const SPICE_OPTIONS: { value: SpiceTolerance; label: string; description: string }[] = [
  { value: 'none', label: 'None', description: 'No heat at all please' },
  { value: 'mild', label: 'Mild', description: 'A tiny bit of warmth is fine' },
  { value: 'medium', label: 'Medium', description: "Flavourful but not burning" },
  { value: 'hot', label: 'Hot', description: 'Bring the heat' },
  { value: 'extreme', label: 'Extreme', description: 'The hotter the better' },
];

export const BUDGET_OPTIONS: { value: WeeklyBudget; label: string; description: string }[] = [
  { value: 'under_30', label: 'Under £30', description: 'Tight budget, stretch every ingredient' },
  { value: '30_to_60', label: '£30–£60', description: 'Mid-range, happy to spend on good ingredients' },
  { value: '60_to_100', label: '£60–£100', description: 'Flexible, quality matters' },
  { value: 'over_100', label: '£100+', description: 'No real budget constraints' },
];

export const TIME_OPTIONS: { value: DailyTimeAvailable; label: string }[] = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '90+ min' },
];

export const EQUIPMENT_OPTIONS: { value: KitchenEquipment; label: string; icon: string }[] = [
  { value: 'hob', label: 'Hob / Stovetop', icon: 'flame-outline' },
  { value: 'oven', label: 'Oven', icon: 'thermometer-outline' },
  { value: 'microwave', label: 'Microwave', icon: 'radio-outline' },
  { value: 'air_fryer', label: 'Air Fryer', icon: 'aperture-outline' },
  { value: 'instant_pot', label: 'Instant Pot', icon: 'timer-outline' },
  { value: 'blender', label: 'Blender', icon: 'fitness-outline' },
  { value: 'food_processor', label: 'Food Processor', icon: 'settings-outline' },
  { value: 'stand_mixer', label: 'Stand Mixer', icon: 'reload-outline' },
  { value: 'grill', label: 'Grill / BBQ', icon: 'bonfire-outline' },
];

export const LEARNING_GOAL_OPTIONS: { value: LearningGoal; label: string }[] = [
  { value: 'build_confidence', label: 'Build confidence' },
  { value: 'knife_skills', label: 'Knife skills' },
  { value: 'sauces_and_bases', label: 'Sauces & bases' },
  { value: 'world_cuisines', label: 'World cuisines' },
  { value: 'meal_prep', label: 'Meal prep' },
  { value: 'baking', label: 'Baking' },
  { value: 'plating', label: 'Plating & presentation' },
  { value: 'nutrition', label: 'Nutrition & balance' },
];

export const HEALTH_GOAL_OPTIONS: { value: HealthGoal; label: string }[] = [
  { value: 'lose_weight', label: 'Lose weight' },
  { value: 'build_muscle', label: 'Build muscle' },
  { value: 'eat_healthier', label: 'Eat healthier' },
  { value: 'save_money', label: 'Save money' },
  { value: 'reduce_waste', label: 'Reduce food waste' },
  { value: 'impress_people', label: 'Impress people' },
];

export const DIETARY_OPTIONS: { value: DietaryPreference; label: string }[] = [
  { value: 'no_preference', label: 'No preference' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'pescatarian', label: 'Pescatarian' },
  { value: 'dairy_free', label: 'Dairy free' },
  { value: 'gluten_free', label: 'Gluten free' },
  { value: 'halal', label: 'Halal' },
  { value: 'kosher', label: 'Kosher' },
];

export const ALLERGY_OPTIONS: { value: Allergy; label: string }[] = [
  { value: 'nuts', label: 'Nuts' },
  { value: 'shellfish', label: 'Shellfish' },
  { value: 'eggs', label: 'Eggs' },
  { value: 'soy', label: 'Soy' },
  { value: 'wheat', label: 'Wheat / Gluten' },
  { value: 'fish', label: 'Fish' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'sesame', label: 'Sesame' },
];

export const SHOPPING_FREQ_OPTIONS: { value: ShoppingFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'twice_weekly', label: 'Twice a week' },
  { value: 'weekly', label: 'Once a week' },
  { value: 'fortnightly', label: 'Every two weeks' },
];

export const MEAL_TYPE_OPTIONS: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snacks', label: 'Snacks' },
];

// Builds a compact AI prompt string from a user profile
export function buildProfilePrompt(profile: UserProfile): string {
  const parts: string[] = [];

  if (profile.cookingLevel) {
    const label = COOKING_LEVEL_OPTIONS.find(o => o.value === profile.cookingLevel)?.label;
    parts.push(`Cooking level: ${label}`);
  }
  if (profile.dailyTimeAvailable) {
    parts.push(`Max daily cooking time: ${profile.dailyTimeAvailable} min`);
  }
  if (profile.householdSize) {
    parts.push(`Cooking for: ${profile.householdSize === 5 ? '5+' : profile.householdSize} people${profile.includesKids ? ' (including children)' : ''}`);
  }
  if (profile.dietaryPreferences.length && !profile.dietaryPreferences.includes('no_preference')) {
    parts.push(`Diet: ${profile.dietaryPreferences.join(', ')}`);
  }
  if (profile.allergies.length) {
    const labels = profile.allergies.map(a => ALLERGY_OPTIONS.find(o => o.value === a)?.label ?? a);
    parts.push(`Allergies: ${labels.join(', ')}`);
  }
  if (profile.otherAllergies.length) {
    parts.push(`Other allergies: ${profile.otherAllergies.join(', ')}`);
  }
  if (profile.dislikedIngredients.length) {
    parts.push(`Dislikes: ${profile.dislikedIngredients.join(', ')}`);
  }
  if (profile.spiceTolerance) {
    parts.push(`Spice tolerance: ${profile.spiceTolerance}`);
  }
  if (profile.kitchenEquipment.length) {
    const labels = profile.kitchenEquipment.map(e => EQUIPMENT_OPTIONS.find(o => o.value === e)?.label ?? e);
    parts.push(`Equipment: ${labels.join(', ')}`);
  }
  if (profile.weeklyBudget) {
    const label = BUDGET_OPTIONS.find(o => o.value === profile.weeklyBudget)?.label;
    parts.push(`Weekly budget: ${label}`);
  }
  if (profile.learningGoals.length) {
    const labels = profile.learningGoals.map(g => LEARNING_GOAL_OPTIONS.find(o => o.value === g)?.label ?? g);
    parts.push(`Learning goals: ${labels.join(', ')}`);
  }
  if (profile.healthGoals.length) {
    const labels = profile.healthGoals.map(g => HEALTH_GOAL_OPTIONS.find(o => o.value === g)?.label ?? g);
    parts.push(`Health goals: ${labels.join(', ')}`);
  }

  return parts.join('. ');
}
