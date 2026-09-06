import { Prisma, OutboxStatus } from '@prisma/client';
import { prismaService } from '../../../database/prisma.service';
import { realtimeEventBus } from './event-bus.service';
import { RealtimeEvent } from '../types/realtime.types';
import { logger } from '../../../observability/logger';
import { randomUUID } from 'crypto';

export class OutboxService {
  public async createOutboxRecord(
    tx: Prisma.TransactionClient,
    event: Omit<RealtimeEvent, 'eventId' | 'timestamp'>,
  ): Promise<string> {
    const eventId = randomUUID();
    const now = new Date();

    await tx.outboxEvent.create({
      data: {
        eventId,
        eventType: event.eventType,
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        userId: event.userId,
        payload: event.payload as Prisma.InputJsonValue,
        status: OutboxStatus.PENDING,
        createdAt: now,
      },
    });

    return eventId;
  }

  public async processPendingOutboxEvents(batchSize = 50): Promise<number> {
    const pendingEvents = await prismaService.outboxEvent.findMany({
      where: { status: OutboxStatus.PENDING },
      orderBy: { createdAt: 'asc' },
      take: batchSize,
    });

    let processedCount = 0;

    for (const record of pendingEvents) {
      try {
        const fullEvent: RealtimeEvent = {
          eventId: record.eventId,
          eventType: record.eventType,
          aggregateType: record.aggregateType,
          aggregateId: record.aggregateId,
          userId: record.userId || 'system',
          timestamp: record.createdAt.toISOString(),
          version: 'v1',
          payload: record.payload,
        };

        const channel = record.userId ? `user:${record.userId}` : `${record.aggregateType}:${record.aggregateId}`;
        await realtimeEventBus.publish(channel, fullEvent);

        await prismaService.outboxEvent.update({
          where: { id: record.id },
          data: {
            status: OutboxStatus.PROCESSED,
            processedAt: new Date(),
          },
        });

        processedCount++;
      } catch (err) {
        logger.error({ err, outboxId: record.id }, 'Error processing outbox event');
        await prismaService.outboxEvent.update({
          where: { id: record.id },
          data: {
            retryCount: record.retryCount + 1,
            status: record.retryCount >= 5 ? OutboxStatus.FAILED : OutboxStatus.PENDING,
            error: String(err),
          },
        });
      }
    }

    return processedCount;
  }
}

export const outboxService = new OutboxService();
