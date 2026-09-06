import { recommendationRepository, RecommendationRepository } from '../repositories/recommendation.repository';
import { AdaptiveWorkoutStrategy, WorkoutRecommendationStrategy } from '../strategies/workout-recommendation.strategy';
import { exerciseRecommendationEngine } from '../engines/exercise.engine';
import { AIProviderFactory } from '../ai/ai.provider';
import { AISafetyLayer } from '../ai/ai-safety.layer';
import { personalizationRepository } from '../../personalization/repositories/personalization.repository';
import { recoveryService } from '../../recovery/services/recovery.service';
import { trainingLoadService } from '../../training-load/services/training-load.service';
import { redisService } from '../../../cache/redis.service';
import { StandardRecommendation, WorkoutPlanData, ExerciseAlternative, RecommendationFeedbackDto } from '../types/recommendation.types';
import { FeedbackType } from '@prisma/client';

export class RecommendationService {
  private workoutStrategy: WorkoutRecommendationStrategy;

  constructor(
    private repo: RecommendationRepository = recommendationRepository,
    strategy?: WorkoutRecommendationStrategy,
  ) {
    this.workoutStrategy = strategy || new AdaptiveWorkoutStrategy();
  }

  public async getWorkoutRecommendation(userId: string): Promise<StandardRecommendation<WorkoutPlanData>> {
    const cacheKey = `rec:user:${userId}:workout`;
    try {
      const cached = await redisService.client.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (_e) {
      // Ignore cache failure if Redis offline
    }

    // 1. Fetch user profile, recovery & workload context
    const profile = await personalizationRepository.getProfileByUserId(userId);
    const todayRecovery = await recoveryService.getTodayRecovery(userId);
    const loadSummary = await trainingLoadService.getSummary(userId);

    const input = {
      primaryGoal: profile?.primaryGoal || 'GENERAL_FITNESS',
      fitnessLevel: profile?.fitnessLevel || 'intermediate',
      availableEquipment: profile?.availableEquipment || ['dumbbells', 'barbell', 'bodyweight'],
      preferredDurationMinutes: profile?.preferredDurationMinutes || 45,
      dislikedExercises: profile?.dislikedExercises || [],
      recoveryScore: todayRecovery.recoveryScore,
      recentWorkloadRatio: loadSummary.workloadRatio,
    };

    // 2. Generate workout via strategy
    const result = this.workoutStrategy.recommend(input);

    // 3. Optional AI Provider pass & Safety validation
    const aiProvider = AIProviderFactory.getProvider('mock');
    const aiOutput = await aiProvider.generateRecommendation({
      userGoal: input.primaryGoal,
      fitnessLevel: input.fitnessLevel,
      equipment: input.availableEquipment,
      recentWorkloadRatio: input.recentWorkloadRatio,
      recoveryScore: input.recoveryScore,
    });

    const safeAiOutput = AISafetyLayer.validateRecommendationOutput(
      aiOutput,
      input.availableEquipment,
      input.dislikedExercises,
    );

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hours TTL

    const recommendationData: StandardRecommendation<WorkoutPlanData> = {
      type: 'WORKOUT',
      title: result.workout.title,
      recommendation: safeAiOutput.recommendation || result.workout.title,
      reason: result.reason,
      confidence: Math.round(((result.confidence + safeAiOutput.confidence) / 2) * 100) / 100,
      factors: todayRecovery.contributingFactors,
      data: result.workout,
      generatedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    // Save to database asynchronously
    this.repo.createRecommendation(
      userId,
      'WORKOUT',
      recommendationData.title,
      recommendationData.recommendation,
      recommendationData.reason,
      recommendationData.confidence,
      recommendationData.factors,
      recommendationData.data,
      expiresAt,
    ).catch(() => {});

    // Cache in Redis for 4 hours
    try {
      await redisService.client.set(cacheKey, JSON.stringify(recommendationData), 'EX', 14400);
    } catch (_e) {
      // Ignore Redis set failure
    }

    return recommendationData;
  }

  public async getExerciseAlternatives(
    userId: string,
    exerciseId: string,
  ): Promise<ExerciseAlternative[]> {
    const profile = await personalizationRepository.getProfileByUserId(userId);
    const availableEquipment = profile?.availableEquipment || ['dumbbells', 'barbell', 'bodyweight'];
    const dislikedExercises = profile?.dislikedExercises || [];
    const preferredExercises = profile?.preferredExercises || [];

    return exerciseRecommendationEngine.findAlternatives({
      targetExerciseId: exerciseId,
      availableEquipment,
      dislikedExercises,
      preferredExercises,
    });
  }

  public async submitFeedback(
    userId: string,
    recommendationId: string,
    dto: RecommendationFeedbackDto,
  ): Promise<{ message: string; feedbackId: string }> {
    const feedback = await this.repo.createFeedback(
      userId,
      recommendationId,
      dto.feedbackType as FeedbackType,
      dto.notes,
    );

    // Clear user recommendation cache so updated rules take effect immediately
    try {
      await redisService.client.del(`rec:user:${userId}:workout`);
    } catch (_e) {
      // Ignore Redis del failure
    }

    return {
      message: 'Feedback recorded successfully. Recommendations updated.',
      feedbackId: feedback.id,
    };
  }
}

export const recommendationService = new RecommendationService();
