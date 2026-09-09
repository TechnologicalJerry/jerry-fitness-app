import { AppError } from '../../../common/errors/app-error';
import { ErrorCodes } from '../../../common/constants/error-codes';

export class OrganizationNotFoundError extends AppError {
  constructor(identifier?: string) {
    super(
      `Organization ${identifier ? `'${identifier}' ` : ''}not found`,
      404,
      ErrorCodes.ORGANIZATION_NOT_FOUND,
    );
  }
}

export class OrganizationSlugExistsError extends AppError {
  constructor(slug: string) {
    super(`Organization slug '${slug}' already exists`, 409, ErrorCodes.ORGANIZATION_SLUG_EXISTS);
  }
}

export class MemberAlreadyExistsError extends AppError {
  constructor(emailOrUserId: string) {
    super(`User '${emailOrUserId}' is already a member of this organization`, 409, ErrorCodes.MEMBER_ALREADY_EXISTS);
  }
}

export class MemberNotFoundError extends AppError {
  constructor(userId: string) {
    super(`Member '${userId}' not found in this organization`, 404, ErrorCodes.MEMBER_NOT_FOUND);
  }
}

export class InvitationNotFoundError extends AppError {
  constructor() {
    super('Invitation not found or invalid token', 404, ErrorCodes.INVITATION_NOT_FOUND);
  }
}

export class InvitationExpiredError extends AppError {
  constructor() {
    super('Invitation has expired or was revoked', 400, ErrorCodes.INVITATION_EXPIRED);
  }
}

export class TeamNotFoundError extends AppError {
  constructor(teamId: string) {
    super(`Team '${teamId}' not found`, 404, ErrorCodes.TEAM_NOT_FOUND);
  }
}

export class TeamSlugExistsError extends AppError {
  constructor(slug: string) {
    super(`Team slug '${slug}' already exists in this organization`, 409, ErrorCodes.TEAM_SLUG_EXISTS);
  }
}

export class QuotaExceededError extends AppError {
  constructor(resource: string, limit: number) {
    super(
      `Organization limit reached for ${resource} (max: ${limit})`,
      403,
      ErrorCodes.QUOTA_EXCEEDED,
      { resource, limit },
    );
  }
}

export class DomainAlreadyExistsError extends AppError {
  constructor(domain: string) {
    super(`Domain '${domain}' is already registered`, 409, ErrorCodes.DOMAIN_ALREADY_EXISTS);
  }
}
