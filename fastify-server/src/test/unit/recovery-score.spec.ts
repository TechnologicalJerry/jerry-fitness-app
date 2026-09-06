import { describe, it, expect } from 'vitest';
import { RecoveryService } from '../../modules/recovery/services/recovery.service';

describe('RecoveryService Calculation Unit Tests', () => {
  const service = new RecoveryService();

  it('should calculate high recovery score for optimal inputs', () => {
    const { score, factors } = service.calculateRecoveryScore({
      sleepDurationHours: 8,
      sleepQualityScore: 9,
      subjectiveFatigueScore: 2,
      sorenessScore: 2,
      energyLevelScore: 9,
      stressLevelScore: 2,
    });

    expect(score).toBeGreaterThanOrEqual(80);
    expect(factors).toContain('High energy level reported');
  });

  it('should calculate lower recovery score for high fatigue and low sleep', () => {
    const { score, factors } = service.calculateRecoveryScore({
      sleepDurationHours: 5,
      sleepQualityScore: 4,
      subjectiveFatigueScore: 8,
      sorenessScore: 8,
      energyLevelScore: 3,
      stressLevelScore: 8,
    });

    expect(score).toBeLessThan(50);
    expect(factors).toContain('High muscle soreness detected');
  });
});
