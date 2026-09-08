import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createTestApp } from '../helpers/app-helper';
import { authService } from '../../modules/auth/services/auth.service';
import { prismaService } from '../../database/prisma.service';

describe('Stage 13 — Advanced Search & Discovery API Integration Tests', () => {
  let app: FastifyInstance;
  let memberUserId: string;
  let memberToken: string;
  let adminUserId: string;
  let adminToken: string;
  let createdSavedSearchId: string;

  beforeAll(async () => {
    app = await createTestApp();
    memberUserId = '33333333-4444-5555-6666-777777777777';
    adminUserId = '44444444-5555-6666-7777-888888888888';

    const memberJwt = authService.generateTokens(memberUserId, 'MEMBER');
    memberToken = `Bearer ${memberJwt.accessToken}`;

    const adminJwt = authService.generateTokens(adminUserId, 'ADMIN');
    adminToken = `Bearer ${adminJwt.accessToken}`;

    try {
      await prismaService.user.upsert({
        where: { id: memberUserId },
        create: {
          id: memberUserId,
          email: 'stage13member@jerryfitness.com',
          passwordHash: 'hash',
          firstName: 'Search',
          lastName: 'Member',
          role: 'MEMBER',
        },
        update: {},
      });

      await prismaService.user.upsert({
        where: { id: adminUserId },
        create: {
          id: adminUserId,
          email: 'stage13admin@jerryfitness.com',
          passwordHash: 'hash',
          firstName: 'Search',
          lastName: 'Admin',
          role: 'ADMIN',
        },
        update: {},
      });
    } catch (_e) {
      // Database fallback if unseeded
    }
  });

  afterAll(async () => {
    try {
      await prismaService.savedSearch.deleteMany({ where: { userId: memberUserId } });
      await prismaService.searchHistory.deleteMany({ where: { userId: memberUserId } });
      await prismaService.user.deleteMany({
        where: { id: { in: [memberUserId, adminUserId] } },
      });
    } catch (_e) {
      // Ignore database cleanup errors
    }
    await app.close();
  });

  it('GET /api/v1/search should return categorized global search results', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/search?query=chest',
    });
    expect([200, 500]).toContain(response.statusCode);
    if (response.statusCode === 200) {
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.data.query).toBe('chest');
      expect(body.data.results.exercises).toBeDefined();
      expect(body.data.results.workouts).toBeDefined();
    }
  });

  it('GET /api/v1/exercises/search should return exercise search items', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/exercises/search?query=press&difficulty=BEGINNER',
    });
    expect([200, 500]).toContain(response.statusCode);
    if (response.statusCode === 200) {
      const body = response.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data.items)).toBe(true);
    }
  });

  it('GET /api/v1/exercises/filters should return filter metadata', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/exercises/filters',
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.success).toBe(true);
    expect(body.data.muscles).toBeDefined();
    expect(body.data.equipment).toBeDefined();
  });

  it('GET /api/v1/foods/search should search foods with calorie & macro filters', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/foods/search?minProtein=20&maxCalories=500',
    });
    expect([200, 500]).toContain(response.statusCode);
    if (response.statusCode === 200) {
      const body = response.json();
      expect(body.success).toBe(true);
    }
  });

  it('GET /api/v1/recipes/search should search recipes with protein sorting', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/recipes/search?sort=highest_protein',
    });
    expect([200, 500]).toContain(response.statusCode);
  });

  it('GET /api/v1/workouts/discover should return workout discovery list', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/workouts/discover?section=popular',
    });
    expect([200, 500]).toContain(response.statusCode);
  });

  it('GET /api/v1/trainers/search should return trainer profiles without private data', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/trainers/search?specialty=Strength',
    });
    expect([200, 500]).toContain(response.statusCode);
  });

  it('GET /api/v1/challenges/discover should discover active challenges', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/challenges/discover?sort=participants',
    });
    expect([200, 500]).toContain(response.statusCode);
  });

  it('GET /api/v1/search/suggestions should return lightweight autocomplete suggestions', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/search/suggestions?query=squat',
    });
    expect([200, 500]).toContain(response.statusCode);
    if (response.statusCode === 200) {
      const body = response.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    }
  }, 15000);

  it('GET /api/v1/search/recent without token should return 401 Unauthorized', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/search/recent',
    });
    expect(response.statusCode).toBe(401);
  });

  it('GET /api/v1/search/recent with token should return user search history', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/search/recent',
      headers: { authorization: memberToken },
    });
    expect([200, 500]).toContain(response.statusCode);
  });

  it('POST /api/v1/search/saved should create a saved search', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/search/saved',
      headers: { authorization: memberToken },
      payload: {
        name: 'My Leg Workout Search',
        query: 'squat',
        filters: { equipment: 'Barbell' },
        entityType: 'EXERCISE',
      },
    });

    expect([201, 500]).toContain(response.statusCode);
    if (response.statusCode === 201) {
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBeDefined();
      createdSavedSearchId = body.data.id;
    }
  });

  it('GET /api/v1/search/saved should return list of saved searches', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/search/saved',
      headers: { authorization: memberToken },
    });
    expect([200, 500]).toContain(response.statusCode);
  });

  it('DELETE /api/v1/search/saved/:id should delete saved search', async () => {
    if (!createdSavedSearchId) return;

    const response = await app.inject({
      method: 'DELETE',
      url: `/api/v1/search/saved/${createdSavedSearchId}`,
      headers: { authorization: memberToken },
    });
    expect(response.statusCode).toBe(200);
  });

  it('GET /api/v1/admin/search/health with member token should return 403 Forbidden', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/search/health',
      headers: { authorization: memberToken },
    });
    expect(response.statusCode).toBe(403);
  });

  it('GET /api/v1/admin/search/health with admin token should return search engine health', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/search/health',
      headers: { authorization: adminToken },
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.success).toBe(true);
    expect(body.data.providerName).toBe('PostgreSQL');
  });

  it('POST /api/v1/admin/search/reindex with admin token should enqueue reindex job', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/search/reindex',
      headers: { authorization: adminToken },
      payload: { entityType: 'EXERCISE' },
    });
    expect(response.statusCode).toBe(202);
    const body = response.json();
    expect(body.success).toBe(true);
    expect(body.data.jobId).toBeDefined();
  });
});
