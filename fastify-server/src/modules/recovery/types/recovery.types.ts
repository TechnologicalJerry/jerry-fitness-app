export interface SubmitRecoveryDto {
  date?: string; // YYYY-MM-DD
  sleepDurationHours?: number;
  sleepQualityScore?: number; // 1-10
  restingHeartRate?: number;
  subjectiveFatigueScore: number; // 1-10
  sorenessScore: number; // 1-10
  energyLevelScore: number; // 1-10
  stressLevelScore: number; // 1-10
}

export interface TodayRecoveryResponse {
  recoveryScore: number; // 0-100
  status: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'POOR';
  contributingFactors: string[];
  recommendation: string;
  confidence: number;
  generatedAt: string;
  details: {
    sleepHours: number | null;
    fatigue: number;
    soreness: number;
    energy: number;
    stress: number;
  };
}
