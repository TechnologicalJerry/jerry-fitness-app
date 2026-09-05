import { FastifyRequest, FastifyReply } from 'fastify';
import { dailyPlanService } from '../services/daily-plan.service';
import { formatSuccessResponse } from '../../../common/utils/response-formatter';
import { HttpStatus } from '../../../common/constants/http-status';

export class DailyPlanController {
  public async getDailyPlan(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const query = request.query as { timezone?: string; date?: string };
    const timezone = query.timezone || 'UTC';
    const dateStr = query.date;

    const plan = await dailyPlanService.getDailyPlan(userId, timezone, dateStr);
    return reply.status(HttpStatus.OK).send(formatSuccessResponse(plan));
  }
}

export const dailyPlanController = new DailyPlanController();
