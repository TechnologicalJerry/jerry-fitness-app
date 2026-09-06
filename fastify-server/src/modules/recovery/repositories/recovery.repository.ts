import { RecoveryRecord, Prisma } from '@prisma/client';
import { prismaService } from '../../../database/prisma.service';
import { SubmitRecoveryDto } from '../types/recovery.types';

export class RecoveryRepository {
  public async upsertDailyRecord(
    userId: string,
    date: Date,
    dto: SubmitRecoveryDto,
    calculatedScore: number,
    factors: string[],
  ): Promise<RecoveryRecord> {
    return prismaService.recoveryRecord.upsert({
      where: {
        userId_date: {
          userId,
          date,
        },
      },
      create: {
        userId,
        date,
        sleepDurationHours: dto.sleepDurationHours,
        sleepQualityScore: dto.sleepQualityScore,
        restingHeartRate: dto.restingHeartRate,
        subjectiveFatigueScore: dto.subjectiveFatigueScore,
        sorenessScore: dto.sorenessScore,
        energyLevelScore: dto.energyLevelScore,
        stressLevelScore: dto.stressLevelScore,
        recoveryScore: calculatedScore,
        contributingFactors: factors as unknown as Prisma.InputJsonValue,
      },
      update: {
        sleepDurationHours: dto.sleepDurationHours,
        sleepQualityScore: dto.sleepQualityScore,
        restingHeartRate: dto.restingHeartRate,
        subjectiveFatigueScore: dto.subjectiveFatigueScore,
        sorenessScore: dto.sorenessScore,
        energyLevelScore: dto.energyLevelScore,
        stressLevelScore: dto.stressLevelScore,
        recoveryScore: calculatedScore,
        contributingFactors: factors as unknown as Prisma.InputJsonValue,
      },
    });
  }

  public async getByDate(userId: string, date: Date): Promise<RecoveryRecord | null> {
    return prismaService.recoveryRecord.findUnique({
      where: {
        userId_date: {
          userId,
          date,
        },
      },
    });
  }

  public async getHistory(userId: string, limit = 30): Promise<RecoveryRecord[]> {
    return prismaService.recoveryRecord.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: limit,
    });
  }
}

export const recoveryRepository = new RecoveryRepository();
