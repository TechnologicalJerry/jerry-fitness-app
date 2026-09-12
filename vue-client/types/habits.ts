export type HabitCategory =
  | 'NUTRITION'
  | 'HYDRATION'
  | 'SLEEP'
  | 'WORKOUT'
  | 'RECOVERY'
  | 'MINDFULNESS'
  | 'OTHER';

export type FrequencyType = 'DAILY' | 'WEEKLY' | 'CUSTOM';

export interface Habit {
  id: string;
  userId: string;
  name: string;
  category: HabitCategory;
  description?: string | null;
  targetValue: number;
  unit: string;
  frequencyType: FrequencyType;
  daysOfWeek?: number[];
  currentStreak: number;
  bestStreak: number;
  completedToday: boolean;
  currentTodayValue?: number;
  createdAt: string;
  updatedAt: string;
}

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
