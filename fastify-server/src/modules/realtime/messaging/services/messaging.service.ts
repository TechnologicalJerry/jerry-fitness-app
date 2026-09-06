import { Conversation, Message } from '@prisma/client';
import { messagingRepository, MessagingRepository } from '../repositories/messaging.repository';
import { CreateConversationDto, SendMessageDto, QueryMessagesParams, RealtimeEvent } from '../../types/realtime.types';
import { realtimeEventBus } from '../../services/event-bus.service';
import { redisService } from '../../../../cache/redis.service';
import { RedisKeyBuilder } from '../../../../common/utils/redis-keys';
import { NotFoundError } from '../../../../common/errors/common-errors';
import { randomUUID } from 'crypto';

export class MessagingService {
  constructor(private repo: MessagingRepository = messagingRepository) {}

  public async createConversation(userId: string, dto: CreateConversationDto): Promise<Conversation> {
    return this.repo.createConversation(userId, dto);
  }

  public async getUserConversations(userId: string): Promise<Array<Conversation & { unreadCount: number }>> {
    return this.repo.getUserConversations(userId);
  }

  public async getConversationById(conversationId: string, userId: string): Promise<Conversation> {
    const conversation = await this.repo.findConversationById(conversationId, userId);
    if (!conversation) {
      throw new NotFoundError(`Conversation '${conversationId}' was not found or access is unauthorized`);
    }
    return conversation;
  }

  public async sendMessage(
    conversationId: string,
    senderId: string,
    dto: SendMessageDto,
  ): Promise<Message> {
    await this.getConversationById(conversationId, senderId);

    const message = await this.repo.createMessage(conversationId, senderId, dto);
    const now = new Date().toISOString();

    const event: RealtimeEvent = {
      eventId: randomUUID(),
      eventType: 'message.created.v1',
      aggregateType: 'message',
      aggregateId: message.id,
      userId: senderId,
      timestamp: now,
      version: 'v1',
      payload: message,
    };

    // Publish to conversation channel and recipient channel if targeted
    await realtimeEventBus.publish(`conversation:${conversationId}`, event);
    if (dto.recipientId) {
      await realtimeEventBus.publish(`user:${dto.recipientId}`, event);
    }

    return message;
  }

  public async getMessages(
    conversationId: string,
    userId: string,
    params: QueryMessagesParams,
  ): Promise<{ messages: Message[]; nextCursor?: string }> {
    await this.getConversationById(conversationId, userId);
    return this.repo.getMessages(conversationId, params);
  }

  public async markAsRead(conversationId: string, userId: string): Promise<{ count: number }> {
    await this.getConversationById(conversationId, userId);
    const count = await this.repo.markAsRead(conversationId, userId);

    const now = new Date().toISOString();
    const event: RealtimeEvent = {
      eventId: randomUUID(),
      eventType: 'message.read.v1',
      aggregateType: 'message',
      aggregateId: conversationId,
      userId,
      timestamp: now,
      version: 'v1',
      payload: { conversationId, userId, readAt: now, count },
    };

    await realtimeEventBus.publish(`conversation:${conversationId}`, event);

    return { count };
  }

  public async setTypingIndicator(
    conversationId: string,
    userId: string,
    isTyping: boolean,
  ): Promise<void> {
    const key = RedisKeyBuilder.typingIndicator(conversationId, userId);
    const now = new Date().toISOString();

    try {
      if (isTyping) {
        await redisService.client.set(key, '1', 'EX', 5); // 5s TTL
      } else {
        await redisService.client.del(key);
      }
    } catch (_err) {
      // Ignore Redis error
    }

    const event: RealtimeEvent = {
      eventId: randomUUID(),
      eventType: isTyping ? 'typing.started.v1' : 'typing.stopped.v1',
      aggregateType: 'typing',
      aggregateId: conversationId,
      userId,
      timestamp: now,
      version: 'v1',
      payload: { conversationId, userId, isTyping },
    };

    await realtimeEventBus.publish(`conversation:${conversationId}`, event);
  }
}

export const messagingService = new MessagingService();
