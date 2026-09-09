import { FastifyRequest, FastifyReply } from 'fastify';
import { domainService } from '../services/domain.service';
import { authorizationService } from '../permissions/authorization.service';

export class DomainController {
  public async addDomain(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { organizationId } = request.params as { organizationId: string };
    const actorUserId = request.user!.id;
    const { domain } = request.body as { domain: string };

    authorizationService.assertCan(request.tenant, 'organization.domains.manage');

    const result = await domainService.addDomain(organizationId, domain, actorUserId);
    return reply.status(201).send({
      success: true,
      data: result,
    });
  }

  public async getDomains(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { organizationId } = request.params as { organizationId: string };

    authorizationService.assertCan(request.tenant, 'organization.read');

    const domains = await domainService.getOrgDomains(organizationId);
    return reply.send({
      success: true,
      data: domains,
    });
  }

  public async verifyDomain(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { organizationId, domainId } = request.params as { organizationId: string; domainId: string };
    const actorUserId = request.user!.id;

    authorizationService.assertCan(request.tenant, 'organization.domains.manage');

    const result = await domainService.verifyDomain(organizationId, domainId, actorUserId);
    return reply.send({
      success: true,
      data: result,
    });
  }

  public async removeDomain(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { organizationId, domainId } = request.params as { organizationId: string; domainId: string };
    const actorUserId = request.user!.id;

    authorizationService.assertCan(request.tenant, 'organization.domains.manage');

    await domainService.removeDomain(organizationId, domainId, actorUserId);
    return reply.send({
      success: true,
      message: 'Domain removed successfully',
    });
  }
}

export const domainController = new DomainController();
