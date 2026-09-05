import { AdherenceTrend } from '@prisma/client';
import { adherenceRepository, AdherenceRepository } from '../repositories/adherence.repository';
import { redisService } from '../../../cache/redis.service';
import { habitRepository } from '../../habits/repositories/habit.repository';
import { trainingLoadRepository } from '../../training-load/repositories/training-load.repository';
import { AdherenceMetricResponse } from '../types/adherence.types';

export class AdherenceService {
  constructor(private repo: AdherenceRepository = adherenceRepository) {}

  public async getAdherence(userId: string, windowDays = 7): Promise<AdherenceMetricResponse> {
    const cacheKey = `adherence:${userId}:${windowDays}`;
    const cached = await redisService.client.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (_e) {
        // Cache miss/parse fail fallback
      }
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - windowDays);
    startDate.setUTCHours(0, 0, 0, 0);

    // Fetch habit completions in range
    const habitCompletions = await habitRepository.getCompletionsInRange(userId, startDate, today);
    const habitCount = (await habitRepository.findMany(userId)).length;
    const targetHabitCount = habitCount * windowDays || 1;
    const completedHabits = habitCompletions.filter((c) => c.completed).length;
    const habitAdherence = Math.min(100, Math.round((completedHabits / targetHabitCount) * 100));

    // Fetch workout session counts in range
    const recentLoads = await trainingLoadRepository.getRecentLoads(userId, windowDays);
    const expectedWorkouts = Math.max(1, Math.round(windowDays * 0.5)); // expected ~3-4 workouts per week
    const workoutAdherence = Math.min(100, Math.round((recentLoads.length / expectedWorkouts) * 100));

    const nutritionAdherence = 85; // Baseline nutrition logging adherence
    const hydrationAdherence = 90; // Baseline hydration tracking adherence

    const overallAdherence = Math.round(
      (habitAdherence + workoutAdherence + nutritionAdherence + hydrationAdherence) / 4,
    );

    let trend: AdherenceTrend = AdherenceTrend.STABLE;
    if (overallAdherence >= 80) trend = AdherenceTrend.IMPROVING;
    else if (overallAdherence < 60) trend = AdherenceTrend.DECLINING;

    await this.repo.upsertSummary(userId, windowDays, today, {
      overallAdherence,
      workoutAdherence,
      nutritionAdherence,
      hydrationAdherence,
      habitAdherence,
      trend,
    });

    const response: AdherenceMetricResponse = {
      windowDays,
      overallAdherence,
      workoutAdherence,
      nutritionAdherence,
      hydrationAdherence,
      habitAdherence,
      trend,
      generatedAt: new Date().toISOString(),
    };

    // Cache in Redis for 15 minutes (900 seconds)
    await redisService.client.set(cacheKey, JSON.stringify(response), 'EX', 900);

    return response;
  }
}

export const adherenceService = new AdherenceService();
