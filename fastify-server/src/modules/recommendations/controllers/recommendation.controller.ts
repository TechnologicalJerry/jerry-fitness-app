import { FastifyRequest, FastifyReply } from 'fastify';
import { recommendationService } from '../services/recommendation.service';
import { formatSuccessResponse } from '../../../common/utils/response-formatter';
import { HttpStatus } from '../../../common/constants/http-status';
import { RecommendationFeedbackDto } from '../types/recommendation.types';

export class RecommendationController {
  public async getWorkoutRecommendation(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const recommendation = await recommendationService.getWorkoutRecommendation(userId);
    return reply.status(HttpStatus.OK).send(formatSuccessResponse(recommendation));
  }

  public async getExerciseAlternatives(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const params = request.params as { exerciseId: string };
    const alternatives = await recommendationService.getExerciseAlternatives(
      userId,
      params.exerciseId,
    );
    return reply.status(HttpStatus.OK).send(formatSuccessResponse(alternatives));
  }

  public async submitFeedback(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const params = request.params as { id: string };
    const body = request.body as RecommendationFeedbackDto;
    const result = await recommendationService.submitFeedback(userId, params.id, body);
    return reply.status(HttpStatus.CREATED).send(formatSuccessResponse(result));
  }
}

export const recommendationController = new RecommendationController();
