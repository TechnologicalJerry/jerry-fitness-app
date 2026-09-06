import { redisService } from '../../../cache/redis.service';
import { RedisKeyBuilder } from '../../../common/utils/redis-keys';
import { PresenceState, PresenceInfo } from '../types/realtime.types';
import { logger } from '../../../observability/logger';

export class PresenceService {
  public async setPresence(
    userId: string,
    state: PresenceState,
    currentWorkoutId?: string,
  ): Promise<PresenceInfo> {
    const info: PresenceInfo = {
      userId,
      state,
      lastActive: new Date().toISOString(),
      currentWorkoutId,
    };

    try {
      const key = RedisKeyBuilder.userPresence(userId);
      // Presence key expires after 90 seconds unless heartbeat renews it
      await redisService.client.set(key, JSON.stringify(info), 'EX', 90);
    } catch (err) {
      logger.error({ err, userId }, 'Failed to set user presence in Redis');
    }

    return info;
  }

  public async getPresence(userId: string): Promise<PresenceInfo> {
    try {
      const key = RedisKeyBuilder.userPresence(userId);
      const data = await redisService.client.get(key);
      if (data) {
        return JSON.parse(data);
      }
    } catch (err) {
      logger.error({ err, userId }, 'Failed to fetch presence from Redis');
    }

    return {
      userId,
      state: 'OFFLINE',
      lastActive: new Date().toISOString(),
    };
  }

  public async removePresence(userId: string): Promise<void> {
    try {
      const key = RedisKeyBuilder.userPresence(userId);
      await redisService.client.del(key);
    } catch (err) {
      logger.error({ err, userId }, 'Failed to remove presence from Redis');
    }
  }
}

export const presenceService = new PresenceService();
