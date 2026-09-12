import type { User, ApiResponse } from '~/types/auth';

export const useProfile = () => {
  const { user } = useAuth();
  const { fetchApi } = useApi();

  const isUpdating = ref(false);
  const profileError = ref<string | null>(null);
  const successMessage = ref<string | null>(null);

  const updateUserProfile = async (data: { firstName: string; lastName: string }): Promise<boolean> => {
    if (!user.value?.id) {
      profileError.value = 'User not authenticated';
      return false;
    }

    isUpdating.value = true;
    profileError.value = null;
    successMessage.value = null;

    try {
      const res = await fetchApi<ApiResponse<User>>(`/users/${user.value.id}`, {
        method: 'PATCH',
        body: data,
      });

      if (res.success && res.data) {
        // Update auth user state cookie
        const userState = useState<User | null>('auth_user');
        const userCookie = useCookie<User | null>('auth_user_data');
        
        const updatedUser = {
          ...userState.value,
          ...res.data,
        } as User;

        userState.value = updatedUser;
        userCookie.value = updatedUser;

        successMessage.value = 'Account details updated successfully!';
        return true;
      } else if (!res.success && res.error) {
        profileError.value = res.error.message || 'Failed to update profile';
        return false;
      }
      return false;
    } catch (err: any) {
      profileError.value = err?.data?.error?.message || err?.message || 'Failed to update user profile';
      return false;
    } finally {
      isUpdating.value = false;
    }
  };

  return {
    isUpdating: readonly(isUpdating),
    profileError: readonly(profileError),
    successMessage: readonly(successMessage),
    updateUserProfile,
  };
};
