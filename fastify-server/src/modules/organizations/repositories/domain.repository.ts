import { Prisma, OrganizationDomain, DomainVerificationStatus } from '@prisma/client';
import { prismaService } from '../../../database/prisma.service';

export class DomainRepository {
  public async create(
    organizationId: string,
    domain: string,
    verificationToken: string,
    tx?: Prisma.TransactionClient,
  ): Promise<OrganizationDomain> {
    const prisma = tx || prismaService;
    return prisma.organizationDomain.create({
      data: {
        organizationId,
        domain: domain.toLowerCase(),
        verificationToken,
        verificationStatus: DomainVerificationStatus.PENDING,
      },
    });
  }

  public async findByDomain(domain: string, tx?: Prisma.TransactionClient): Promise<OrganizationDomain | null> {
    const prisma = tx || prismaService;
    return prisma.organizationDomain.findUnique({
      where: { domain: domain.toLowerCase() },
    });
  }

  public async findByOrg(organizationId: string): Promise<OrganizationDomain[]> {
    return prismaService.organizationDomain.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async updateVerificationStatus(
    id: string,
    status: DomainVerificationStatus,
    verifiedAt?: Date,
    tx?: Prisma.TransactionClient,
  ): Promise<OrganizationDomain> {
    const prisma = tx || prismaService;
    return prisma.organizationDomain.update({
      where: { id },
      data: {
        verificationStatus: status,
        verifiedAt,
      },
    });
  }

  public async delete(id: string, tx?: Prisma.TransactionClient): Promise<OrganizationDomain> {
    const prisma = tx || prismaService;
    return prisma.organizationDomain.delete({
      where: { id },
    });
  }
}

export const domainRepository = new DomainRepository();
