import { FastifyInstance } from 'fastify';
import { trainingLoadController } from '../controllers/training-load.controller';
import { logTrainingSessionSchema, trainingLoadSummarySchema } from '../schemas/training-load.schema';

export async function trainingLoadRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post(
    '/',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Log workout training session workload parameters',
        tags: ['Training Load'],
        ...logTrainingSessionSchema,
      },
    },
    trainingLoadController.logSession.bind(trainingLoadController),
  );

  fastify.get(
    '/',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Get current acute/chronic workload summary and trend status',
        tags: ['Training Load'],
        ...trainingLoadSummarySchema,
      },
    },
    trainingLoadController.getSummary.bind(trainingLoadController),
  );

  fastify.get(
    '/history',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Get historical workload records',
        tags: ['Training Load'],
      },
    },
    trainingLoadController.getHistory.bind(trainingLoadController),
  );
}
