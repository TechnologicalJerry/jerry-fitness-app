import crypto from 'crypto';
import { DomainVerificationStatus, OrganizationDomain } from '@prisma/client';
import { domainRepository } from '../repositories/domain.repository';
import { DomainAlreadyExistsError } from '../errors/organization.errors';
import { auditService } from './audit.service';

export interface OrganizationDomainVerificationProvider {
  verifyTxtRecord(domain: string, expectedToken: string): Promise<boolean>;
}

export class MockDnsDomainVerificationProvider implements OrganizationDomainVerificationProvider {
  public async verifyTxtRecord(_domain: string, _expectedToken: string): Promise<boolean> {
    // In mock/test environment, always succeeds or simulates validation
    return true;
  }
}

export class DomainService {
  constructor(
    private readonly verificationProvider: OrganizationDomainVerificationProvider = new MockDnsDomainVerificationProvider(),
  ) {}

  public async addDomain(organizationId: string, domainName: string, actorUserId: string): Promise<OrganizationDomain> {
    const cleanDomain = domainName.trim().toLowerCase();

    const existing = await domainRepository.findByDomain(cleanDomain);
    if (existing) {
      throw new DomainAlreadyExistsError(cleanDomain);
    }

    const verificationToken = `jerry-verify-${crypto.randomBytes(16).toString('hex')}`;
    const domainRecord = await domainRepository.create(organizationId, cleanDomain, verificationToken);

    await auditService.log({
      organizationId,
      actorUserId,
      action: 'domain.added',
      resource: 'OrganizationDomain',
      resourceId: domainRecord.id,
      details: { domain: cleanDomain },
    });

    return domainRecord;
  }

  public async verifyDomain(organizationId: string, domainId: string, actorUserId: string): Promise<OrganizationDomain> {
    const domains = await domainRepository.findByOrg(organizationId);
    const domain = domains.find((d) => d.id === domainId);
    if (!domain) {
      throw new Error('Domain not found');
    }

    const isVerified = await this.verificationProvider.verifyTxtRecord(domain.domain, domain.verificationToken);

    const updated = await domainRepository.updateVerificationStatus(
      domain.id,
      isVerified ? DomainVerificationStatus.VERIFIED : DomainVerificationStatus.FAILED,
      isVerified ? new Date() : undefined,
    );

    if (isVerified) {
      await auditService.log({
        organizationId,
        actorUserId,
        action: 'domain.verified',
        resource: 'OrganizationDomain',
        resourceId: domain.id,
        details: { domain: domain.domain },
      });
    }

    return updated;
  }

  public async getOrgDomains(organizationId: string): Promise<OrganizationDomain[]> {
    return domainRepository.findByOrg(organizationId);
  }

  public async removeDomain(organizationId: string, domainId: string, actorUserId: string): Promise<void> {
    const domains = await domainRepository.findByOrg(organizationId);
    const domain = domains.find((d) => d.id === domainId);
    if (domain) {
      await domainRepository.delete(domainId);
      await auditService.log({
        organizationId,
        actorUserId,
        action: 'domain.removed',
        resource: 'OrganizationDomain',
        resourceId: domainId,
        details: { domain: domain.domain },
      });
    }
  }
}

export const domainService = new DomainService();
