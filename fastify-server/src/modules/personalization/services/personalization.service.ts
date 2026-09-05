import { PersonalizationProfile, UserPreference } from '@prisma/client';
import {
  personalizationRepository,
  PersonalizationRepository,
} from '../repositories/personalization.repository';
import { UpdatePersonalizationProfileDto, SetUserPreferenceDto } from '../types/personalization.types';

export class PersonalizationService {
  constructor(private repo: PersonalizationRepository = personalizationRepository) {}

  public async getProfile(userId: string): Promise<PersonalizationProfile> {
    let profile = await this.repo.getProfileByUserId(userId);
    if (!profile) {
      profile = await this.repo.upsertProfile(userId, {});
    }
    return profile;
  }

  public async updateProfile(
    userId: string,
    dto: UpdatePersonalizationProfileDto,
  ): Promise<PersonalizationProfile> {
    return this.repo.upsertProfile(userId, dto);
  }

  public async getPreferences(userId: string, category?: string): Promise<UserPreference[]> {
    return this.repo.getPreferences(userId, category);
  }

  public async setPreference(userId: string, dto: SetUserPreferenceDto): Promise<UserPreference> {
    return this.repo.upsertPreference(userId, dto);
  }
}

export const personalizationService = new PersonalizationService();
