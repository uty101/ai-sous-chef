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

