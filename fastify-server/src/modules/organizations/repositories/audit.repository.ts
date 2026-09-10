import { Prisma, AuditLog } from '@prisma/client';
import { prismaService } from '../../../database/prisma.service';

export interface CreateAuditLogInput {
  organizationId?: string;
  actorUserId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

export class AuditRepository {
  public async create(data: CreateAuditLogInput, tx?: Prisma.TransactionClient): Promise<AuditLog> {
    const prisma = tx || prismaService;
    return prisma.auditLog.create({
      data: {
        organizationId: data.organizationId,
        actorUserId: data.actorUserId,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        details: data.details,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        requestId: data.requestId,
      },
    });
  }

  public async findByOrg(
    organizationId: string,
    options?: { page?: number; limit?: number; action?: string; resource?: string },
  ) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {
      organizationId,
      ...(options?.action ? { action: options.action } : {}),
      ...(options?.resource ? { resource: options.resource } : {}),
    };

    const [items, total] = await Promise.all([
      prismaService.auditLog.findMany({
        where,
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prismaService.auditLog.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

export const auditRepository = new AuditRepository();
