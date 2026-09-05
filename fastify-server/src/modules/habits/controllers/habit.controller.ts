import { FastifyRequest, FastifyReply } from 'fastify';
import { habitService } from '../services/habit.service';
import { formatSuccessResponse } from '../../../common/utils/response-formatter';
import { HttpStatus } from '../../../common/constants/http-status';
import { CreateHabitDto, LogHabitCompletionDto } from '../types/habit.types';

export class HabitController {
  public async createHabit(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const body = request.body as CreateHabitDto;
    const habit = await habitService.createHabit(userId, body);
    return reply.status(HttpStatus.CREATED).send(formatSuccessResponse(habit));
  }

  public async getHabits(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const habits = await habitService.getHabits(userId);
    return reply.status(HttpStatus.OK).send(formatSuccessResponse(habits));
  }

  public async getHabitById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const params = request.params as { id: string };
    const habit = await habitService.getHabitById(params.id, userId);
    return reply.status(HttpStatus.OK).send(formatSuccessResponse(habit));
  }

  public async logCompletion(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const params = request.params as { id: string };
    const body = request.body as LogHabitCompletionDto;
    const result = await habitService.logCompletion(userId, params.id, body);
    return reply.status(HttpStatus.OK).send(formatSuccessResponse(result));
  }

  public async getSummary(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const summary = await habitService.getSummary(userId);
    return reply.status(HttpStatus.OK).send(formatSuccessResponse(summary));
  }
}

export const habitController = new HabitController();
