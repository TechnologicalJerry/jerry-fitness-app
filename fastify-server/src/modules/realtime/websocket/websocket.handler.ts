import { FastifyInstance, FastifyRequest } from 'fastify';
import { WebSocket } from 'ws';
import { verifyJwtToken } from '../../../plugins/auth';
import { connectionService } from '../services/connection.service';
import { presenceService } from '../services/presence.service';
import { realtimeEventBus } from '../services/event-bus.service';
import { messagingRepository } from '../messaging/repositories/messaging.repository';
import { messagingService } from '../messaging/services/messaging.service';
import { liveWorkoutService } from '../services/live-workout.service';
import { logger } from '../../../observability/logger';
import { randomUUID } from 'crypto';
import { RealtimeEvent } from '../types/realtime.types';

export async function registerWebSocketHandler(fastify: FastifyInstance): Promise<void> {
  fastify.get('/realtime', { websocket: true }, async (connection, request: FastifyRequest) => {
    const socket: WebSocket = connection.socket;
    const connectionId = randomUUID();

    // 1. Authenticate WebSocket Connection
    const query = request.query as { token?: string; deviceId?: string };
    const authHeader = request.headers.authorization;
    let token = query.token;

    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }

    if (!token) {
      socket.close(4001, 'Unauthorized: Missing token');
      return;
    }

    let userId: string;
    let userRole: string;

    try {
      const decoded = verifyJwtToken(token);
      userId = decoded.sub;
      userRole = decoded.role;
    } catch (_err) {
      socket.close(4001, 'Unauthorized: Invalid or expired token');
      return;
    }

    const deviceId = query.deviceId || 'web';

    // 2. Connection Management & Presence Registration
    await connectionService.registerConnection(connectionId, userId, deviceId);
    await presenceService.setPresence(userId, 'ONLINE');

    const subscribedChannels = new Set<string>();
    // Auto-subscribe to user's personal channel
    const userChannel = `user:${userId}`;
    subscribedChannels.add(userChannel);

    const userEventHandler = (event: RealtimeEvent) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(event));
      }
    };

    await realtimeEventBus.subscribe(userChannel, userEventHandler);

    let isAlive = true;

    // Rate Limiting counter per socket
    let messageCount = 0;
    const rateResetInterval = setInterval(() => {
      messageCount = 0;
    }, 60000);

    // Heartbeat ping-pong
    const pingInterval = setInterval(() => {
      if (!isAlive) {
        logger.warn({ connectionId, userId }, 'WebSocket client heartbeat timed out. Terminating socket.');
        socket.terminate();
        return;
      }
      isAlive = false;
      if (socket.readyState === WebSocket.OPEN) {
        socket.ping();
      }
    }, 30000);

    socket.on('pong', async () => {
      isAlive = true;
      await connectionService.updateHeartbeat(connectionId, userId);
      await presenceService.setPresence(userId, 'ONLINE');
    });

    socket.on('message', async (rawMessage: Buffer) => {
      messageCount++;
      if (messageCount > 60) {
        socket.send(JSON.stringify({ error: 'Rate limit exceeded for real-time socket events.' }));
        return;
      }

      try {
        const data = JSON.parse(rawMessage.toString());
        const action = data.action || data.type;

        switch (action) {
          case 'subscribe': {
            const channel: string = data.channel;
            if (!channel) break;

            // Channel Authorization Checks
            let isAllowed = false;
            if (channel === `user:${userId}`) {
              isAllowed = true;
            } else if (channel.startsWith('conversation:')) {
              const convId = channel.replace('conversation:', '');
              const conv = await messagingRepository.findConversationById(convId, userId);
              if (conv) isAllowed = true;
            } else if (channel.startsWith('workout:')) {
              isAllowed = true; // Authorized workout participant
            } else if (channel.startsWith('trainer:') && (userRole === 'TRAINER' || userRole === 'ADMIN')) {
              isAllowed = true;
            } else if (channel.startsWith('org:')) {
              const parts = channel.split(':');
              const orgId = parts[1];
              if (orgId) {
                const { membershipRepository } = await import('../../organizations/repositories/membership.repository');
                const m = await membershipRepository.findByOrgAndUser(orgId, userId);
                if (m && m.status === 'ACTIVE') {
                  if (parts.length > 2 && parts[2] === 'team' && parts[3]) {
                    const teamId = parts[3];
                    const { teamRepository } = await import('../../organizations/repositories/team.repository');
                    const teamMembers = await teamRepository.findTeamMemberships(teamId);
                    if (teamMembers.some((tm) => tm.userId === userId)) {
                      isAllowed = true;
                    }
                  } else {
                    isAllowed = true;
                  }
                }
              }
            }

            if (isAllowed) {
              subscribedChannels.add(channel);
              await realtimeEventBus.subscribe(channel, userEventHandler);
              socket.send(JSON.stringify({ action: 'subscribed', channel }));
            } else {
              socket.send(JSON.stringify({ error: 'Unauthorized channel subscription', channel }));
            }
            break;
          }

          case 'unsubscribe': {
            const channel: string = data.channel;
            if (channel && subscribedChannels.has(channel)) {
              subscribedChannels.delete(channel);
              await realtimeEventBus.unsubscribe(channel, userEventHandler);
              socket.send(JSON.stringify({ action: 'unsubscribed', channel }));
            }
            break;
          }

          case 'typing_start': {
            if (data.conversationId) {
              await messagingService.setTypingIndicator(data.conversationId, userId, true);
            }
            break;
          }

          case 'typing_stop': {
            if (data.conversationId) {
              await messagingService.setTypingIndicator(data.conversationId, userId, false);
            }
            break;
          }

          case 'workout_pause': {
            if (data.workoutSessionId) {
              await liveWorkoutService.togglePause(userId, data.workoutSessionId, true);
            }
            break;
          }

          case 'workout_resume': {
            if (data.workoutSessionId) {
              await liveWorkoutService.togglePause(userId, data.workoutSessionId, false);
            }
            break;
          }

          default:
            socket.send(JSON.stringify({ error: `Unknown action: ${action}` }));
        }
      } catch (err) {
        logger.error({ err, connectionId, userId }, 'Error processing incoming WebSocket frame');
      }
    });

    socket.on('close', async () => {
      clearInterval(pingInterval);
      clearInterval(rateResetInterval);

      // Clean up subscriptions
      for (const ch of subscribedChannels) {
        await realtimeEventBus.unsubscribe(ch, userEventHandler);
      }

      await connectionService.removeConnection(connectionId, userId);
      // If no active connections left, update presence to OFFLINE
      const activeConns = await connectionService.getUserConnections(userId);
      if (activeConns.length === 0) {
        await presenceService.setPresence(userId, 'OFFLINE');
      }

      logger.info({ connectionId, userId }, 'WebSocket client connection closed cleanly');
    });
  });
}
