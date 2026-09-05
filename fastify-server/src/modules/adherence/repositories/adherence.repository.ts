import { AdherenceSummary, AdherenceTrend } from '@prisma/client';
import { prismaService } from '../../../database/prisma.service';

export class AdherenceRepository {
  public async getLatestSummary(userId: string, windowDays: number, date: Date): Promise<AdherenceSummary | null> {
    return prismaService.adherenceSummary.findUnique({
      where: {
        userId_windowDays_date: {
          userId,
          windowDays,
          date,
        },
      },
    });
  }

  public async upsertSummary(
    userId: string,
    windowDays: number,
    date: Date,
    data: {
      overallAdherence: number;
      workoutAdherence: number;
      nutritionAdherence: number;
      hydrationAdherence: number;
      habitAdherence: number;
      trend: AdherenceTrend;
    },
  ): Promise<AdherenceSummary> {
    return prismaService.adherenceSummary.upsert({
      where: {
        userId_windowDays_date: {
          userId,
          windowDays,
          date,
        },
      },
      create: {
        userId,
        windowDays,
        date,
        overallAdherence: data.overallAdherence,
        workoutAdherence: data.workoutAdherence,
        nutritionAdherence: data.nutritionAdherence,
        hydrationAdherence: data.hydrationAdherence,
        habitAdherence: data.habitAdherence,
        trend: data.trend,
      },
      update: {
        overallAdherence: data.overallAdherence,
        workoutAdherence: data.workoutAdherence,
        nutritionAdherence: data.nutritionAdherence,
        hydrationAdherence: data.hydrationAdherence,
        habitAdherence: data.habitAdherence,
        trend: data.trend,
      },
    });
  }
}

export const adherenceRepository = new AdherenceRepository();
