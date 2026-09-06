import { describe, it, expect } from 'vitest';
import { AISafetyLayer } from '../../modules/recommendations/ai/ai-safety.layer';
import { ValidationError } from '../../common/errors/common-errors';

describe('AISafetyLayer Unit Tests', () => {
  it('should pass valid AI recommendation output', () => {
    const output = AISafetyLayer.validateRecommendationOutput(
      {
        title: 'Upper Body Blast',
        recommendation: 'Perform 4 sets of Bench Press',
        reason: 'Optimal strength stimulus',
        confidence: 0.85,
        workoutData: { suggestedDuration: 45, equipmentNeeded: ['dumbbells'] },
      },
      ['dumbbells', 'barbell'],
      [],
    );

    expect(output.confidence).toBe(0.85);
    expect(output.title).toBe('Upper Body Blast');
  });

  it('should throw ValidationError if AI recommends unavailable equipment', () => {
    expect(() =>
      AISafetyLayer.validateRecommendationOutput(
        {
          title: 'Machine Workout',
          recommendation: 'Use heavy cable crossover machine',
          reason: 'Target chest',
          confidence: 0.9,
          workoutData: { suggestedDuration: 45, equipmentNeeded: ['cable_machine'] },
        },
        ['dumbbells'],
        [],
      ),
    ).toThrow(ValidationError);
  });
});
