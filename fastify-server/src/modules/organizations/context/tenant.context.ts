import { FastifyRequest, FastifyReply } from 'fastify';
import { organizationService } from '../services/organization.service';
import { authorizationService } from '../permissions/authorization.service';
import { OrganizationPermission } from '../permissions/permission.types';
import { UnauthorizedError } from '../../../common/errors/common-errors';

export async function resolveTenantContextHook(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  if (!request.user) {
    return;
  }

  const headerOrgId = request.headers['x-organization-id'] as string | undefined;
  const paramOrgId = (request.params as any)?.organizationId as string | undefined;
  const queryOrgId = (request.query as any)?.organizationId as string | undefined;

  const targetOrgId = paramOrgId || headerOrgId || queryOrgId;

  try {
    const tenantContext = await organizationService.resolveTenantContext(request.user.id, targetOrgId);
    request.tenant = tenantContext;
  } catch (err) {
    // If explicit org ID was provided but user lacks access, rethrow
    if (targetOrgId) {
      throw err;
    }
  }
}

export function requireTenantPermission(permission: OrganizationPermission) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!request.tenant) {
      await resolveTenantContextHook(request, _reply);
    }

    authorizationService.assertCan(request.tenant, permission);
  };
}
