import { Prisma, OrganizationSettings } from '@prisma/client';
import { prismaService } from '../../../database/prisma.service';

export class SettingsRepository {
  public async createDefault(organizationId: string, tx?: Prisma.TransactionClient): Promise<OrganizationSettings> {
    const prisma = tx || prismaService;
    return prisma.organizationSettings.create({
      data: {
        organizationId,
        timezone: 'UTC',
        locale: 'en-US',
        defaultUnits: 'metric',
      },
    });
  }

  public async findByOrgId(organizationId: string, tx?: Prisma.TransactionClient): Promise<OrganizationSettings | null> {
    const prisma = tx || prismaService;
    return prisma.organizationSettings.findUnique({
      where: { organizationId },
    });
  }

  public async update(
    organizationId: string,
    data: Prisma.OrganizationSettingsUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<OrganizationSettings> {
    const prisma = tx || prismaService;
    return prisma.organizationSettings.upsert({
      where: { organizationId },
      update: data,
      create: {
        organizationId,
        ...data,
      } as Prisma.OrganizationSettingsUncheckedCreateInput,
    });
  }
}

export const settingsRepository = new SettingsRepository();
