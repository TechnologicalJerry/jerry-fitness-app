import { FastifyInstance } from 'fastify';
import { goalController } from '../controllers/goal.controller';
import { createGoalSchema, updateGoalStatusSchema } from '../schemas/goal.schema';

export async function goalRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get(
    '/',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Get list of fitness goals for user',
        tags: ['Goals'],
      },
    },
    goalController.getGoals.bind(goalController),
  );

  fastify.get(
    '/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Get fitness goal by ID',
        tags: ['Goals'],
      },
    },
    goalController.getGoalById.bind(goalController),
  );

  fastify.post(
    '/',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Create a new fitness goal',
        tags: ['Goals'],
        ...createGoalSchema,
      },
    },
    goalController.createGoal.bind(goalController),
  );

  fastify.patch(
    '/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Update fitness goal parameters',
        tags: ['Goals'],
      },
    },
    goalController.updateGoal.bind(goalController),
  );

  fastify.patch(
    '/:id/status',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Update fitness goal status (pause, resume, complete, cancel, archive)',
        tags: ['Goals'],
        ...updateGoalStatusSchema,
      },
    },
    goalController.updateGoalStatus.bind(goalController),
  );

  fastify.delete(
    '/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Archive a fitness goal',
        tags: ['Goals'],
      },
    },
    goalController.deleteGoal.bind(goalController),
  );
}
