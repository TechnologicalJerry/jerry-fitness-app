export type SearchEntityType =
  | 'GLOBAL'
  | 'EXERCISE'
  | 'WORKOUT'
  | 'FOOD'
  | 'RECIPE'
  | 'TRAINER'
  | 'CHALLENGE';

export type SearchSortOption =
  | 'relevance'
  | 'popularity'
  | 'newest'
  | 'oldest'
  | 'rating'
  | 'difficulty'
  | 'duration'
  | 'highest_protein'
  | 'lowest_calories'
  | 'participants';

export interface SearchQueryParams {
  query?: string;
  category?: string;
  sort?: SearchSortOption;
  limit?: number;
  cursor?: string;
}

export interface ExerciseSearchFilters {
  query?: string;
  muscle?: string;
  equipment?: string;
  difficulty?: string;
  category?: string;
  movementPattern?: string;
  exerciseType?: string;
  sort?: SearchSortOption;
  limit?: number;
  cursor?: string;
}

export interface FoodSearchFilters {
  query?: string;
  category?: string;
  minCalories?: number;
  maxCalories?: number;
  minProtein?: number;
  maxProtein?: number;
  minCarbs?: number;
  maxCarbs?: number;
  minFat?: number;
  maxFat?: number;
  dietaryTag?: string;
  limit?: number;
  cursor?: string;
}

export interface RecipeSearchFilters {
  query?: string;
  category?: string;
  minCalories?: number;
  maxCalories?: number;
  minProtein?: number;
  maxPrepTime?: number;
  dietaryPreference?: string;
  mealType?: string;
  sort?: SearchSortOption;
  limit?: number;
  cursor?: string;
}

export interface WorkoutDiscoverFilters {
  query?: string;
  goal?: string;
  difficulty?: string;
  maxDuration?: number;
  equipment?: string;
  muscleGroup?: string;
  workoutType?: string;
  trainerId?: string;
  section?: 'beginner' | 'popular' | 'recommended' | 'trending' | 'recent';
  limit?: number;
  cursor?: string;
}

export interface TrainerSearchFilters {
  query?: string;
  specialty?: string;
  minExperienceYears?: number;
  minRating?: number;
  language?: string;
  sort?: SearchSortOption;
  limit?: number;
  cursor?: string;
}

export interface ChallengeDiscoverFilters {
  query?: string;
  type?: string;
  difficulty?: string;
  status?: string;
  sort?: SearchSortOption;
  limit?: number;
  cursor?: string;
}

export interface SearchResultItem {
  id: string;
  entityType: SearchEntityType;
  title: string;
  description?: string;
  imageUrl?: string;
  score: number;
  metadata?: Record<string, any>;
}

export interface CategorizedSearchResults {
  query: string;
  normalizedQuery: string;
  results: {
    exercises: SearchResultItem[];
    workouts: SearchResultItem[];
    recipes: SearchResultItem[];
    foods: SearchResultItem[];
    trainers: SearchResultItem[];
    challenges: SearchResultItem[];
  };
  pagination: {
    total: number;
    nextCursor?: string;
  };
}

export interface AutocompleteSuggestion {
  text: string;
  entityType: SearchEntityType;
  id: string;
}

export interface CreateSavedSearchDto {
  name: string;
  query: string;
  filters?: Record<string, any>;
  entityType?: SearchEntityType;
}
