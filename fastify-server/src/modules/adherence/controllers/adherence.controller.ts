import { FastifyRequest, FastifyReply } from 'fastify';
import { adherenceService } from '../services/adherence.service';
import { formatSuccessResponse } from '../../../common/utils/response-formatter';
import { HttpStatus } from '../../../common/constants/http-status';

export class AdherenceController {
  public async getAdherence(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const query = request.query as { window?: string };
    const windowDays = query.window ? parseInt(query.window, 10) : 7;
    const result = await adherenceService.getAdherence(userId, windowDays);
    return reply.status(HttpStatus.OK).send(formatSuccessResponse(result));
  }
}

export const adherenceController = new AdherenceController();
