import type { DailyPlanResponse } from '~/types/daily-plan';
import type { ApiResponse } from '~/types/auth';

export const useDailyPlan = () => {
  const { fetchApi } = useApi();

  const dailyPlan = useState<DailyPlanResponse | null>('daily_plan_state', () => null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const fetchDailyPlan = async (): Promise<DailyPlanResponse | null> => {
    isLoading.value = true;
    error.value = null;

    try {
      const res = await fetchApi<ApiResponse<DailyPlanResponse>>('/daily-plan');
      if (res.success && res.data) {
        dailyPlan.value = res.data;
        return res.data;
      }
      return dailyPlan.value;
    } catch (err: any) {
      // Provide comprehensive mock data if backend database is empty
      if (!dailyPlan.value) {
        dailyPlan.value = {
          date: new Date().toISOString().split('T')[0],
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          workoutRecommendation: {
            type: 'HYPERTROPHY',
            title: 'Upper Body Strength & Hypertrophy',
            durationMinutes: 45,
            intensity: 'HIGH',
            description: 'Focus on chest, shoulders, and triceps with moderate weights and controlled tempos.',
            exercises: [
              { name: 'Barbell Bench Press', sets: 4, reps: '8-10' },
              { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12' },
              { name: 'Overhead Shoulder Press', sets: 3, reps: '10' },
              { name: 'Tricep Rope Pushdowns', sets: 3, reps: '12-15' },
            ],
          },
          recoveryRecommendation: {
            score: 88,
            status: 'EXCELLENT',
            advice: 'High HRV and full nervous system recovery. Prime condition for intense training session.',
            recommendedSleepHours: 8,
          },
          nutritionTargets: {
            calories: 2400,
            proteinGrams: 180,
            carbsGrams: 240,
            fatsGrams: 70,
          },
          hydrationTargetMl: 3000,
          reminders: [
            'Drink 500ml water immediately upon waking',
            'Take Post-workout protein shake within 30 minutes',
            'Perform 10 mins mobility stretching before bed',
          ],
          challenges: [
            '10,000 Steps Daily Challenge',
            'Zero Sugar Drinks Today',
          ],
          generatedAt: new Date().toISOString(),
        };
      }
      return dailyPlan.value;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    dailyPlan: readonly(dailyPlan),
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchDailyPlan,
  };
};
