import { FastifyRequest, FastifyReply } from 'fastify';
import { healthService } from '../services/health.service';
import { formatSuccessResponse } from '../../../common/utils/response-formatter';
import { HttpStatus } from '../../../common/constants/http-status';

export class HealthController {
  public async getHealth(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const result = await healthService.getHealth();
    const statusCode = result.status === 'ok' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
    return reply.status(statusCode).send(formatSuccessResponse(result));
  }

  public async getLive(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const result = healthService.getLiveness();
    return reply.status(HttpStatus.OK).send(formatSuccessResponse(result));
  }

  public async getReady(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { isReady, result } = await healthService.getReadiness();
    const statusCode = isReady ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
    return reply.status(statusCode).send(formatSuccessResponse(result));
  }
}

export const healthController = new HealthController();
