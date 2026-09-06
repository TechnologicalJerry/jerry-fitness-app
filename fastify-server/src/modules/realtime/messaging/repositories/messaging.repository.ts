import { Conversation, Message } from '@prisma/client';
import { prismaService } from '../../../../database/prisma.service';
import { CreateConversationDto, SendMessageDto, QueryMessagesParams } from '../../types/realtime.types';

export class MessagingRepository {
  public async createConversation(userId: string, dto: CreateConversationDto): Promise<Conversation> {
    const participantIds = Array.from(new Set([userId, ...dto.participantIds]));

    return prismaService.conversation.create({
      data: {
        title: dto.title,
        isGroup: dto.isGroup ?? false,
        participants: {
          create: participantIds.map((pid) => ({
            userId: pid,
            role: pid === userId ? 'ADMIN' : 'MEMBER',
          })),
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
        },
      },
    });
  }

  public async getUserConversations(userId: string): Promise<Array<Conversation & { unreadCount: number }>> {
    const participants = await prismaService.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: {
                  select: { id: true, email: true, firstName: true, lastName: true, role: true },
                },
              },
            },
            messages: {
              take: 1,
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
      orderBy: { conversation: { updatedAt: 'desc' } },
    });

    const conversationsWithUnread = await Promise.all(
      participants.map(async (p) => {
        const unreadCount = await prismaService.message.count({
          where: {
            conversationId: p.conversationId,
            senderId: { not: userId },
            createdAt: { gt: p.lastReadAt },
          },
        });

        return {
          ...p.conversation,
          unreadCount,
        };
      }),
    );

    return conversationsWithUnread;
  }

  public async findConversationById(conversationId: string, userId: string): Promise<Conversation | null> {
    return prismaService.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, email: true, firstName: true, lastName: true, role: true },
            },
          },
        },
      },
    });
  }

  public async createMessage(
    conversationId: string,
    senderId: string,
    dto: SendMessageDto,
  ): Promise<Message> {
    return prismaService.message.create({
      data: {
        conversationId,
        senderId,
        recipientId: dto.recipientId,
        content: dto.content,
        messageType: dto.messageType ?? 'TEXT',
      },
    });
  }

  public async getMessages(
    conversationId: string,
    params: QueryMessagesParams,
  ): Promise<{ messages: Message[]; nextCursor?: string }> {
    const limit = params.limit && params.limit > 0 ? params.limit : 20;

    const messages = await prismaService.message.findMany({
      where: {
        conversationId,
        deletedAt: null,
      },
      take: limit + 1, // fetch one extra to determine nextCursor
      cursor: params.cursor ? { id: params.cursor } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    let nextCursor: string | undefined = undefined;
    if (messages.length > limit) {
      const nextItem = messages.pop();
      nextCursor = nextItem?.id;
    }

    return { messages, nextCursor };
  }

  public async markAsRead(conversationId: string, userId: string): Promise<number> {
    const now = new Date();

    await prismaService.conversationParticipant.updateMany({
      where: { conversationId, userId },
      data: { lastReadAt: now },
    });

    const unreadMessages = await prismaService.message.findMany({
      where: {
        conversationId,
        recipientId: userId,
        readAt: null,
      },
      select: { id: true },
    });

    if (unreadMessages.length > 0) {
      await prismaService.message.updateMany({
        where: {
          id: { in: unreadMessages.map((m) => m.id) },
        },
        data: { readAt: now },
      });
    }

    return unreadMessages.length;
  }
}

export const messagingRepository = new MessagingRepository();
