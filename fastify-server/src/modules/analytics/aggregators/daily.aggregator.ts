import { analyticsRepository } from '../repositories/analytics.repository';
import { userMetricsCalculator } from '../metrics/user-metrics.calculator';
import { revenueMetricsCalculator } from '../metrics/revenue-metrics.calculator';
import { postgresAnalyticsStore } from '../collectors/postgres-analytics.store';
import { logger } from '../../../observability/logger';

export class DailyAggregator {
  public async runDailyAggregation(targetDate: Date = new Date()): Promise<void> {
    logger.info({ targetDate: targetDate.toISOString() }, 'Starting daily analytics aggregation job');

    const dau = await userMetricsCalculator.calculateActiveUsers(1);
    const wau = await userMetricsCalculator.calculateActiveUsers(7);
    const mau = await userMetricsCalculator.calculateActiveUsers(30);

    const revenue = await revenueMetricsCalculator.calculateRevenueMetrics();

    const workouts = await postgresAnalyticsStore.queryEvents({
      eventType: 'WORKOUT_COMPLETED',
      startDate: new Date(targetDate.getTime() - 24 * 60 * 60 * 1000),
      endDate: targetDate,
      limit: 5000,
    });

    let workoutMinutes = 0;
    for (const w of workouts) {
      workoutMinutes += w.metadata?.durationMinutes || 30;
    }

    const meals = await postgresAnalyticsStore.queryEvents({
      eventType: 'MEAL_LOGGED',
      startDate: new Date(targetDate.getTime() - 24 * 60 * 60 * 1000),
      endDate: targetDate,
      limit: 5000,
    });

    const regs = await postgresAnalyticsStore.queryEvents({
      eventType: 'USER_REGISTERED',
      startDate: new Date(targetDate.getTime() - 24 * 60 * 60 * 1000),
      endDate: targetDate,
      limit: 5000,
    });

    await analyticsRepository.upsertDailySystemMetric(targetDate, {
      dau,
      wau,
      mau,
      totalRegistrations: regs.length,
      totalWorkoutsCompleted: workouts.length,
      totalWorkoutMinutes: workoutMinutes,
      totalMealsLogged: meals.length,
      totalActiveSubscriptions: revenue.totalSubscriptions,
      grossRevenueCents: revenue.grossRevenueCents,
      netRevenueCents: revenue.netRevenueCents,
    });

    logger.info({ dau, wau, mau, workouts: workouts.length }, 'Completed daily analytics aggregation');
  }
}

export const dailyAggregator = new DailyAggregator();
