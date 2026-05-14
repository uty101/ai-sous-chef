import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  UserProfile,
  DEFAULT_PROFILE,
  CookingLevel,
  SpiceTolerance,
  WeeklyBudget,
  DailyTimeAvailable,
  ShoppingFrequency,
  HouseholdSize,
  KitchenEquipment,
  LearningGoal,
  HealthGoal,
  MealType,
  DietaryPreference,
  Allergy,
  COOKING_LEVEL_OPTIONS,
  SPICE_OPTIONS,
  BUDGET_OPTIONS,
  TIME_OPTIONS,
  EQUIPMENT_OPTIONS,
  LEARNING_GOAL_OPTIONS,
  HEALTH_GOAL_OPTIONS,
  DIETARY_OPTIONS,
  ALLERGY_OPTIONS,
  SHOPPING_FREQ_OPTIONS,
  MEAL_TYPE_OPTIONS,
} from '@/constants/user-profile';

// ─── Palette ────────────────────────────────────────────────────────────────
const PRIMARY = '#1B1F23';
const ACCENT = '#FFBA35';
const CREAM = '#FAFAF7';
const MUTED = '#8A8FA3';
const CARD_BG = '#FFFFFF';
const BORDER = '#E2E3EA';

const { width: SCREEN_W } = Dimensions.get('window');

const STORAGE_KEY = 'ai_souschef_user_profile';

// ─── Step definitions ────────────────────────────────────────────────────────
type StepId =
  | 'welcome'
  | 'cooking_level'
  | 'meals_cooked'
  | 'daily_time'
  | 'household'
  | 'dietary'
  | 'allergies'
  | 'spice'
  | 'equipment'
  | 'learning_goals'
  | 'health_goals'
  | 'budget'
  | 'shopping_freq'
  | 'done';

const STEPS: StepId[] = [
  'welcome',
  'cooking_level',
  'meals_cooked',
  'daily_time',
  'household',
  'dietary',
  'allergies',
  'spice',
  'equipment',
  'learning_goals',
  'health_goals',
  'budget',
  'shopping_freq',
  'done',
];

// ─── Component ───────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const [stepIndex, setStepIndex] = useState(0);
  const [profile, setProfile] = useState<UserProfile>({ ...DEFAULT_PROFILE });
  const [allergyInput, setAllergyInput] = useState('');
  const [dislikedInput, setDislikedInput] = useState('');
  const [saving, setSaving] = useState(false);

  const stepId = STEPS[stepIndex];
  const totalSteps = STEPS.length - 2; // exclude welcome and done from progress
  const progressStep = Math.max(0, stepIndex - 1); // welcome = step 0, first real = step 1

  const goNext = () => setStepIndex(i => Math.min(i + 1, STEPS.length - 1));
  const goBack = () => setStepIndex(i => Math.max(i - 1, 0));

  function toggle<T>(arr: T[], value: T): T[] {
    return arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];
  }

  const addAllergyTag = () => {
    const trimmed = allergyInput.trim();
    if (!trimmed) return;
    if (!profile.otherAllergies.includes(trimmed)) {
      setProfile(p => ({ ...p, otherAllergies: [...p.otherAllergies, trimmed] }));
    }
    setAllergyInput('');
  };

  const addDislikedTag = () => {
    const trimmed = dislikedInput.trim();
    if (!trimmed) return;
    if (!profile.dislikedIngredients.includes(trimmed)) {
      setProfile(p => ({ ...p, dislikedIngredients: [...p.dislikedIngredients, trimmed] }));
    }
    setDislikedInput('');
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const completed = { ...profile, onboardingComplete: true };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
      setProfile(completed);
      goNext(); // go to done screen
    } catch {
      Alert.alert('Error', 'Could not save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Render step content ────────────────────────────────────────────────────
  const renderStep = () => {
    switch (stepId) {
      case 'welcome':
        return <WelcomeStep onNext={goNext} />;

      case 'cooking_level':
        return (
          <Step
            title="How comfortable are you in the kitchen?"
            subtitle="We'll match recipes to your level — no judgement here."
            onNext={goNext}
            onBack={goBack}
            canContinue={profile.cookingLevel !== null}
          >
            {COOKING_LEVEL_OPTIONS.map(opt => (
              <SelectCard
                key={opt.value}
                label={opt.label}
                description={opt.description}
                selected={profile.cookingLevel === opt.value}
                onPress={() => setProfile(p => ({ ...p, cookingLevel: opt.value as CookingLevel }))}
              />
            ))}
          </Step>
        );

      case 'meals_cooked':
        return (
          <Step
            title="Which meals do you cook?"
            subtitle="Pick all that apply — we'll tailor suggestions accordingly."
            onNext={goNext}
            onBack={goBack}
            canContinue={profile.mealsCooked.length > 0}
          >
            <View style={styles.pillRow}>
              {MEAL_TYPE_OPTIONS.map(opt => (
                <TogglePill
                  key={opt.value}
                  label={opt.label}
                  selected={profile.mealsCooked.includes(opt.value)}
                  onPress={() =>
                    setProfile(p => ({ ...p, mealsCooked: toggle(p.mealsCooked, opt.value as MealType) }))
                  }
                />
              ))}
            </View>
          </Step>
        );

      case 'daily_time':
        return (
          <Step
            title="How much time can you spare each day?"
            subtitle="Be honest — quick meals every day beats burnout."
            onNext={goNext}
            onBack={goBack}
            canContinue={profile.dailyTimeAvailable !== null}
          >
            {TIME_OPTIONS.map(opt => (
              <SelectCard
                key={opt.value}
                label={opt.label}
                selected={profile.dailyTimeAvailable === opt.value}
                onPress={() =>
                  setProfile(p => ({ ...p, dailyTimeAvailable: opt.value as DailyTimeAvailable }))
                }
              />
            ))}
          </Step>
        );

      case 'household':
        return (
          <Step
            title="Who are you cooking for?"
            subtitle="We'll get portion sizes and complexity right."
            onNext={goNext}
            onBack={goBack}
            canContinue={profile.householdSize !== null}
          >
            <View style={styles.pillRow}>
              {([1, 2, 3, 4, 5] as HouseholdSize[]).map(n => (
                <TogglePill
                  key={n}
                  label={n === 5 ? '5+' : String(n)}
                  selected={profile.householdSize === n}
                  onPress={() => setProfile(p => ({ ...p, householdSize: n }))}
                />
              ))}
            </View>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.checkRow}
              onPress={() => setProfile(p => ({ ...p, includesKids: !p.includesKids }))}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, profile.includesKids && styles.checkboxChecked]}>
                {profile.includesKids && (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                )}
              </View>
              <Text style={styles.checkLabel}>Includes children</Text>
            </TouchableOpacity>
          </Step>
        );

      case 'dietary':
        return (
          <Step
            title="Any dietary preferences?"
            subtitle="Select all that apply. We'll never suggest something off-limits."
            onNext={goNext}
            onBack={goBack}
            canContinue
          >
            <View style={styles.pillRow}>
              {DIETARY_OPTIONS.map(opt => (
                <TogglePill
                  key={opt.value}
                  label={opt.label}
                  selected={profile.dietaryPreferences.includes(opt.value)}
                  onPress={() => {
                    setProfile(p => {
                      if (opt.value === 'no_preference') {
                        return { ...p, dietaryPreferences: ['no_preference'] };
                      }
                      const without = p.dietaryPreferences.filter(v => v !== 'no_preference');
                      return { ...p, dietaryPreferences: toggle(without, opt.value as DietaryPreference) };
                    });
                  }}
                />
              ))}
            </View>
            <View style={styles.divider} />
            <Text style={styles.inputLabel}>Anything you just don't like eating?</Text>
            <View style={styles.tagInputRow}>
              <TextInput
                style={styles.tagInput}
                value={dislikedInput}
                onChangeText={setDislikedInput}
                placeholder="e.g. mushrooms, olives…"
                placeholderTextColor={MUTED}
                returnKeyType="done"
                onSubmitEditing={addDislikedTag}
              />
              <TouchableOpacity style={styles.tagAddBtn} onPress={addDislikedTag}>
                <Ionicons name="add" size={20} color={PRIMARY} />
              </TouchableOpacity>
            </View>
            {profile.dislikedIngredients.length > 0 && (
              <View style={styles.tagCloud}>
                {profile.dislikedIngredients.map(tag => (
                  <TouchableOpacity
                    key={tag}
                    style={styles.tag}
                    onPress={() =>
                      setProfile(p => ({ ...p, dislikedIngredients: p.dislikedIngredients.filter(t => t !== tag) }))
                    }
                  >
                    <Text style={styles.tagText}>{tag}</Text>
                    <Ionicons name="close" size={12} color={MUTED} style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Step>
        );

      case 'allergies':
        return (
          <Step
            title="Any food allergies?"
            subtitle="Safety first — these are always filtered out."
            onNext={goNext}
            onBack={goBack}
            canContinue
          >
            <View style={styles.pillRow}>
              {ALLERGY_OPTIONS.map(opt => (
                <TogglePill
                  key={opt.value}
                  label={opt.label}
                  selected={profile.allergies.includes(opt.value)}
                  onPress={() =>
                    setProfile(p => ({ ...p, allergies: toggle(p.allergies, opt.value as Allergy) }))
                  }
                />
              ))}
            </View>
            <View style={styles.divider} />
            <Text style={styles.inputLabel}>Anything else? (free text)</Text>
            <View style={styles.tagInputRow}>
              <TextInput
                style={styles.tagInput}
                value={allergyInput}
                onChangeText={setAllergyInput}
                placeholder="e.g. mango, lupin…"
                placeholderTextColor={MUTED}
                returnKeyType="done"
                onSubmitEditing={addAllergyTag}
              />
              <TouchableOpacity style={styles.tagAddBtn} onPress={addAllergyTag}>
                <Ionicons name="add" size={20} color={PRIMARY} />
              </TouchableOpacity>
            </View>
            {profile.otherAllergies.length > 0 && (
              <View style={styles.tagCloud}>
                {profile.otherAllergies.map(tag => (
                  <TouchableOpacity
                    key={tag}
                    style={styles.tag}
                    onPress={() =>
                      setProfile(p => ({ ...p, otherAllergies: p.otherAllergies.filter(t => t !== tag) }))
                    }
                  >
                    <Text style={styles.tagText}>{tag}</Text>
                    <Ionicons name="close" size={12} color={MUTED} style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Step>
        );

      case 'spice':
        return (
          <Step
            title="How much heat can you handle?"
            subtitle="Honest answer only — nobody will judge you for mild."
            onNext={goNext}
            onBack={goBack}
            canContinue={profile.spiceTolerance !== null}
          >
            {SPICE_OPTIONS.map(opt => (
              <SelectCard
                key={opt.value}
                label={opt.label}
                description={opt.description}
                selected={profile.spiceTolerance === opt.value}
                onPress={() => setProfile(p => ({ ...p, spiceTolerance: opt.value as SpiceTolerance }))}
              />
            ))}
          </Step>
        );

      case 'equipment':
        return (
          <Step
            title="What kit do you have?"
            subtitle="We'll only suggest recipes you can actually make."
            onNext={goNext}
            onBack={goBack}
            canContinue
          >
            <View style={styles.pillRow}>
              {EQUIPMENT_OPTIONS.map(opt => (
                <TogglePill
                  key={opt.value}
                  label={opt.label}
                  icon={opt.icon}
                  selected={profile.kitchenEquipment.includes(opt.value)}
                  onPress={() =>
                    setProfile(p => ({
                      ...p,
                      kitchenEquipment: toggle(p.kitchenEquipment, opt.value as KitchenEquipment),
                    }))
                  }
                />
              ))}
            </View>
          </Step>
        );

      case 'learning_goals':
        return (
          <Step
            title="What do you want to learn?"
            subtitle="Optional — helps us weave in teaching moments."
            onNext={goNext}
            onBack={goBack}
            canContinue
          >
            <View style={styles.pillRow}>
              {LEARNING_GOAL_OPTIONS.map(opt => (
                <TogglePill
                  key={opt.value}
                  label={opt.label}
                  selected={profile.learningGoals.includes(opt.value)}
                  onPress={() =>
                    setProfile(p => ({
                      ...p,
                      learningGoals: toggle(p.learningGoals, opt.value as LearningGoal),
                    }))
                  }
                />
              ))}
            </View>
          </Step>
        );

      case 'health_goals':
        return (
          <Step
            title="Any goals you're working towards?"
            subtitle="Optional — shapes the kinds of meals we suggest."
            onNext={goNext}
            onBack={goBack}
            canContinue
          >
            <View style={styles.pillRow}>
              {HEALTH_GOAL_OPTIONS.map(opt => (
                <TogglePill
                  key={opt.value}
                  label={opt.label}
                  selected={profile.healthGoals.includes(opt.value)}
                  onPress={() =>
                    setProfile(p => ({
                      ...p,
                      healthGoals: toggle(p.healthGoals, opt.value as HealthGoal),
                    }))
                  }
                />
              ))}
            </View>
          </Step>
        );

      case 'budget':
        return (
          <Step
            title="What's your weekly food budget?"
            subtitle="Helps us keep suggestions realistic for you."
            onNext={goNext}
            onBack={goBack}
            canContinue={profile.weeklyBudget !== null}
          >
            {BUDGET_OPTIONS.map(opt => (
              <SelectCard
                key={opt.value}
                label={opt.label}
                description={opt.description}
                selected={profile.weeklyBudget === opt.value}
                onPress={() => setProfile(p => ({ ...p, weeklyBudget: opt.value as WeeklyBudget }))}
              />
            ))}
          </Step>
        );

      case 'shopping_freq':
        return (
          <Step
            title="How often do you shop?"
            subtitle="We'll plan meals around your shopping rhythm."
            onNext={handleFinish}
            onBack={goBack}
            canContinue={profile.shoppingFrequency !== null}
            nextLabel={saving ? 'Saving…' : 'Finish'}
          >
            {SHOPPING_FREQ_OPTIONS.map(opt => (
              <SelectCard
                key={opt.value}
                label={opt.label}
                selected={profile.shoppingFrequency === opt.value}
                onPress={() => setProfile(p => ({ ...p, shoppingFrequency: opt.value as ShoppingFrequency }))}
              />
            ))}
          </Step>
        );

      case 'done':
        return <DoneStep />;

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Progress bar — hidden on welcome and done */}
      {stepId !== 'welcome' && stepId !== 'done' && (
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(progressStep / totalSteps) * 100}%` },
            ]}
          />
        </View>
      )}

      {renderStep()}
    </SafeAreaView>
  );
}

// ─── Shared step shell ────────────────────────────────────────────────────────
function Step({
  title,
  subtitle,
  children,
  onNext,
  onBack,
  canContinue,
  nextLabel = 'Continue',
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onNext: () => void;
  onBack: () => void;
  canContinue: boolean;
  nextLabel?: string;
}) {
  return (
    <View style={styles.stepContainer}>
      <ScrollView
        style={styles.stepScroll}
        contentContainerStyle={styles.stepScrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.stepTitle}>{title}</Text>
        {subtitle && <Text style={styles.stepSubtitle}>{subtitle}</Text>}
        <View style={styles.stepBody}>{children}</View>
      </ScrollView>

      <View style={styles.navRow}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={PRIMARY} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.nextBtn, !canContinue && styles.nextBtnDisabled]}
          onPress={canContinue ? onNext : undefined}
          activeOpacity={canContinue ? 0.85 : 1}
        >
          <Text style={styles.nextBtnText}>{nextLabel}</Text>
          <Ionicons name="chevron-forward" size={18} color={PRIMARY} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Welcome screen ───────────────────────────────────────────────────────────
function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <View style={styles.welcomeContainer}>
      <View style={styles.welcomeIconWrap}>
        <Ionicons name="restaurant" size={52} color={ACCENT} />
      </View>
      <Text style={styles.welcomeTitle}>Let's personalise your kitchen</Text>
      <Text style={styles.welcomeSubtitle}>
        A few quick questions so every recipe, every plan, and every suggestion is built around{' '}
        <Text style={{ fontWeight: '700' }}>you</Text>.
      </Text>
      <Text style={styles.welcomeMeta}>Takes about 2 minutes · You can update anytime</Text>
      <TouchableOpacity style={styles.welcomeBtn} onPress={onNext} activeOpacity={0.85}>
        <Text style={styles.welcomeBtnText}>Get started</Text>
        <Ionicons name="arrow-forward" size={18} color={PRIMARY} style={{ marginLeft: 8 }} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Done screen ──────────────────────────────────────────────────────────────
function DoneStep() {
  return (
    <View style={styles.welcomeContainer}>
      <View style={[styles.welcomeIconWrap, { backgroundColor: '#E8F8EE' }]}>
        <Ionicons name="checkmark-circle" size={52} color="#34A853" />
      </View>
      <Text style={styles.welcomeTitle}>You're all set!</Text>
      <Text style={styles.welcomeSubtitle}>
        Your profile is saved. Every AI suggestion from now on is built around your kitchen.
      </Text>
      <Text style={styles.welcomeMeta}>Head back to start cooking.</Text>
    </View>
  );
}

