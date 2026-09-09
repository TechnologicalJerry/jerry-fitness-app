# Stage 16 — Multi-Tenancy, Teams & Organizations Architecture

## Overview

Stage 16 transforms the Jerry Fitness App into a enterprise-ready multi-tenant fitness platform capable of serving individual users, fitness trainers, gyms, fitness studios, corporate wellness programs, and enterprise sports organizations.

---

## 1. Multi-Tenant Model

```text
User
 ├── Personal Workspace (Personal Organization)
 ├── Organization A (Role: OWNER)
 │    ├── Team 1 (Strength)
 │    ├── Team 2 (HIIT)
 │    └── Team 3 (Personal Training)
 └── Organization B (Role: TRAINER)
      ├── Team 1 (Endurance)
      └── Team 2 (Mobility)
```

- **User**: Global identity across the platform.
- **Organization**: Independent tenant boundary with custom branding, settings, custom domains, quotas, and billing.
- **OrganizationMembership**: Determines user's role (`OWNER`, `ADMIN`, `MANAGER`, `TRAINER`, `MEMBER`, `VIEWER`) and status (`INVITED`, `ACTIVE`, `SUSPENDED`, `REMOVED`) within an organization.
- **Team**: Sub-group inside an organization for grouping members and coaches.

---

## 2. Organization Lifecycle & Status

An organization can be in one of four lifecycle states:
- `ACTIVE`: Normal operations enabled.
- `SUSPENDED`: Access blocked for write operations; read-only access where permitted.
- `ARCHIVED`: Archived state for legacy organizations.
- `DELETED`: Soft deleted; all tenant access blocked.

---

## 3. Authorization & Permissions Engine

The system uses `AuthorizationService` for granular permission evaluation. Rather than relying exclusively on global user roles, tenant operations check organization-level role permissions (`ROLE_PERMISSIONS_MAP`):

### Roles & Responsibilities
- **OWNER**: Full administrative control, billing management, ownership transfer, organization deletion.
- **ADMIN**: Member management, team management, setting updates, content moderation.
- **MANAGER**: Team oversight, program assignments, team member management.
- **TRAINER**: Assigned client progress review, workout creation, nutrition plan assignments.
- **MEMBER**: Access permitted organization workouts, teams, and personal progress.
- **VIEWER**: Read-only access to permitted organization resources.

---

## 4. Tenant Context & Switching

### Fastify Request Context
Each request authenticated with organization context populates:
- `request.tenant` = `{ organizationId, membershipId, role, membershipStatus, organizationStatus, permissions, teamIds }`

### Active Organization Switching
Users belonging to multiple organizations can switch their active context:
```http
POST /api/v1/organizations/:organizationId/switch
```
The active organization context is cached in Redis (`user:{userId}:active_org`) for smooth navigation.

---

## 5. Personal Workspace Compatibility

For existing single-user workflows, the system automatically ensures a default **Personal Organization** (`type: PERSONAL`, name: `${user.firstName}'s Personal Workspace`) when a user has no active organization memberships. This maintains 100% backward compatibility for single-user endpoints.

---

## 6. Invitations & Token Hashing

1. Inviter generates invitation specifying email, role, and optional team ID.
2. Cryptographically secure 256-bit token is generated (`crypto.randomBytes(32)`).
3. SHA-256 hash of token (`tokenHash`) is stored in PostgreSQL; raw token is sent to recipient.
4. Recipient accepts via `POST /api/v1/organization-invitations/:token/accept` in an atomic PostgreSQL transaction.

---

## 7. Quota Enforcement (`QuotaService`)

Enforces organization entitlements server-side before creating resources:
- `maxMembers`
- `maxTrainers`
- `maxTeams`
- `maxStorageMb`

Atomic database checks prevent race conditions during concurrent member invites or team creation.

---

## 8. Cross-Subsystem Tenant Isolation

1. **Redis**: Key prefixing `org:{organizationId}:{key}` ensures strict cache isolation.
2. **BullMQ Queues**: Background jobs carry `{ organizationId, userId, requestId }` metadata.
3. **WebSockets**: Real-time channel subscriptions (`org:{orgId}`, `org:{orgId}:team:{teamId}`) require authenticated organization/team membership verification before joining.
4. **Media Storage**: Object keys follow `organizations/{organizationId}/media/{mediaId}/{variant}`.
5. **Audit Logging**: Structured audit entries recorded for creation, member role changes, invitations, ownership transfers, and domain updates.

---

## 9. API Reference Summary

- `POST /api/v1/organizations` — Create organization
- `GET /api/v1/organizations` — List user organizations
- `GET /api/v1/organizations/:organizationId` — Get organization details
- `PATCH /api/v1/organizations/:organizationId` — Update organization
- `DELETE /api/v1/organizations/:organizationId` — Soft delete organization
- `POST /api/v1/organizations/:organizationId/switch` — Switch active organization
- `POST /api/v1/organizations/:organizationId/transfer-ownership` — Transfer ownership
- `GET /api/v1/organizations/:organizationId/quota` — Get quota usage
- `GET /api/v1/organizations/:organizationId/audit-logs` — Query audit logs
- `GET /api/v1/organizations/:organizationId/members` — List members
- `PATCH /api/v1/organizations/:organizationId/members/:userId/role` — Update member role
- `PATCH /api/v1/organizations/:organizationId/members/:userId/status` — Update member status
- `DELETE /api/v1/organizations/:organizationId/members/:userId` — Remove member
- `POST /api/v1/organizations/:organizationId/invitations` — Send invitation
- `GET /api/v1/organizations/:organizationId/invitations` — List pending invitations
- `POST /api/v1/organization-invitations/:token/accept` — Accept invitation
- `POST /api/v1/organizations/:organizationId/teams` — Create team
- `GET /api/v1/organizations/:organizationId/teams` — List teams
- `POST /api/v1/organizations/:organizationId/teams/:teamId/members` — Add team member
- `GET /api/v1/organizations/:organizationId/domains` — List custom domains
- `POST /api/v1/organizations/:organizationId/domains` — Add custom domain
- `POST /api/v1/organizations/:organizationId/domains/:domainId/verify` — Verify custom domain
