import type {
  ExerciseSearchResult,
  GlobalSearchItem,
  GlobalSearchResponse,
} from '~/types/search';
import type { ApiResponse } from '~/types/auth';

export const useSearch = () => {
  const { fetchApi } = useApi();

  const searchResults = useState<GlobalSearchItem[]>('global_search_results', () => []);
  const exerciseResults = useState<ExerciseSearchResult[]>('exercise_search_results', () => []);
  const suggestions = useState<string[]>('search_suggestions', () => []);
  const isLoading = ref(false);

  const searchGlobal = async (q: string): Promise<GlobalSearchItem[]> => {
    if (!q.trim()) {
      searchResults.value = [];
      return [];
    }

    isLoading.value = true;
    try {
      const res = await fetchApi<ApiResponse<GlobalSearchResponse>>(`/search?q=${encodeURIComponent(q)}`);
      if (res.success && res.data?.items) {
        searchResults.value = res.data.items;
        return res.data.items;
      }
      return searchResults.value;
    } catch {
      // Mock global search results fallback
      searchResults.value = [
        { id: 'ex-1', type: 'EXERCISE', title: 'Barbell Bench Press', subtitle: 'Chest & Triceps &bull; Barbell', badge: 'Exercise' },
        { id: 'ex-2', type: 'EXERCISE', title: 'Incline Dumbbell Flyes', subtitle: 'Upper Chest &bull; Dumbbells', badge: 'Exercise' },
        { id: 'g-1', type: 'GOAL', title: 'Bench Press Target 100kg', subtitle: '37.5% Completed', badge: 'Goal' },
        { id: 'ex-3', type: 'EXERCISE', title: 'Barbell Back Squat', subtitle: 'Quadriceps & Glutes &bull; Barbell', badge: 'Exercise' },
      ].filter((item) => item.title.toLowerCase().includes(q.toLowerCase()));
      return searchResults.value;
    } finally {
      isLoading.value = false;
    }
  };

  const searchExercises = async (muscle = 'ALL', equipment = 'ALL', query = ''): Promise<ExerciseSearchResult[]> => {
    isLoading.value = true;

    try {
      const queryParts: string[] = [];
      if (muscle !== 'ALL') queryParts.push(`muscle=${encodeURIComponent(muscle)}`);
      if (equipment !== 'ALL') queryParts.push(`equipment=${encodeURIComponent(equipment)}`);
      if (query) queryParts.push(`q=${encodeURIComponent(query)}`);

      const queryString = queryParts.length ? `?${queryParts.join('&')}` : '';

      const res = await fetchApi<ApiResponse<ExerciseSearchResult[]>>(`/exercises/search${queryString}`);
      if (res.success && res.data) {
        exerciseResults.value = res.data;
        return res.data;
      }
      return exerciseResults.value;
    } catch {
      // Mock exercise library
      const library: ExerciseSearchResult[] = [
        {
          id: 'ex-1',
          name: 'Barbell Bench Press',
          category: 'Chest',
          targetMuscles: ['Pectoralis Major', 'Triceps Brachii', 'Anterior Deltoids'],
          equipment: 'BARBELL',
          difficulty: 'INTERMEDIATE',
          instructions: [
            'Lie flat on bench with feet planted firmly.',
            'Grasp bar slightly wider than shoulder width.',
            'Lower bar under control to mid-chest.',
            'Press bar explosively back to starting position.',
          ],
        },
        {
          id: 'ex-2',
          name: 'Incline Dumbbell Press',
          category: 'Chest',
          targetMuscles: ['Upper Chest (Clavicular Head)', 'Triceps'],
          equipment: 'DUMBBELL',
          difficulty: 'INTERMEDIATE',
          instructions: [
            'Set bench to 30-45 degree incline.',
            'Hold dumbbells at chest level.',
            'Press upward until arms are fully extended.',
          ],
        },
        {
          id: 'ex-3',
          name: 'Barbell Back Squat',
          category: 'Legs',
          targetMuscles: ['Quadriceps', 'Gluteus Maximus', 'Hamstrings'],
          equipment: 'BARBELL',
          difficulty: 'ADVANCED',
          instructions: [
            'Position barbell across upper trapezius muscles.',
            'Squat down until thighs are parallel to ground.',
            'Drive through mid-foot to stand erect.',
          ],
        },
        {
          id: 'ex-4',
          name: 'Lat Pulldown',
          category: 'Back',
          targetMuscles: ['Latissimus Dorsi', 'Biceps', 'Rhomboids'],
          equipment: 'CABLE',
          difficulty: 'BEGINNER',
          instructions: [
            'Grasp wide bar with overhand grip.',
            'Pull bar down smoothly to upper chest.',
            'Control release back upward.',
          ],
        },
        {
          id: 'ex-5',
          name: 'Dumbbell Lateral Raise',
          category: 'Shoulders',
          targetMuscles: ['Lateral Deltoids'],
          equipment: 'DUMBBELL',
          difficulty: 'BEGINNER',
          instructions: [
            'Stand upright holding dumbbells at sides.',
            'Raise arms laterally with slight bend at elbows.',
            'Pause at shoulder height and lower slowly.',
          ],
        },
        {
          id: 'ex-6',
          name: 'Romanian Deadlift',
          category: 'Legs',
          targetMuscles: ['Hamstrings', 'Glutes', 'Erector Spinae'],
          equipment: 'BARBELL',
          difficulty: 'INTERMEDIATE',
          instructions: [
            'Hinge at hips pushing glutes backward.',
            'Lower bar along shins until hamstring stretch is felt.',
            'Drive hips forward to return to start.',
          ],
        },
      ];

      exerciseResults.value = library.filter((ex) => {
        if (muscle !== 'ALL' && ex.category.toUpperCase() !== muscle.toUpperCase()) return false;
        if (equipment !== 'ALL' && ex.equipment !== equipment) return false;
        if (query && !ex.name.toLowerCase().includes(query.toLowerCase())) return false;
        return true;
      });

      return exerciseResults.value;
    } finally {
      isLoading.value = false;
    }
  };

  const getSuggestions = async (q: string): Promise<string[]> => {
    try {
      const res = await fetchApi<ApiResponse<string[]>>(`/search/suggestions?q=${encodeURIComponent(q)}`);
      if (res.success && res.data) {
        suggestions.value = res.data;
        return res.data;
      }
      return suggestions.value;
    } catch {
      suggestions.value = ['Barbell Bench Press', 'Squat', 'Deadlift', 'Protein Shake', 'Fat Loss Goal'];
      return suggestions.value;
    }
  };

  return {
    searchResults: readonly(searchResults),
    exerciseResults: readonly(exerciseResults),
    suggestions: readonly(suggestions),
    isLoading: readonly(isLoading),
    searchGlobal,
    searchExercises,
    getSuggestions,
  };
};
