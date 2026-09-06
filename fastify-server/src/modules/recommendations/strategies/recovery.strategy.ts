export interface RecoveryStrategyInput {
  recoveryScore: number; // 0-100
  recentWorkloadRatio: number; // acute/chronic ratio
  fatigueScore: number; // 1-10
  sorenessScore: number; // 1-10
}

export interface RecoveryRecommendationResult {
  action: 'TRAIN' | 'ACTIVE_RECOVERY' | 'REST_DAY' | 'MOBILITY';
  reason: string;
  confidence: number;
}

export interface RecoveryStrategy {
  recommend(input: RecoveryStrategyInput): RecoveryRecommendationResult;
}

export class AdaptiveRecoveryStrategy implements RecoveryStrategy {
  public recommend(input: RecoveryStrategyInput): RecoveryRecommendationResult {
    if (input.recoveryScore < 45 || input.recentWorkloadRatio > 1.5 || input.fatigueScore >= 8) {
      return {
        action: 'REST_DAY',
        reason: 'Recent training load is elevated and recovery indicators are below your normal baseline.',
        confidence: 0.89,
      };
    }

    if (input.recoveryScore < 65 || input.sorenessScore >= 7) {
      return {
        action: 'ACTIVE_RECOVERY',
        reason: 'Moderate muscle soreness detected. Low-intensity active recovery or mobility is suggested.',
        confidence: 0.84,
      };
    }

    if (input.recentWorkloadRatio < 0.8) {
      return {
        action: 'TRAIN',
        reason: 'Recovery markers are optimal and current workload ratio indicates capacity for progressive training.',
        confidence: 0.91,
      };
    }

    return {
      action: 'TRAIN',
      reason: 'Balanced recovery status and stable workload ratio.',
      confidence: 0.86,
    };
  }
}
