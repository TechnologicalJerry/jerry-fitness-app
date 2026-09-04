import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createTestApp } from '../helpers/app-helper';

describe('Centralized Error Handling', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/unknown-route should return 404 with standardized error envelope', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/unknown-route',
    });

    expect(response.statusCode).toBe(404);
    const body = response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBeDefined();
    expect(body.requestId).toBeDefined();
  });

  it('POST /api/v1/auth/login with invalid payload schema should return 422 with validation details', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { invalidField: true },
    });

    expect(response.statusCode).toBe(422);
    const body = response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details).toBeDefined();
  });
});
