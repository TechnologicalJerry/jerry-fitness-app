import Redis from 'ioredis';
import { env } from '../../../config/env';
import { logger } from '../../../observability/logger';
import { RealtimeEvent } from '../types/realtime.types';

export type EventHandler = (event: RealtimeEvent) => void;

export interface RealtimeEventBus {
  publish(channel: string, event: RealtimeEvent): Promise<void>;
  subscribe(channel: string, handler: EventHandler): Promise<void>;
  unsubscribe(channel: string, handler?: EventHandler): Promise<void>;
  close(): Promise<void>;
}

export class RedisRealtimeEventBus implements RealtimeEventBus {
  private pubClient: Redis;
  private subClient: Redis;
  private handlersMap: Map<string, Set<EventHandler>> = new Map();

  constructor() {
    this.pubClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    this.subClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    this.subClient.on('message', (channel, message) => {
      try {
        const parsedEvent: RealtimeEvent = JSON.parse(message);
        const handlers = this.handlersMap.get(channel);
        if (handlers) {
          handlers.forEach((handler) => {
            try {
              handler(parsedEvent);
            } catch (err) {
              logger.error({ err, channel }, 'Error in event handler execution');
            }
          });
        }
      } catch (err) {
        logger.error({ err, channel }, 'Error parsing Pub/Sub event message');
      }
    });

    this.pubClient.on('error', (err) => logger.error({ err }, 'Redis PubClient error'));
    this.subClient.on('error', (err) => logger.error({ err }, 'Redis SubClient error'));
  }

  public async publish(channel: string, event: RealtimeEvent): Promise<void> {
    try {
      const payloadString = JSON.stringify(event);
      await this.pubClient.publish(channel, payloadString);
    } catch (err) {
      logger.error({ err, channel, eventId: event.eventId }, 'Failed to publish event to Redis Pub/Sub');
    }
  }

  public async subscribe(channel: string, handler: EventHandler): Promise<void> {
    let handlers = this.handlersMap.get(channel);
    if (!handlers) {
      handlers = new Set();
      this.handlersMap.set(channel, handlers);
      try {
        await this.subClient.subscribe(channel);
      } catch (err) {
        logger.error({ err, channel }, 'Failed to subscribe to Redis channel');
      }
    }
    handlers.add(handler);
  }

  public async unsubscribe(channel: string, handler?: EventHandler): Promise<void> {
    const handlers = this.handlersMap.get(channel);
    if (handlers) {
      if (handler) {
        handlers.delete(handler);
      } else {
        handlers.clear();
      }

      if (handlers.size === 0) {
        this.handlersMap.delete(channel);
        try {
          await this.subClient.unsubscribe(channel);
        } catch (err) {
          logger.error({ err, channel }, 'Failed to unsubscribe from Redis channel');
        }
      }
    }
  }

  public async close(): Promise<void> {
    try {
      await Promise.all([this.pubClient.quit(), this.subClient.quit()]);
      logger.info('RealtimeEventBus Redis clients disconnected cleanly');
    } catch (err) {
      logger.error({ err }, 'Error closing RealtimeEventBus Redis clients');
    }
  }
}

export const realtimeEventBus = new RedisRealtimeEventBus();
