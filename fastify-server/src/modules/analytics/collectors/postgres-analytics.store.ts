import { PrismaClient } from '@prisma/client';
import { prismaService } from '../../../database/prisma.service';
import { AnalyticsStore, EventQueryFilter } from './analytics-store.interface';
import {
  AnalyticsEventDto,
  IngestionResultDto,
  DateRangeQuery,
} from '../types/analytics.types';
import { analyticsEventValidator } from './analytics-event.validator';
import { logger } from '../../../observability/logger';

export class PostgresAnalyticsStore implements AnalyticsStore {
  public readonly storeName = 'PostgreSQL';
  private db: PrismaClient;

  constructor(customPrisma?: PrismaClient) {
    this.db = customPrisma || prismaService;
  }

  public async writeEvent(event: AnalyticsEventDto): Promise<void> {
    analyticsEventValidator.validateEvent(event);

    const eventDate = event.timestamp ? new Date(event.timestamp) : new Date();

    try {
      await this.db.analyticsEvent.create({
        data: {
          eventId: event.eventId,
          eventType: event.eventType,
          eventVersion: event.eventVersion || 'v1',
          userId: event.userId || null,
          anonymousId: event.anonymousId || null,
          sessionId: event.sessionId || null,
          timestamp: eventDate,
          source: event.source || 'client',
          platform: event.platform || 'web',
          appVersion: event.appVersion || null,
          metadata: event.metadata ? (event.metadata as any) : undefined,
        },
      });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        logger.info({ eventId: event.eventId }, 'Duplicate analytics event ignored (Idempotent)');
        return;
      }
      throw err;
    }
  }

  public async writeBatch(events: AnalyticsEventDto[]): Promise<IngestionResultDto> {
    analyticsEventValidator.validateBatch(events);

    let acceptedCount = 0;
    let duplicateCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const event of events) {
      try {
        const eventDate = event.timestamp ? new Date(event.timestamp) : new Date();
        await this.db.analyticsEvent.create({
          data: {
            eventId: event.eventId,
            eventType: event.eventType,
            eventVersion: event.eventVersion || 'v1',
            userId: event.userId || null,
            anonymousId: event.anonymousId || null,
            sessionId: event.sessionId || null,
            timestamp: eventDate,
            source: event.source || 'client',
            platform: event.platform || 'web',
            appVersion: event.appVersion || null,
            metadata: event.metadata ? (event.metadata as any) : undefined,
          },
        });
        acceptedCount++;
      } catch (err: any) {
        if (err?.code === 'P2002') {
          duplicateCount++;
        } else {
          failedCount++;
          errors.push(`Event ${event.eventId}: ${err.message}`);
        }
      }
    }

    return {
      acceptedCount,
      duplicateCount,
      failedCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  public async queryEvents(filter: EventQueryFilter): Promise<AnalyticsEventDto[]> {
    const where: any = {};
    if (filter.eventType) where.eventType = filter.eventType;
    if (filter.userId) where.userId = filter.userId;
    if (filter.sessionId) where.sessionId = filter.sessionId;
    if (filter.source) where.source = filter.source;

    if (filter.startDate || filter.endDate) {
      where.timestamp = {};
      if (filter.startDate) where.timestamp.gte = filter.startDate;
      if (filter.endDate) where.timestamp.lte = filter.endDate;
    }

    const rows = await this.db.analyticsEvent.findMany({
      where,
      take: filter.limit || 100,
      skip: filter.offset || 0,
      orderBy: { timestamp: 'desc' },
    });

    return rows.map((r) => ({
      eventId: r.eventId,
      eventType: r.eventType,
      eventVersion: r.eventVersion,
      userId: r.userId || undefined,
      anonymousId: r.anonymousId || undefined,
      sessionId: r.sessionId || undefined,
      timestamp: r.timestamp.toISOString(),
      source: r.source as any,
      platform: r.platform as any,
      appVersion: r.appVersion || undefined,
      metadata: (r.metadata as Record<string, any>) || undefined,
    }));
  }

  public async aggregate(metricName: string, filter: EventQueryFilter): Promise<number> {
    const where: any = {};
    if (metricName) where.eventType = metricName;
    if (filter.userId) where.userId = filter.userId;
    if (filter.startDate || filter.endDate) {
      where.timestamp = {};
      if (filter.startDate) where.timestamp.gte = filter.startDate;
      if (filter.endDate) where.timestamp.lte = filter.endDate;
    }

    return this.db.analyticsEvent.count({ where });
  }

  public async getTimeSeries(
    metricName: string,
    filter: EventQueryFilter,
    _period: DateRangeQuery,
  ): Promise<Array<{ date: string; value: number }>> {
    const events = await this.queryEvents({
      ...filter,
      eventType: metricName,
      limit: 1000,
    });

    const countsByDate: Record<string, number> = {};
    for (const event of events) {
      const dateStr = new Date(event.timestamp!).toISOString().substring(0, 10);
      countsByDate[dateStr] = (countsByDate[dateStr] || 0) + 1;
    }

    return Object.entries(countsByDate).map(([date, value]) => ({ date, value }));
  }
}

export const postgresAnalyticsStore = new PostgresAnalyticsStore();
