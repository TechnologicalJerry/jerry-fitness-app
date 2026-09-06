import { RecoveryRecord } from '@prisma/client';
import { recoveryRepository, RecoveryRepository } from '../repositories/recovery.repository';
import { SubmitRecoveryDto, TodayRecoveryResponse } from '../types/recovery.types';

export class RecoveryService {
  constructor(private repo: RecoveryRepository = recoveryRepository) {}

  public calculateRecoveryScore(dto: SubmitRecoveryDto): { score: number; factors: string[] } {
    const factors: string[] = [];

    // Energy score component (1-10 -> max 25 points)
    const energyPoints = (dto.energyLevelScore / 10) * 25;
    if (dto.energyLevelScore >= 8) factors.push('High energy level reported');
    if (dto.energyLevelScore <= 4) factors.push('Low energy self-report');

    // Fatigue & Soreness component (10 is worst -> max 25 points)
    const fatiguePoints = ((10 - dto.subjectiveFatigueScore) / 10) * 12.5;
    const sorenessPoints = ((10 - dto.sorenessScore) / 10) * 12.5;
    if (dto.sorenessScore >= 7) factors.push('High muscle soreness detected');
    if (dto.subjectiveFatigueScore >= 7) factors.push('High subjective fatigue detected');

    // Stress component (10 is worst -> max 25 points)
    const stressPoints = ((10 - dto.stressLevelScore) / 10) * 25;
    if (dto.stressLevelScore >= 7) factors.push('Elevated stress level');

    // Sleep component (max 25 points)
    let sleepPoints = 17.5; // default moderate
    if (dto.sleepDurationHours !== undefined && dto.sleepDurationHours !== null) {
      if (dto.sleepDurationHours >= 7.5) {
        sleepPoints = 25;
        factors.push('Optimal sleep duration (7.5+ hours)');
      } else if (dto.sleepDurationHours >= 6) {
        sleepPoints = 18;
        factors.push('Moderate sleep duration (6-7.5 hours)');
      } else {
        sleepPoints = 10;
        factors.push('Sub-optimal sleep duration (<6 hours)');
      }
    }

    const totalScore = Math.min(100, Math.max(0, Math.round(energyPoints + fatiguePoints + sorenessPoints + stressPoints + sleepPoints)));

    return { score: totalScore, factors };
  }

  public getRecommendationText(score: number): { status: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'POOR'; text: string } {
    if (score >= 85) {
      return {
        status: 'EXCELLENT',
        text: 'Your body is fully primed for high-intensity training or heavy strength workloads today.',
      };
    }
    if (score >= 70) {
      return {
        status: 'GOOD',
        text: 'Good recovery status. Standard training intensity is recommended.',
      };
    }
    if (score >= 50) {
      return {
        status: 'MODERATE',
        text: 'Moderate recovery state. Consider reducing total volume or opting for moderate-intensity sessions.',
      };
    }
    return {
      status: 'POOR',
      text: 'Recovery indicators are low. An active recovery, light mobility session, or complete rest day is strongly recommended.',
    };
  }

  public async submitRecovery(userId: string, dto: SubmitRecoveryDto): Promise<TodayRecoveryResponse> {
    const targetDate = dto.date ? new Date(dto.date) : new Date();
    // Normalize date to UTC start of day
    targetDate.setUTCHours(0, 0, 0, 0);

    const { score, factors } = this.calculateRecoveryScore(dto);
    const recInfo = this.getRecommendationText(score);

    await this.repo.upsertDailyRecord(userId, targetDate, dto, score, factors);

    return {
      recoveryScore: score,
      status: recInfo.status,
      contributingFactors: factors,
      recommendation: recInfo.text,
      confidence: 0.92,
      generatedAt: new Date().toISOString(),
      details: {
        sleepHours: dto.sleepDurationHours ?? null,
        fatigue: dto.subjectiveFatigueScore,
        soreness: dto.sorenessScore,
        energy: dto.energyLevelScore,
        stress: dto.stressLevelScore,
      },
    };
  }

  public async getTodayRecovery(userId: string): Promise<TodayRecoveryResponse> {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const record = await this.repo.getByDate(userId, today);
    if (!record) {
      // Default baseline response if no log submitted today
      return {
        recoveryScore: 75,
        status: 'GOOD',
        contributingFactors: ['Default baseline recovery estimate (no log submitted today)'],
        recommendation: 'Log your sleep and fatigue for a personalized recovery score.',
        confidence: 0.70,
        generatedAt: new Date().toISOString(),
        details: {
          sleepHours: null,
          fatigue: 3,
          soreness: 3,
          energy: 7,
          stress: 3,
        },
      };
    }

    const recInfo = this.getRecommendationText(record.recoveryScore);
    const factors = (record.contributingFactors as string[]) || [];

    return {
      recoveryScore: record.recoveryScore,
      status: recInfo.status,
      contributingFactors: factors,
      recommendation: recInfo.text,
      confidence: 0.92,
      generatedAt: record.updatedAt.toISOString(),
      details: {
        sleepHours: record.sleepDurationHours,
        fatigue: record.subjectiveFatigueScore,
        soreness: record.sorenessScore,
        energy: record.energyLevelScore,
        stress: record.stressLevelScore,
      },
    };
  }

  public async getHistory(userId: string, limit = 30): Promise<RecoveryRecord[]> {
    return this.repo.getHistory(userId, limit);
  }
}

export const recoveryService = new RecoveryService();
