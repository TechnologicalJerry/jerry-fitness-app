export type ReadinessStatus = 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'POOR';

export interface RecoveryMetrics {
  id?: string;
  userId?: string;
  date: string;
  sleepHours: number;
  sleepQuality?: number; // 1-10
  hrvMs?: number; // Heart Rate Variability in ms
  sorenessLevel: number; // 1-10
  energyLevel: number; // 1-10
  stressLevel: number; // 1-10
  fatigueLevel: number; // 1-10
  readinessScore: number; // 0-100
  status: ReadinessStatus;
  notes?: string;
  createdAt?: string;
}

export interface SubmitRecoveryDto {
  date?: string;
  sleepHours: number;
  sleepQuality?: number;
  hrvMs?: number;
  sorenessLevel: number;
  energyLevel: number;
  stressLevel: number;
  fatigueLevel: number;
  notes?: string;
}

export interface TodayRecoveryResponse {
  readinessScore: number;
  status: ReadinessStatus;
  advice: string;
  metrics?: RecoveryMetrics;
  history?: RecoveryMetrics[];
}
