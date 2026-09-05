import { NotFoundError } from '../../../common/errors/common-errors';

export class GoalNotFoundError extends NotFoundError {
  constructor(goalId?: string) {
    super(goalId ? `Fitness goal '${goalId}' was not found` : 'Fitness goal not found');
  }
}
