import { describe, it, expect } from 'vitest';
import { authorizationService } from '../../modules/organizations/permissions/authorization.service';
import { TenantContext } from '../../modules/organizations/permissions/permission.types';
import { quotaService } from '../../modules/organizations/services/quota.service';
import { OrganizationRole, OrganizationStatus, MembershipStatus, OrganizationType } from '@prisma/client';

describe('Stage 16 — Organization Permissions & Quotas Unit Tests', () => {
  describe('AuthorizationService', () => {
    it('should return correct permissions map for OWNER role', () => {
      const perms = authorizationService.getRolePermissions(OrganizationRole.OWNER);
      expect(perms).toContain('organization.read');
      expect(perms).toContain('organization.delete');
      expect(perms).toContain('organization.transfer_ownership');
      expect(perms).toContain('organization.billing.manage');
    });

    it('should return correct permissions map for ADMIN role', () => {
      const perms = authorizationService.getRolePermissions(OrganizationRole.ADMIN);
      expect(perms).toContain('organization.read');
      expect(perms).toContain('organization.members.invite');
      expect(perms).not.toContain('organization.transfer_ownership');
      expect(perms).not.toContain('organization.delete');
    });

    it('should return correct permissions map for MEMBER role', () => {
      const perms = authorizationService.getRolePermissions(OrganizationRole.MEMBER);
      expect(perms).toContain('organization.read');
      expect(perms).toContain('workouts.read');
      expect(perms).not.toContain('organization.members.invite');
      expect(perms).not.toContain('organization.delete');
    });

    it('should approve action when active context has permission', () => {
      const context: TenantContext = {
        organizationId: 'org-123',
        membershipId: 'mem-123',
        role: OrganizationRole.ADMIN,
        membershipStatus: MembershipStatus.ACTIVE,
        organizationStatus: OrganizationStatus.ACTIVE,
        permissions: authorizationService.getRolePermissions(OrganizationRole.ADMIN),
        teamIds: [],
      };

      expect(authorizationService.can(context, 'organization.members.invite')).toBe(true);
      expect(() => authorizationService.assertCan(context, 'organization.members.invite')).not.toThrow();
    });

    it('should deny action when role lacks required permission', () => {
      const context: TenantContext = {
        organizationId: 'org-123',
        membershipId: 'mem-123',
        role: OrganizationRole.MEMBER,
        membershipStatus: MembershipStatus.ACTIVE,
        organizationStatus: OrganizationStatus.ACTIVE,
        permissions: authorizationService.getRolePermissions(OrganizationRole.MEMBER),
        teamIds: [],
      };

      expect(authorizationService.can(context, 'organization.members.invite')).toBe(false);
      expect(() => authorizationService.assertCan(context, 'organization.members.invite')).toThrow(
        /Permission 'organization.members.invite' required/i,
      );
    });

    it('should block non-read mutations when organization is SUSPENDED or ARCHIVED', () => {
      const context: TenantContext = {
        organizationId: 'org-123',
        membershipId: 'mem-123',
        role: OrganizationRole.OWNER,
        membershipStatus: MembershipStatus.ACTIVE,
        organizationStatus: OrganizationStatus.SUSPENDED,
        permissions: authorizationService.getRolePermissions(OrganizationRole.OWNER),
        teamIds: [],
      };

      expect(authorizationService.can(context, 'organization.read')).toBe(true);
      expect(authorizationService.can(context, 'organization.update')).toBe(false);
      expect(() => authorizationService.assertCan(context, 'organization.update')).toThrow(
        /Organization is suspended/i,
      );
    });
  });

  describe('Quota Limits', () => {
    it('should define stricter quota limits for PERSONAL organizations', () => {
      const limits = (quotaService as any).getDefaultLimits(OrganizationType.PERSONAL);
      expect(limits.maxMembers).toBe(1);
      expect(limits.maxTrainers).toBe(0);
    });

    it('should define higher quota limits for ENTERPRISE organizations', () => {
      const limits = (quotaService as any).getDefaultLimits(OrganizationType.ENTERPRISE);
      expect(limits.maxMembers).toBe(10000);
      expect(limits.maxTrainers).toBe(100);
    });
  });
});
