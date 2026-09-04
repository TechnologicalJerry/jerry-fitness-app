import { FastifyInstance } from 'fastify';
import { healthController } from '../controllers/health.controller';
import { healthResponseSchema } from '../schemas/health.schema';

export async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get(
    '/health',
    {
      schema: {
        description: 'Get service health overview including database and redis connectivity',
        tags: ['Health'],
        response: {
          200: healthResponseSchema,
          503: healthResponseSchema,
        },
      },
    },
    healthController.getHealth.bind(healthController),
  );

  fastify.get(
    '/live',
    {
      schema: {
        description: 'Liveness probe for container orchestration',
        tags: ['Health'],
        response: {
          200: healthResponseSchema,
        },
      },
    },
    healthController.getLive.bind(healthController),
  );

  fastify.get(
    '/ready',
    {
      schema: {
        description: 'Readiness probe checking database and redis connections',
        tags: ['Health'],
        response: {
          200: healthResponseSchema,
          503: healthResponseSchema,
        },
      },
    },
    healthController.getReady.bind(healthController),
  );
}
