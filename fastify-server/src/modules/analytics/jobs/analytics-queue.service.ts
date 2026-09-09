import { postgresAnalyticsStore } from '../collectors/postgres-analytics.store';
import { analyticsRepository } from '../repositories/analytics.repository';
import { dailyAggregator } from '../aggregators/daily.aggregator';
import { exportService } from '../exports/export.service';
import { AnalyticsEventDto, AnalyticsExportRequestDto } from '../types/analytics.types';

export class AnalyticsQueueService {
  public async processEventJob(event: AnalyticsEventDto): Promise<void> {
    await postgresAnalyticsStore.writeEvent(event);

    // Update DailyUserMetric if userId is present
    if (event.userId) {
      const eventDate = event.timestamp ? new Date(event.timestamp) : new Date();

      const delta: any = {};
      switch (event.eventType) {
        case 'WORKOUT_COMPLETED':
          delta.workoutsCompleted = 1;
          delta.workoutMinutes = event.metadata?.durationMinutes || 30;
          break;
        case 'MEAL_LOGGED':
          delta.mealsLogged = 1;
          break;
        case 'HYDRATION_LOGGED':
          delta.hydrationLoggedMl = event.metadata?.amountMl || 250;
          break;
        case 'CHALLENGE_JOINED':
          delta.challengesJoined = 1;
          break;
        case 'ACHIEVEMENT_UNLOCKED':
          delta.achievementsUnlocked = 1;
          break;
        case 'SEARCH_PERFORMED':
          delta.searchesPerformed = 1;
          break;
      }

      if (Object.keys(delta).length > 0) {
        await analyticsRepository.upsertDailyUserMetric(event.userId, eventDate, delta);
      }
    }
  }

  public async runDailyAggregationJob(): Promise<void> {
    await dailyAggregator.runDailyAggregation();
  }

  public async processExportJob(payload: {
    exportId: string;
    userId: string;
    userRole: string;
    dto: AnalyticsExportRequestDto;
  }): Promise<void> {
    await exportService.processExportJob(payload.exportId, payload.userId, payload.userRole, payload.dto);
  }
}

export const analyticsQueueService = new AnalyticsQueueService();
