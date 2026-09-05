import { Habit, HabitCompletion } from '@prisma/client';
import { prismaService } from '../../../database/prisma.service';
import { CreateHabitDto, LogHabitCompletionDto } from '../types/habit.types';

export class HabitRepository {
  public async create(userId: string, dto: CreateHabitDto): Promise<Habit> {
    return prismaService.habit.create({
      data: {
        userId,
        name: dto.name,
        category: dto.category ?? 'CUSTOM',
        description: dto.description,
        targetValue: dto.targetValue ?? 1,
        unit: dto.unit ?? 'count',
        frequencyType: dto.frequencyType ?? 'DAILY',
        schedule: {
          create: {
            daysOfWeek: dto.daysOfWeek ?? [0, 1, 2, 3, 4, 5, 6],
          },
        },
      },
      include: {
        schedule: true,
      },
    });
  }

  public async findMany(userId: string): Promise<Habit[]> {
    return prismaService.habit.findMany({
      where: { userId, isActive: true },
      include: {
        schedule: true,
        completions: {
          take: 30,
          orderBy: { date: 'desc' },
        },
      },
    });
  }

  public async findById(id: string, userId: string): Promise<Habit | null> {
    return prismaService.habit.findFirst({
      where: { id, userId },
      include: {
        schedule: true,
        completions: {
          orderBy: { date: 'desc' },
        },
      },
    });
  }

  public async logCompletion(
    userId: string,
    habitId: string,
    date: Date,
    dto: LogHabitCompletionDto,
  ): Promise<HabitCompletion> {
    return prismaService.habitCompletion.upsert({
      where: {
        habitId_date: {
          habitId,
          date,
        },
      },
      create: {
        habitId,
        userId,
        date,
        value: dto.value ?? 1,
        completed: dto.completed ?? true,
        skipped: dto.skipped ?? false,
        notes: dto.notes,
      },
      update: {
        value: dto.value ?? 1,
        completed: dto.completed ?? true,
        skipped: dto.skipped ?? false,
        notes: dto.notes,
      },
    });
  }

  public async getCompletionsInRange(userId: string, startDate: Date, endDate: Date): Promise<HabitCompletion[]> {
    return prismaService.habitCompletion.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'desc' },
    });
  }
}

export const habitRepository = new HabitRepository();
