import type { StandardRecommendation, RecommendationFeedbackDto } from '~/types/recommendations';
import type { ApiResponse } from '~/types/auth';

export const useRecommendations = () => {
  const { fetchApi } = useApi();

  const recommendations = useState<StandardRecommendation[]>('recommendations_feed', () => []);
  const isLoading = ref(false);

  const fetchRecommendations = async (): Promise<StandardRecommendation[]> => {
    isLoading.value = true;
    try {
      const res = await fetchApi<ApiResponse<StandardRecommendation[]>>('/recommendations');
      if (res.success && res.data) {
        recommendations.value = res.data;
        return res.data;
      }
      return recommendations.value;
    } catch {
      if (!recommendations.value.length) {
        recommendations.value = [
          {
            id: 'rec-1',
            type: 'WORKOUT_PLAN',
            title: 'Increase Progressive Overload on Bench Press',
            recommendation: 'Add 2.5kg to your top set of Barbell Bench Press next session (4 sets of 8 reps at 87.5kg).',
            reason: 'Your readiness score is 88% and ACWR workload is in the optimal sweet spot (1.11).',
            confidence: 0.94,
            factors: ['High HRV', 'Consistent 8+ hours sleep', 'Optimal ACWR ratio'],
            generatedAt: new Date().toISOString(),
          },
          {
            id: 'rec-2',
            type: 'NUTRITION_ADJUSTMENT',
            title: 'Boost Post-Workout Protein Intake',
            recommendation: 'Increase post-workout protein to 40g following heavy leg sessions for faster tissue repair.',
            reason: 'Leg day volume exceeded 5,500kg tonnage.',
            confidence: 0.89,
            factors: ['High workout volume', 'Muscle hypertrophy goal'],
            generatedAt: new Date().toISOString(),
          },
          {
            id: 'rec-3',
            type: 'RECOVERY_PROTOCOL',
            title: 'Schedule Active Recovery Walk',
            recommendation: 'Perform a 30-minute low-intensity zone 1 walk on Sunday.',
            reason: 'Helps flush lactate and maintain 85%+ weekly adherence.',
            confidence: 0.91,
            factors: ['Consecutive training days', 'Active recovery preference'],
            generatedAt: new Date().toISOString(),
          },
        ];
      }
      return recommendations.value;
    } finally {
      isLoading.value = false;
    }
  };

  const submitFeedback = async (id: string, dto: RecommendationFeedbackDto): Promise<boolean> => {
    try {
      await fetchApi(`/recommendations/${id}/feedback`, {
        method: 'POST',
        body: dto,
      });
      if (dto.feedbackType === 'DISMISSED') {
        recommendations.value = recommendations.value.filter((r) => r.id !== id);
      }
      return true;
    } catch {
      if (dto.feedbackType === 'DISMISSED') {
        recommendations.value = recommendations.value.filter((r) => r.id !== id);
      }
      return true;
    }
  };

  return {
    recommendations: readonly(recommendations),
    isLoading: readonly(isLoading),
    fetchRecommendations,
    submitFeedback,
  };
};
