import { RecommendationType, FeedbackType } from '@prisma/client';

export interface StandardRecommendation<T = unknown> {
  id?: string;
  type: RecommendationType;
  title: string;
  recommendation: string;
  reason: string;
  confidence: number;
  factors: string[];
  data: T;
  generatedAt: string;
  expiresAt: string;
}

export interface WorkoutPlanData {
  title: string;
  targetMuscleGroups: string[];
  estimatedDurationMinutes: number;
  difficulty: string;
  exercises: {
    id: string;
    name: string;
    sets: number;
    reps: string;
    restSeconds: number;
    notes?: string;
  }[];
}

export interface ExerciseAlternative {
  id: string;
  name: string;
  targetMuscles: string[];
  movementPattern: string;
  requiredEquipment: string;
  difficulty: string;
  score: number;
  reason: string;
}

export interface RecommendationFeedbackDto {
  feedbackType: FeedbackType;
  notes?: string;
}
