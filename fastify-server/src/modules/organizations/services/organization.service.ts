import { Organization, OrganizationRole, OrganizationStatus, OrganizationType } from '@prisma/client';
import { organizationRepository, CreateOrganizationInput } from '../repositories/organization.repository';
import { membershipRepository } from '../repositories/membership.repository';
import { settingsRepository } from '../repositories/settings.repository';
import { teamRepository } from '../repositories/team.repository';
import { authorizationService } from '../permissions/authorization.service';
import { TenantContext } from '../permissions/permission.types';
import { auditService } from './audit.service';
import {
  OrganizationNotFoundError,
  OrganizationSlugExistsError,
  MemberNotFoundError,
} from '../errors/organization.errors';
import { ForbiddenError, UnauthorizedError } from '../../../common/errors/common-errors';
import { prismaService } from '../../../database/prisma.service';
import { outboxService } from '../../realtime/services/outbox.service';
import { redisService } from '../../../cache/redis.service';

export class OrganizationService {
  private generateSlug(name: string, suffix?: string): string {
    const base = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const cleanBase = base || 'organization';
    return suffix ? `${cleanBase}-${suffix}` : cleanBase;
  }

  public async createOrganization(
    userId: string,
    input: Omit<CreateOrganizationInput, 'ownerId' | 'slug'> & { slug?: string },
  ): Promise<Organization> {
    const slug = input.slug ? this.generateSlug(input.slug) : this.generateSlug(input.name, Date.now().toString(36));

    const existing = await organizationRepository.findBySlug(slug);
    if (existing) {
      throw new OrganizationSlugExistsError(slug);
    }

    return prismaService.$transaction(async (tx) => {
      const org = await organizationRepository.create(
        {
          name: input.name,
          slug,
          description: input.description,
          logoUrl: input.logoUrl,
          type: input.type || OrganizationType.PERSONAL,
          ownerId: userId,
          planId: input.planId,
          metadata: input.metadata,
        },
        tx,
      );

      // Create owner membership
      await membershipRepository.create(
        {
          organizationId: org.id,
          userId,
          role: OrganizationRole.OWNER,
          status: 'ACTIVE',
        },
        tx,
      );

      // Create default settings
      await settingsRepository.createDefault(org.id, tx);

      // Record outbox event
      await outboxService.createOutboxRecord(tx, {
        eventType: 'organization.created',
        aggregateType: 'Organization',
        aggregateId: org.id,
        userId,
        version: 'v1',
        payload: {
          organizationId: org.id,
          name: org.name,
          slug: org.slug,
          type: org.type,
          ownerId: userId,
          createdAt: org.createdAt.toISOString(),
        },
      });

      // Audit Log
      await auditService.log(
        {
          organizationId: org.id,
          actorUserId: userId,
          action: 'organization.created',
          resource: 'Organization',
          resourceId: org.id,
          details: { name: org.name, slug: org.slug, type: org.type },
        },
        tx,
      );

      return org;
    });
  }

  public async ensurePersonalWorkspace(userId: string): Promise<Organization> {
    const user = await prismaService.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    const personalSlug = `personal-${user.id.substring(0, 8)}`;
    let org = await organizationRepository.findBySlug(personalSlug);

    if (!org) {
      org = await this.createOrganization(userId, {
        name: `${user.firstName}'s Personal Workspace`,
        slug: personalSlug,
        type: OrganizationType.PERSONAL,
        description: 'Default personal workspace',
      });
    }

    return org;
  }

  public async getUserOrganizations(userId: string): Promise<Organization[]> {
    let orgs = await organizationRepository.findUserOrganizations(userId);

    // Personal Workspace auto-creation for backward compatibility
    if (orgs.length === 0) {
      const personalOrg = await this.ensurePersonalWorkspace(userId);
      orgs = [personalOrg];
    }

    return orgs;
  }

  public async getOrganizationById(organizationId: string): Promise<Organization> {
    const org = await organizationRepository.findById(organizationId);
    if (!org) {
      throw new OrganizationNotFoundError(organizationId);
    }
    return org;
  }

  public async updateOrganization(
    organizationId: string,
    data: { name?: string; description?: string; logoUrl?: string; metadata?: any },
    actorUserId: string,
  ): Promise<Organization> {
    const org = await this.getOrganizationById(organizationId);

    const updated = await organizationRepository.update(org.id, data);

    await auditService.log({
      organizationId,
      actorUserId,
      action: 'organization.updated',
      resource: 'Organization',
      resourceId: org.id,
      details: data,
    });

    return updated;
  }

  public async softDeleteOrganization(organizationId: string, actorUserId: string): Promise<void> {
    const org = await this.getOrganizationById(organizationId);

    await organizationRepository.softDelete(org.id);

    await auditService.log({
      organizationId,
      actorUserId,
      action: 'organization.deleted',
      resource: 'Organization',
      resourceId: org.id,
    });
  }

  public async transferOwnership(
    organizationId: string,
    newOwnerUserId: string,
    actorUserId: string,
  ): Promise<Organization> {
    const org = await this.getOrganizationById(organizationId);
    if (org.ownerId !== actorUserId) {
      throw new ForbiddenError('Only the current organization owner can transfer ownership');
    }

    if (org.ownerId === newOwnerUserId) {
      return org;
    }

    const targetMembership = await membershipRepository.findByOrgAndUser(organizationId, newOwnerUserId);
    if (!targetMembership || targetMembership.status !== 'ACTIVE') {
      throw new MemberNotFoundError(newOwnerUserId);
    }

    return prismaService.$transaction(async (tx) => {
      // Update target membership to OWNER
      await membershipRepository.updateRole(targetMembership.id, OrganizationRole.OWNER, tx);

      // Update old owner membership to ADMIN
      const oldOwnerMembership = await membershipRepository.findByOrgAndUser(organizationId, actorUserId, tx);
      if (oldOwnerMembership) {
        await membershipRepository.updateRole(oldOwnerMembership.id, OrganizationRole.ADMIN, tx);
      }

      // Update organization owner
      const updatedOrg = await organizationRepository.update(
        organizationId,
        { owner: { connect: { id: newOwnerUserId } } },
        tx,
      );

      await auditService.log(
        {
          organizationId,
          actorUserId,
          action: 'ownership.transferred',
          resource: 'Organization',
          resourceId: organizationId,
          details: { previousOwner: actorUserId, newOwner: newOwnerUserId },
        },
        tx,
      );

      return updatedOrg;
    });
  }

  public async switchActiveOrganization(userId: string, organizationId: string): Promise<TenantContext> {
    const org = await organizationRepository.findById(organizationId);
    if (!org || org.status === OrganizationStatus.DELETED) {
      throw new OrganizationNotFoundError(organizationId);
    }

    if (org.status === OrganizationStatus.SUSPENDED) {
      throw new ForbiddenError('Organization is currently suspended');
    }

    const membership = await membershipRepository.findByOrgAndUser(organizationId, userId);
    if (!membership || membership.status !== 'ACTIVE') {
      throw new ForbiddenError('Active membership in target organization required');
    }

    const permissions = authorizationService.getRolePermissions(membership.role);
    const teamIds = await teamRepository.findUserTeamIdsInOrg(organizationId, userId);

    const context: TenantContext = {
      organizationId: org.id,
      membershipId: membership.id,
      role: membership.role,
      membershipStatus: membership.status,
      organizationStatus: org.status,
      permissions,
      teamIds,
    };

    // Store in Redis active organization key for user (expires in 30 days)
    await redisService.set(`user:${userId}:active_org`, org.id, 30 * 24 * 60 * 60);

    return context;
  }

  public async resolveTenantContext(userId: string, targetOrgId?: string): Promise<TenantContext> {
    let orgId = targetOrgId;

    if (!orgId) {
      // Try to resolve active org from Redis cache
      const cachedOrgId = await redisService.get(`user:${userId}:active_org`);
      if (cachedOrgId) {
        orgId = cachedOrgId;
      }
    }

    if (!orgId) {
      const userOrgs = await this.getUserOrganizations(userId);
      if (userOrgs.length > 0) {
        orgId = userOrgs[0]?.id;
      }
    }

    if (!orgId) {
      throw new OrganizationNotFoundError();
    }

    const org = await organizationRepository.findById(orgId);
    if (!org || org.status === OrganizationStatus.DELETED) {
      throw new OrganizationNotFoundError(orgId);
    }

    const membership = await membershipRepository.findByOrgAndUser(org.id, userId);
    if (!membership || membership.status !== 'ACTIVE') {
      throw new ForbiddenError('User is not an active member of organization');
    }

    const permissions = authorizationService.getRolePermissions(membership.role);
    const teamIds = await teamRepository.findUserTeamIdsInOrg(org.id, userId);

    return {
      organizationId: org.id,
      membershipId: membership.id,
      role: membership.role,
      membershipStatus: membership.status,
      organizationStatus: org.status,
      permissions,
      teamIds,
    };
  }
}

export const organizationService = new OrganizationService();
