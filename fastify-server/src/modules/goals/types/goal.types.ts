import { GoalType, GoalStatus } from '@prisma/client';

export interface CreateGoalDto {
  type: GoalType;
  title: string;
  description?: string;
  target: number;
  targetUnit: string;
  startingValue: number;
  currentValue?: number;
  targetDate?: string;
  priority?: number;
}

export interface UpdateGoalDto {
  title?: string;
  description?: string;
  target?: number;
  targetUnit?: string;
  currentValue?: number;
  targetDate?: string;
  priority?: number;
}

export interface QueryGoalsParams {
  status?: GoalStatus;
  type?: GoalType;
}
