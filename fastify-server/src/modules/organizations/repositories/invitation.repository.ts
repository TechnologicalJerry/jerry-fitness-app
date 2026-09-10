import { Prisma, OrganizationInvitation, OrganizationRole, InvitationStatus } from '@prisma/client';
import { prismaService } from '../../../database/prisma.service';

export interface CreateInvitationInput {
  organizationId: string;
  email: string;
  role: OrganizationRole;
  teamId?: string;
  tokenHash: string;
  inviterId: string;
  expiresAt: Date;
}

export class InvitationRepository {
  public async create(data: CreateInvitationInput, tx?: Prisma.TransactionClient): Promise<OrganizationInvitation> {
    const prisma = tx || prismaService;
    return prisma.organizationInvitation.create({
      data: {
        organizationId: data.organizationId,
        email: data.email,
        role: data.role,
        teamId: data.teamId,
        tokenHash: data.tokenHash,
        inviterId: data.inviterId,
        expiresAt: data.expiresAt,
        status: InvitationStatus.PENDING,
      },
    });
  }

  public async findByTokenHash(tokenHash: string, tx?: Prisma.TransactionClient) {
    const prisma = tx || prismaService;
    return prisma.organizationInvitation.findUnique({
      where: { tokenHash },
      include: {
        organization: true,
        team: true,
      },
    });
  }

  public async findById(id: string, tx?: Prisma.TransactionClient): Promise<OrganizationInvitation | null> {
    const prisma = tx || prismaService;
    return prisma.organizationInvitation.findUnique({
      where: { id },
    });
  }

  public async findPendingByOrg(organizationId: string) {
    return prismaService.organizationInvitation.findMany({
      where: {
        organizationId,
        status: InvitationStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
      include: {
        inviter: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async findExistingPending(organizationId: string, email: string) {
    return prismaService.organizationInvitation.findFirst({
      where: {
        organizationId,
        email: email.toLowerCase(),
        status: InvitationStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
    });
  }

  public async updateStatus(
    id: string,
    status: InvitationStatus,
    acceptedAt?: Date,
    tx?: Prisma.TransactionClient,
  ): Promise<OrganizationInvitation> {
    const prisma = tx || prismaService;
    return prisma.organizationInvitation.update({
      where: { id },
      data: {
        status,
        ...(acceptedAt ? { acceptedAt } : {}),
      },
    });
  }
}

export const invitationRepository = new InvitationRepository();
