export interface ExerciseSearchResult {
  id: string;
  name: string;
  category: string;
  targetMuscles: string[];
  equipment: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  instructions?: string[];
  thumbnailUrl?: string;
  videoUrl?: string;
}

export interface GlobalSearchItem {
  id: string;
  type: 'EXERCISE' | 'GOAL' | 'WORKOUT' | 'RECIPE' | 'ARTICLE';
  title: string;
  subtitle?: string;
  url?: string;
  badge?: string;
}

export interface GlobalSearchResponse {
  query: string;
  totalResults: number;
  items: GlobalSearchItem[];
}

export interface SavedSearch {
  id: string;
  query: string;
  filters?: Record<string, any>;
  createdAt: string;
}
