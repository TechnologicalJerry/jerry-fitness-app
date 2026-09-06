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

export interface SearchHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  providerName: string;
  details?: Record<string, any>;
}

export interface SearchProvider {
  readonly providerName: string;

  health(): Promise<SearchHealthStatus>;

  searchGlobal(
    query: string,
    limit?: number,
    userId?: string,
  ): Promise<CategorizedSearchResults>;

  searchExercises(
    filters: ExerciseSearchFilters,
    userId?: string,
  ): Promise<{ items: SearchResultItem[]; nextCursor?: string; total: number }>;

  searchFoods(
    filters: FoodSearchFilters,
  ): Promise<{ items: SearchResultItem[]; nextCursor?: string; total: number }>;

  searchRecipes(
    filters: RecipeSearchFilters,
  ): Promise<{ items: SearchResultItem[]; nextCursor?: string; total: number }>;

  discoverWorkouts(
    filters: WorkoutDiscoverFilters,
    userId?: string,
  ): Promise<{ items: SearchResultItem[]; nextCursor?: string; total: number }>;

  searchTrainers(
    filters: TrainerSearchFilters,
  ): Promise<{ items: SearchResultItem[]; nextCursor?: string; total: number }>;

  discoverChallenges(
    filters: ChallengeDiscoverFilters,
  ): Promise<{ items: SearchResultItem[]; nextCursor?: string; total: number }>;

  suggest(
    query: string,
    entityTypes?: SearchEntityType[],
    limit?: number,
  ): Promise<AutocompleteSuggestion[]>;

  indexEntity(entityType: SearchEntityType, entityId: string): Promise<void>;
  updateIndex(entityType: SearchEntityType, entityId: string): Promise<void>;
  removeFromIndex(entityType: SearchEntityType, entityId: string): Promise<void>;
  rebuildIndex(entityType?: SearchEntityType): Promise<{ processed: number; errors: number }>;
}
