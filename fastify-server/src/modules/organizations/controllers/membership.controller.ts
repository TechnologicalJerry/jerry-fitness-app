import { FastifyRequest, FastifyReply } from 'fastify';
import { membershipService } from '../services/membership.service';
import { authorizationService } from '../permissions/authorization.service';

export class MembershipController {
  public async getMembers(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { organizationId } = request.params as { organizationId: string };
    const query = request.query as any;

    authorizationService.assertCan(request.tenant, 'organization.members.read');

    const members = await membershipService.getOrgMembers(organizationId, {
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 20,
      role: query.role,
      status: query.status,
    });

    return reply.send({
      success: true,
      data: members,
    });
  }

  public async updateMemberRole(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { organizationId, userId: targetUserId } = request.params as { organizationId: string; userId: string };
    const actorUserId = request.user!.id;
    const { role } = request.body as { role: any };

    authorizationService.assertCan(request.tenant, 'organization.members.update');

    const updated = await membershipService.updateMemberRole(organizationId, targetUserId, role, actorUserId);
    return reply.send({
      success: true,
      data: updated,
    });
  }

  public async updateMemberStatus(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { organizationId, userId: targetUserId } = request.params as { organizationId: string; userId: string };
    const actorUserId = request.user!.id;
    const { status } = request.body as { status: any };

    authorizationService.assertCan(request.tenant, 'organization.members.update');

    const updated = await membershipService.updateMemberStatus(organizationId, targetUserId, status, actorUserId);
    return reply.send({
      success: true,
      data: updated,
    });
  }

  public async removeMember(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { organizationId, userId: targetUserId } = request.params as { organizationId: string; userId: string };
    const actorUserId = request.user!.id;

    authorizationService.assertCan(request.tenant, 'organization.members.remove');

    await membershipService.removeMember(organizationId, targetUserId, actorUserId);
    return reply.send({
      success: true,
      message: 'Member removed from organization',
    });
  }
}

export const membershipController = new MembershipController();
