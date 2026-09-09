import { FastifyRequest, FastifyReply } from 'fastify';
import { teamService } from '../services/team.service';
import { authorizationService } from '../permissions/authorization.service';

export class TeamController {
  public async createTeam(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { organizationId } = request.params as { organizationId: string };
    const actorUserId = request.user!.id;
    const body = request.body as { name: string; slug?: string; description?: string };

    authorizationService.assertCan(request.tenant, 'organization.teams.create');

    const team = await teamService.createTeam(
      {
        organizationId,
        name: body.name,
        slug: body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: body.description,
      },
      actorUserId,
    );

    return reply.status(201).send({
      success: true,
      data: team,
    });
  }

  public async getTeams(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { organizationId } = request.params as { organizationId: string };

    authorizationService.assertCan(request.tenant, 'organization.teams.read');

    const teams = await teamService.getOrgTeams(organizationId);
    return reply.send({
      success: true,
      data: teams,
    });
  }

  public async getTeam(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { organizationId, teamId } = request.params as { organizationId: string; teamId: string };

    authorizationService.assertCan(request.tenant, 'organization.teams.read');

    const team = await teamService.getTeamById(organizationId, teamId);
    return reply.send({
      success: true,
      data: team,
    });
  }

  public async updateTeam(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { organizationId, teamId } = request.params as { organizationId: string; teamId: string };
    const actorUserId = request.user!.id;
    const body = request.body as any;

    authorizationService.assertCan(request.tenant, 'organization.teams.update');

    const team = await teamService.updateTeam(organizationId, teamId, body, actorUserId);
    return reply.send({
      success: true,
      data: team,
    });
  }

  public async deleteTeam(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { organizationId, teamId } = request.params as { organizationId: string; teamId: string };
    const actorUserId = request.user!.id;

    authorizationService.assertCan(request.tenant, 'organization.teams.delete');

    await teamService.deleteTeam(organizationId, teamId, actorUserId);
    return reply.send({
      success: true,
      message: 'Team deleted successfully',
    });
  }

  public async addTeamMember(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { organizationId, teamId } = request.params as { organizationId: string; teamId: string };
    const actorUserId = request.user!.id;
    const { userId: targetUserId, role } = request.body as { userId: string; role?: string };

    authorizationService.assertCan(request.tenant, 'organization.teams.manage_members');

    const membership = await teamService.addTeamMember(organizationId, teamId, targetUserId, actorUserId, role);
    return reply.status(201).send({
      success: true,
      data: membership,
    });
  }

  public async removeTeamMember(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { organizationId, teamId, userId: targetUserId } = request.params as {
      organizationId: string;
      teamId: string;
      userId: string;
    };
    const actorUserId = request.user!.id;

    authorizationService.assertCan(request.tenant, 'organization.teams.manage_members');

    await teamService.removeTeamMember(organizationId, teamId, targetUserId, actorUserId);
    return reply.send({
      success: true,
      message: 'Member removed from team',
    });
  }

  public async getTeamMembers(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { organizationId, teamId } = request.params as { organizationId: string; teamId: string };

    authorizationService.assertCan(request.tenant, 'organization.teams.read');

    const members = await teamService.getTeamMembers(organizationId, teamId);
    return reply.send({
      success: true,
      data: members,
    });
  }
}

export const teamController = new TeamController();
