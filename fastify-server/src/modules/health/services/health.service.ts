import { prismaService } from '../../../database/prisma.service';
import { redisService } from '../../../cache/redis.service';
import { env } from '../../../config/env';

export interface HealthCheckResult {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  services?: {
    database: 'up' | 'down';
    redis: 'up' | 'down';
  };
}

export class HealthService {
  public getLiveness(): HealthCheckResult {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: env.NODE_ENV,
      version: env.APP_VERSION,
    };
  }

  public async getReadiness(): Promise<{ isReady: boolean; result: HealthCheckResult }> {
    const [dbOk, redisOk] = await Promise.all([
      prismaService.isHealthy(),
      redisService.isHealthy(),
    ]);

    const isReady = dbOk && redisOk;
    const status = isReady ? 'ok' : dbOk || redisOk ? 'degraded' : 'down';

    return {
      isReady,
      result: {
        status,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: env.NODE_ENV,
        version: env.APP_VERSION,
        services: {
          database: dbOk ? 'up' : 'down',
          redis: redisOk ? 'up' : 'down',
        },
      },
    };
  }

  public async getHealth(): Promise<HealthCheckResult> {
    const { result } = await this.getReadiness();
    return result;
  }
}

export const healthService = new HealthService();
