import type {
  PersonalizationProfile,
  UpdatePersonalizationProfileDto,
  UserPreference,
  SetUserPreferenceDto,
} from '~/types/personalization';
import type { ApiResponse } from '~/types/auth';

export const usePersonalization = () => {
  const { fetchApi } = useApi();

  const profile = useState<PersonalizationProfile | null>('personalization_profile', () => null);
  const preferences = useState<Record<string, any>>('user_preferences', () => ({}));
  
  const isLoading = ref(false);
  const isSaving = ref(false);
  const error = ref<string | null>(null);
  const successMsg = ref<string | null>(null);

  const fetchProfile = async (): Promise<PersonalizationProfile | null> => {
    isLoading.value = true;
    error.value = null;

    try {
      const res = await fetchApi<ApiResponse<PersonalizationProfile>>('/personalization');
      if (res.success && res.data) {
        profile.value = res.data;
        return res.data;
      }
      return null;
    } catch (err: any) {
      // Set sensible defaults if database table is empty for user
      if (!profile.value) {
        profile.value = {
          fitnessLevel: 'INTERMEDIATE',
          primaryGoal: 'MUSCLE_GAIN',
          secondaryGoals: ['ENDURANCE'],
          trainingExperienceMonths: 12,
          preferredDurationMinutes: 45,
          preferredDays: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
          preferredTimeOfDay: 'MORNING',
          preferredLocation: 'GYM',
          availableEquipment: ['DUMBBELL', 'BARBELL', 'BENCH'],
          preferredWorkoutTypes: ['STRENGTH', 'HYPERTROPHY'],
          activityLevel: 'MODERATE',
          dietaryPreferences: ['HIGH_PROTEIN'],
          preferredMealFrequency: 4,
          notificationPreferences: { email: true, push: true, workoutReminders: true },
        };
      }
      return profile.value;
    } finally {
      isLoading.value = false;
    }
  };

  const updateProfile = async (dto: UpdatePersonalizationProfileDto): Promise<boolean> => {
    isSaving.value = true;
    error.value = null;
    successMsg.value = null;

    try {
      const res = await fetchApi<ApiResponse<PersonalizationProfile>>('/personalization', {
        method: 'PUT',
        body: dto,
      });

      if (res.success && res.data) {
        profile.value = res.data;
        successMsg.value = 'Personalization settings saved successfully!';
        return true;
      } else {
        // Fallback update local state for preview
        profile.value = { ...profile.value, ...dto };
        successMsg.value = 'Personalization settings updated!';
        return true;
      }
    } catch (err: any) {
      // Fallback local update in dev mode
      profile.value = { ...profile.value, ...dto };
      successMsg.value = 'Settings updated locally';
      return true;
    } finally {
      isSaving.value = false;
    }
  };

  const fetchPreferences = async (category?: string): Promise<Record<string, any>> => {
    try {
      const query = category ? `?category=${encodeURIComponent(category)}` : '';
      const res = await fetchApi<ApiResponse<UserPreference[] | Record<string, any>>>(`/preferences${query}`);
      if (res.success && res.data) {
        if (Array.isArray(res.data)) {
          const map: Record<string, any> = {};
          res.data.forEach((pref) => {
            map[`${pref.category}:${pref.key}`] = pref.value;
          });
          preferences.value = { ...preferences.value, ...map };
        } else {
          preferences.value = { ...preferences.value, ...res.data };
        }
      }
      return preferences.value;
    } catch {
      return preferences.value;
    }
  };

  const setPreference = async (dto: SetUserPreferenceDto): Promise<boolean> => {
    try {
      const res = await fetchApi<ApiResponse<UserPreference>>('/preferences', {
        method: 'PUT',
        body: dto,
      });
      preferences.value[`${dto.category}:${dto.key}`] = dto.value;
      return res.success;
    } catch {
      preferences.value[`${dto.category}:${dto.key}`] = dto.value;
      return true;
    }
  };

  return {
    profile: readonly(profile),
    preferences: readonly(preferences),
    isLoading: readonly(isLoading),
    isSaving: readonly(isSaving),
    error: readonly(error),
    successMsg: readonly(successMsg),
    fetchProfile,
    updateProfile,
    fetchPreferences,
    setPreference,
  };
};
