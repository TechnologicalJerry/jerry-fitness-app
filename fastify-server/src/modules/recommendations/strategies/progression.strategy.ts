export interface ProgressionInput {
  completionRate: number; // 0.0 to 1.0
  averageRpe: number; // 1 to 10 (Rating of Perceived Exertion)
  missedSessionsCount: number;
  recoveryScore: number; // 0 to 100
}

export interface ProgressionResult {
  weightMultiplier: number; // e.g. 1.05 = +5% weight
  repsAdjustment: number; // e.g. +1 or -1
  volumeAdjustment: number; // e.g. 0 (same sets) or -1 set
  reason: string;
}

export interface ProgressionStrategy {
  calculateProgression(input: ProgressionInput): ProgressionResult;
}

export class DefaultProgressionStrategy implements ProgressionStrategy {
  public calculateProgression(input: ProgressionInput): ProgressionResult {
    // 1. High performance & high recovery -> Progressive overload
    if (input.completionRate >= 0.9 && input.averageRpe <= 7 && input.recoveryScore >= 75) {
      return {
        weightMultiplier: 1.05,
        repsAdjustment: 1,
        volumeAdjustment: 0,
        reason: 'Consistently high set completion with low perceived effort and high recovery status.',
      };
    }

    // 2. High fatigue or low recovery -> Maintain or deload
    if (input.recoveryScore < 50 || input.averageRpe >= 9) {
      return {
        weightMultiplier: 0.95,
        repsAdjustment: 0,
        volumeAdjustment: -1,
        reason: 'Elevated perceived fatigue or sub-optimal recovery. Micro-deload applied.',
      };
    }

    // 3. Repeatedly missed sessions -> Suggest shorter, manageable volume
    if (input.missedSessionsCount >= 2) {
      return {
        weightMultiplier: 1.0,
        repsAdjustment: 0,
        volumeAdjustment: -1,
        reason: 'Recent missed sessions detected. Reduced volume to rebuild consistency.',
      };
    }

    // 4. Default baseline maintenance
    return {
      weightMultiplier: 1.0,
      repsAdjustment: 0,
      volumeAdjustment: 0,
      reason: 'Standard progressive maintenance based on current baseline metrics.',
    };
  }
}
