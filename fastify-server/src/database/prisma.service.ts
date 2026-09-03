import { PrismaClient } from '@prisma/client';
import { logger } from '../observability/logger';

export class PrismaService extends PrismaClient {
  private static instance: PrismaService;

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
    });
  }

  public static getInstance(): PrismaService {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaService();
    }
    return PrismaService.instance;
  }

  public async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error({ err: error }, 'Database healthcheck query failed');
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.$disconnect();
      logger.info('Prisma disconnected successfully');
    } catch (error) {
      logger.error({ err: error }, 'Error disconnecting Prisma');
    }
  }
}

export const prismaService = PrismaService.getInstance();
