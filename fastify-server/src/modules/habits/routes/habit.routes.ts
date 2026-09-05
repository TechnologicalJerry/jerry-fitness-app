import { FastifyInstance } from 'fastify';
import { habitController } from '../controllers/habit.controller';
import { createHabitSchema, logHabitCompletionSchema } from '../schemas/habit.schema';

export async function habitRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get(
    '/',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Get list of active habits for user',
        tags: ['Habits'],
      },
    },
    habitController.getHabits.bind(habitController),
  );

  fastify.get(
    '/summary',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Get habit completion summary and streaks',
        tags: ['Habits'],
      },
    },
    habitController.getSummary.bind(habitController),
  );

  fastify.get(
    '/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Get habit by ID',
        tags: ['Habits'],
      },
    },
    habitController.getHabitById.bind(habitController),
  );

  fastify.post(
    '/',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Create a new habit',
        tags: ['Habits'],
        ...createHabitSchema,
      },
    },
    habitController.createHabit.bind(habitController),
  );

  fastify.post(
    '/:id/complete',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Log habit completion or skip for date',
        tags: ['Habits'],
        ...logHabitCompletionSchema,
      },
    },
    habitController.logCompletion.bind(habitController),
  );
}
