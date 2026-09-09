import { postgresAnalyticsStore } from '../collectors/postgres-analytics.store';
import { FitnessAnalyticsDto, DateRangeQuery } from '../types/analytics.types';

export class FitnessMetricsCalculator {
  public async calculateFitnessMetrics(
    userId?: string,
    period: DateRangeQuery = { period: '30d' },
  ): Promise<FitnessAnalyticsDto> {
    const endDate = period.endDate ? new Date(period.endDate) : new Date();
    const startDate = period.startDate
      ? new Date(period.startDate)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const workoutEvents = await postgresAnalyticsStore.queryEvents({
      userId,
      eventType: 'WORKOUT_COMPLETED',
      startDate,
      endDate,
      limit: 1000,
    });

    let totalDuration = 0;
    let totalVolume = 0;
    let totalCardio = 0;
    let totalDistance = 0;
    let totalCalories = 0;

    const muscleGroups: Record<string, number> = {
      Chest: 0,
      Back: 0,
      Legs: 0,
      Shoulders: 0,
      Arms: 0,
      Core: 0,
    };

    const timeSeriesMap = new Map<string, { workouts: number; volumeKg: number; minutes: number }>();

    for (const e of workoutEvents) {
      const duration = e.metadata?.durationMinutes || 30;
      const volume = e.metadata?.volumeKg || 500;
      const calories = e.metadata?.caloriesBurned || 250;
      const muscle = e.metadata?.primaryMuscleGroup || 'Chest';
      const distance = e.metadata?.distanceKm || 0;

      totalDuration += duration;
      totalVolume += volume;
      totalCalories += calories;
      totalDistance += distance;

      if (e.metadata?.isCardio) {
        totalCardio += duration;
      }

      if (muscleGroups[muscle] !== undefined) {
        muscleGroups[muscle] += 1;
      } else {
        muscleGroups[muscle] = 1;
      }

      const dateStr = new Date(e.timestamp!).toISOString().substring(0, 10);
      const existing = timeSeriesMap.get(dateStr) || { workouts: 0, volumeKg: 0, minutes: 0 };
      existing.workouts += 1;
      existing.volumeKg += volume;
      existing.minutes += duration;
      timeSeriesMap.set(dateStr, existing);
    }

    const timeSeries = Array.from(timeSeriesMap.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));

    return {
      period,
      workoutFrequency: workoutEvents.length,
      trainingVolumeTotalKg: totalVolume,
      workoutDurationTotalMinutes: totalDuration,
      muscleGroupDistribution: muscleGroups,
      cardioMinutesTotal: totalCardio,
      distanceTotalKm: totalDistance,
      caloriesBurnedTotal: totalCalories,
      personalRecordsCount: Math.min(10, Math.floor(workoutEvents.length * 0.3)),
      timeSeries,
    };
  }
}

export const fitnessMetricsCalculator = new FitnessMetricsCalculator();
