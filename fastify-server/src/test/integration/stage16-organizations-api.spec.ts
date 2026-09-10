import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../app';
import { FastifyInstance } from 'fastify';
import { prismaService } from '../../database/prisma.service';
import crypto from 'crypto';
import { env } from '../../config/env';

describe('Stage 16 — Multi-Tenancy, Teams & Organizations API Integration Tests', () => {
  let app: FastifyInstance;
  let userAToken: string;
  let userAId: string;
  let userBToken: string;
  let userBId: string;

  let createdOrgId: string;
  let invitationToken: string;
  let createdTeamId: string;

  function createTestJwt(userId: string, role = 'MEMBER'): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({
        sub: userId,
        role,
        exp: Math.floor(Date.now() / 1000) + 3600,
      }),
    ).toString('base64url');

    const signature = crypto
      .createHmac('sha256', env.JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');

    return `${header}.${payload}.${signature}`;
  }

  beforeAll(async () => {
    app = buildApp();
    await app.ready();

    // Create Test User A
    const userA = await prismaService.user.create({
      data: {
        email: `org.test.a.${Date.now()}@example.com`,
        passwordHash: 'hashedpassword',
        firstName: 'OwnerA',
        lastName: 'User',
      },
    });
    userAId = userA.id;
    userAToken = createTestJwt(userAId);

    // Create Test User B
    const userB = await prismaService.user.create({
      data: {
        email: `org.test.b.${Date.now()}@example.com`,
        passwordHash: 'hashedpassword',
        firstName: 'MemberB',
        lastName: 'User',
      },
    });
    userBId = userB.id;
    userBToken = createTestJwt(userBId);
  });

  afterAll(async () => {
    // Cleanup test users and organizations
    try {
      if (createdOrgId) {
        await prismaService.organization.deleteMany({ where: { id: createdOrgId } });
      }
      const userIds = [userAId, userBId].filter(Boolean);
      if (userIds.length > 0) {
        await prismaService.user.deleteMany({
          where: { id: { in: userIds } },
        });
      }
    } catch {
      // Ignore DB cleanup error if DB offline
    }
    if (app) {
      await app.close();
    }
  });

  describe('1. Organization Creation & Personal Workspace', () => {
    it('should list organizations and auto-create personal workspace for new user', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/organizations',
        headers: { authorization: `Bearer ${userAToken}` },
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.payload);
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.length).toBeGreaterThanOrEqual(1);
      expect(json.data[0].type).toBe('PERSONAL');
    });

    it('should create a new GYM organization', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/organizations',
        headers: { authorization: `Bearer ${userAToken}` },
        payload: {
          name: 'Apex Fitness Studio',
          type: 'FITNESS_STUDIO',
          description: 'Premium fitness coaching studio',
        },
      });

      expect(res.statusCode).toBe(201);
      const json = JSON.parse(res.payload);
      expect(json.success).toBe(true);
      expect(json.data.name).toBe('Apex Fitness Studio');
      expect(json.data.type).toBe('FITNESS_STUDIO');
      createdOrgId = json.data.id;
    });
  });

  describe('2. Tenant Context & Organization Management', () => {
    it('should fetch organization details for member/owner', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/organizations/${createdOrgId}`,
        headers: {
          authorization: `Bearer ${userAToken}`,
          'x-organization-id': createdOrgId,
        },
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.payload);
      expect(json.success).toBe(true);
      expect(json.data.id).toBe(createdOrgId);
    });

    it('should fetch organization quota usage', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/organizations/${createdOrgId}/quota`,
        headers: {
          authorization: `Bearer ${userAToken}`,
          'x-organization-id': createdOrgId,
        },
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.payload);
      expect(json.success).toBe(true);
      expect(json.data.limits).toBeDefined();
      expect(json.data.usage).toBeDefined();
    });

    it('should update organization settings', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/organizations/${createdOrgId}/settings`,
        headers: {
          authorization: `Bearer ${userAToken}`,
          'x-organization-id': createdOrgId,
        },
        payload: {
          timezone: 'America/New_York',
          defaultUnits: 'imperial',
        },
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.payload);
      expect(json.success).toBe(true);
      expect(json.data.timezone).toBe('America/New_York');
      expect(json.data.defaultUnits).toBe('imperial');
    });
  });

  describe('3. Teams Management', () => {
    it('should create a team in organization', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/organizations/${createdOrgId}/teams`,
        headers: {
          authorization: `Bearer ${userAToken}`,
          'x-organization-id': createdOrgId,
        },
        payload: {
          name: 'Strength Training Team',
          description: 'Competitive powerlifting team',
        },
      });

      expect(res.statusCode).toBe(201);
      const json = JSON.parse(res.payload);
      expect(json.success).toBe(true);
      expect(json.data.name).toBe('Strength Training Team');
      createdTeamId = json.data.id;
    });

    it('should list teams in organization', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/organizations/${createdOrgId}/teams`,
        headers: {
          authorization: `Bearer ${userAToken}`,
          'x-organization-id': createdOrgId,
        },
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.payload);
      expect(json.success).toBe(true);
      expect(json.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('4. Invitations & Active Organization Switching', () => {
    it('should create an invitation for User B', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/organizations/${createdOrgId}/invitations`,
        headers: {
          authorization: `Bearer ${userAToken}`,
          'x-organization-id': createdOrgId,
        },
        payload: {
          email: 'memberb.test@example.com',
          role: 'TRAINER',
          teamId: createdTeamId,
        },
      });

      expect(res.statusCode).toBe(201);
      const json = JSON.parse(res.payload);
      expect(json.success).toBe(true);
      expect(json.data.invitationToken).toBeDefined();
      invitationToken = json.data.invitationToken;
    });

    it('should allow User B to accept the invitation', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/organization-invitations/${invitationToken}/accept`,
        headers: { authorization: `Bearer ${userBToken}` },
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.payload);
      expect(json.success).toBe(true);
      expect(json.data.membership.role).toBe('TRAINER');
    });

    it('should allow User B to switch into the active organization context', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/organizations/${createdOrgId}/switch`,
        headers: { authorization: `Bearer ${userBToken}` },
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.payload);
      expect(json.success).toBe(true);
      expect(json.data.organizationId).toBe(createdOrgId);
      expect(json.data.role).toBe('TRAINER');
    });
  });

  describe('5. Multi-Tenancy Security & IDOR Isolation', () => {
    it('should reject unauthorized organization access (IDOR check)', async () => {
      const unauthedUserToken = createTestJwt(crypto.randomUUID());

      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/organizations/${createdOrgId}`,
        headers: {
          authorization: `Bearer ${unauthedUserToken}`,
          'x-organization-id': createdOrgId,
        },
      });

      expect([403, 404]).toContain(res.statusCode);
    });

    it('should prevent User B from deleting the organization (Role authorization check)', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/organizations/${createdOrgId}`,
        headers: {
          authorization: `Bearer ${userBToken}`,
          'x-organization-id': createdOrgId,
        },
      });

      expect(res.statusCode).toBe(403);
    });
  });
});
