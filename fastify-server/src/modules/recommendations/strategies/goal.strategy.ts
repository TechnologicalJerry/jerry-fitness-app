import { FitnessGoal } from '@prisma/client';

export interface GoalStrategyResult {
  primaryGoalId: string | null;
  focusMessage: string;
  prioritizedGoals: FitnessGoal[];
}

export interface GoalStrategy {
  prioritizeGoals(goals: FitnessGoal[]): GoalStrategyResult;
}

export class AdaptiveGoalStrategy implements GoalStrategy {
  public prioritizeGoals(goals: FitnessGoal[]): GoalStrategyResult {
    const activeGoals = goals.filter((g) => g.status === 'ACTIVE');
    if (activeGoals.length === 0) {
      return {
        primaryGoalId: null,
        focusMessage: 'No active fitness goals currently configured.',
        prioritizedGoals: [],
      };
    }

    // Sort by priority (1 is highest) and created date
    const sorted = [...activeGoals].sort((a, b) => a.priority - b.priority || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const primary = sorted[0];

    return {
      primaryGoalId: primary ? primary.id : null,
      focusMessage: primary ? `Primary focus on active goal: ${primary.title}` : 'Balanced general fitness focus.',
      prioritizedGoals: sorted,
    };
  }
}
