import { HabitCategory, FrequencyType } from '@prisma/client';

export interface CreateHabitDto {
  name: string;
  category?: HabitCategory;
  description?: string;
  targetValue?: number;
  unit?: string;
  frequencyType?: FrequencyType;
  daysOfWeek?: number[];
}

export interface LogHabitCompletionDto {
  date?: string; // YYYY-MM-DD
  value?: number;
  completed?: boolean;
  skipped?: boolean;
  notes?: string;
}

export interface HabitSummaryResponse {
  totalHabits: number;
  completedToday: number;
  todayAdherencePercent: number;
  weeklyAdherencePercent: number;
  monthlyAdherencePercent: number;
  longestStreak: number;
}
