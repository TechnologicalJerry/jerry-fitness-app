import { OrganizationRole, OrganizationStatus, MembershipStatus } from '@prisma/client';

export type OrganizationPermission =
  // Organization lifecycle
  | 'organization.read'
  | 'organization.update'
  | 'organization.delete'
  | 'organization.transfer_ownership'

  // Members
  | 'organization.members.read'
  | 'organization.members.invite'
  | 'organization.members.update'
  | 'organization.members.remove'

  // Teams
  | 'organization.teams.read'
  | 'organization.teams.create'
  | 'organization.teams.update'
  | 'organization.teams.delete'
  | 'organization.teams.manage_members'

  // Settings & Domains
  | 'organization.settings.read'
  | 'organization.settings.update'
  | 'organization.domains.manage'

  // Billing & Quotas
  | 'organization.billing.read'
  | 'organization.billing.manage'

  // Analytics & Audit
  | 'organization.analytics.read'
  | 'organization.audit.read'

  // Trainer & Clients
  | 'trainer.clients.read'
  | 'trainer.clients.manage'

  // Workouts, Nutrition, Media
  | 'workouts.read'
  | 'workouts.create'
  | 'workouts.update'
  | 'workouts.assign'
  | 'nutrition.read'
  | 'nutrition.manage'
  | 'media.read'
  | 'media.manage';

export interface TenantContext {
  organizationId: string;
  membershipId: string;
  role: OrganizationRole;
  membershipStatus: MembershipStatus;
  organizationStatus: OrganizationStatus;
  permissions: OrganizationPermission[];
  teamIds: string[];
}
