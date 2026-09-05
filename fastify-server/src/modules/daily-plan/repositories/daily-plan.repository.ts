import { DailyPlan, Prisma } from '@prisma/client';
import { prismaService } from '../../../database/prisma.service';

export class DailyPlanRepository {
  public async getPlanByDate(userId: string, date: Date): Promise<DailyPlan | null> {
    return prismaService.dailyPlan.findUnique({
      where: {
        userId_date: {
          userId,
          date,
        },
      },
    });
  }

  public async upsertPlan(
    userId: string,
    date: Date,
    data: {
      timezone: string;
      workoutRecommendation: any;
      recoveryRecommendation: any;
      nutritionTargets: any;
      hydrationTargetMl: number;
      habits: any;
      goalsSummary: any;
      reminders: string[];
      challenges: string[];
    },
  ): Promise<DailyPlan> {
    return prismaService.dailyPlan.upsert({
      where: {
        userId_date: {
          userId,
          date,
        },
      },
      create: {
        userId,
        date,
        timezone: data.timezone,
        workoutRecommendation: data.workoutRecommendation as Prisma.InputJsonValue,
        recoveryRecommendation: data.recoveryRecommendation as Prisma.InputJsonValue,
        nutritionTargets: data.nutritionTargets as Prisma.InputJsonValue,
        hydrationTargetMl: data.hydrationTargetMl,
        habits: data.habits as Prisma.InputJsonValue,
        goalsSummary: data.goalsSummary as Prisma.InputJsonValue,
        reminders: data.reminders as unknown as Prisma.InputJsonValue,
        challenges: data.challenges as unknown as Prisma.InputJsonValue,
      },
      update: {
        timezone: data.timezone,
        workoutRecommendation: data.workoutRecommendation as Prisma.InputJsonValue,
        recoveryRecommendation: data.recoveryRecommendation as Prisma.InputJsonValue,
        nutritionTargets: data.nutritionTargets as Prisma.InputJsonValue,
        hydrationTargetMl: data.hydrationTargetMl,
        habits: data.habits as Prisma.InputJsonValue,
        goalsSummary: data.goalsSummary as Prisma.InputJsonValue,
        reminders: data.reminders as unknown as Prisma.InputJsonValue,
        challenges: data.challenges as unknown as Prisma.InputJsonValue,
      },
    });
  }
}

export const dailyPlanRepository = new DailyPlanRepository();
