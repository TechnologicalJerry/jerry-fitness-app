import { AdherenceTrend } from '@prisma/client';

export interface AdherenceMetricResponse {
  windowDays: number; // 7, 14, 30, 90
  overallAdherence: number; // 0-100%
  workoutAdherence: number;
  nutritionAdherence: number;
  hydrationAdherence: number;
  habitAdherence: number;
  trend: AdherenceTrend;
  generatedAt: string;
}
