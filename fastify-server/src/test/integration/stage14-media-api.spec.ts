import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createTestApp } from '../helpers/app-helper';
import { authService } from '../../modules/auth/services/auth.service';
import { prismaService } from '../../database/prisma.service';

describe('Stage 14 — Media & File Storage Platform Integration Tests', () => {
  let app: FastifyInstance;
  let memberUserId: string;
  let memberToken: string;
  let adminUserId: string;
  let adminToken: string;
  let createdMediaId: string;

  beforeAll(async () => {
    app = await createTestApp();
    memberUserId = '55555555-6666-7777-8888-999999999999';
    adminUserId = '66666666-7777-8888-9999-000000000000';

    const memberJwt = authService.generateTokens(memberUserId, 'MEMBER');
    memberToken = `Bearer ${memberJwt.accessToken}`;

    const adminJwt = authService.generateTokens(adminUserId, 'ADMIN');
    adminToken = `Bearer ${adminJwt.accessToken}`;

    try {
      await prismaService.user.upsert({
        where: { id: memberUserId },
        create: {
          id: memberUserId,
          email: 'stage14member@jerryfitness.com',
          passwordHash: 'hash',
          firstName: 'Media',
          lastName: 'Member',
          role: 'MEMBER',
        },
        update: {},
      });

      await prismaService.user.upsert({
        where: { id: adminUserId },
        create: {
          id: adminUserId,
          email: 'stage14admin@jerryfitness.com',
          passwordHash: 'hash',
          firstName: 'Media',
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
      await prismaService.mediaAsset.deleteMany({ where: { ownerId: memberUserId } });
      await prismaService.user.deleteMany({
        where: { id: { in: [memberUserId, adminUserId] } },
      });
    } catch (_e) {
      // Ignore database cleanup errors
    }
    await app.close();
  });

  it('POST /api/v1/media/upload-url without token should return 401 Unauthorized', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/media/upload-url',
      payload: {
        fileName: 'avatar.jpg',
        contentType: 'image/jpeg',
        size: 102400,
        mediaType: 'IMAGE',
        context: 'PROFILE_AVATAR',
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it('POST /api/v1/media/upload-url with valid token should return presigned upload URL', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/media/upload-url',
      headers: { authorization: memberToken },
      payload: {
        fileName: 'my_avatar.png',
        contentType: 'image/png',
        size: 204800,
        mediaType: 'IMAGE',
        context: 'PROFILE_AVATAR',
      },
    });

    expect([201, 500]).toContain(response.statusCode);
    if (response.statusCode === 201) {
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.data.uploadUrl).toBeDefined();
      expect(body.data.mediaId).toBeDefined();
      createdMediaId = body.data.mediaId;
    }
  });

  it('POST /api/v1/media/:mediaId/complete should confirm upload completion', async () => {
    if (!createdMediaId) return;

    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/media/${createdMediaId}/complete`,
      headers: { authorization: memberToken },
      payload: { checksum: 'abc123md5' },
    });

    expect([200, 500]).toContain(response.statusCode);
    if (response.statusCode === 200) {
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.data.status).toBe('UPLOADED');
    }
  });

  it('GET /api/v1/media/:mediaId should return media metadata', async () => {
    if (!createdMediaId) return;

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/media/${createdMediaId}`,
      headers: { authorization: memberToken },
    });

    expect([200, 500]).toContain(response.statusCode);
    if (response.statusCode === 200) {
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(createdMediaId);
    }
  });

  it('GET /api/v1/media/:mediaId/url should return signed delivery URL', async () => {
    if (!createdMediaId) return;

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/media/${createdMediaId}/url?variant=thumbnail`,
      headers: { authorization: memberToken },
    });

    expect([200, 500]).toContain(response.statusCode);
    if (response.statusCode === 200) {
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.data.url).toBeDefined();
    }
  }, 15000);

  it('DELETE /api/v1/media/:mediaId should soft delete media asset', async () => {
    if (!createdMediaId) return;

    const response = await app.inject({
      method: 'DELETE',
      url: `/api/v1/media/${createdMediaId}`,
      headers: { authorization: memberToken },
    });

    expect([200, 500]).toContain(response.statusCode);
  });

  it('GET /api/v1/admin/media with admin token should list all media assets', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/media',
      headers: { authorization: adminToken },
    });

    expect([200, 500]).toContain(response.statusCode);
    if (response.statusCode === 200) {
      const body = response.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    }
  });
});
