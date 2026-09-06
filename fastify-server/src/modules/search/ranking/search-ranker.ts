import { SearchResultItem } from '../types/search.types';

export interface RankingUserContext {
  userId?: string;
  fitnessGoals?: string[];
  preferredEquipment?: string[];
  preferredWorkoutTypes?: string[];
  dislikedExercises?: string[];
  dietaryPreferences?: string[];
}

export class SearchRanker {
  /**
   * Ranks candidate search result items using multi-signal scoring.
   * Personalization affects ranking score, NEVER authorization.
   */
  public rank(
    items: SearchResultItem[],
    query?: string,
    userContext?: RankingUserContext,
  ): SearchResultItem[] {
    if (!items || items.length === 0) {
      return [];
    }

    const normalizedQuery = query ? query.toLowerCase().trim() : '';

    const scoredItems = items.map((item) => {
      const score = this.calculateScore(item, normalizedQuery, userContext);
      return {
        ...item,
        score,
      };
    });

    return scoredItems.sort((a, b) => b.score - a.score);
  }

  private calculateScore(
    item: SearchResultItem,
    query: string,
    userContext?: RankingUserContext,
  ): number {
    let score = item.score || 1.0;

    // 1. Textual relevance signal
    if (query) {
      const titleLower = item.title.toLowerCase();
      const descLower = (item.description || '').toLowerCase();

      if (titleLower === query) {
        score += 5.0; // Exact match boost
      } else if (titleLower.startsWith(query)) {
        score += 3.0; // Prefix match boost
      } else if (titleLower.includes(query)) {
        score += 1.5; // Title contains query
      } else if (descLower.includes(query)) {
        score += 0.5; // Description match
      }
    }

    // 2. Popularity & Rating signals
    const popularityScore = item.metadata?.popularityScore || 0;
    const rating = item.metadata?.rating || 0;
    const viewsCount = item.metadata?.viewsCount || 0;

    score += Math.min(popularityScore * 0.1, 2.0);
    if (rating > 0) {
      score += (rating / 5.0) * 1.0;
    }
    if (viewsCount > 0) {
      score += Math.min(Math.log10(viewsCount) * 0.2, 1.0);
    }

    // 3. Recency signal
    if (item.metadata?.createdAt) {
      const createdAt = new Date(item.metadata.createdAt).getTime();
      const now = Date.now();
      const ageInDays = (now - createdAt) / (1000 * 60 * 60 * 24);
      if (ageInDays >= 0 && ageInDays < 30) {
        score += (30 - ageInDays) / 30; // Boost up to +1.0 for brand new content
      }
    }

    // 4. Personalization signals
    if (userContext) {
      if (
        userContext.dislikedExercises &&
        userContext.dislikedExercises.some(
          (d) => d.toLowerCase() === item.title.toLowerCase(),
        )
      ) {
        score -= 3.0; // Demote disliked exercises
      }

      if (userContext.preferredEquipment && item.metadata?.equipment) {
        const itemEquipment = Array.isArray(item.metadata.equipment)
          ? item.metadata.equipment
          : [item.metadata.equipment];
        const match = itemEquipment.some((eq: string) =>
          userContext.preferredEquipment?.includes(eq),
        );
        if (match) {
          score += 1.0;
        }
      }

      if (userContext.preferredWorkoutTypes && item.metadata?.workoutType) {
        if (userContext.preferredWorkoutTypes.includes(item.metadata.workoutType)) {
          score += 1.0;
        }
      }

      if (userContext.dietaryPreferences && item.metadata?.dietaryPreferences) {
        const itemPrefs = Array.isArray(item.metadata.dietaryPreferences)
          ? item.metadata.dietaryPreferences
          : [item.metadata.dietaryPreferences];
        const match = itemPrefs.some((pref: string) =>
          userContext.dietaryPreferences?.includes(pref),
        );
        if (match) {
          score += 1.0;
        }
      }
    }

    return Math.max(0, Math.round(score * 100) / 100);
  }
}

export const searchRanker = new SearchRanker();
