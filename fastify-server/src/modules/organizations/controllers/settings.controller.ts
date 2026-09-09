import { FastifyRequest, FastifyReply } from 'fastify';
import { settingsService } from '../services/settings.service';
import { authorizationService } from '../permissions/authorization.service';

export class SettingsController {
  public async getSettings(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { organizationId } = request.params as { organizationId: string };

    authorizationService.assertCan(request.tenant, 'organization.settings.read');

    const settings = await settingsService.getSettings(organizationId);
    return reply.send({
      success: true,
      data: settings,
    });
  }

  public async updateSettings(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { organizationId } = request.params as { organizationId: string };
    const actorUserId = request.user!.id;
    const body = request.body as any;

    authorizationService.assertCan(request.tenant, 'organization.settings.update');

    const settings = await settingsService.updateSettings(organizationId, body, actorUserId);
    return reply.send({
      success: true,
      data: settings,
    });
  }
}

export const settingsController = new SettingsController();
