import { Prisma, OrganizationSettings } from '@prisma/client';
import { settingsRepository } from '../repositories/settings.repository';
import { auditService } from './audit.service';

export class SettingsService {
  public async getSettings(organizationId: string): Promise<OrganizationSettings> {
    let settings = await settingsRepository.findByOrgId(organizationId);
    if (!settings) {
      settings = await settingsRepository.createDefault(organizationId);
    }
    return settings;
  }

  public async updateSettings(
    organizationId: string,
    data: Prisma.OrganizationSettingsUpdateInput,
    actorUserId: string,
  ): Promise<OrganizationSettings> {
    const updated = await settingsRepository.update(organizationId, data);

    await auditService.log({
      organizationId,
      actorUserId,
      action: 'settings.updated',
      resource: 'OrganizationSettings',
      resourceId: updated.id,
      details: { updatedKeys: Object.keys(data) },
    });

    return updated;
  }
}

export const settingsService = new SettingsService();
