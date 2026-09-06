import { FastifyInstance } from 'fastify';
import { recoveryController } from '../controllers/recovery.controller';
import { submitRecoverySchema, todayRecoverySchema } from '../schemas/recovery.schema';

export async function recoveryRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post(
    '/',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Submit daily recovery metrics (sleep, fatigue, soreness, energy, stress)',
        tags: ['Recovery'],
        ...submitRecoverySchema,
      },
    },
    recoveryController.submitRecovery.bind(recoveryController),
  );

  fastify.get(
    '/today',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Get today recovery score, status, and wellness recommendation',
        tags: ['Recovery'],
        ...todayRecoverySchema,
      },
    },
    recoveryController.getToday.bind(recoveryController),
  );

  fastify.get(
    '/history',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Get historical recovery records for current user',
        tags: ['Recovery'],
      },
    },
    recoveryController.getHistory.bind(recoveryController),
  );
}
