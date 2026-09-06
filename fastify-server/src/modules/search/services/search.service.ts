import { searchEngine } from '../engines/search.engine';
import { searchRepository } from '../repositories/search.repository';
import { redisService } from '../../../cache/redis.service';
import { logger } from '../../../observability/logger';
import { backgroundQueueService } from '../../../jobs/queue.service';
import {
  CategorizedSearchResults,
  ExerciseSearchFilters,
  FoodSearchFilters,
  RecipeSearchFilters,
  WorkoutDiscoverFilters,
  TrainerSearchFilters,
  ChallengeDiscoverFilters,
  SearchResultItem,
  AutocompleteSuggestion,
  SearchEntityType,
  CreateSavedSearchDto,
} from '../types/search.types';
import { SavedSearchNotFoundError, SavedSearchAccessDeniedError } from '../errors/search.errors';

export class SearchService {
  /**
   * Normalizes search query: lowercases, trims excess whitespace and punctuation.
   */
  public normalizeQuery(rawQuery?: string): string {
    if (!rawQuery) return '';
    return rawQuery
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, ' ');
  }

  // --- Centralized Cache Key Generators ---
  public getCacheKeys() {
    return {
      suggestions: (q: string) => `search:suggestions:${this.normalizeQuery(q)}`,
      trending: (entityType: string) => `search:trending:${entityType.toUpperCase()}`,
      popular: (entityType: string) => `search:popular:${entityType.toUpperCase()}`,
      filters: (entityType: string) => `search:filters:${entityType.toLowerCase()}`,
    };
  }

  // --- Global Search ---
  public async searchGlobal(
    query: string,
    limit = 10,
    userId?: string,
  ): Promise<CategorizedSearchResults> {
    const normalized = this.normalizeQuery(query);
    const results = await searchEngine.search(query, limit, userId);

    if (userId && query) {
      // Record search history asynchronously
      searchRepository
        .addSearchHistory({
          userId,
          query,
          normalizedQuery: normalized,
          entityType: 'GLOBAL',
        })
        .catch((err) => logger.error({ err }, 'Failed to record user search history'));
    }

    // Log analytics asynchronously
    const totalResults = results.pagination.total;
    this.logAnalyticsAsync({
      query,
      normalizedQuery: normalized,
      userId,
      entityType: 'GLOBAL',
      resultCount: totalResults,
      isZeroResult: totalResults === 0,
    });

    return results;
  }

  // --- Exercise Search ---
  public async searchExercises(
    filters: ExerciseSearchFilters,
    userId?: string,
  ): Promise<{ items: SearchResultItem[]; nextCursor?: string; total: number }> {
    const res = await searchEngine.searchExercises(filters, userId);

    if (filters.query) {
      const normalized = this.normalizeQuery(filters.query);
      if (userId) {
        searchRepository
          .addSearchHistory({
            userId,
            query: filters.query,
            normalizedQuery: normalized,
            entityType: 'EXERCISE',
          })
          .catch(() => {});
      }
      this.logAnalyticsAsync({
        query: filters.query,
        normalizedQuery: normalized,
        userId,
        entityType: 'EXERCISE',
        resultCount: res.total,
        isZeroResult: res.total === 0,
      });
    }

    return res;
  }

  // --- Food Search ---
  public async searchFoods(
    filters: FoodSearchFilters,
    userId?: string,
  ): Promise<{ items: SearchResultItem[]; nextCursor?: string; total: number }> {
    const res = await searchEngine.searchFoods(filters);

    if (filters.query) {
      const normalized = this.normalizeQuery(filters.query);
      this.logAnalyticsAsync({
        query: filters.query,
        normalizedQuery: normalized,
        userId,
        entityType: 'FOOD',
        resultCount: res.total,
        isZeroResult: res.total === 0,
      });
    }

    return res;
  }

  // --- Recipe Search ---
  public async searchRecipes(
    filters: RecipeSearchFilters,
    userId?: string,
  ): Promise<{ items: SearchResultItem[]; nextCursor?: string; total: number }> {
    const res = await searchEngine.searchRecipes(filters);

    if (filters.query) {
      const normalized = this.normalizeQuery(filters.query);
      this.logAnalyticsAsync({
        query: filters.query,
        normalizedQuery: normalized,
        userId,
        entityType: 'RECIPE',
        resultCount: res.total,
        isZeroResult: res.total === 0,
      });
    }

    return res;
  }

  // --- Workout Discovery ---
  public async discoverWorkouts(
    filters: WorkoutDiscoverFilters,
    userId?: string,
  ): Promise<{ items: SearchResultItem[]; nextCursor?: string; total: number }> {
    const res = await searchEngine.discoverWorkouts(filters, userId);

    if (filters.query) {
      const normalized = this.normalizeQuery(filters.query);
      this.logAnalyticsAsync({
        query: filters.query,
        normalizedQuery: normalized,
        userId,
        entityType: 'WORKOUT',
        resultCount: res.total,
        isZeroResult: res.total === 0,
      });
    }

    return res;
  }

  // --- Trainer Search ---
  public async searchTrainers(
    filters: TrainerSearchFilters,
    userId?: string,
  ): Promise<{ items: SearchResultItem[]; nextCursor?: string; total: number }> {
    const res = await searchEngine.searchTrainers(filters);

    if (filters.query) {
      const normalized = this.normalizeQuery(filters.query);
      this.logAnalyticsAsync({
        query: filters.query,
        normalizedQuery: normalized,
        userId,
        entityType: 'TRAINER',
        resultCount: res.total,
        isZeroResult: res.total === 0,
      });
    }

    return res;
  }

  // --- Challenge Discovery ---
  public async discoverChallenges(
    filters: ChallengeDiscoverFilters,
    userId?: string,
  ): Promise<{ items: SearchResultItem[]; nextCursor?: string; total: number }> {
    const res = await searchEngine.discoverChallenges(filters);

    if (filters.query) {
      const normalized = this.normalizeQuery(filters.query);
      this.logAnalyticsAsync({
        query: filters.query,
        normalizedQuery: normalized,
        userId,
        entityType: 'CHALLENGE',
        resultCount: res.total,
        isZeroResult: res.total === 0,
      });
    }

    return res;
  }

  // --- Autocomplete Suggestions ---
  public async getSuggestions(
    query: string,
    entityTypes?: SearchEntityType[],
    limit = 10,
  ): Promise<AutocompleteSuggestion[]> {
    const normalized = this.normalizeQuery(query);
    if (!normalized) return [];

    const cacheKey = this.getCacheKeys().suggestions(normalized);

    try {
      const cached = await redisService.client.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      logger.warn({ err }, 'Redis cache read error for suggestions');
    }

    const suggestions = await searchEngine.suggest(query, entityTypes, limit);

    try {
      await redisService.client.setex(cacheKey, 300, JSON.stringify(suggestions)); // 5 min TTL
    } catch (err) {
      logger.warn({ err }, 'Redis cache write error for suggestions');
    }

    return suggestions;
  }

  // --- Filter Metadata ---
  public async getExerciseFilterMetadata() {
    const cacheKey = this.getCacheKeys().filters('exercise');
    try {
      const cached = await redisService.client.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (_e) {
      logger.warn({ err: _e }, 'Redis cache read error for exercise filters');
    }

    const metadata = {
      muscles: [
        'Chest',
        'Back',
        'Shoulders',
        'Biceps',
        'Triceps',
        'Quadriceps',
        'Hamstrings',
        'Calves',
        'Abs',
        'Glutes',
      ],
      equipment: ['Barbell', 'Dumbbell', 'Kettlebell', 'Machine', 'Cable', 'Bodyweight', 'Band'],
      difficulties: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
      categories: ['Strength', 'Cardio', 'Flexibility', 'Olympic', 'Plyometrics'],
      movementPatterns: ['Push', 'Pull', 'Squat', 'Hinge', 'Lunge', 'Carry'],
    };

    try {
      await redisService.client.setex(cacheKey, 3600, JSON.stringify(metadata));
    } catch (_e) {
      logger.warn({ err: _e }, 'Redis cache write error for exercise filters');
    }

    return metadata;
  }

  // --- Trending & Popular Content ---
  public async getTrendingContent(entityType: string): Promise<any[]> {
    const cacheKey = this.getCacheKeys().trending(entityType);
    try {
      const cached = await redisService.client.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (_e) {
      logger.warn({ err: _e }, 'Redis cache read error for trending content');
    }

    // Fallback response if cache empty
    return [];
  }

  public async getPopularContent(entityType: string): Promise<any[]> {
    const cacheKey = this.getCacheKeys().popular(entityType);
    try {
      const cached = await redisService.client.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (_e) {
      logger.warn({ err: _e }, 'Redis cache read error for popular content');
    }

    return [];
  }

  // --- User Recent Searches ---
  public async getUserRecentSearches(userId: string, limit = 10) {
    return searchRepository.getUserRecentSearches(userId, limit);
  }

  public async clearUserRecentSearches(userId: string) {
    return searchRepository.deleteUserRecentSearches(userId);
  }

  // --- Saved Searches ---
  public async createSavedSearch(userId: string, dto: CreateSavedSearchDto) {
    return searchRepository.createSavedSearch(userId, dto);
  }

  public async getSavedSearches(userId: string) {
    return searchRepository.getSavedSearchesByUser(userId);
  }

  public async updateSavedSearch(
    userId: string,
    id: string,
    data: {
      name?: string;
      query?: string;
      filters?: Record<string, any>;
      entityType?: SearchEntityType;
    },
  ) {
    const existing = await searchRepository.getSavedSearchById(id);
    if (!existing) {
      throw new SavedSearchNotFoundError(id);
    }
    if (existing.userId !== userId) {
      throw new SavedSearchAccessDeniedError();
    }

    return searchRepository.updateSavedSearch(id, data);
  }

  public async deleteSavedSearch(userId: string, id: string) {
    const existing = await searchRepository.getSavedSearchById(id);
    if (!existing) {
      throw new SavedSearchNotFoundError(id);
    }
    if (existing.userId !== userId) {
      throw new SavedSearchAccessDeniedError();
    }

    await searchRepository.deleteSavedSearch(id);
  }

  // --- Asynchronous Analytics ---
  private logAnalyticsAsync(data: {
    query: string;
    normalizedQuery: string;
    userId?: string;
    entityType: string;
    resultCount: number;
    selectedEntityId?: string;
    isZeroResult: boolean;
  }): void {
    backgroundQueueService.enqueueJob('SEARCH_ANALYTICS_LOG', data);
  }
}

export const searchService = new SearchService();
