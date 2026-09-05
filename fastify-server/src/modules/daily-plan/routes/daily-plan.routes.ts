import { FastifyInstance } from 'fastify';
import { dailyPlanController } from '../controllers/daily-plan.controller';
import { getDailyPlanSchema } from '../schemas/daily-plan.schema';

export async function dailyPlanRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get(
    '/',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Get timezone-aware personalized daily fitness, nutrition, hydration, and habit plan',
        tags: ['Daily Plan'],
        ...getDailyPlanSchema,
      },
    },
    dailyPlanController.getDailyPlan.bind(dailyPlanController),
  );
}
