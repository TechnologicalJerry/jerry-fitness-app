import { FastifyInstance } from 'fastify';
import { adherenceController } from '../controllers/adherence.controller';
import { adherenceSchema } from '../schemas/adherence.schema';

export async function adherenceRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get(
    '/',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Get user adherence metrics (workouts, nutrition, hydration, habits) for 7, 14, 30, or 90 days',
        tags: ['Adherence'],
        ...adherenceSchema,
      },
    },
    adherenceController.getAdherence.bind(adherenceController),
  );
}
