import { Prisma, OrganizationMembership, OrganizationRole, MembershipStatus } from '@prisma/client';
import { prismaService } from '../../../database/prisma.service';

export interface CreateMembershipInput {
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  status?: MembershipStatus;
  invitedBy?: string;
}

export class MembershipRepository {
  public async create(data: CreateMembershipInput, tx?: Prisma.TransactionClient): Promise<OrganizationMembership> {
    const prisma = tx || prismaService;
    return prisma.organizationMembership.create({
      data: {
        organizationId: data.organizationId,
        userId: data.userId,
        role: data.role,
        status: data.status || MembershipStatus.ACTIVE,
        invitedBy: data.invitedBy,
      },
    });
  }

  public async findByOrgAndUser(
    organizationId: string,
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<OrganizationMembership | null> {
    const prisma = tx || prismaService;
    return prisma.organizationMembership.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
      include: {
        organization: true,
      },
    });
  }

  public async findUserActiveMemberships(userId: string): Promise<OrganizationMembership[]> {
    return prismaService.organizationMembership.findMany({
      where: {
        userId,
        status: MembershipStatus.ACTIVE,
        organization: {
          deletedAt: null,
          status: { not: 'DELETED' },
        },
      },
      include: {
        organization: true,
      },
    });
  }

  public async findOrgMembers(
    organizationId: string,
    options?: { page?: number; limit?: number; role?: OrganizationRole; status?: MembershipStatus },
  ) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.OrganizationMembershipWhereInput = {
      organizationId,
      ...(options?.role ? { role: options.role } : {}),
      ...(options?.status ? { status: options.status } : { status: MembershipStatus.ACTIVE }),
    };

    const [items, total] = await Promise.all([
      prismaService.organizationMembership.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              status: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { joinedAt: 'desc' },
      }),
      prismaService.organizationMembership.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  public async updateRole(
    membershipId: string,
    role: OrganizationRole,
    tx?: Prisma.TransactionClient,
  ): Promise<OrganizationMembership> {
    const prisma = tx || prismaService;
    return prisma.organizationMembership.update({
      where: { id: membershipId },
      data: { role },
    });
  }

  public async updateStatus(
    membershipId: string,
    status: MembershipStatus,
    tx?: Prisma.TransactionClient,
  ): Promise<OrganizationMembership> {
    const prisma = tx || prismaService;
    return prisma.organizationMembership.update({
      where: { id: membershipId },
      data: { status },
    });
  }

  public async countActiveMembers(organizationId: string, tx?: Prisma.TransactionClient): Promise<number> {
    const prisma = tx || prismaService;
    return prisma.organizationMembership.count({
      where: {
        organizationId,
        status: MembershipStatus.ACTIVE,
      },
    });
  }

  public async countActiveTrainers(organizationId: string, tx?: Prisma.TransactionClient): Promise<number> {
    const prisma = tx || prismaService;
    return prisma.organizationMembership.count({
      where: {
        organizationId,
        role: OrganizationRole.TRAINER,
        status: MembershipStatus.ACTIVE,
      },
    });
  }
}

export const membershipRepository = new MembershipRepository();
