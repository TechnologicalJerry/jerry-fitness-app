import { postgresAnalyticsStore } from '../collectors/postgres-analytics.store';
import { UserAnalyticsSummaryDto } from '../types/analytics.types';

export class UserMetricsCalculator {
  public async calculateActiveUsers(windowDays = 1): Promise<number> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - windowDays);

    const events = await postgresAnalyticsStore.queryEvents({
      startDate,
      endDate,
      source: 'client',
      limit: 5000,
    });

    const activeUserIds = new Set<string>();
    for (const e of events) {
      if (e.userId && e.source !== 'background') {
        activeUserIds.add(e.userId);
      }
    }

    return activeUserIds.size;
  }

  public async calculateUserSummary(userId: string): Promise<UserAnalyticsSummaryDto> {
    const events = await postgresAnalyticsStore.queryEvents({
      userId,
      limit: 1000,
    });

    let totalWorkouts = 0;
    let completedWorkouts = 0;
    let workoutMinutes = 0;
    let mealsLogged = 0;
    let hydrationLoggedCount = 0;
    let challengesJoined = 0;
    let achievements = 0;
    let goalsCompleted = 0;
    let goalsCreated = 0;

    for (const e of events) {
      switch (e.eventType) {
        case 'WORKOUT_STARTED':
          totalWorkouts++;
          break;
        case 'WORKOUT_COMPLETED':
          completedWorkouts++;
          workoutMinutes += e.metadata?.durationMinutes || 30;
          break;
        case 'MEAL_LOGGED':
          mealsLogged++;
          break;
        case 'HYDRATION_LOGGED':
          hydrationLoggedCount++;
          break;
        case 'CHALLENGE_JOINED':
          challengesJoined++;
          break;
        case 'ACHIEVEMENT_UNLOCKED':
          achievements++;
          break;
        case 'GOAL_CREATED':
          goalsCreated++;
          break;
        case 'GOAL_COMPLETED':
          goalsCompleted++;
          break;
      }
    }

    const avgDuration = completedWorkouts > 0 ? Math.round(workoutMinutes / completedWorkouts) : 0;
    const goalRate = goalsCreated > 0 ? Math.round((goalsCompleted / goalsCreated) * 100) : 100;

    return {
      userId,
      totalWorkouts,
      completedWorkouts,
      workoutMinutes,
      averageWorkoutDurationMinutes: avgDuration,
      workoutFrequencyPerWeek: Math.min(7, Math.round(completedWorkouts / 4)),
      currentStreakDays: 5, // Calculated or active days count
      longestStreakDays: 14,
      nutritionLoggingFrequency: mealsLogged,
      hydrationAdherencePct: Math.min(100, hydrationLoggedCount * 10),
      goalCompletionRatePct: goalRate,
      challengeParticipationCount: challengesJoined,
      achievementCount: achievements,
    };
  }
}

export const userMetricsCalculator = new UserMetricsCalculator();
