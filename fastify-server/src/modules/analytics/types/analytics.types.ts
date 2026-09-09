export type AnalyticsEventType =
  | 'USER_REGISTERED'
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'PROFILE_COMPLETED'
  | 'WORKOUT_STARTED'
  | 'WORKOUT_SET_COMPLETED'
  | 'WORKOUT_COMPLETED'
  | 'WORKOUT_SKIPPED'
  | 'EXERCISE_VIEWED'
  | 'EXERCISE_COMPLETED'
  | 'WORKOUT_PLAN_STARTED'
  | 'WORKOUT_PLAN_COMPLETED'
  | 'MEAL_LOGGED'
  | 'RECIPE_VIEWED'
  | 'RECIPE_SAVED'
  | 'HYDRATION_LOGGED'
  | 'GOAL_CREATED'
  | 'GOAL_COMPLETED'
  | 'CHALLENGE_JOINED'
  | 'CHALLENGE_COMPLETED'
  | 'ACHIEVEMENT_UNLOCKED'
  | 'TRAINER_VIEWED'
  | 'TRAINER_BOOKED'
  | 'MESSAGE_SENT'
  | 'SUBSCRIPTION_STARTED'
  | 'SUBSCRIPTION_RENEWED'
  | 'SUBSCRIPTION_CANCELLED'
  | 'MEDIA_VIEWED'
  | 'SEARCH_PERFORMED'
  | 'SEARCH_RESULT_SELECTED'
  | 'RECOMMENDATION_VIEWED'
  | 'RECOMMENDATION_ACCEPTED'
  | 'RECOMMENDATION_REJECTED';

export type EventSource = 'client' | 'server' | 'background';
export type AppPlatform = 'web' | 'ios' | 'android' | 'desktop';

export interface AnalyticsEventDto {
  eventId: string;
  eventType: AnalyticsEventType | string;
  eventVersion?: string;
  userId?: string;
  anonymousId?: string;
  sessionId?: string;
  timestamp?: string | Date;
  source?: EventSource;
  platform?: AppPlatform;
  appVersion?: string;
  metadata?: Record<string, any>;
}

export interface BatchIngestEventsDto {
  events: AnalyticsEventDto[];
}

export interface IngestionResultDto {
  acceptedCount: number;
  duplicateCount: number;
  failedCount: number;
  errors?: string[];
}

export interface DateRangeQuery {
  startDate?: string;
  endDate?: string;
  period?: '7d' | '30d' | '90d' | '1y' | 'custom';
  timezone?: string;
}

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
  period: DateRangeQuery;
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
  period: DateRangeQuery;
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
  period: DateRangeQuery;
  weightTrend: Array<{ date: string; weightKg: number }>;
  bodyFatTrend: Array<{ date: string; bodyFatPct: number }>;
  strengthProgression: Array<{ exerciseName: string; maxWeightKg: number; date: string }>;
  overallAdherencePct: number;
}

export interface TrainerClientAnalyticsDto {
  trainerId: string;
  activeClientsCount: number;
  clientAdherenceAveragePct: number;
  workoutCompletionRatePct: number;
  planCompletionRatePct: number;
  totalAssignedWorkouts: number;
  totalCompletedWorkouts: number;
  averageResponseTimeMinutes: number;
}

export interface AdminOverviewAnalyticsDto {
  users: {
    dau: number;
    wau: number;
    mau: number;
    registrationsTotal: number;
    activeUsersTotal: number;
    inactiveUsersTotal: number;
  };
  engagement: {
    workoutsCompletedTotal: number;
    totalWorkoutMinutes: number;
    averageSessionMinutes: number;
    day30RetentionPct: number;
  };
  monetization: {
    totalSubscriptions: number;
    mrrCents: number;
    arrCents: number;
    arpuCents: number;
    churnRatePct: number;
    conversionRatePct: number;
  };
  content: {
    topExercises: Array<{ id: string; name: string; views: number }>;
    topWorkouts: Array<{ id: string; title: string; completions: number }>;
    topRecipes: Array<{ id: string; title: string; views: number }>;
  };
}

export interface CohortAnalysisDto {
  cohortKey: string;
  dimension: string;
  dimensionValue: string;
  startDate: string;
  initialSize: number;
  retentionPercentages: {
    day1: number;
    day7: number;
    day14: number;
    day30: number;
    day60: number;
    day90: number;
  };
}

export interface FunnelStepDto {
  stepName: string;
  userCount: number;
  conversionRateFromPreviousPct: number;
  dropOffRatePct: number;
}

export interface FunnelAnalysisDto {
  funnelName: string;
  totalStarted: number;
  totalCompleted: number;
  overallConversionRatePct: number;
  steps: FunnelStepDto[];
}

export interface ReportQueryDto {
  reportId?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  parameters?: Record<string, any>;
  format?: 'JSON' | 'CSV';
}

export interface AnalyticsExportRequestDto {
  exportType: 'CSV' | 'JSON';
  category: string;
  startDate?: string;
  endDate?: string;
}
