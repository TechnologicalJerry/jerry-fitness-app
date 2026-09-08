import { dailyPlanRepository, DailyPlanRepository } from '../repositories/daily-plan.repository';
import { recommendationService } from '../../recommendations/services/recommendation.service';
import { recoveryService } from '../../recovery/services/recovery.service';
import { nutritionRecommendationEngine } from '../../recommendations/engines/nutrition.engine';
import { habitService } from '../../habits/services/habit.service';
import { goalService } from '../../goals/services/goal.service';
import { personalizationRepository } from '../../personalization/repositories/personalization.repository';
import { redisService } from '../../../cache/redis.service';
import { DailyPlanResponse } from '../types/daily-plan.types';

export class DailyPlanService {
  constructor(private repo: DailyPlanRepository = dailyPlanRepository) {}

  public async getDailyPlan(userId: string, timezone = 'UTC', dateStr?: string): Promise<DailyPlanResponse> {
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    targetDate.setUTCHours(0, 0, 0, 0);

    const formattedDate = targetDate.toISOString().split('T')[0] || '';
    const cacheKey = `daily-plan:${userId}:${formattedDate}`;

    try {
      const cached = await redisService.client.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (_e) {
      // Ignore cache get failure if Redis offline
    }

    // 1. Fetch user personalization profile
    const profile = await personalizationRepository.getProfileByUserId(userId);
    const primaryGoal = profile?.primaryGoal || 'GENERAL_FITNESS';
    const activityLevel = profile?.activityLevel || 'moderate';
    const dietaryPreferences = profile?.dietaryPreferences || [];

    // 2. Fetch workout recommendation & recovery status
    const [workoutRec, recoveryStatus, habitsList, goalsList] = await Promise.all([
      recommendationService.getWorkoutRecommendation(userId),
      recoveryService.getTodayRecovery(userId),
      habitService.getHabits(userId),
      goalService.getGoals(userId, {}),
    ]);

    // 3. Generate nutrition recommendations
    const nutritionResult = nutritionRecommendationEngine.generateRecommendations({
      primaryGoal,
      activityLevel,
      dietaryPreferences,
    });

    const reminders = [
      'Log your morning recovery scores for optimal training adjustments.',
      `Target ${nutritionResult.proteinGrams}g protein intake today.`,
      'Stay hydrated throughout the day.',
    ];

    const challenges = [
      'Complete all planned workout sets with strict form.',
      'Achieve 100% habit completion today.',
    ];

    const planData: DailyPlanResponse = {
      date: formattedDate,
      timezone,
      workoutRecommendation: workoutRec,
      recoveryRecommendation: recoveryStatus,
      nutritionTargets: {
        calories: nutritionResult.calorieTarget,
        proteinGrams: nutritionResult.proteinGrams,
        carbsGrams: nutritionResult.carbsGrams,
        fatsGrams: nutritionResult.fatsGrams,
      },
      hydrationTargetMl: nutritionResult.hydrationMl,
      habits: habitsList,
      goalsSummary: goalsList.map((g) => ({
        id: g.id,
        title: g.title,
        status: g.status,
        target: g.target,
        currentValue: g.currentValue,
        unit: g.targetUnit,
      })),
      reminders,
      challenges,
      generatedAt: new Date().toISOString(),
    };

    // Save DB record asynchronously
    this.repo.upsertPlan(userId, targetDate, {
      timezone,
      workoutRecommendation: planData.workoutRecommendation,
      recoveryRecommendation: planData.recoveryRecommendation,
      nutritionTargets: planData.nutritionTargets,
      hydrationTargetMl: planData.hydrationTargetMl,
      habits: planData.habits,
      goalsSummary: planData.goalsSummary,
      reminders: planData.reminders,
      challenges: planData.challenges,
    }).catch(() => {});

    // Cache in Redis for 4 hours (14400 seconds)
    try {
      await redisService.client.set(cacheKey, JSON.stringify(planData), 'EX', 14400);
    } catch (_e) {
      // Ignore Redis set failure
    }

    return planData;
  }
}

export const dailyPlanService = new DailyPlanService();
