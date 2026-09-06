import { SearchProvider, SearchHealthStatus } from './search-provider.interface';
import { postgresSearchProvider } from './postgres-search.provider';
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
} from '../types/search.types';

export class SearchEngine {
  private provider: SearchProvider;

  constructor(provider?: SearchProvider) {
    this.provider = provider || postgresSearchProvider;
  }

  public setProvider(provider: SearchProvider): void {
    this.provider = provider;
  }

  public getProviderName(): string {
    return this.provider.providerName;
  }

  public async health(): Promise<SearchHealthStatus> {
    return this.provider.health();
  }

  public async search(
    query: string,
    limit?: number,
    userId?: string,
  ): Promise<CategorizedSearchResults> {
    return this.provider.searchGlobal(query, limit, userId);
  }

  public async searchExercises(
    filters: ExerciseSearchFilters,
    userId?: string,
  ): Promise<{ items: SearchResultItem[]; nextCursor?: string; total: number }> {
    return this.provider.searchExercises(filters, userId);
  }

  public async searchFoods(
    filters: FoodSearchFilters,
  ): Promise<{ items: SearchResultItem[]; nextCursor?: string; total: number }> {
    return this.provider.searchFoods(filters);
  }

  public async searchRecipes(
    filters: RecipeSearchFilters,
  ): Promise<{ items: SearchResultItem[]; nextCursor?: string; total: number }> {
    return this.provider.searchRecipes(filters);
  }

  public async discoverWorkouts(
    filters: WorkoutDiscoverFilters,
    userId?: string,
  ): Promise<{ items: SearchResultItem[]; nextCursor?: string; total: number }> {
    return this.provider.discoverWorkouts(filters, userId);
  }

  public async searchTrainers(
    filters: TrainerSearchFilters,
  ): Promise<{ items: SearchResultItem[]; nextCursor?: string; total: number }> {
    return this.provider.searchTrainers(filters);
  }

  public async discoverChallenges(
    filters: ChallengeDiscoverFilters,
  ): Promise<{ items: SearchResultItem[]; nextCursor?: string; total: number }> {
    return this.provider.discoverChallenges(filters);
  }

  public async suggest(
    query: string,
    entityTypes?: SearchEntityType[],
    limit?: number,
  ): Promise<AutocompleteSuggestion[]> {
    return this.provider.suggest(query, entityTypes, limit);
  }

  public async index(entityType: SearchEntityType, entityId: string): Promise<void> {
    return this.provider.indexEntity(entityType, entityId);
  }

  public async update(entityType: SearchEntityType, entityId: string): Promise<void> {
    return this.provider.updateIndex(entityType, entityId);
  }

  public async remove(entityType: SearchEntityType, entityId: string): Promise<void> {
    return this.provider.removeFromIndex(entityType, entityId);
  }

  public async rebuild(entityType?: SearchEntityType): Promise<{ processed: number; errors: number }> {
    return this.provider.rebuildIndex(entityType);
  }
}

export const searchEngine = new SearchEngine();
