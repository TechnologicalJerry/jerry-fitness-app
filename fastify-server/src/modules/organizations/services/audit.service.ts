import { Prisma } from '@prisma/client';
import { auditRepository, CreateAuditLogInput } from '../repositories/audit.repository';
import { logger } from '../../../observability/logger';

export class AuditService {
  public async log(data: CreateAuditLogInput, tx?: Prisma.TransactionClient): Promise<void> {
    try {
      await auditRepository.create(data, tx);
    } catch (err) {
      logger.error({ err, data }, 'Failed to record organization audit log');
    }
  }

  public async getOrgAuditLogs(
    organizationId: string,
    options?: { page?: number; limit?: number; action?: string; resource?: string },
  ) {
    return auditRepository.findByOrg(organizationId, options);
  }
}

export const auditService = new AuditService();
