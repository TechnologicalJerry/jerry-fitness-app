import { FastifyRequest, FastifyReply } from 'fastify';
import { goalService } from '../services/goal.service';
import { formatSuccessResponse } from '../../../common/utils/response-formatter';
import { HttpStatus } from '../../../common/constants/http-status';
import { CreateGoalDto, UpdateGoalDto, QueryGoalsParams } from '../types/goal.types';
import { GoalStatus } from '@prisma/client';

export class GoalController {
  public async getGoals(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const query = request.query as QueryGoalsParams;
    const goals = await goalService.getGoals(userId, query);
    return reply.status(HttpStatus.OK).send(formatSuccessResponse(goals));
  }

  public async getGoalById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const params = request.params as { id: string };
    const goal = await goalService.getGoalById(params.id, userId);
    return reply.status(HttpStatus.OK).send(formatSuccessResponse(goal));
  }

  public async createGoal(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const body = request.body as CreateGoalDto;
    const goal = await goalService.createGoal(userId, body);
    return reply.status(HttpStatus.CREATED).send(formatSuccessResponse(goal));
  }

  public async updateGoal(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const params = request.params as { id: string };
    const body = request.body as UpdateGoalDto;
    const goal = await goalService.updateGoal(params.id, userId, body);
    return reply.status(HttpStatus.OK).send(formatSuccessResponse(goal));
  }

  public async updateGoalStatus(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const params = request.params as { id: string };
    const body = request.body as { status: GoalStatus };
    const goal = await goalService.updateGoalStatus(params.id, userId, body.status);
    return reply.status(HttpStatus.OK).send(formatSuccessResponse(goal));
  }

  public async deleteGoal(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const params = request.params as { id: string };
    const result = await goalService.deleteGoal(params.id, userId);
    return reply.status(HttpStatus.OK).send(formatSuccessResponse(result));
  }
}

export const goalController = new GoalController();
