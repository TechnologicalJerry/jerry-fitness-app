import { Prisma, OrganizationType } from '@prisma/client';
import { organizationRepository } from '../repositories/organization.repository';
import { membershipRepository } from '../repositories/membership.repository';
import { teamRepository } from '../repositories/team.repository';
import { QuotaExceededError, OrganizationNotFoundError } from '../errors/organization.errors';

export interface OrgQuotaLimits {
  maxMembers: number;
  maxTrainers: number;
  maxTeams: number;
  maxClientsPerTrainer: number;
  maxStorageMb: number;
}

export class QuotaService {
  private getDefaultLimits(type: OrganizationType): OrgQuotaLimits {
    switch (type) {
      case OrganizationType.PERSONAL:
        return {
          maxMembers: 1,
          maxTrainers: 0,
          maxTeams: 1,
          maxClientsPerTrainer: 0,
          maxStorageMb: 500,
        };
      case OrganizationType.GYM:
      case OrganizationType.FITNESS_STUDIO:
      case OrganizationType.TRAINING_BUSINESS:
        return {
          maxMembers: 500,
          maxTrainers: 20,
          maxTeams: 20,
          maxClientsPerTrainer: 50,
          maxStorageMb: 50000,
        };
      case OrganizationType.CORPORATE:
      case OrganizationType.SPORTS_TEAM:
      case OrganizationType.ENTERPRISE:
        return {
          maxMembers: 10000,
          maxTrainers: 100,
          maxTeams: 100,
          maxClientsPerTrainer: 100,
          maxStorageMb: 500000,
        };
      case OrganizationType.OTHER:
      default:
        return {
          maxMembers: 10,
          maxTrainers: 2,
          maxTeams: 2,
          maxClientsPerTrainer: 10,
          maxStorageMb: 2000,
        };
    }
  }

  public async getQuotaUsage(organizationId: string, tx?: Prisma.TransactionClient) {
    const org = await organizationRepository.findById(organizationId, tx);
    if (!org) throw new OrganizationNotFoundError(organizationId);

    const limits = this.getDefaultLimits(org.type);

    const [memberCount, trainerCount, teamCount] = await Promise.all([
      membershipRepository.countActiveMembers(organizationId, tx),
      membershipRepository.countActiveTrainers(organizationId, tx),
      teamRepository.countTeams(organizationId, tx),
    ]);

    return {
      limits,
      usage: {
        members: memberCount,
        trainers: trainerCount,
        teams: teamCount,
      },
    };
  }

  public async assertWithinLimit(
    organizationId: string,
    resource: 'members' | 'trainers' | 'teams',
    increment = 1,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const { limits, usage } = await this.getQuotaUsage(organizationId, tx);

    if (resource === 'members') {
      if (usage.members + increment > limits.maxMembers) {
        throw new QuotaExceededError('members', limits.maxMembers);
      }
    } else if (resource === 'trainers') {
      if (usage.trainers + increment > limits.maxTrainers) {
        throw new QuotaExceededError('trainers', limits.maxTrainers);
      }
    } else if (resource === 'teams') {
      if (usage.teams + increment > limits.maxTeams) {
        throw new QuotaExceededError('teams', limits.maxTeams);
      }
    }
  }
}

export const quotaService = new QuotaService();
