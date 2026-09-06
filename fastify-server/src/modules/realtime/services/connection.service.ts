import { redisService } from '../../../cache/redis.service';
import { RedisKeyBuilder } from '../../../common/utils/redis-keys';
import { ActiveConnectionMeta } from '../types/realtime.types';
import { logger } from '../../../observability/logger';
import { osHostId } from '../../../config/env';

export class ConnectionService {
  private serverInstanceId: string;

  constructor() {
    this.serverInstanceId = process.env.SERVER_INSTANCE_ID || osHostId;
  }

  public async registerConnection(
    connectionId: string,
    userId: string,
    deviceId = 'default',
  ): Promise<ActiveConnectionMeta> {
    const now = new Date().toISOString();
    const meta: ActiveConnectionMeta = {
      connectionId,
      userId,
      deviceId,
      connectedAt: now,
      lastHeartbeat: now,
      serverInstanceId: this.serverInstanceId,
    };

    try {
      const connKey = RedisKeyBuilder.connection(connectionId);
      const userConnsKey = RedisKeyBuilder.userConnections(userId);

      await redisService.client.set(connKey, JSON.stringify(meta), 'EX', 90); // 90s TTL
      await redisService.client.sadd(userConnsKey, connectionId);

      logger.info({ connectionId, userId, deviceId }, 'Registered active WebSocket connection in Redis');
    } catch (err) {
      logger.error({ err, connectionId, userId }, 'Failed to register connection in Redis');
    }

    return meta;
  }

  public async updateHeartbeat(connectionId: string, userId: string): Promise<void> {
    try {
      const connKey = RedisKeyBuilder.connection(connectionId);
      const data = await redisService.client.get(connKey);
      if (data) {
        const meta: ActiveConnectionMeta = JSON.parse(data);
        meta.lastHeartbeat = new Date().toISOString();
        await redisService.client.set(connKey, JSON.stringify(meta), 'EX', 90);
      }
    } catch (err) {
      logger.error({ err, connectionId, userId }, 'Failed to update heartbeat in Redis');
    }
  }

  public async removeConnection(connectionId: string, userId: string): Promise<void> {
    try {
      const connKey = RedisKeyBuilder.connection(connectionId);
      const userConnsKey = RedisKeyBuilder.userConnections(userId);

      await redisService.client.del(connKey);
      await redisService.client.srem(userConnsKey, connectionId);

      logger.info({ connectionId, userId }, 'Removed connection from Redis');
    } catch (err) {
      logger.error({ err, connectionId, userId }, 'Failed to remove connection from Redis');
    }
  }

  public async getUserConnections(userId: string): Promise<string[]> {
    try {
      const userConnsKey = RedisKeyBuilder.userConnections(userId);
      return await redisService.client.smembers(userConnsKey);
    } catch (_err) {
      return [];
    }
  }
}

export const connectionService = new ConnectionService();
