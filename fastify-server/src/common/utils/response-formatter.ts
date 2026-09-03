import { ApiSuccessResponse, ApiErrorResponse } from '../types/api-response';

export function formatSuccessResponse<T>(
  data: T,
  meta?: Record<string, unknown>,
): ApiSuccessResponse<T> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
  };

  if (meta && Object.keys(meta).length > 0) {
    response.meta = meta;
  }

  return response;
}

export function formatErrorResponse(
  code: string,
  message: string,
  requestId: string,
  details?: Record<string, unknown>,
): ApiErrorResponse {
  const response: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
    },
    requestId,
  };

  if (details && Object.keys(details).length > 0) {
    response.error.details = details;
  }

  return response;
}
