import type { FetchOptions } from 'ofetch';
import type { ApiResponse } from '~/types/auth';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(true);
    }
  });
  failedQueue = [];
};

export const useApi = () => {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase || 'http://localhost:3000/api/v1';

  const accessTokenCookie = useCookie<string | null>('auth_access_token');
  const refreshTokenCookie = useCookie<string | null>('auth_refresh_token');

  const fetchApi = async <T = any>(
    endpoint: string,
    options: FetchOptions = {},
    retryOnUnauthorized = true
  ): Promise<T> => {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${apiBase.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (accessTokenCookie.value) {
      headers.Authorization = `Bearer ${accessTokenCookie.value}`;
    }

    try {
      return await $fetch<T>(url, {
        ...options,
        headers,
      });
    } catch (err: any) {
      const status = err?.response?.status || err?.status;

      // Handle 401 Unauthorized for token refresh
      if (status === 401 && retryOnUnauthorized && refreshTokenCookie.value) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(() => {
            return fetchApi<T>(endpoint, options, false);
          });
        }

        isRefreshing = true;

        try {
          const refreshUrl = `${apiBase.replace(/\/$/, '')}/auth/refresh-token`;
          const refreshResponse = await $fetch<ApiResponse<{ tokens: { accessToken: string; refreshToken: string; expiresIn: string } }>>(
            refreshUrl,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: { refreshToken: refreshTokenCookie.value },
            }
          );

          if (refreshResponse.success && refreshResponse.data?.tokens) {
            accessTokenCookie.value = refreshResponse.data.tokens.accessToken;
            refreshTokenCookie.value = refreshResponse.data.tokens.refreshToken;

            processQueue(null);
            isRefreshing = false;

            // Retry original request with new access token
            return await fetchApi<T>(endpoint, options, false);
          } else {
            throw new Error('Refresh token rejected');
          }
        } catch (refreshErr) {
          processQueue(refreshErr);
          isRefreshing = false;

          // Clear credentials and redirect to login
          const { logout } = useAuth();
          await logout();
          if (import.meta.client) {
            navigateTo('/login');
          }
          throw refreshErr;
        }
      }

      throw err;
    }
  };

  return {
    fetchApi,
  };
};
