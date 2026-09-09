import {
  PrismaClient,
  DailyUserMetric,
  DailySystemMetric,
  CohortRecord,
  ReportExecution,
  AnalyticsExport,
} from '@prisma/client';
import { prismaService } from '../../../database/prisma.service';

export class AnalyticsRepository {
  private db: PrismaClient;

  constructor(customPrisma?: PrismaClient) {
    this.db = customPrisma || prismaService;
  }

  // --- Daily User Metrics ---
  public async upsertDailyUserMetric(
    userId: string,
    date: Date,
    data: {
      workoutsCompleted?: number;
      workoutMinutes?: number;
      mealsLogged?: number;
      hydrationLoggedMl?: number;
      challengesJoined?: number;
      achievementsUnlocked?: number;
      searchesPerformed?: number;
    },
  ): Promise<DailyUserMetric> {
    const dateOnly = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

    return this.db.dailyUserMetric.upsert({
      where: {
        userId_date: {
          userId,
          date: dateOnly,
        },
      },
      create: {
        userId,
        date: dateOnly,
        active: true,
        workoutsCompleted: data.workoutsCompleted || 0,
        workoutMinutes: data.workoutMinutes || 0,
        mealsLogged: data.mealsLogged || 0,
        hydrationLoggedMl: data.hydrationLoggedMl || 0,
        challengesJoined: data.challengesJoined || 0,
        achievementsUnlocked: data.achievementsUnlocked || 0,
        searchesPerformed: data.searchesPerformed || 0,
      },
      update: {
        active: true,
        ...(data.workoutsCompleted ? { workoutsCompleted: { increment: data.workoutsCompleted } } : {}),
        ...(data.workoutMinutes ? { workoutMinutes: { increment: data.workoutMinutes } } : {}),
        ...(data.mealsLogged ? { mealsLogged: { increment: data.mealsLogged } } : {}),
        ...(data.hydrationLoggedMl ? { hydrationLoggedMl: { increment: data.hydrationLoggedMl } } : {}),
        ...(data.challengesJoined ? { challengesJoined: { increment: data.challengesJoined } } : {}),
        ...(data.achievementsUnlocked ? { achievementsUnlocked: { increment: data.achievementsUnlocked } } : {}),
        ...(data.searchesPerformed ? { searchesPerformed: { increment: data.searchesPerformed } } : {}),
      },
    });
  }

  public async getDailyUserMetrics(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<DailyUserMetric[]> {
    return this.db.dailyUserMetric.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  // --- Daily System Metrics ---
  public async upsertDailySystemMetric(
    date: Date,
    data: {
      dau?: number;
      wau?: number;
      mau?: number;
      totalRegistrations?: number;
      totalWorkoutsCompleted?: number;
      totalWorkoutMinutes?: number;
      totalMealsLogged?: number;
      totalActiveSubscriptions?: number;
      grossRevenueCents?: number;
      netRevenueCents?: number;
    },
  ): Promise<DailySystemMetric> {
    const dateOnly = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

    return this.db.dailySystemMetric.upsert({
      where: { date: dateOnly },
      create: {
        date: dateOnly,
        dau: data.dau || 0,
        wau: data.wau || 0,
        mau: data.mau || 0,
        totalRegistrations: data.totalRegistrations || 0,
        totalWorkoutsCompleted: data.totalWorkoutsCompleted || 0,
        totalWorkoutMinutes: data.totalWorkoutMinutes || 0,
        totalMealsLogged: data.totalMealsLogged || 0,
        totalActiveSubscriptions: data.totalActiveSubscriptions || 0,
        grossRevenueCents: data.grossRevenueCents || 0,
        netRevenueCents: data.netRevenueCents || 0,
      },
      update: {
        ...(data.dau !== undefined ? { dau: data.dau } : {}),
        ...(data.wau !== undefined ? { wau: data.wau } : {}),
        ...(data.mau !== undefined ? { mau: data.mau } : {}),
        ...(data.totalRegistrations !== undefined ? { totalRegistrations: data.totalRegistrations } : {}),
        ...(data.totalWorkoutsCompleted !== undefined ? { totalWorkoutsCompleted: data.totalWorkoutsCompleted } : {}),
        ...(data.totalWorkoutMinutes !== undefined ? { totalWorkoutMinutes: data.totalWorkoutMinutes } : {}),
        ...(data.totalMealsLogged !== undefined ? { totalMealsLogged: data.totalMealsLogged } : {}),
        ...(data.totalActiveSubscriptions !== undefined ? { totalActiveSubscriptions: data.totalActiveSubscriptions } : {}),
        ...(data.grossRevenueCents !== undefined ? { grossRevenueCents: data.grossRevenueCents } : {}),
        ...(data.netRevenueCents !== undefined ? { netRevenueCents: data.netRevenueCents } : {}),
      },
    });
  }

  public async getDailySystemMetrics(startDate: Date, endDate: Date): Promise<DailySystemMetric[]> {
    return this.db.dailySystemMetric.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  // --- Cohorts ---
  public async upsertCohortRecord(data: {
    cohortKey: string;
    dimension: string;
    dimensionValue: string;
    startDate: Date;
    initialSize: number;
    day1Retained?: number;
    day7Retained?: number;
    day14Retained?: number;
    day30Retained?: number;
    day60Retained?: number;
    day90Retained?: number;
  }): Promise<CohortRecord> {
    return this.db.cohortRecord.upsert({
      where: { cohortKey: data.cohortKey },
      create: {
        cohortKey: data.cohortKey,
        dimension: data.dimension,
        dimensionValue: data.dimensionValue,
        startDate: data.startDate,
        initialSize: data.initialSize,
        day1Retained: data.day1Retained || 0,
        day7Retained: data.day7Retained || 0,
        day14Retained: data.day14Retained || 0,
        day30Retained: data.day30Retained || 0,
        day60Retained: data.day60Retained || 0,
        day90Retained: data.day90Retained || 0,
      },
      update: {
        initialSize: data.initialSize,
        ...(data.day1Retained !== undefined ? { day1Retained: data.day1Retained } : {}),
        ...(data.day7Retained !== undefined ? { day7Retained: data.day7Retained } : {}),
        ...(data.day14Retained !== undefined ? { day14Retained: data.day14Retained } : {}),
        ...(data.day30Retained !== undefined ? { day30Retained: data.day30Retained } : {}),
        ...(data.day60Retained !== undefined ? { day60Retained: data.day60Retained } : {}),
        ...(data.day90Retained !== undefined ? { day90Retained: data.day90Retained } : {}),
      },
    });
  }

  public async getCohortRecords(dimension?: string): Promise<CohortRecord[]> {
    return this.db.cohortRecord.findMany({
      where: dimension ? { dimension } : {},
      orderBy: { startDate: 'desc' },
    });
  }

  // --- Reports & Exports ---
  public async createReportExecution(data: {
    reportId: string;
    executedBy: string;
    parameters?: Record<string, any>;
  }): Promise<ReportExecution> {
    return this.db.reportExecution.create({
      data: {
        reportId: data.reportId,
        executedBy: data.executedBy,
        parameters: data.parameters ? (data.parameters as any) : undefined,
        status: 'PROCESSING',
      },
    });
  }

  public async updateReportExecution(
    id: string,
    status: string,
    result?: Record<string, any>,
    executionTimeMs?: number,
  ): Promise<ReportExecution> {
    return this.db.reportExecution.update({
      where: { id },
      data: {
        status,
        ...(result ? { result: result as any } : {}),
        ...(executionTimeMs ? { executionTimeMs } : {}),
      },
    });
  }

  public async createAnalyticsExport(data: {
    userId: string;
    exportType: string;
  }): Promise<AnalyticsExport> {
    return this.db.analyticsExport.create({
      data: {
        userId: data.userId,
        exportType: data.exportType,
        status: 'PENDING',
      },
    });
  }

  public async updateAnalyticsExport(
    id: string,
    data: {
      status: string;
      fileKey?: string;
      downloadUrl?: string;
      expiresAt?: Date;
    },
  ): Promise<AnalyticsExport> {
    return this.db.analyticsExport.update({
      where: { id },
      data: {
        status: data.status,
        ...(data.fileKey ? { fileKey: data.fileKey } : {}),
        ...(data.downloadUrl ? { downloadUrl: data.downloadUrl } : {}),
        ...(data.expiresAt ? { expiresAt: data.expiresAt } : {}),
      },
    });
  }

  public async getAnalyticsExport(id: string): Promise<AnalyticsExport | null> {
    return this.db.analyticsExport.findUnique({
      where: { id },
    });
  }
}

export const analyticsRepository = new AnalyticsRepository();
