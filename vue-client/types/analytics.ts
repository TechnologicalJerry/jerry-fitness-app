export interface UserAnalyticsSummaryDto {
  userId: string;
  totalWorkouts: number;
  completedWorkouts: number;
  workoutMinutes: number;
  averageWorkoutDurationMinutes: number;
  workoutFrequencyPerWeek: number;
  currentStreakDays: number;
  longestStreakDays: number;
  nutritionLoggingFrequency: number;
  hydrationAdherencePct: number;
  goalCompletionRatePct: number;
  challengeParticipationCount: number;
  achievementCount: number;
}

export interface FitnessAnalyticsDto {
  period: { startDate?: string; endDate?: string; period?: string };
  workoutFrequency: number;
  trainingVolumeTotalKg: number;
  workoutDurationTotalMinutes: number;
  muscleGroupDistribution: Record<string, number>;
  cardioMinutesTotal: number;
  distanceTotalKm: number;
  caloriesBurnedTotal: number;
  personalRecordsCount: number;
  timeSeries: Array<{ date: string; workouts: number; volumeKg: number; minutes: number }>;
}

export interface NutritionAnalyticsDto {
  period: { startDate?: string; endDate?: string; period?: string };
  averageDailyCalories: number;
  averageProteinGrams: number;
  averageCarbsGrams: number;
  averageFatGrams: number;
  averageFiberGrams: number;
  hydrationAverageMl: number;
  mealLoggingConsistencyPct: number;
  nutritionGoalAdherencePct: number;
  timeSeries: Array<{ date: string; calories: number; protein: number; carbs: number; fat: number; hydration: number }>;
}

export interface ProgressAnalyticsDto {
  period: { startDate?: string; endDate?: string; period?: string };
  weightTrend: Array<{ date: string; weightKg: number }>;
  bodyFatTrend: Array<{ date: string; bodyFatPct: number }>;
  strengthProgression: Array<{ exerciseName: string; maxWeightKg: number; date: string }>;
  overallAdherencePct: number;
}

export interface AnalyticsExportRequestDto {
  exportType: 'CSV' | 'JSON';
  category: string;
  startDate?: string;
  endDate?: string;
}
