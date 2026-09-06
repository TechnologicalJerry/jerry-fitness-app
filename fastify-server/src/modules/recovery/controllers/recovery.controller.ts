import { FastifyRequest, FastifyReply } from 'fastify';
import { recoveryService } from '../services/recovery.service';
import { formatSuccessResponse } from '../../../common/utils/response-formatter';
import { HttpStatus } from '../../../common/constants/http-status';
import { SubmitRecoveryDto } from '../types/recovery.types';

export class RecoveryController {
  public async submitRecovery(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const body = request.body as SubmitRecoveryDto;
    const result = await recoveryService.submitRecovery(userId, body);
    return reply.status(HttpStatus.OK).send(formatSuccessResponse(result));
  }

  public async getToday(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const result = await recoveryService.getTodayRecovery(userId);
    return reply.status(HttpStatus.OK).send(formatSuccessResponse(result));
  }

  public async getHistory(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const query = request.query as { limit?: string };
    const limit = query.limit ? parseInt(query.limit, 10) : 30;
    const history = await recoveryService.getHistory(userId, limit);
    return reply.status(HttpStatus.OK).send(formatSuccessResponse(history));
  }
}

export const recoveryController = new RecoveryController();
