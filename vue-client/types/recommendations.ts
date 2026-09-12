export type RecommendationType =
  | 'WORKOUT_PLAN'
  | 'EXERCISE_ALTERNATIVE'
  | 'NUTRITION_ADJUSTMENT'
  | 'RECOVERY_PROTOCOL'
  | 'GOAL_ADJUSTMENT'
  | 'HABIT_SUGGESTION';

export interface StandardRecommendation<T = unknown> {
  id?: string;
  type: RecommendationType;
  title: string;
  recommendation: string;
  reason: string;
  confidence: number; // 0-1 (e.g. 0.92 = 92%)
  factors: string[];
  data?: T;
  generatedAt: string;
  expiresAt?: string;
}

export interface RecommendationFeedbackDto {
  feedbackType: 'HELPFUL' | 'NOT_HELPFUL' | 'APPLIED' | 'DISMISSED';
  notes?: string;
}
