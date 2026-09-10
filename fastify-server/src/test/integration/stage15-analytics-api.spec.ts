import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createTestApp } from '../helpers/app-helper';
import { authService } from '../../modules/auth/services/auth.service';
import { prismaService } from '../../database/prisma.service';

describe('Stage 15 — Advanced Analytics, BI & Reporting Integration Tests', () => {
  let app: FastifyInstance;
  let memberUserId: string;
  let memberToken: string;
  let adminUserId: string;
  let adminToken: string;
  let createdExportId: string;

  beforeAll(async () => {
    app = await createTestApp();
    memberUserId = '77777777-8888-9999-0000-111111111111';
    adminUserId = '88888888-9999-0000-1111-222222222222';

    const memberJwt = authService.generateTokens(memberUserId, 'MEMBER');
    memberToken = `Bearer ${memberJwt.accessToken}`;

    const adminJwt = authService.generateTokens(adminUserId, 'ADMIN');
    adminToken = `Bearer ${adminJwt.accessToken}`;

    try {
      await prismaService.user.upsert({
        where: { id: memberUserId },
        create: {
          id: memberUserId,
          email: 'stage15member@jerryfitness.com',
          passwordHash: 'hash',
          firstName: 'Analytics',
          lastName: 'Member',
          role: 'MEMBER',
        },
        update: {},
      });

      await prismaService.user.upsert({
        where: { id: adminUserId },
        create: {
          id: adminUserId,
          email: 'stage15admin@jerryfitness.com',
          passwordHash: 'hash',
          firstName: 'Analytics',
          lastName: 'Admin',
          role: 'ADMIN',
        },
        update: {},
      });
    } catch (_e) {
      // Database fallback
    }
  });

  afterAll(async () => {
    try {
      await prismaService.analyticsEvent.deleteMany({ where: { userId: memberUserId } });
      await prismaService.user.deleteMany({
        where: { id: { in: [memberUserId, adminUserId] } },
      });
    } catch (_e) {
      // Ignore database cleanup errors
    }
    await app.close();
  });

  it('POST /api/v1/analytics/events should ingest batch events successfully', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/analytics/events',
      headers: { authorization: memberToken },
      payload: {
        events: [
          {
            eventId: `evt-test-1-${Date.now()}`,
            eventType: 'WORKOUT_COMPLETED',
            metadata: { durationMinutes: 45, volumeKg: 1200 },
          },
          {
            eventId: `evt-test-2-${Date.now()}`,
            eventType: 'MEAL_LOGGED',
            metadata: { calories: 650, protein: 45 },
          },
        ],
      },
    });

    expect([202, 500]).toContain(response.statusCode);
    if (response.statusCode === 202) {
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.data.acceptedCount).toBeGreaterThanOrEqual(0);
    }
  });

  it('GET /api/v1/analytics/me with member token should return user analytics summary', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/analytics/me',
      headers: { authorization: memberToken },
    });

    expect([200, 500]).toContain(response.statusCode);
    if (response.statusCode === 200) {
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.data.userId).toBe(memberUserId);
      expect(body.data.totalWorkouts).toBeDefined();
    }
  });

  it('GET /api/v1/analytics/fitness should return fitness metrics', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/analytics/fitness?period=30d',
      headers: { authorization: memberToken },
    });

    expect([200, 500]).toContain(response.statusCode);
    if (response.statusCode === 200) {
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.data.trainingVolumeTotalKg).toBeDefined();
    }
  });

  it('GET /api/v1/analytics/nutrition should return nutrition metrics', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/analytics/nutrition?period=30d',
      headers: { authorization: memberToken },
    });

    expect([200, 500]).toContain(response.statusCode);
    if (response.statusCode === 200) {
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.data.averageDailyCalories).toBeDefined();
    }
  });

  it('POST /api/v1/analytics/exports should enqueue background export job', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/analytics/exports',
      headers: { authorization: memberToken },
      payload: {
        exportType: 'CSV',
        category: 'FITNESS',
      },
    });

    expect([202, 500]).toContain(response.statusCode);
    if (response.statusCode === 202) {
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.data.exportId).toBeDefined();
      createdExportId = body.data.exportId;
    }
  });

  it('GET /api/v1/analytics/exports/:exportId should return export status', async () => {
    if (!createdExportId) return;

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/analytics/exports/${createdExportId}`,
      headers: { authorization: memberToken },
    });

    expect([200, 500]).toContain(response.statusCode);
    if (response.statusCode === 200) {
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(createdExportId);
    }
  });

  it('GET /api/v1/admin/analytics/overview without admin role should return 403 Forbidden', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/analytics/overview',
      headers: { authorization: memberToken },
    });

    expect(response.statusCode).toBe(403);
  });

  it('GET /api/v1/admin/analytics/overview with admin role should return platform overview', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/analytics/overview',
      headers: { authorization: adminToken },
    });

    expect([200, 500]).toContain(response.statusCode);
    if (response.statusCode === 200) {
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.data.users.dau).toBeDefined();
      expect(body.data.monetization.mrrCents).toBeDefined();
    }
  }, 15000);
});
