import { Prisma, Team, TeamMembership } from '@prisma/client';
import { prismaService } from '../../../database/prisma.service';

export interface CreateTeamInput {
  organizationId: string;
  name: string;
  slug: string;
  description?: string;
  metadata?: Prisma.InputJsonValue;
}

export class TeamRepository {
  public async create(data: CreateTeamInput, tx?: Prisma.TransactionClient): Promise<Team> {
    const prisma = tx || prismaService;
    return prisma.team.create({
      data: {
        organizationId: data.organizationId,
        name: data.name,
        slug: data.slug,
        description: data.description,
        metadata: data.metadata,
      },
    });
  }

  public async findById(id: string, tx?: Prisma.TransactionClient): Promise<Team | null> {
    const prisma = tx || prismaService;
    return prisma.team.findUnique({
      where: { id },
    });
  }

  public async findBySlug(organizationId: string, slug: string, tx?: Prisma.TransactionClient): Promise<Team | null> {
    const prisma = tx || prismaService;
    return prisma.team.findUnique({
      where: {
        organizationId_slug: {
          organizationId,
          slug,
        },
      },
    });
  }

  public async findByOrg(organizationId: string): Promise<Team[]> {
    return prismaService.team.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: { memberships: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  public async update(id: string, data: Prisma.TeamUpdateInput, tx?: Prisma.TransactionClient): Promise<Team> {
    const prisma = tx || prismaService;
    return prisma.team.update({
      where: { id },
      data,
    });
  }

  public async delete(id: string, tx?: Prisma.TransactionClient): Promise<Team> {
    const prisma = tx || prismaService;
    return prisma.team.delete({
      where: { id },
    });
  }

  public async addMember(teamId: string, userId: string, role = 'MEMBER', tx?: Prisma.TransactionClient): Promise<TeamMembership> {
    const prisma = tx || prismaService;
    return prisma.teamMembership.create({
      data: {
        teamId,
        userId,
        role,
      },
    });
  }

  public async removeMember(teamId: string, userId: string, tx?: Prisma.TransactionClient): Promise<void> {
    const prisma = tx || prismaService;
    await prisma.teamMembership.delete({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });
  }

  public async findTeamMemberships(teamId: string) {
    return prismaService.teamMembership.findMany({
      where: { teamId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });
  }

  public async findUserTeamIdsInOrg(organizationId: string, userId: string): Promise<string[]> {
    const memberships = await prismaService.teamMembership.findMany({
      where: {
        userId,
        team: { organizationId },
      },
      select: { teamId: true },
    });
    return memberships.map((m) => m.teamId);
  }

  public async countTeams(organizationId: string, tx?: Prisma.TransactionClient): Promise<number> {
    const prisma = tx || prismaService;
    return prisma.team.count({
      where: { organizationId },
    });
  }
}

export const teamRepository = new TeamRepository();
