import { Recommendation, RecommendationFeedback, RecommendationType, FeedbackType, Prisma } from '@prisma/client';
import { prismaService } from '../../../database/prisma.service';

export class RecommendationRepository {
  public async createRecommendation(
    userId: string,
    type: RecommendationType,
    title: string,
    recommendation: string,
    reason: string,
    confidence: number,
    factors: string[],
    data: any,
    expiresAt: Date,
  ): Promise<Recommendation> {
    return prismaService.recommendation.create({
      data: {
        userId,
        type,
        title,
        recommendation,
        reason,
        confidence,
        factors: factors as unknown as Prisma.InputJsonValue,
        data: data as unknown as Prisma.InputJsonValue,
        expiresAt,
      },
    });
  }

  public async getActiveRecommendation(userId: string, type: RecommendationType): Promise<Recommendation | null> {
    return prismaService.recommendation.findFirst({
      where: {
        userId,
        type,
        status: 'ACTIVE',
        expiresAt: { gte: new Date() },
      },
      orderBy: { generatedAt: 'desc' },
    });
  }

  public async createFeedback(
    userId: string,
    recommendationId: string,
    feedbackType: FeedbackType,
    notes?: string,
  ): Promise<RecommendationFeedback> {
    return prismaService.recommendationFeedback.create({
      data: {
        userId,
        recommendationId,
        feedbackType,
        notes,
      },
    });
  }
}

export const recommendationRepository = new RecommendationRepository();
