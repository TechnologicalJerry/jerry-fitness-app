import { FastifyInstance } from 'fastify';
import { organizationController } from '../controllers/organization.controller';
import { membershipController } from '../controllers/membership.controller';
import { invitationController } from '../controllers/invitation.controller';
import { teamController } from '../controllers/team.controller';
import { settingsController } from '../controllers/settings.controller';
import { domainController } from '../controllers/domain.controller';
import { resolveTenantContextHook } from '../context/tenant.context';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  transferOwnershipSchema,
  createInvitationSchema,
  createTeamSchema,
  addTeamMemberSchema,
  updateMemberRoleSchema,
  addDomainSchema,
} from '../schemas/organization.schema';

export async function organizationRoutes(fastify: FastifyInstance): Promise<void> {
  // Public/User accept invitation endpoint (doesn't require org header)
  fastify.post(
    '/organization-invitations/:token/accept',
    { onRequest: [fastify.authenticate] },
    invitationController.acceptInvitation,
  );

  // User list organizations endpoint
  fastify.get('/organizations', { onRequest: [fastify.authenticate] }, organizationController.getUserOrganizations);

  // User create organization endpoint
  fastify.post(
    '/organizations',
    {
      onRequest: [fastify.authenticate],
      schema: createOrganizationSchema,
    },
    organizationController.createOrganization,
  );

  // Switch active organization
  fastify.post(
    '/organizations/:organizationId/switch',
    { onRequest: [fastify.authenticate] },
    organizationController.switchOrganization,
  );

  // Organization-scoped sub-router hook
  fastify.register(async (orgScope) => {
    orgScope.addHook('onRequest', orgScope.authenticate);
    orgScope.addHook('onRequest', resolveTenantContextHook);

    // Organization Details & Admin
    orgScope.get('/organizations/:organizationId', organizationController.getOrganization);
    orgScope.patch(
      '/organizations/:organizationId',
      { schema: updateOrganizationSchema },
      organizationController.updateOrganization,
    );
    orgScope.delete('/organizations/:organizationId', organizationController.deleteOrganization);
    orgScope.post(
      '/organizations/:organizationId/transfer-ownership',
      { schema: transferOwnershipSchema },
      organizationController.transferOwnership,
    );
    orgScope.get('/organizations/:organizationId/quota', organizationController.getQuotaUsage);
    orgScope.get('/organizations/:organizationId/audit-logs', organizationController.getAuditLogs);

    // Members Management
    orgScope.get('/organizations/:organizationId/members', membershipController.getMembers);
    orgScope.patch(
      '/organizations/:organizationId/members/:userId/role',
      { schema: updateMemberRoleSchema },
      membershipController.updateMemberRole,
    );
    orgScope.patch(
      '/organizations/:organizationId/members/:userId/status',
      membershipController.updateMemberStatus,
    );
    orgScope.delete('/organizations/:organizationId/members/:userId', membershipController.removeMember);

    // Invitations Management
    orgScope.post(
      '/organizations/:organizationId/invitations',
      { schema: createInvitationSchema },
      invitationController.createInvitation,
    );
    orgScope.get('/organizations/:organizationId/invitations', invitationController.getInvitations);
    orgScope.post(
      '/organizations/:organizationId/invitations/:invitationId/resend',
      invitationController.resendInvitation,
    );
    orgScope.delete(
      '/organizations/:organizationId/invitations/:invitationId',
      invitationController.revokeInvitation,
    );

    // Teams Management
    orgScope.post(
      '/organizations/:organizationId/teams',
      { schema: createTeamSchema },
      teamController.createTeam,
    );
    orgScope.get('/organizations/:organizationId/teams', teamController.getTeams);
    orgScope.get('/organizations/:organizationId/teams/:teamId', teamController.getTeam);
    orgScope.patch('/organizations/:organizationId/teams/:teamId', teamController.updateTeam);
    orgScope.delete('/organizations/:organizationId/teams/:teamId', teamController.deleteTeam);

    // Team Members Management
    orgScope.post(
      '/organizations/:organizationId/teams/:teamId/members',
      { schema: addTeamMemberSchema },
      teamController.addTeamMember,
    );
    orgScope.get('/organizations/:organizationId/teams/:teamId/members', teamController.getTeamMembers);
    orgScope.delete(
      '/organizations/:organizationId/teams/:teamId/members/:userId',
      teamController.removeTeamMember,
    );

    // Settings
    orgScope.get('/organizations/:organizationId/settings', settingsController.getSettings);
    orgScope.patch('/organizations/:organizationId/settings', settingsController.updateSettings);

    // Custom Domains
    orgScope.post(
      '/organizations/:organizationId/domains',
      { schema: addDomainSchema },
      domainController.addDomain,
    );
    orgScope.get('/organizations/:organizationId/domains', domainController.getDomains);
    orgScope.post(
      '/organizations/:organizationId/domains/:domainId/verify',
      domainController.verifyDomain,
    );
    orgScope.delete('/organizations/:organizationId/domains/:domainId', domainController.removeDomain);
  });
}
