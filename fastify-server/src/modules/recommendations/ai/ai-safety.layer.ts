import { AIRecommendationResponse } from './ai.provider';
import { ValidationError } from '../../../common/errors/common-errors';

export class AISafetyLayer {
  public static validateRecommendationOutput(
    rawOutput: AIRecommendationResponse,
    userEquipment: string[],
    userDislikedExercises: string[],
  ): AIRecommendationResponse {
    // 1. Sanitize text & confidence score bounds [0.0, 1.0]
    const confidence = Math.max(0.0, Math.min(1.0, rawOutput.confidence ?? 0.85));

    if (!rawOutput.title || !rawOutput.recommendation) {
      throw new ValidationError('AI recommendation output is missing required text fields.');
    }

    // 2. Validate workout data structure if present
    if (rawOutput.workoutData) {
      const duration = rawOutput.workoutData.suggestedDuration as number;
      if (duration && (duration < 5 || duration > 180)) {
        throw new ValidationError('AI generated invalid workout duration parameter.');
      }

      const reqEquipment = (rawOutput.workoutData.equipmentNeeded as string[]) || [];
      const unavailable = reqEquipment.filter(
        (eq) => !userEquipment.includes(eq) && eq !== 'bodyweight',
      );
      if (unavailable.length > 0) {
        throw new ValidationError(
          `AI recommended equipment unavailable to user: ${unavailable.join(', ')}`,
        );
      }
    }

    // 3. Ensure no disliked exercises are leaked in rawOutput text
    const textContent = `${rawOutput.title} ${rawOutput.recommendation} ${rawOutput.reason}`.toLowerCase();
    for (const disliked of userDislikedExercises) {
      if (disliked.trim() && textContent.includes(disliked.toLowerCase())) {
        throw new ValidationError(`AI recommendation contains user disliked exercise: ${disliked}`);
      }
    }

    return {
      title: rawOutput.title,
      recommendation: rawOutput.recommendation,
      reason: rawOutput.reason,
      confidence,
      workoutData: rawOutput.workoutData,
    };
  }
}
