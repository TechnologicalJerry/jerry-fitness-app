import { FitnessGoal, GoalStatus } from '@prisma/client';
import { prismaService } from '../../../database/prisma.service';
import { CreateGoalDto, UpdateGoalDto, QueryGoalsParams } from '../types/goal.types';

export class GoalRepository {
  public async findById(id: string, userId: string): Promise<FitnessGoal | null> {
    return prismaService.fitnessGoal.findFirst({
      where: { id, userId },
    });
  }

  public async findMany(userId: string, params: QueryGoalsParams): Promise<FitnessGoal[]> {
    return prismaService.fitnessGoal.findMany({
      where: {
        userId,
        ...(params.status ? { status: params.status } : {}),
        ...(params.type ? { type: params.type } : {}),
      },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    });
  }

  public async create(userId: string, dto: CreateGoalDto): Promise<FitnessGoal> {
    return prismaService.fitnessGoal.create({
      data: {
        userId,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        target: dto.target,
        targetUnit: dto.targetUnit,
        startingValue: dto.startingValue,
        currentValue: dto.currentValue ?? dto.startingValue,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined,
        priority: dto.priority ?? 1,
      },
    });
  }

  public async update(id: string, _userId: string, dto: UpdateGoalDto): Promise<FitnessGoal> {
    return prismaService.fitnessGoal.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.target !== undefined && { target: dto.target }),
        ...(dto.targetUnit !== undefined && { targetUnit: dto.targetUnit }),
        ...(dto.currentValue !== undefined && { currentValue: dto.currentValue }),
        ...(dto.targetDate !== undefined && { targetDate: new Date(dto.targetDate) }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
      },
    });
  }

  public async updateStatus(id: string, status: GoalStatus): Promise<FitnessGoal> {
    return prismaService.fitnessGoal.update({
      where: { id },
      data: {
        status,
        ...(status === GoalStatus.COMPLETED ? { completedAt: new Date() } : {}),
      },
    });
  }

  public async delete(id: string): Promise<FitnessGoal> {
    return prismaService.fitnessGoal.delete({
      where: { id },
    });
  }
}

export const goalRepository = new GoalRepository();
