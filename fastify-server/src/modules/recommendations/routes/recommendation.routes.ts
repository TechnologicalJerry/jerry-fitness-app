import { FastifyInstance } from 'fastify';
import { recommendationController } from '../controllers/recommendation.controller';
import { getWorkoutRecommendationSchema, submitFeedbackSchema } from '../schemas/recommendation.schema';

export async function recommendationRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get(
    '/recommendations/workout',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Get personalized workout recommendation for today',
        tags: ['Recommendations'],
        ...getWorkoutRecommendationSchema,
      },
    },
    recommendationController.getWorkoutRecommendation.bind(recommendationController),
  );

  fastify.post(
    '/recommendations/:id/feedback',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Provide feedback for a recommendation to tune future suggestions',
        tags: ['Recommendations'],
        ...submitFeedbackSchema,
      },
    },
    recommendationController.submitFeedback.bind(recommendationController),
  );

  fastify.get(
    '/exercises/:exerciseId/alternatives',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Get ranked alternative exercises matching movement pattern, equipment, and difficulty',
        tags: ['Exercises'],
      },
    },
    recommendationController.getExerciseAlternatives.bind(recommendationController),
  );
}
