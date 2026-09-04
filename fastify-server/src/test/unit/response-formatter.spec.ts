import { describe, it, expect } from 'vitest';
import { formatSuccessResponse, formatErrorResponse } from '../../common/utils/response-formatter';

describe('Response Formatter', () => {
  it('should format success responses correctly', () => {
    const data = { id: '123', name: 'Test' };
    const meta = { total: 1 };
    const response = formatSuccessResponse(data, meta);

    expect(response).toEqual({
      success: true,
      data: { id: '123', name: 'Test' },
      meta: { total: 1 },
    });
  });

  it('should format error responses correctly', () => {
    const response = formatErrorResponse('TEST_ERROR', 'Something went wrong', 'req-123', {
      field: 'email',
    });

    expect(response).toEqual({
      success: false,
      error: {
        code: 'TEST_ERROR',
        message: 'Something went wrong',
        details: { field: 'email' },
      },
      requestId: 'req-123',
    });
  });
});
