import { FastifyRequest, FastifyReply } from 'fastify';
import { invitationService } from '../services/invitation.service';
import { authorizationService } from '../permissions/authorization.service';

export class InvitationController {
  public async createInvitation(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { organizationId } = request.params as { organizationId: string };
    const actorUserId = request.user!.id;
    const { email, role, teamId } = request.body as { email: string; role: any; teamId?: string };

    authorizationService.assertCan(request.tenant, 'organization.members.invite');

    const result = await invitationService.createInvitation(organizationId, email, role, actorUserId, teamId);
    return reply.status(201).send({
      success: true,
      data: {
        invitation: result.invitation,
        invitationToken: result.rawToken,
      },
    });
  }

  public async getInvitations(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { organizationId } = request.params as { organizationId: string };

    authorizationService.assertCan(request.tenant, 'organization.members.read');

    const invites = await invitationService.getPendingInvitations(organizationId);
    return reply.send({
      success: true,
      data: invites,
    });
  }

  public async resendInvitation(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { organizationId, invitationId } = request.params as { organizationId: string; invitationId: string };
    const actorUserId = request.user!.id;

    authorizationService.assertCan(request.tenant, 'organization.members.invite');

    const result = await invitationService.resendInvitation(organizationId, invitationId, actorUserId);
    return reply.send({
      success: true,
      data: {
        invitation: result.invitation,
        invitationToken: result.rawToken,
      },
    });
  }

  public async revokeInvitation(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { organizationId, invitationId } = request.params as { organizationId: string; invitationId: string };
    const actorUserId = request.user!.id;

    authorizationService.assertCan(request.tenant, 'organization.members.invite');

    await invitationService.revokeInvitation(organizationId, invitationId, actorUserId);
    return reply.send({
      success: true,
      message: 'Invitation revoked successfully',
    });
  }

  public async acceptInvitation(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { token } = request.params as { token: string };
    const userId = request.user!.id;

    const result = await invitationService.acceptInvitation(token, userId);
    return reply.send({
      success: true,
      data: result,
    });
  }
}

export const invitationController = new InvitationController();
