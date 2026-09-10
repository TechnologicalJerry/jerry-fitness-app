import { Team, TeamMembership } from '@prisma/client';
import { teamRepository, CreateTeamInput } from '../repositories/team.repository';
import { membershipRepository } from '../repositories/membership.repository';
import { quotaService } from './quota.service';
import { auditService } from './audit.service';
import { TeamNotFoundError, TeamSlugExistsError, MemberNotFoundError } from '../errors/organization.errors';

export class TeamService {
  public async createTeam(data: CreateTeamInput, actorUserId: string): Promise<Team> {
    await quotaService.assertWithinLimit(data.organizationId, 'teams');

    const cleanSlug = data.slug.toLowerCase().trim();
    const existing = await teamRepository.findBySlug(data.organizationId, cleanSlug);
    if (existing) {
      throw new TeamSlugExistsError(cleanSlug);
    }

    const team = await teamRepository.create({
      ...data,
      slug: cleanSlug,
    });

    await auditService.log({
      organizationId: data.organizationId,
      actorUserId,
      action: 'team.created',
      resource: 'Team',
      resourceId: team.id,
      details: { name: team.name, slug: team.slug },
    });

    return team;
  }

  public async getOrgTeams(organizationId: string): Promise<Team[]> {
    return teamRepository.findByOrg(organizationId);
  }

  public async getTeamById(organizationId: string, teamId: string): Promise<Team> {
    const team = await teamRepository.findById(teamId);
    if (!team || team.organizationId !== organizationId) {
      throw new TeamNotFoundError(teamId);
    }
    return team;
  }

  public async updateTeam(
    organizationId: string,
    teamId: string,
    data: { name?: string; description?: string },
    actorUserId: string,
  ): Promise<Team> {
    const team = await this.getTeamById(organizationId, teamId);

    const updated = await teamRepository.update(team.id, data);

    await auditService.log({
      organizationId,
      actorUserId,
      action: 'team.updated',
      resource: 'Team',
      resourceId: team.id,
      details: data,
    });

    return updated;
  }

  public async deleteTeam(organizationId: string, teamId: string, actorUserId: string): Promise<void> {
    const team = await this.getTeamById(organizationId, teamId);

    await teamRepository.delete(team.id);

    await auditService.log({
      organizationId,
      actorUserId,
      action: 'team.deleted',
      resource: 'Team',
      resourceId: team.id,
    });
  }

  public async addTeamMember(
    organizationId: string,
    teamId: string,
    targetUserId: string,
    actorUserId: string,
    role = 'MEMBER',
  ): Promise<TeamMembership> {
    const team = await this.getTeamById(organizationId, teamId);

    // Validate target user belongs to organization
    const orgMembership = await membershipRepository.findByOrgAndUser(organizationId, targetUserId);
    if (!orgMembership || orgMembership.status !== 'ACTIVE') {
      throw new MemberNotFoundError(targetUserId);
    }

    const teamMembership = await teamRepository.addMember(team.id, targetUserId, role);

    await auditService.log({
      organizationId,
      actorUserId,
      action: 'team.member_added',
      resource: 'TeamMembership',
      resourceId: teamMembership.id,
      details: { teamId, targetUserId, role },
    });

    return teamMembership;
  }

  public async removeTeamMember(
    organizationId: string,
    teamId: string,
    targetUserId: string,
    actorUserId: string,
  ): Promise<void> {
    const team = await this.getTeamById(organizationId, teamId);

    await teamRepository.removeMember(team.id, targetUserId);

    await auditService.log({
      organizationId,
      actorUserId,
      action: 'team.member_removed',
      resource: 'Team',
      resourceId: team.id,
      details: { targetUserId },
    });
  }

  public async getTeamMembers(organizationId: string, teamId: string) {
    await this.getTeamById(organizationId, teamId);
    return teamRepository.findTeamMemberships(teamId);
  }
}

export const teamService = new TeamService();
