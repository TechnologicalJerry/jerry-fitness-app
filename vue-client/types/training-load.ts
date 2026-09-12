export type ACWRStatus = 'OPTIMAL' | 'OVERREACHING' | 'UNDERLOADED' | 'HIGH_RISK';

export interface TrainingSessionLog {
  id?: string;
  userId?: string;
  workoutTitle?: string;
  durationMinutes: number;
  rpe: number; // Rating of Perceived Exertion (1-10)
  workloadScore?: number; // durationMinutes * rpe
  tonnageKg?: number;
  notes?: string;
  loggedAt?: string;
  createdAt?: string;
}

export interface TrainingLoadSummary {
  acuteLoad: number; // 7-day average workload
  chronicLoad: number; // 28-day average workload
  acwrRatio: number; // acuteLoad / chronicLoad
  status: ACWRStatus;
  recommendation: string;
  weeklyWorkloadTrend: Array<{ date: string; load: number }>;
}

export interface LogTrainingSessionDto {
  workoutTitle?: string;
  durationMinutes: number;
  rpe: number;
  tonnageKg?: number;
  notes?: string;
  date?: string;
}
