export interface NutritionTargets {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
}

export interface WorkoutRecommendation {
  type: string;
  title: string;
  durationMinutes: number;
  intensity: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
  description: string;
  exercises?: Array<{ name: string; sets: number; reps: string }>;
}

export interface RecoveryRecommendation {
  score: number; // 0-100
  status: string; // EXCELLENT, GOOD, MODERATE, POOR
  advice: string;
  recommendedSleepHours: number;
}

export interface DailyPlanResponse {
  date: string;
  timezone: string;
  workoutRecommendation: WorkoutRecommendation;
  recoveryRecommendation: RecoveryRecommendation;
  nutritionTargets: NutritionTargets;
  hydrationTargetMl: number;
  habits?: any[];
  goalsSummary?: any[];
  reminders: string[];
  challenges: string[];
  generatedAt: string;
}
