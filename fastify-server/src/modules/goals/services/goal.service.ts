import { FitnessGoal, GoalStatus } from '@prisma/client';
import { goalRepository, GoalRepository } from '../repositories/goal.repository';
import { CreateGoalDto, UpdateGoalDto, QueryGoalsParams } from '../types/goal.types';
import { GoalNotFoundError } from '../errors/goal.errors';

export class GoalService {
  constructor(private repo: GoalRepository = goalRepository) {}

  public async getGoals(userId: string, params: QueryGoalsParams): Promise<FitnessGoal[]> {
    return this.repo.findMany(userId, params);
  }

  public async getGoalById(id: string, userId: string): Promise<FitnessGoal> {
    const goal = await this.repo.findById(id, userId);
    if (!goal) {
      throw new GoalNotFoundError(id);
    }
    return goal;
  }

  public async createGoal(userId: string, dto: CreateGoalDto): Promise<FitnessGoal> {
    return this.repo.create(userId, dto);
  }

  public async updateGoal(id: string, userId: string, dto: UpdateGoalDto): Promise<FitnessGoal> {
    await this.getGoalById(id, userId);
    return this.repo.update(id, userId, dto);
  }

  public async updateGoalStatus(id: string, userId: string, status: GoalStatus): Promise<FitnessGoal> {
    await this.getGoalById(id, userId);
    return this.repo.updateStatus(id, status);
  }

  public async deleteGoal(id: string, userId: string): Promise<{ message: string; id: string }> {
    await this.getGoalById(id, userId);
    await this.repo.updateStatus(id, GoalStatus.ARCHIVED);
    return { message: 'Goal archived successfully', id };
  }
}

export const goalService = new GoalService();
