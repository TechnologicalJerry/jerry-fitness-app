import Fastify, { FastifyInstance } from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import { requestIdMiddleware } from './common/middleware/request-id';
import corsPlugin from './plugins/cors';
import helmetPlugin from './plugins/helmet';
import rateLimitPlugin from './plugins/rate-limit';
import sensiblePlugin from './plugins/sensible';
import swaggerPlugin from './plugins/swagger';
import prismaPlugin from './plugins/prisma';
import redisPlugin from './plugins/redis';
import authPlugin from './plugins/auth';
import errorHandlerPlugin from './plugins/error-handler';
import { appRoutes } from './routes';
import { logger } from './observability/logger';

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: logger as any,
    disableRequestLogging: false,
    requestIdHeader: 'x-request-id',
  });

  // Request ID middleware hook
  app.addHook('onRequest', requestIdMiddleware);

  // WebSocket Plugin
  app.register(fastifyWebsocket);

  // Core Security & Framework Plugins
  app.register(corsPlugin);
  app.register(helmetPlugin);
  app.register(rateLimitPlugin);
  app.register(sensiblePlugin);
  app.register(swaggerPlugin);

  // Infrastructure Lifecycle Plugins
  app.register(prismaPlugin);
  app.register(redisPlugin);
  app.register(authPlugin);

  // Centralized Error Handler Plugin
  app.register(errorHandlerPlugin);

  // Route Registrations
  app.register(appRoutes);

  return app;
}
