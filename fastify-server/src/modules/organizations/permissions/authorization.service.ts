import { OrganizationRole, OrganizationStatus, MembershipStatus } from '@prisma/client';
import { OrganizationPermission, TenantContext } from './permission.types';
import { ROLE_PERMISSIONS_MAP } from './role-permissions.map';
import { ForbiddenError, UnauthorizedError } from '../../../common/errors/common-errors';

export class AuthorizationService {
  public getRolePermissions(role: OrganizationRole): OrganizationPermission[] {
    return ROLE_PERMISSIONS_MAP[role] || [];
  }

  public hasPermission(role: OrganizationRole, permission: OrganizationPermission): boolean {
    const permissions = this.getRolePermissions(role);
    return permissions.includes(permission);
  }

  public can(context: TenantContext | undefined, permission: OrganizationPermission): boolean {
    if (!context) return false;

    // Organization status check
    if (context.organizationStatus === OrganizationStatus.DELETED) {
      return false;
    }
    if (
      context.organizationStatus === OrganizationStatus.SUSPENDED ||
      context.organizationStatus === OrganizationStatus.ARCHIVED
    ) {
      // Read-only permissions allowed during suspension/archival if explicitly permitted, otherwise false
      if (!permission.endsWith('.read')) {
        return false;
      }
    }

    // Membership status check
    if (context.membershipStatus !== MembershipStatus.ACTIVE) {
      return false;
    }

    return context.permissions.includes(permission);
  }

  public assertCan(context: TenantContext | undefined, permission: OrganizationPermission): void {
    if (!context) {
      throw new UnauthorizedError('Organization tenant context required');
    }

    if (context.organizationStatus === OrganizationStatus.DELETED) {
      throw new ForbiddenError('Organization is deleted');
    }

    if (
      (context.organizationStatus === OrganizationStatus.SUSPENDED ||
        context.organizationStatus === OrganizationStatus.ARCHIVED) &&
      !permission.endsWith('.read')
    ) {
      throw new ForbiddenError(`Organization is ${context.organizationStatus.toLowerCase()}`);
    }

    if (context.membershipStatus !== MembershipStatus.ACTIVE) {
      throw new ForbiddenError('Active organization membership required');
    }

    if (!context.permissions.includes(permission)) {
      throw new ForbiddenError(`Permission '${permission}' required for organization action`);
    }
  }
}

export const authorizationService = new AuthorizationService();
