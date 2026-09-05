import { Habit, HabitCompletion } from '@prisma/client';
import { habitRepository, HabitRepository } from '../repositories/habit.repository';
import { CreateHabitDto, LogHabitCompletionDto, HabitSummaryResponse } from '../types/habit.types';
import { NotFoundError } from '../../../common/errors/common-errors';

export class HabitService {
  constructor(private repo: HabitRepository = habitRepository) {}

  public async createHabit(userId: string, dto: CreateHabitDto): Promise<Habit> {
    return this.repo.create(userId, dto);
  }

  public async getHabits(userId: string): Promise<Habit[]> {
    return this.repo.findMany(userId);
  }

  public async getHabitById(id: string, userId: string): Promise<Habit & { currentStreak: number }> {
    const habit = await this.repo.findById(id, userId);
    if (!habit) {
      throw new NotFoundError(`Habit '${id}' was not found`);
    }

    const currentStreak = this.calculateStreak((habit as any).completions || []);
    return {
      ...(habit as any),
      currentStreak,
    };
  }

  public calculateStreak(completions: HabitCompletion[]): number {
    let streak = 0;
    const sorted = [...completions]
      .filter((c) => c.completed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let lastDate = new Date();
    lastDate.setUTCHours(0, 0, 0, 0);

    for (const comp of sorted) {
      const compDate = new Date(comp.date);
      compDate.setUTCHours(0, 0, 0, 0);

      const diffDays = Math.floor((lastDate.getTime() - compDate.getTime()) / (1000 * 3600 * 24));
      if (diffDays <= 1) {
        streak++;
        lastDate = compDate;
      } else {
        break;
      }
    }

    return streak;
  }

  public async logCompletion(
    userId: string,
    habitId: string,
    dto: LogHabitCompletionDto,
  ): Promise<HabitCompletion & { currentStreak: number }> {
    await this.getHabitById(habitId, userId);

    const targetDate = dto.date ? new Date(dto.date) : new Date();
    targetDate.setUTCHours(0, 0, 0, 0);

    const completion = await this.repo.logCompletion(userId, habitId, targetDate, dto);
    const updatedHabit = await this.getHabitById(habitId, userId);

    return {
      ...completion,
      currentStreak: updatedHabit.currentStreak,
    };
  }

  public async getSummary(userId: string): Promise<HabitSummaryResponse> {
    const habits = await this.getHabits(userId);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setUTCHours(0, 0, 0, 0);

    const completions = await this.repo.getCompletionsInRange(userId, thirtyDaysAgo, today);

    const completedTodayCount = completions.filter(
      (c) => c.completed && new Date(c.date).getTime() === today.getTime(),
    ).length;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weekCompletions = completions.filter((c) => c.completed && new Date(c.date) >= sevenDaysAgo);
    const monthCompletions = completions.filter((c) => c.completed);

    const weeklyTarget = habits.length * 7 || 1;
    const monthlyTarget = habits.length * 30 || 1;

    const todayAdherence = habits.length > 0 ? Math.round((completedTodayCount / habits.length) * 100) : 100;
    const weeklyAdherence = Math.min(100, Math.round((weekCompletions.length / weeklyTarget) * 100));
    const monthlyAdherence = Math.min(100, Math.round((monthCompletions.length / monthlyTarget) * 100));

    let maxStreak = 0;
    for (const h of habits) {
      const s = this.calculateStreak((h as any).completions || []);
      if (s > maxStreak) maxStreak = s;
    }

    return {
      totalHabits: habits.length,
      completedToday: completedTodayCount,
      todayAdherencePercent: todayAdherence,
      weeklyAdherencePercent: weeklyAdherence,
      monthlyAdherencePercent: monthlyAdherence,
      longestStreak: maxStreak,
    };
  }
}

export const habitService = new HabitService();
