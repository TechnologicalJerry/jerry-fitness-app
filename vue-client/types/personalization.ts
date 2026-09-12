export type GoalType =
  | 'WEIGHT_LOSS'
  | 'MUSCLE_GAIN'
  | 'ENDURANCE'
  | 'STRENGTH'
  | 'GENERAL_FITNESS'
  | 'FLEXIBILITY'
  | 'RECOVERY';

export interface PersonalizationProfile {
  id?: string;
  userId?: string;
  fitnessLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ELITE';
  primaryGoal?: GoalType;
  secondaryGoals?: string[];
  trainingExperienceMonths?: number;
  preferredDurationMinutes?: number;
  preferredDays?: string[];
  preferredTimeOfDay?: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'FLEXIBLE';
  preferredLocation?: 'HOME' | 'GYM' | 'OUTDOORS';
  availableEquipment?: string[];
  preferredWorkoutTypes?: string[];
  dislikedExercises?: string[];
  preferredExercises?: string[];
  dietaryPreferences?: string[];
  preferredMealFrequency?: number;
  activityLevel?: 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'VERY_ACTIVE' | 'EXTRA_ACTIVE';
  recoveryPreferences?: Record<string, unknown>;
  notificationPreferences?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdatePersonalizationProfileDto {
  fitnessLevel?: string;
  primaryGoal?: GoalType;
  secondaryGoals?: string[];
  trainingExperienceMonths?: number;
  preferredDurationMinutes?: number;
  preferredDays?: string[];
  preferredTimeOfDay?: string;
  preferredLocation?: string;
  availableEquipment?: string[];
  preferredWorkoutTypes?: string[];
  dislikedExercises?: string[];
  preferredExercises?: string[];
  dietaryPreferences?: string[];
  preferredMealFrequency?: number;
  activityLevel?: string;
  recoveryPreferences?: Record<string, unknown>;
  notificationPreferences?: Record<string, unknown>;
}

export interface UserPreference {
  id?: string;
  userId?: string;
  category: string;
  key: string;
  value: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface SetUserPreferenceDto {
  category: string;
  key: string;
  value: any;
}
