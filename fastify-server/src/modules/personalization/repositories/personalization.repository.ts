import { PersonalizationProfile, UserPreference, Prisma } from '@prisma/client';
import { prismaService } from '../../../database/prisma.service';
import { UpdatePersonalizationProfileDto, SetUserPreferenceDto } from '../types/personalization.types';

export class PersonalizationRepository {
  public async getProfileByUserId(userId: string): Promise<PersonalizationProfile | null> {
    return prismaService.personalizationProfile.findUnique({
      where: { userId },
    });
  }

  public async upsertProfile(
    userId: string,
    data: UpdatePersonalizationProfileDto,
  ): Promise<PersonalizationProfile> {
    const existing = await this.getProfileByUserId(userId);
    const newVersion = existing ? existing.version + 1 : 1;

    return prismaService.personalizationProfile.upsert({
      where: { userId },
      create: {
        userId,
        fitnessLevel: data.fitnessLevel ?? 'intermediate',
        primaryGoal: data.primaryGoal ?? 'GENERAL_FITNESS',
        secondaryGoals: data.secondaryGoals ?? [],
        trainingExperienceMonths: data.trainingExperienceMonths ?? 12,
        preferredDurationMinutes: data.preferredDurationMinutes ?? 45,
        preferredDays: data.preferredDays ?? ['mon', 'wed', 'fri'],
        preferredTimeOfDay: data.preferredTimeOfDay ?? 'morning',
        preferredLocation: data.preferredLocation ?? 'gym',
        availableEquipment: data.availableEquipment ?? ['dumbbells', 'barbell', 'bodyweight'],
        preferredWorkoutTypes: data.preferredWorkoutTypes ?? ['strength', 'hiit'],
        dislikedExercises: data.dislikedExercises ?? [],
        preferredExercises: data.preferredExercises ?? [],
        dietaryPreferences: data.dietaryPreferences ?? [],
        preferredMealFrequency: data.preferredMealFrequency ?? 3,
        activityLevel: data.activityLevel ?? 'moderate',
        recoveryPreferences: (data.recoveryPreferences as Prisma.InputJsonValue) ?? undefined,
        notificationPreferences: (data.notificationPreferences as Prisma.InputJsonValue) ?? undefined,
        version: 1,
      },
      update: {
        ...(data.fitnessLevel !== undefined && { fitnessLevel: data.fitnessLevel }),
        ...(data.primaryGoal !== undefined && { primaryGoal: data.primaryGoal }),
        ...(data.secondaryGoals !== undefined && { secondaryGoals: data.secondaryGoals }),
        ...(data.trainingExperienceMonths !== undefined && { trainingExperienceMonths: data.trainingExperienceMonths }),
        ...(data.preferredDurationMinutes !== undefined && { preferredDurationMinutes: data.preferredDurationMinutes }),
        ...(data.preferredDays !== undefined && { preferredDays: data.preferredDays }),
        ...(data.preferredTimeOfDay !== undefined && { preferredTimeOfDay: data.preferredTimeOfDay }),
        ...(data.preferredLocation !== undefined && { preferredLocation: data.preferredLocation }),
        ...(data.availableEquipment !== undefined && { availableEquipment: data.availableEquipment }),
        ...(data.preferredWorkoutTypes !== undefined && { preferredWorkoutTypes: data.preferredWorkoutTypes }),
        ...(data.dislikedExercises !== undefined && { dislikedExercises: data.dislikedExercises }),
        ...(data.preferredExercises !== undefined && { preferredExercises: data.preferredExercises }),
        ...(data.dietaryPreferences !== undefined && { dietaryPreferences: data.dietaryPreferences }),
        ...(data.preferredMealFrequency !== undefined && { preferredMealFrequency: data.preferredMealFrequency }),
        ...(data.activityLevel !== undefined && { activityLevel: data.activityLevel }),
        ...(data.recoveryPreferences !== undefined && { recoveryPreferences: data.recoveryPreferences as Prisma.InputJsonValue }),
        ...(data.notificationPreferences !== undefined && { notificationPreferences: data.notificationPreferences as Prisma.InputJsonValue }),
        version: newVersion,
      },
    });
  }

  public async getPreferences(userId: string, category?: string): Promise<UserPreference[]> {
    return prismaService.userPreference.findMany({
      where: {
        userId,
        ...(category ? { category } : {}),
      },
    });
  }

  public async upsertPreference(userId: string, dto: SetUserPreferenceDto): Promise<UserPreference> {
    const existing = await prismaService.userPreference.findUnique({
      where: {
        userId_category_key: {
          userId,
          category: dto.category,
          key: dto.key,
        },
      },
    });

    const newVersion = existing ? existing.version + 1 : 1;

    return prismaService.userPreference.upsert({
      where: {
        userId_category_key: {
          userId,
          category: dto.category,
          key: dto.key,
        },
      },
      create: {
        userId,
        category: dto.category,
        key: dto.key,
        value: dto.value,
        version: 1,
      },
      update: {
        value: dto.value,
        version: newVersion,
      },
    });
  }
}

export const personalizationRepository = new PersonalizationRepository();
