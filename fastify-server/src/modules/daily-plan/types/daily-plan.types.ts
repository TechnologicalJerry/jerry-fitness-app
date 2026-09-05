export interface DailyPlanResponse {
  date: string;
  timezone: string;
  workoutRecommendation: any;
  recoveryRecommendation: any;
  nutritionTargets: {
    calories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatsGrams: number;
  };
  hydrationTargetMl: number;
  habits: any[];
  goalsSummary: any[];
  reminders: string[];
  challenges: string[];
  generatedAt: string;
}
