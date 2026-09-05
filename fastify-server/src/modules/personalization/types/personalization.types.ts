import { GoalType } from '@prisma/client';

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

export interface SetUserPreferenceDto {
  category: string;
  key: string;
  value: any;
}
