import { TrainingLoad } from '@prisma/client';
import { trainingLoadRepository, TrainingLoadRepository } from '../repositories/training-load.repository';
import { LogTrainingSessionDto, TrainingLoadSummary } from '../types/training-load.types';

export class TrainingLoadService {
  constructor(private repo: TrainingLoadRepository = trainingLoadRepository) {}

  public async logSession(userId: string, dto: LogTrainingSessionDto): Promise<TrainingLoadSummary> {
    const targetDate = dto.date ? new Date(dto.date) : new Date();
    targetDate.setUTCHours(0, 0, 0, 0);

    const workload = dto.sessionVolume * dto.intensity;

    const recentLoads = await this.repo.getRecentLoads(userId, 28);
    const last7Days = recentLoads.slice(0, 7);
    const sum7 = last7Days.reduce((acc, curr) => acc + curr.workload, 0) + workload;
    const acuteWorkload = Math.round((sum7 / Math.max(1, last7Days.length + 1)) * 100) / 100;

    const sum28 = recentLoads.reduce((acc, curr) => acc + curr.workload, 0) + workload;
    const chronicWorkload = Math.round((sum28 / Math.max(1, recentLoads.length + 1)) * 100) / 100;

    const workloadRatio = Math.round((acuteWorkload / Math.max(1, chronicWorkload)) * 100) / 100;

    // Monotony calculation: mean / stddev
    const workloads = [...last7Days.map((l) => l.workload), workload];
    const mean = workloads.reduce((a, b) => a + b, 0) / workloads.length;
    const variance = workloads.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / workloads.length;
    const stdDev = Math.sqrt(variance) || 1;
    const monotony = Math.round((mean / stdDev) * 100) / 100;

    // Consistency score (percentage of days with recorded workload in last 14 days)
    const consistencyScore = Math.min(100, Math.round(((recentLoads.length + 1) / 14) * 100));

    let status: 'OPTIMAL' | 'UNDERBOARD' | 'OVERREACHING' | 'HIGH_RISK' = 'OPTIMAL';
    if (workloadRatio > 1.5) status = 'HIGH_RISK';
    else if (workloadRatio > 1.3) status = 'OVERREACHING';
    else if (workloadRatio < 0.8) status = 'UNDERBOARD';

    let trend: 'INCREMENTAL' | 'STABLE' | 'DECREASING' = 'STABLE';
    if (acuteWorkload > chronicWorkload * 1.1) trend = 'INCREMENTAL';
    else if (acuteWorkload < chronicWorkload * 0.9) trend = 'DECREASING';

    await this.repo.upsertDailyLoad(userId, targetDate, {
      sessionVolume: dto.sessionVolume,
      intensity: dto.intensity,
      durationMinutes: dto.durationMinutes,
      workload,
      acuteWorkload,
      chronicWorkload,
      workloadRatio,
      monotony,
      consistencyScore,
    });

    return {
      date: targetDate.toISOString().split('T')[0] || '',
      sessionVolume: dto.sessionVolume,
      intensity: dto.intensity,
      durationMinutes: dto.durationMinutes,
      workload,
      acuteWorkload,
      chronicWorkload,
      workloadRatio,
      monotony,
      consistencyScore,
      status,
      trend,
    };
  }

  public async getSummary(userId: string): Promise<TrainingLoadSummary> {
    const latest = await this.repo.getLatestLoad(userId);
    if (!latest) {
      return {
        date: new Date().toISOString().split('T')[0] || '',
        sessionVolume: 0,
        intensity: 0,
        durationMinutes: 0,
        workload: 0,
        acuteWorkload: 0,
        chronicWorkload: 0,
        workloadRatio: 1.0,
        monotony: 1.0,
        consistencyScore: 100,
        status: 'OPTIMAL',
        trend: 'STABLE',
      };
    }

    let status: 'OPTIMAL' | 'UNDERBOARD' | 'OVERREACHING' | 'HIGH_RISK' = 'OPTIMAL';
    if (latest.workloadRatio > 1.5) status = 'HIGH_RISK';
    else if (latest.workloadRatio > 1.3) status = 'OVERREACHING';
    else if (latest.workloadRatio < 0.8) status = 'UNDERBOARD';

    let trend: 'INCREMENTAL' | 'STABLE' | 'DECREASING' = 'STABLE';
    if (latest.acuteWorkload > latest.chronicWorkload * 1.1) trend = 'INCREMENTAL';
    else if (latest.acuteWorkload < latest.chronicWorkload * 0.9) trend = 'DECREASING';

    return {
      date: latest.date.toISOString().split('T')[0] || '',
      sessionVolume: latest.sessionVolume,
      intensity: latest.intensity,
      durationMinutes: latest.durationMinutes,
      workload: latest.workload,
      acuteWorkload: latest.acuteWorkload,
      chronicWorkload: latest.chronicWorkload,
      workloadRatio: latest.workloadRatio,
      monotony: latest.monotony,
      consistencyScore: latest.consistencyScore,
      status,
      trend,
    };
  }

  public async getHistory(userId: string, days = 28): Promise<TrainingLoad[]> {
    return this.repo.getRecentLoads(userId, days);
  }
}

export const trainingLoadService = new TrainingLoadService();
