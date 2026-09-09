import { FastifyRequest, FastifyReply } from 'fastify';
import { organizationService } from '../services/organization.service';
import { quotaService } from '../services/quota.service';
import { auditService } from '../services/audit.service';
import { authorizationService } from '../permissions/authorization.service';

export class OrganizationController {
  public async createOrganization(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const body = request.body as any;

    const org = await organizationService.createOrganization(userId, body);
    return reply.status(201).send({
      success: true,
      data: org,
    });
  }

  public async getUserOrganizations(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const orgs = await organizationService.getUserOrganizations(userId);
    return reply.send({
      success: true,
      data: orgs,
    });
  }

  public async getOrganization(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { organizationId } = request.params as { organizationId: string };
    authorizationService.assertCan(request.tenant, 'organization.read');

    const org = await organizationService.getOrganizationById(organizationId);
    return reply.send({
      success: true,
      data: org,
    });
  }

  public async updateOrganization(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { organizationId } = request.params as { organizationId: string };
    const userId = request.user!.id;
    authorizationService.assertCan(request.tenant, 'organization.update');

    const body = request.body as any;
    const updated = await organizationService.updateOrganization(organizationId, body, userId);
    return reply.send({
      success: true,
      data: updated,
    });
  }

  public async deleteOrganization(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { organizationId } = request.params as { organizationId: string };
    const userId = request.user!.id;
    authorizationService.assertCan(request.tenant, 'organization.delete');

    await organizationService.softDeleteOrganization(organizationId, userId);
    return reply.send({
      success: true,
      message: 'Organization deleted successfully',
    });
  }

  public async switchOrganization(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { organizationId } = request.params as { organizationId: string };
    const userId = request.user!.id;

    const context = await organizationService.switchActiveOrganization(userId, organizationId);
    return reply.send({
      success: true,
      data: context,
    });
  }

  public async transferOwnership(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { organizationId } = request.params as { organizationId: string };
    const userId = request.user!.id;
    const { newOwnerUserId } = request.body as { newOwnerUserId: string };

    authorizationService.assertCan(request.tenant, 'organization.transfer_ownership');

    const updated = await organizationService.transferOwnership(organizationId, newOwnerUserId, userId);
    return reply.send({
      success: true,
      data: updated,
    });
  }

  public async getQuotaUsage(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { organizationId } = request.params as { organizationId: string };
    authorizationService.assertCan(request.tenant, 'organization.read');

    const usage = await quotaService.getQuotaUsage(organizationId);
    return reply.send({
      success: true,
      data: usage,
    });
  }

  public async getAuditLogs(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { organizationId } = request.params as { organizationId: string };
    const query = request.query as any;

    authorizationService.assertCan(request.tenant, 'organization.audit.read');

    const logs = await auditService.getOrgAuditLogs(organizationId, {
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 20,
      action: query.action,
      resource: query.resource,
    });

    return reply.send({
      success: true,
      data: logs,
    });
  }
}

export const organizationController = new OrganizationController();
