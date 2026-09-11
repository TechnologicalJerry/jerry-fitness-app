import type {
  User,
  AuthTokens,
  AuthResponseData,
  RefreshResponseData,
  ApiResponse,
  LoginPayload,
  RegisterPayload,
} from '~/types/auth';

export const useAuth = () => {
  const userState = useState<User | null>('auth_user', () => null);
  const isLoadingState = useState<boolean>('auth_loading', () => false);
  const errorState = useState<string | null>('auth_error', () => null);

  const accessTokenCookie = useCookie<string | null>('auth_access_token', {
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax',
    path: '/',
  });
  const refreshTokenCookie = useCookie<string | null>('auth_refresh_token', {
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax',
    path: '/',
  });
  const userCookie = useCookie<User | null>('auth_user_data', {
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
    path: '/',
  });

  // Sync state with cookie on hydration/mount
  if (import.meta.client && !userState.value && userCookie.value) {
    userState.value = userCookie.value;
  }

  const isAuthenticated = computed(() => {
    return !!userState.value && !!accessTokenCookie.value;
  });

  const setAuthSession = (user: User, tokens: AuthTokens) => {
    userState.value = user;
    userCookie.value = user;
    accessTokenCookie.value = tokens.accessToken;
    refreshTokenCookie.value = tokens.refreshToken;
    errorState.value = null;
  };

  const clearAuthSession = () => {
    userState.value = null;
    userCookie.value = null;
    accessTokenCookie.value = null;
    refreshTokenCookie.value = null;
    errorState.value = null;
  };

  const login = async (payload: LoginPayload): Promise<boolean> => {
    isLoadingState.value = true;
    errorState.value = null;

    try {
      const { fetchApi } = useApi();
      const res = await fetchApi<ApiResponse<AuthResponseData>>('/auth/login', {
        method: 'POST',
        body: payload,
      }, false);

      if (res.success && res.data) {
        setAuthSession(res.data.user, res.data.tokens);
        return true;
      } else if (!res.success && res.error) {
        errorState.value = res.error.message || 'Login failed';
        return false;
      }
      errorState.value = 'An unexpected error occurred';
      return false;
    } catch (err: any) {
      const msg = err?.data?.error?.message || err?.message || 'Login request failed. Please check backend status.';
      errorState.value = msg;
      return false;
    } finally {
      isLoadingState.value = false;
    }
  };

  const register = async (payload: RegisterPayload): Promise<boolean> => {
    isLoadingState.value = true;
    errorState.value = null;

    try {
      const { fetchApi } = useApi();
      const res = await fetchApi<ApiResponse<AuthResponseData>>('/auth/register', {
        method: 'POST',
        body: payload,
      }, false);

      if (res.success && res.data) {
        setAuthSession(res.data.user, res.data.tokens);
        return true;
      } else if (!res.success && res.error) {
        errorState.value = res.error.message || 'Registration failed';
        return false;
      }
      errorState.value = 'An unexpected error occurred';
      return false;
    } catch (err: any) {
      const msg = err?.data?.error?.message || err?.message || 'Registration failed. User may already exist.';
      errorState.value = msg;
      return false;
    } finally {
      isLoadingState.value = false;
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    if (!refreshTokenCookie.value) {
      clearAuthSession();
      return false;
    }

    try {
      const { fetchApi } = useApi();
      const res = await fetchApi<ApiResponse<RefreshResponseData>>('/auth/refresh-token', {
        method: 'POST',
        body: { refreshToken: refreshTokenCookie.value },
      }, false);

      if (res.success && res.data?.tokens) {
        accessTokenCookie.value = res.data.tokens.accessToken;
        refreshTokenCookie.value = res.data.tokens.refreshToken;
        return true;
      }
      clearAuthSession();
      return false;
    } catch {
      clearAuthSession();
      return false;
    }
  };

  const logout = async () => {
    clearAuthSession();
    if (import.meta.client) {
      await navigateTo('/login');
    }
  };

  return {
    user: readonly(userState),
    accessToken: readonly(accessTokenCookie),
    refreshTokenValue: readonly(refreshTokenCookie),
    isAuthenticated,
    isLoading: readonly(isLoadingState),
    error: readonly(errorState),
    login,
    register,
    refreshToken,
    logout,
    clearAuthSession,
  };
};

