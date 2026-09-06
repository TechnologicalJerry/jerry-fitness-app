import { FastifyInstance } from 'fastify';
import { searchController } from '../controllers/search.controller';
import {
  globalSearchSchema,
  exerciseSearchSchema,
  foodSearchSchema,
  recipeSearchSchema,
  workoutDiscoverSchema,
  trainerSearchSchema,
  challengeDiscoverSchema,
  autocompleteSchema,
  createSavedSearchSchema,
  updateSavedSearchSchema,
} from '../schemas/search.schema';

export async function searchRoutes(fastify: FastifyInstance): Promise<void> {
  // --- Global Search & Autocomplete ---
  fastify.get(
    '/search',
    {
      preHandler: [fastify.optionalAuthenticate],
      schema: globalSearchSchema,
    },
    searchController.searchGlobal.bind(searchController),
  );

  fastify.get(
    '/search/suggestions',
    {
      schema: autocompleteSchema,
    },
    searchController.getSuggestions.bind(searchController),
  );

  // --- Recent Searches ---
  fastify.get(
    '/search/recent',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Get user recent search history',
        tags: ['Search'],
      },
    },
    searchController.getRecentSearches.bind(searchController),
  );

  fastify.delete(
    '/search/recent',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Clear user recent search history',
        tags: ['Search'],
      },
    },
    searchController.clearRecentSearches.bind(searchController),
  );

  // --- Saved Searches ---
  fastify.post(
    '/search/saved',
    {
      preHandler: [fastify.authenticate],
      schema: createSavedSearchSchema,
    },
    searchController.createSavedSearch.bind(searchController),
  );

  fastify.get(
    '/search/saved',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Get user saved searches',
        tags: ['Search'],
      },
    },
    searchController.getSavedSearches.bind(searchController),
  );

  fastify.patch(
    '/search/saved/:id',
    {
      preHandler: [fastify.authenticate],
      schema: updateSavedSearchSchema,
    },
    searchController.updateSavedSearch.bind(searchController),
  );

  fastify.delete(
    '/search/saved/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Delete a saved search by ID',
        tags: ['Search'],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
      },
    },
    searchController.deleteSavedSearch.bind(searchController),
  );

  // --- Domain Specific Search / Discovery Endpoints ---
  fastify.get(
    '/exercises/search',
    {
      preHandler: [fastify.optionalAuthenticate],
      schema: exerciseSearchSchema,
    },
    searchController.searchExercises.bind(searchController),
  );

  fastify.get(
    '/exercises/filters',
    {
      schema: {
        description: 'Get exercise search filter metadata (muscles, equipment, difficulties)',
        tags: ['Search', 'Exercises'],
      },
    },
    searchController.getExerciseFilters.bind(searchController),
  );

  fastify.get(
    '/foods/search',
    {
      preHandler: [fastify.optionalAuthenticate],
      schema: foodSearchSchema,
    },
    searchController.searchFoods.bind(searchController),
  );

  fastify.get(
    '/recipes/search',
    {
      preHandler: [fastify.optionalAuthenticate],
      schema: recipeSearchSchema,
    },
    searchController.searchRecipes.bind(searchController),
  );

  fastify.get(
    '/workouts/discover',
    {
      preHandler: [fastify.optionalAuthenticate],
      schema: workoutDiscoverSchema,
    },
    searchController.discoverWorkouts.bind(searchController),
  );

  fastify.get(
    '/trainers/search',
    {
      preHandler: [fastify.optionalAuthenticate],
      schema: trainerSearchSchema,
    },
    searchController.searchTrainers.bind(searchController),
  );

  fastify.get(
    '/challenges/discover',
    {
      preHandler: [fastify.optionalAuthenticate],
      schema: challengeDiscoverSchema,
    },
    searchController.discoverChallenges.bind(searchController),
  );

  // --- Admin Search Management ---
  fastify.get(
    '/admin/search/health',
    {
      preHandler: [fastify.authenticate, fastify.requireAdmin],
      schema: {
        description: 'Check search engine and provider health',
        tags: ['Admin', 'Search'],
      },
    },
    searchController.getHealth.bind(searchController),
  );

  fastify.post(
    '/admin/search/reindex',
    {
      preHandler: [fastify.authenticate, fastify.requireAdmin],
      schema: {
        description: 'Trigger asynchronous full search reindex via background queue',
        tags: ['Admin', 'Search'],
      },
    },
    searchController.triggerReindex.bind(searchController),
  );

  fastify.get(
    '/admin/search/analytics',
    {
      preHandler: [fastify.authenticate, fastify.requireAdmin],
      schema: {
        description: 'View search analytics and zero-result search queries',
        tags: ['Admin', 'Search'],
      },
    },
    searchController.getAnalytics.bind(searchController),
  );
}
