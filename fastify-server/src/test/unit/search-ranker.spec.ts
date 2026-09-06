import { describe, it, expect } from 'vitest';
import { searchRanker } from '../../modules/search/ranking/search-ranker';
import { searchService } from '../../modules/search/services/search.service';
import { SearchResultItem } from '../../modules/search/types/search.types';

describe('Search Normalization & Ranker Unit Tests', () => {
  it('should normalize search query strings consistently', () => {
    const raw = '   Bench   Press!  ';
    const normalized = searchService.normalizeQuery(raw);
    expect(normalized).toBe('bench press');
  });

  it('should boost exact title matches higher than substring matches', () => {
    const items: SearchResultItem[] = [
      {
        id: '1',
        entityType: 'EXERCISE',
        title: 'Incline Bench Press',
        score: 1.0,
      },
      {
        id: '2',
        entityType: 'EXERCISE',
        title: 'Bench Press',
        score: 1.0,
      },
    ];

    const ranked = searchRanker.rank(items, 'bench press');
    expect(ranked[0]?.id).toBe('2'); // Exact match comes first
    expect(ranked[0]?.score).toBeGreaterThan(ranked[1]?.score || 0);
  });

  it('should apply personalization boosts for preferred equipment and demote disliked exercises', () => {
    const items: SearchResultItem[] = [
      {
        id: '1',
        entityType: 'EXERCISE',
        title: 'Barbell Squat',
        score: 1.0,
        metadata: { equipment: 'Barbell' },
      },
      {
        id: '2',
        entityType: 'EXERCISE',
        title: 'Burpee',
        score: 1.0,
        metadata: { equipment: 'Bodyweight' },
      },
    ];

    const userContext = {
      preferredEquipment: ['Barbell'],
      dislikedExercises: ['Burpee'],
    };

    const ranked = searchRanker.rank(items, 'squat', userContext);
    expect(ranked[0]?.id).toBe('1');
    expect(ranked[1]?.id).toBe('2');
    expect(ranked[1]?.score).toBe(0); // Burpee demoted below 0 capped at 0
  });

  it('should consider popularity and rating signals', () => {
    const items: SearchResultItem[] = [
      {
        id: '1',
        entityType: 'RECIPE',
        title: 'High Protein Chicken',
        score: 1.0,
        metadata: { popularityScore: 10, rating: 4.8 },
      },
      {
        id: '2',
        entityType: 'RECIPE',
        title: 'Low Carb Soup',
        score: 1.0,
        metadata: { popularityScore: 1, rating: 3.0 },
      },
    ];

    const ranked = searchRanker.rank(items);
    expect(ranked[0]?.id).toBe('1');
  });
});
