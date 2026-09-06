import { FastifyRequest, FastifyReply } from 'fastify';
import { presenceService } from '../services/presence.service';
import { liveWorkoutService } from '../services/live-workout.service';
import { formatSuccessResponse } from '../../../common/utils/response-formatter';
import { HttpStatus } from '../../../common/constants/http-status';
import { osHostId, env } from '../../../config/env';

export class RealtimeController {
  public async getStatus(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    return reply.status(HttpStatus.OK).send(
      formatSuccessResponse({
        status: 'UP',
        serverInstanceId: process.env.SERVER_INSTANCE_ID || osHostId,
        environment: env.NODE_ENV,
        timestamp: new Date().toISOString(),
      }),
    );
  }

  public async getPresence(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const query = request.query as { userId?: string };
    const targetUserId = query.userId || request.user!.id;
    const presence = await presenceService.getPresence(targetUserId);
    return reply.status(HttpStatus.OK).send(formatSuccessResponse(presence));
  }

  public async syncState(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const query = request.query as { workoutSessionId?: string };
    const presence = await presenceService.getPresence(userId);
    let liveWorkout = null;

    if (query.workoutSessionId) {
      liveWorkout = await liveWorkoutService.getLiveState(query.workoutSessionId);
    }

    return reply.status(HttpStatus.OK).send(
      formatSuccessResponse({
        userId,
        presence,
        liveWorkout,
        syncedAt: new Date().toISOString(),
      }),
    );
  }
}

export const realtimeController = new RealtimeController();
