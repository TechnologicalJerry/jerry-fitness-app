import crypto from 'crypto';
import { OrganizationInvitation, OrganizationRole, InvitationStatus } from '@prisma/client';
import { invitationRepository } from '../repositories/invitation.repository';
import { membershipRepository } from '../repositories/membership.repository';
import { teamRepository } from '../repositories/team.repository';
import { quotaService } from './quota.service';
import { auditService } from './audit.service';
import { InvitationNotFoundError, InvitationExpiredError, MemberAlreadyExistsError } from '../errors/organization.errors';
import { prismaService } from '../../../database/prisma.service';
import { outboxService } from '../../realtime/services/outbox.service';

export class InvitationService {
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  public async createInvitation(
    organizationId: string,
    email: string,
    role: OrganizationRole,
    inviterId: string,
    teamId?: string,
    expiresInDays = 7,
  ): Promise<{ invitation: OrganizationInvitation; rawToken: string }> {
    const cleanEmail = email.toLowerCase().trim();

    // Quota enforcement
    await quotaService.assertWithinLimit(organizationId, 'members');

    // Check if user is already an active member
    const existingUser = await prismaService.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      const existingMembership = await membershipRepository.findByOrgAndUser(organizationId, existingUser.id);
      if (existingMembership && existingMembership.status === 'ACTIVE') {
        throw new MemberAlreadyExistsError(cleanEmail);
      }
    }

    // Check existing pending invite
    const existingInvite = await invitationRepository.findExistingPending(organizationId, cleanEmail);
    if (existingInvite) {
      // Revoke old invite
      await invitationRepository.updateStatus(existingInvite.id, InvitationStatus.REVOKED);
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    const invitation = await invitationRepository.create({
      organizationId,
      email: cleanEmail,
      role,
      teamId,
      tokenHash,
      inviterId,
      expiresAt,
    });

    await auditService.log({
      organizationId,
      actorUserId: inviterId,
      action: 'member.invited',
      resource: 'OrganizationInvitation',
      resourceId: invitation.id,
      details: { email: cleanEmail, role, teamId },
    });

    return { invitation, rawToken };
  }

  public async getPendingInvitations(organizationId: string) {
    return invitationRepository.findPendingByOrg(organizationId);
  }

  public async revokeInvitation(organizationId: string, invitationId: string, actorUserId: string): Promise<void> {
    const invite = await invitationRepository.findById(invitationId);
    if (!invite || invite.organizationId !== organizationId) {
      throw new InvitationNotFoundError();
    }

    await invitationRepository.updateStatus(invite.id, InvitationStatus.REVOKED);

    await auditService.log({
      organizationId,
      actorUserId,
      action: 'member.invite_revoked',
      resource: 'OrganizationInvitation',
      resourceId: invitationId,
    });
  }

  public async resendInvitation(
    organizationId: string,
    invitationId: string,
    actorUserId: string,
  ): Promise<{ invitation: OrganizationInvitation; rawToken: string }> {
    const invite = await invitationRepository.findById(invitationId);
    if (!invite || invite.organizationId !== organizationId) {
      throw new InvitationNotFoundError();
    }

    return this.createInvitation(organizationId, invite.email, invite.role, actorUserId, invite.teamId || undefined);
  }

  public async acceptInvitation(rawToken: string, userId: string) {
    const tokenHash = this.hashToken(rawToken);

    return prismaService.$transaction(async (tx) => {
      const invite = await invitationRepository.findByTokenHash(tokenHash, tx);
      if (!invite) {
        throw new InvitationNotFoundError();
      }

      if (invite.status !== InvitationStatus.PENDING || invite.expiresAt < new Date()) {
        throw new InvitationExpiredError();
      }

      // Check quota inside transaction
      await quotaService.assertWithinLimit(invite.organizationId, 'members', 1, tx);

      // Create membership
      const membership = await membershipRepository.create(
        {
          organizationId: invite.organizationId,
          userId,
          role: invite.role,
          status: 'ACTIVE',
          invitedBy: invite.inviterId,
        },
        tx,
      );

      // Add to team if specified
      if (invite.teamId) {
        await teamRepository.addMember(invite.teamId, userId, 'MEMBER', tx);
      }

      // Update invitation
      await invitationRepository.updateStatus(invite.id, InvitationStatus.ACCEPTED, new Date(), tx);

      // Outbox Event
      await outboxService.createOutboxRecord(tx, {
        eventType: 'organization.member_joined',
        aggregateType: 'Organization',
        aggregateId: invite.organizationId,
        userId,
        version: 'v1',
        payload: {
          organizationId: invite.organizationId,
          userId,
          role: invite.role,
          joinedAt: new Date().toISOString(),
        },
      });

      // Audit Log
      await auditService.log(
        {
          organizationId: invite.organizationId,
          actorUserId: userId,
          action: 'member.joined',
          resource: 'OrganizationMembership',
          resourceId: membership.id,
          details: { role: invite.role, teamId: invite.teamId },
        },
        tx,
      );

      return { membership, organization: invite.organization };
    });
  }
}

export const invitationService = new InvitationService();
