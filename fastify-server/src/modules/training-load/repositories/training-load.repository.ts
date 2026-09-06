import { TrainingLoad } from '@prisma/client';
import { prismaService } from '../../../database/prisma.service';

export class TrainingLoadRepository {
  public async upsertDailyLoad(
    userId: string,
    date: Date,
    data: {
      sessionVolume: number;
      intensity: number;
      durationMinutes: number;
      workload: number;
      acuteWorkload: number;
      chronicWorkload: number;
      workloadRatio: number;
      monotony: number;
      consistencyScore: number;
    },
  ): Promise<TrainingLoad> {
    return prismaService.trainingLoad.upsert({
      where: {
        userId_date: {
          userId,
          date,
        },
      },
      create: {
        userId,
        date,
        sessionVolume: data.sessionVolume,
        intensity: data.intensity,
        durationMinutes: data.durationMinutes,
        workload: data.workload,
        acuteWorkload: data.acuteWorkload,
        chronicWorkload: data.chronicWorkload,
        workloadRatio: data.workloadRatio,
        monotony: data.monotony,
        consistencyScore: data.consistencyScore,
      },
      update: {
        sessionVolume: data.sessionVolume,
        intensity: data.intensity,
        durationMinutes: data.durationMinutes,
        workload: data.workload,
        acuteWorkload: data.acuteWorkload,
        chronicWorkload: data.chronicWorkload,
        workloadRatio: data.workloadRatio,
        monotony: data.monotony,
        consistencyScore: data.consistencyScore,
      },
    });
  }

  public async getRecentLoads(userId: string, days = 28): Promise<TrainingLoad[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setUTCHours(0, 0, 0, 0);

    return prismaService.trainingLoad.findMany({
      where: {
        userId,
        date: { gte: startDate },
      },
      orderBy: { date: 'desc' },
    });
  }

  public async getLatestLoad(userId: string): Promise<TrainingLoad | null> {
    return prismaService.trainingLoad.findFirst({
      where: { userId },
      orderBy: { date: 'desc' },
    });
  }
}

export const trainingLoadRepository = new TrainingLoadRepository();
