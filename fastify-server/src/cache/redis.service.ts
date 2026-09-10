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

  public async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  public async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  public async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  public buildTenantKey(organizationId: string, key: string): string {
    return `org:${organizationId}:${key}`;
  }

  public async getTenantCache<T>(organizationId: string, key: string): Promise<T | null> {
    const tenantKey = this.buildTenantKey(organizationId, key);
    const data = await this.client.get(tenantKey);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return data as any as T;
    }
  }

  public async setTenantCache<T>(
    organizationId: string,
    key: string,
    value: T,
    ttlSeconds = 3600,
  ): Promise<void> {
    const tenantKey = this.buildTenantKey(organizationId, key);
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    await this.client.set(tenantKey, serialized, 'EX', ttlSeconds);
  }

  public async deleteTenantCache(organizationId: string, key: string): Promise<void> {
    const tenantKey = this.buildTenantKey(organizationId, key);
    await this.client.del(tenantKey);
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

