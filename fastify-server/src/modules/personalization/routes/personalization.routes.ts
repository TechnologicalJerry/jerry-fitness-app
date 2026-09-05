import { FastifyInstance } from 'fastify';
import { personalizationController } from '../controllers/personalization.controller';
import {
  updatePersonalizationSchema,
  personalizationProfileResponseSchema,
  userPreferenceSchema,
} from '../schemas/personalization.schema';

export async function personalizationRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get(
    '/personalization',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Get current user personalization profile',
        tags: ['Personalization'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: personalizationProfileResponseSchema,
            },
          },
        },
      },
    },
    personalizationController.getProfile.bind(personalizationController),
  );

  fastify.put(
    '/personalization',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Update current user personalization profile',
        tags: ['Personalization'],
        ...updatePersonalizationSchema,
      },
    },
    personalizationController.updateProfile.bind(personalizationController),
  );

  fastify.get(
    '/preferences',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Get normalized user preferences by optional category',
        tags: ['Personalization'],
        querystring: {
          type: 'object',
          properties: {
            category: { type: 'string' },
          },
        },
      },
    },
    personalizationController.getPreferences.bind(personalizationController),
  );

  fastify.put(
    '/preferences',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Set a key-value user preference',
        tags: ['Personalization'],
        ...userPreferenceSchema,
      },
    },
    personalizationController.setPreference.bind(personalizationController),
  );
}
