import { redisService } from '../../../cache/redis.service';
import { RedisKeyBuilder } from '../../../common/utils/redis-keys';
import { LiveWorkoutState, RestTimerPayload, RealtimeEvent } from '../types/realtime.types';
import { realtimeEventBus } from './event-bus.service';
import { logger } from '../../../observability/logger';
import { randomUUID } from 'crypto';

export class LiveWorkoutService {
  public async startWorkout(
    userId: string,
    workoutSessionId: string,
    initialExerciseId: string,
  ): Promise<LiveWorkoutState> {
    const now = new Date().toISOString();
    const state: LiveWorkoutState = {
      workoutSessionId,
      userId,
      currentExerciseId: initialExerciseId,
      currentSet: 1,
      isPaused: false,
      activeTimer: null,
      lastEventAt: now,
    };

    try {
      const key = RedisKeyBuilder.liveWorkout(workoutSessionId);
      await redisService.client.set(key, JSON.stringify(state), 'EX', 14400); // 4 hours TTL
    } catch (err) {
      logger.error({ err, workoutSessionId }, 'Failed to persist live workout state in Redis');
    }

    const event: RealtimeEvent = {
      eventId: randomUUID(),
      eventType: 'workout.started.v1',
      aggregateType: 'workout',
      aggregateId: workoutSessionId,
      userId,
      timestamp: now,
      version: 'v1',
      payload: state,
    };

    await realtimeEventBus.publish(`workout:${workoutSessionId}`, event);
    await realtimeEventBus.publish(`user:${userId}`, event);

    return state;
  }

  public async completeSet(
    userId: string,
    workoutSessionId: string,
    exerciseId: string,
    setNumber: number,
    restDurationSeconds = 90,
  ): Promise<RestTimerPayload> {
    const now = new Date();
    const startedAt = now.toISOString();
    const endsAt = new Date(now.getTime() + restDurationSeconds * 1000).toISOString();

    const restTimer: RestTimerPayload = {
      workoutSessionId,
      exerciseId,
      setNumber,
      durationSeconds: restDurationSeconds,
      startedAt,
      endsAt,
    };

    try {
      const key = RedisKeyBuilder.liveWorkout(workoutSessionId);
      const data = await redisService.client.get(key);
      if (data) {
        const state: LiveWorkoutState = JSON.parse(data);
        state.currentExerciseId = exerciseId;
        state.currentSet = setNumber + 1;
        state.activeTimer = restTimer;
        state.lastEventAt = startedAt;
        await redisService.client.set(key, JSON.stringify(state), 'EX', 14400);
      }
    } catch (err) {
      logger.error({ err, workoutSessionId }, 'Failed to update live workout state on set completion');
    }

    const event: RealtimeEvent = {
      eventId: randomUUID(),
      eventType: 'workout.set_completed.v1',
      aggregateType: 'workout',
      aggregateId: workoutSessionId,
      userId,
      timestamp: startedAt,
      version: 'v1',
      payload: {
        setNumber,
        exerciseId,
        restTimer,
      },
    };

    await realtimeEventBus.publish(`workout:${workoutSessionId}`, event);
    await realtimeEventBus.publish(`user:${userId}`, event);

    return restTimer;
  }

  public async togglePause(
    userId: string,
    workoutSessionId: string,
    isPaused: boolean,
  ): Promise<boolean> {
    const now = new Date().toISOString();
    try {
      const key = RedisKeyBuilder.liveWorkout(workoutSessionId);
      const data = await redisService.client.get(key);
      if (data) {
        const state: LiveWorkoutState = JSON.parse(data);
        state.isPaused = isPaused;
        state.lastEventAt = now;
        await redisService.client.set(key, JSON.stringify(state), 'EX', 14400);
      }
    } catch (err) {
      logger.error({ err, workoutSessionId }, 'Failed to update pause state in Redis');
    }

    const event: RealtimeEvent = {
      eventId: randomUUID(),
      eventType: isPaused ? 'workout.paused.v1' : 'workout.resumed.v1',
      aggregateType: 'workout',
      aggregateId: workoutSessionId,
      userId,
      timestamp: now,
      version: 'v1',
      payload: { workoutSessionId, isPaused },
    };

    await realtimeEventBus.publish(`workout:${workoutSessionId}`, event);
    await realtimeEventBus.publish(`user:${userId}`, event);

    return isPaused;
  }

  public async completeWorkout(userId: string, workoutSessionId: string): Promise<void> {
    const now = new Date().toISOString();
    try {
      const key = RedisKeyBuilder.liveWorkout(workoutSessionId);
      await redisService.client.del(key);
    } catch (err) {
      logger.error({ err, workoutSessionId }, 'Failed to clear live workout state from Redis');
    }

    const event: RealtimeEvent = {
      eventId: randomUUID(),
      eventType: 'workout.completed.v1',
      aggregateType: 'workout',
      aggregateId: workoutSessionId,
      userId,
      timestamp: now,
      version: 'v1',
      payload: { workoutSessionId, completedAt: now },
    };

    await realtimeEventBus.publish(`workout:${workoutSessionId}`, event);
    await realtimeEventBus.publish(`user:${userId}`, event);
  }

  public async getLiveState(workoutSessionId: string): Promise<LiveWorkoutState | null> {
    try {
      const key = RedisKeyBuilder.liveWorkout(workoutSessionId);
      const data = await redisService.client.get(key);
      if (data) return JSON.parse(data);
    } catch (_err) {
      // Return null on failure
    }
    return null;
  }
}

export const liveWorkoutService = new LiveWorkoutService();
