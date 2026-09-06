import { FastifyRequest, FastifyReply } from 'fastify';
import { messagingService } from '../services/messaging.service';
import { formatSuccessResponse } from '../../../../common/utils/response-formatter';
import { HttpStatus } from '../../../../common/constants/http-status';
import { CreateConversationDto, SendMessageDto, QueryMessagesParams } from '../../types/realtime.types';

export class MessagingController {
  public async createConversation(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const body = request.body as CreateConversationDto;
    const conversation = await messagingService.createConversation(userId, body);
    return reply.status(HttpStatus.CREATED).send(formatSuccessResponse(conversation));
  }

  public async getUserConversations(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const conversations = await messagingService.getUserConversations(userId);
    return reply.status(HttpStatus.OK).send(formatSuccessResponse(conversations));
  }

  public async getConversationById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const params = request.params as { conversationId: string };
    const conversation = await messagingService.getConversationById(params.conversationId, userId);
    return reply.status(HttpStatus.OK).send(formatSuccessResponse(conversation));
  }

  public async sendMessage(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const params = request.params as { conversationId: string };
    const body = request.body as SendMessageDto;
    const message = await messagingService.sendMessage(params.conversationId, userId, body);
    return reply.status(HttpStatus.CREATED).send(formatSuccessResponse(message));
  }

  public async getMessages(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const params = request.params as { conversationId: string };
    const query = request.query as QueryMessagesParams;
    const result = await messagingService.getMessages(params.conversationId, userId, query);
    return reply.status(HttpStatus.OK).send(formatSuccessResponse(result.messages, { nextCursor: result.nextCursor }));
  }

  public async markAsRead(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const params = request.params as { conversationId: string };
    const result = await messagingService.markAsRead(params.conversationId, userId);
    return reply.status(HttpStatus.OK).send(formatSuccessResponse(result));
  }
}

export const messagingController = new MessagingController();
