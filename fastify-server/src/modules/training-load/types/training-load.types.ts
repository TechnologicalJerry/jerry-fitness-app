export interface LogTrainingSessionDto {
  date?: string; // YYYY-MM-DD
  sessionVolume: number; // e.g. total kg or reps
  intensity: number; // RPE 1-10 or % 1RM
  durationMinutes: number;
}

export interface TrainingLoadSummary {
  date: string;
  sessionVolume: number;
  intensity: number;
  durationMinutes: number;
  workload: number;
  acuteWorkload: number; // 7-day rolling average
  chronicWorkload: number; // 28-day rolling average
  workloadRatio: number; // acute / chronic ratio (A:C ratio)
  monotony: number;
  consistencyScore: number;
  status: 'OPTIMAL' | 'UNDERBOARD' | 'OVERREACHING' | 'HIGH_RISK';
  trend: 'INCREMENTAL' | 'STABLE' | 'DECREASING';
}
