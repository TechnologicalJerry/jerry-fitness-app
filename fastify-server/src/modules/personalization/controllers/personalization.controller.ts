import { FastifyRequest, FastifyReply } from 'fastify';
import { personalizationService } from '../services/personalization.service';
import { formatSuccessResponse } from '../../../common/utils/response-formatter';
import { HttpStatus } from '../../../common/constants/http-status';
import { UpdatePersonalizationProfileDto, SetUserPreferenceDto } from '../types/personalization.types';

export class PersonalizationController {
  public async getProfile(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const profile = await personalizationService.getProfile(userId);
    return reply.status(HttpStatus.OK).send(formatSuccessResponse(profile));
  }

  public async updateProfile(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const body = request.body as UpdatePersonalizationProfileDto;
    const profile = await personalizationService.updateProfile(userId, body);
    return reply.status(HttpStatus.OK).send(formatSuccessResponse(profile));
  }

  public async getPreferences(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const query = request.query as { category?: string };
    const preferences = await personalizationService.getPreferences(userId, query.category);
    return reply.status(HttpStatus.OK).send(formatSuccessResponse(preferences));
  }

  public async setPreference(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const body = request.body as SetUserPreferenceDto;
    const preference = await personalizationService.setPreference(userId, body);
    return reply.status(HttpStatus.OK).send(formatSuccessResponse(preference));
  }
}

export const personalizationController = new PersonalizationController();
