import { FastifyRequest, FastifyReply } from 'fastify';
import { searchService } from '../services/search.service';
import { searchIndexingService } from '../indexing/search-indexing.service';
import { searchRepository } from '../repositories/search.repository';
import { searchEngine } from '../engines/search.engine';
import {
  SearchQueryParams,
  ExerciseSearchFilters,
  FoodSearchFilters,
  RecipeSearchFilters,
  WorkoutDiscoverFilters,
  TrainerSearchFilters,
  ChallengeDiscoverFilters,
  SearchEntityType,
  CreateSavedSearchDto,
} from '../types/search.types';

export class SearchController {
  // --- Global Search ---
  public async searchGlobal(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const queryParams = (request.query as SearchQueryParams) || {};
    const { query = '', limit = 10 } = queryParams;
    const userId = request.user?.id;

    const results = await searchService.searchGlobal(query, limit, userId);

    reply.send({
      success: true,
      data: results,
    });
  }

  // --- Exercise Search & Filters ---
  public async searchExercises(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const filters = (request.query as ExerciseSearchFilters) || {};
    const userId = request.user?.id;
    const res = await searchService.searchExercises(filters, userId);

    reply.send({
      success: true,
      data: {
        items: res.items,
        query: filters.query || '',
      },
      meta: {
        nextCursor: res.nextCursor,
        hasMore: !!res.nextCursor,
        total: res.total,
      },
    });
  }

  public async getExerciseFilters(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const metadata = await searchService.getExerciseFilterMetadata();
    reply.send({
      success: true,
      data: metadata,
    });
  }

  // --- Food Search ---
  public async searchFoods(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const filters = (request.query as FoodSearchFilters) || {};
    const userId = request.user?.id;
    const res = await searchService.searchFoods(filters, userId);

    reply.send({
      success: true,
      data: {
        items: res.items,
        query: filters.query || '',
      },
      meta: {
        nextCursor: res.nextCursor,
        hasMore: !!res.nextCursor,
        total: res.total,
      },
    });
  }

  // --- Recipe Search ---
  public async searchRecipes(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const filters = (request.query as RecipeSearchFilters) || {};
    const userId = request.user?.id;
    const res = await searchService.searchRecipes(filters, userId);

    reply.send({
      success: true,
      data: {
        items: res.items,
        query: filters.query || '',
      },
      meta: {
        nextCursor: res.nextCursor,
        hasMore: !!res.nextCursor,
        total: res.total,
      },
    });
  }

  // --- Workout Discovery ---
  public async discoverWorkouts(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const filters = (request.query as WorkoutDiscoverFilters) || {};
    const userId = request.user?.id;
    const res = await searchService.discoverWorkouts(filters, userId);

    reply.send({
      success: true,
      data: {
        items: res.items,
        query: filters.query || '',
      },
      meta: {
        nextCursor: res.nextCursor,
        hasMore: !!res.nextCursor,
        total: res.total,
      },
    });
  }

  // --- Trainer Search ---
  public async searchTrainers(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const filters = (request.query as TrainerSearchFilters) || {};
    const userId = request.user?.id;
    const res = await searchService.searchTrainers(filters, userId);

    reply.send({
      success: true,
      data: {
        items: res.items,
        query: filters.query || '',
      },
      meta: {
        nextCursor: res.nextCursor,
        hasMore: !!res.nextCursor,
        total: res.total,
      },
    });
  }

  // --- Challenge Discovery ---
  public async discoverChallenges(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const filters = (request.query as ChallengeDiscoverFilters) || {};
    const userId = request.user?.id;
    const res = await searchService.discoverChallenges(filters, userId);

    reply.send({
      success: true,
      data: {
        items: res.items,
        query: filters.query || '',
      },
      meta: {
        nextCursor: res.nextCursor,
        hasMore: !!res.nextCursor,
        total: res.total,
      },
    });
  }

  // --- Autocomplete Suggestions ---
  public async getSuggestions(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { query = '', limit = 10, types } = (request.query as { query?: string; limit?: number; types?: string }) || {};
    const parsedTypes = types ? (types.split(',') as SearchEntityType[]) : undefined;

    const suggestions = await searchService.getSuggestions(query, parsedTypes, limit);

    reply.send({
      success: true,
      data: suggestions,
    });
  }

  // --- Recent Searches ---
  public async getRecentSearches(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const { limit = 10 } = (request.query as { limit?: number }) || {};
    const recent = await searchService.getUserRecentSearches(userId, limit);

    reply.send({
      success: true,
      data: recent,
    });
  }

  public async clearRecentSearches(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    await searchService.clearUserRecentSearches(userId);

    reply.send({
      success: true,
      message: 'Recent searches cleared successfully',
    });
  }

  // --- Saved Searches ---
  public async createSavedSearch(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const dto = request.body as CreateSavedSearchDto;
    const saved = await searchService.createSavedSearch(userId, dto);

    reply.status(201).send({
      success: true,
      data: saved,
    });
  }

  public async getSavedSearches(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const savedList = await searchService.getSavedSearches(userId);

    reply.send({
      success: true,
      data: savedList,
    });
  }

  public async updateSavedSearch(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const { id } = request.params as { id: string };
    const body = request.body as { name?: string; query?: string; filters?: Record<string, any>; entityType?: SearchEntityType };
    const updated = await searchService.updateSavedSearch(userId, id, body);

    reply.send({
      success: true,
      data: updated,
    });
  }

  public async deleteSavedSearch(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const { id } = request.params as { id: string };
    await searchService.deleteSavedSearch(userId, id);

    reply.send({
      success: true,
      message: 'Saved search deleted successfully',
    });
  }

  // --- Admin Endpoints ---
  public async getHealth(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const status = await searchEngine.health();
    reply.send({
      success: true,
      data: status,
    });
  }

  public async triggerReindex(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { entityType } = (request.body as { entityType?: SearchEntityType }) || {};
    const { jobId } = await searchIndexingService.triggerFullReindex(entityType);

    reply.status(202).send({
      success: true,
      message: 'Full reindex job enqueued successfully',
      data: { jobId, entityType: entityType || 'ALL' },
    });
  }

  public async getAnalytics(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const [zeroResult, popular] = await Promise.all([
      searchRepository.getZeroResultQueries(20),
      searchRepository.getPopularQueries(20),
    ]);

    reply.send({
      success: true,
      data: {
        zeroResultQueries: zeroResult,
        popularQueries: popular,
      },
    });
  }
}

export const searchController = new SearchController();
