import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from '../observability/logger';

export class RedisService {
  private static instance: RedisService;
  public readonly client: Redis;

  private constructor() {
    this.client = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 100, 3000);
        return delay;
      },
      lazyConnect: true,
    });

    this.client.on('error', (err) => {
      logger.error({ err }, 'Redis Connection Error');
    });

    this.client.on('connect', () => {
      logger.info('Redis connected successfully');
    });
  }

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  public async isHealthy(): Promise<boolean> {
    try {
      const res = await this.client.ping();
      return res === 'PONG';
    } catch (error) {
      logger.error({ err: error }, 'Redis healthcheck ping failed');
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.client.quit();
      logger.info('Redis client quit successfully');
    } catch (error) {
      logger.error({ err: error }, 'Error closing Redis client');
    }
  }
}

export const redisService = RedisService.getInstance();
