import { Prisma, Organization, OrganizationStatus, OrganizationType } from '@prisma/client';
import { prismaService } from '../../../database/prisma.service';

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  type?: OrganizationType;
  ownerId: string;
  planId?: string;
  metadata?: Prisma.InputJsonValue;
}

export class OrganizationRepository {
  public async create(data: CreateOrganizationInput, tx?: Prisma.TransactionClient): Promise<Organization> {
    const prisma = tx || prismaService;
    return prisma.organization.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        logoUrl: data.logoUrl,
        type: data.type || OrganizationType.PERSONAL,
        ownerId: data.ownerId,
        planId: data.planId,
        metadata: data.metadata,
        status: OrganizationStatus.ACTIVE,
      },
    });
  }

  public async findById(id: string, tx?: Prisma.TransactionClient): Promise<Organization | null> {
    const prisma = tx || prismaService;
    return prisma.organization.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  public async findBySlug(slug: string, tx?: Prisma.TransactionClient): Promise<Organization | null> {
    const prisma = tx || prismaService;
    return prisma.organization.findFirst({
      where: {
        slug,
        deletedAt: null,
      },
    });
  }

  public async update(
    id: string,
    data: Prisma.OrganizationUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Organization> {
    const prisma = tx || prismaService;
    return prisma.organization.update({
      where: { id },
      data,
    });
  }

  public async softDelete(id: string, tx?: Prisma.TransactionClient): Promise<Organization> {
    const prisma = tx || prismaService;
    return prisma.organization.update({
      where: { id },
      data: {
        status: OrganizationStatus.DELETED,
        deletedAt: new Date(),
      },
    });
  }

  public async findUserOrganizations(userId: string): Promise<Organization[]> {
    return prismaService.organization.findMany({
      where: {
        deletedAt: null,
        status: { not: OrganizationStatus.DELETED },
        memberships: {
          some: {
            userId,
            status: 'ACTIVE',
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}

export const organizationRepository = new OrganizationRepository();
