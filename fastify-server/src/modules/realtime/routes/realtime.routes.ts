import { FastifyInstance } from 'fastify';
import { realtimeController } from '../controllers/realtime.controller';
import { messagingController } from '../messaging/controllers/messaging.controller';
import { createConversationSchema, sendMessageSchema, getMessagesSchema } from '../messaging/schemas/messaging.schema';

export async function realtimeRoutes(fastify: FastifyInstance): Promise<void> {
  // Realtime Status & Presence
  fastify.get(
    '/realtime/status',
    {
      schema: {
        description: 'Get real-time infrastructure status and server instance identity',
        tags: ['Realtime'],
      },
    },
    realtimeController.getStatus.bind(realtimeController),
  );

  fastify.get(
    '/presence',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Get user or trainer real-time presence status (ONLINE, AWAY, OFFLINE, IN_WORKOUT)',
        tags: ['Realtime'],
        querystring: {
          type: 'object',
          properties: {
            userId: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    realtimeController.getPresence.bind(realtimeController),
  );

  fastify.get(
    '/sync',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Recover state after client reconnection (presence and live workout state)',
        tags: ['Realtime'],
        querystring: {
          type: 'object',
          properties: {
            workoutSessionId: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    realtimeController.syncState.bind(realtimeController),
  );

  // Conversations & Messaging
  fastify.get(
    '/conversations',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'List user active conversations with unread counts',
        tags: ['Messaging'],
      },
    },
    messagingController.getUserConversations.bind(messagingController),
  );

  fastify.post(
    '/conversations',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Create a new direct or group conversation',
        tags: ['Messaging'],
        ...createConversationSchema,
      },
    },
    messagingController.createConversation.bind(messagingController),
  );

  fastify.get(
    '/conversations/:conversationId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Get conversation metadata by ID',
        tags: ['Messaging'],
      },
    },
    messagingController.getConversationById.bind(messagingController),
  );

  fastify.get(
    '/conversations/:conversationId/messages',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Get paginated messages for a conversation (cursor pagination)',
        tags: ['Messaging'],
        ...getMessagesSchema,
      },
    },
    messagingController.getMessages.bind(messagingController),
  );

  fastify.post(
    '/conversations/:conversationId/messages',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Send a message in a conversation',
        tags: ['Messaging'],
        ...sendMessageSchema,
      },
    },
    messagingController.sendMessage.bind(messagingController),
  );

  fastify.post(
    '/conversations/:conversationId/read',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Mark conversation messages as read',
        tags: ['Messaging'],
      },
    },
    messagingController.markAsRead.bind(messagingController),
  );
}
