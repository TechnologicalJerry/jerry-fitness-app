import { describe, it, expect } from 'vitest';
import { DefaultProgressionStrategy } from '../../modules/recommendations/strategies/progression.strategy';

describe('ProgressionStrategy Unit Tests', () => {
  const strategy = new DefaultProgressionStrategy();

  it('should recommend progressive overload when completion rate and recovery are high', () => {
    const result = strategy.calculateProgression({
      completionRate: 1.0,
      averageRpe: 6.5,
      missedSessionsCount: 0,
      recoveryScore: 85,
    });

    expect(result.weightMultiplier).toBe(1.05);
    expect(result.repsAdjustment).toBe(1);
    expect(result.reason).toContain('high set completion');
  });

  it('should recommend deload when recovery score is low or RPE is high', () => {
    const result = strategy.calculateProgression({
      completionRate: 0.8,
      averageRpe: 9.5,
      missedSessionsCount: 0,
      recoveryScore: 40,
    });

    expect(result.weightMultiplier).toBe(0.95);
    expect(result.volumeAdjustment).toBe(-1);
    expect(result.reason).toContain('Elevated perceived fatigue');
  });
});
