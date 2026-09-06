import { FastifyRequest, FastifyReply } from 'fastify';
import { trainingLoadService } from '../services/training-load.service';
import { formatSuccessResponse } from '../../../common/utils/response-formatter';
import { HttpStatus } from '../../../common/constants/http-status';
import { LogTrainingSessionDto } from '../types/training-load.types';

export class TrainingLoadController {
  public async logSession(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const body = request.body as LogTrainingSessionDto;
    const result = await trainingLoadService.logSession(userId, body);
    return reply.status(HttpStatus.CREATED).send(formatSuccessResponse(result));
  }

  public async getSummary(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const summary = await trainingLoadService.getSummary(userId);
    return reply.status(HttpStatus.OK).send(formatSuccessResponse(summary));
  }

  public async getHistory(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const query = request.query as { days?: string };
    const days = query.days ? parseInt(query.days, 10) : 28;
    const history = await trainingLoadService.getHistory(userId, days);
    return reply.status(HttpStatus.OK).send(formatSuccessResponse(history));
  }
}

export const trainingLoadController = new TrainingLoadController();
