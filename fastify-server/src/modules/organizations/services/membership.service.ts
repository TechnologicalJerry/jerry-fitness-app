import { OrganizationRole, MembershipStatus } from '@prisma/client';
import { membershipRepository } from '../repositories/membership.repository';
import { organizationRepository } from '../repositories/organization.repository';
import { auditService } from './audit.service';
import { MemberNotFoundError, OrganizationNotFoundError } from '../errors/organization.errors';
import { ForbiddenError } from '../../../common/errors/common-errors';

export class MembershipService {
  public async getOrgMembers(
    organizationId: string,
    options?: { page?: number; limit?: number; role?: OrganizationRole; status?: MembershipStatus },
  ) {
    return membershipRepository.findOrgMembers(organizationId, options);
  }

  public async updateMemberRole(
    organizationId: string,
    targetUserId: string,
    newRole: OrganizationRole,
    actorUserId: string,
  ) {
    const org = await organizationRepository.findById(organizationId);
    if (!org) throw new OrganizationNotFoundError(organizationId);

    const membership = await membershipRepository.findByOrgAndUser(organizationId, targetUserId);
    if (!membership) throw new MemberNotFoundError(targetUserId);

    // Prevent changing owner role directly (must use transfer ownership)
    if (org.ownerId === targetUserId && newRole !== OrganizationRole.OWNER) {
      throw new ForbiddenError('Cannot change role of organization owner directly. Use transfer ownership.');
    }

    if (newRole === OrganizationRole.OWNER && org.ownerId !== targetUserId) {
      throw new ForbiddenError('Use transfer ownership endpoint to assign a new owner');
    }

    const updated = await membershipRepository.updateRole(membership.id, newRole);

    await auditService.log({
      organizationId,
      actorUserId,
      action: 'member.role_changed',
      resource: 'OrganizationMembership',
      resourceId: membership.id,
      details: { targetUserId, oldRole: membership.role, newRole },
    });

    return updated;
  }

  public async updateMemberStatus(
    organizationId: string,
    targetUserId: string,
    newStatus: MembershipStatus,
    actorUserId: string,
  ) {
    const org = await organizationRepository.findById(organizationId);
    if (!org) throw new OrganizationNotFoundError(organizationId);

    if (org.ownerId === targetUserId && newStatus !== MembershipStatus.ACTIVE) {
      throw new ForbiddenError('Cannot suspend or deactivate the organization owner');
    }

    const membership = await membershipRepository.findByOrgAndUser(organizationId, targetUserId);
    if (!membership) throw new MemberNotFoundError(targetUserId);

    const updated = await membershipRepository.updateStatus(membership.id, newStatus);

    await auditService.log({
      organizationId,
      actorUserId,
      action: 'member.status_changed',
      resource: 'OrganizationMembership',
      resourceId: membership.id,
      details: { targetUserId, oldStatus: membership.status, newStatus },
    });

    return updated;
  }

  public async removeMember(organizationId: string, targetUserId: string, actorUserId: string) {
    const org = await organizationRepository.findById(organizationId);
    if (!org) throw new OrganizationNotFoundError(organizationId);

    if (org.ownerId === targetUserId) {
      throw new ForbiddenError('Cannot remove the organization owner from the organization');
    }

    const membership = await membershipRepository.findByOrgAndUser(organizationId, targetUserId);
    if (!membership) throw new MemberNotFoundError(targetUserId);

    await membershipRepository.updateStatus(membership.id, MembershipStatus.REMOVED);

    await auditService.log({
      organizationId,
      actorUserId,
      action: 'member.removed',
      resource: 'OrganizationMembership',
      resourceId: membership.id,
      details: { targetUserId },
    });
  }
}

export const membershipService = new MembershipService();
