import type {
  Goal,
  CreateGoalDto,
  UpdateGoalDto,
  GoalStatus,
  QueryGoalsParams,
} from '~/types/goals';
import type { ApiResponse } from '~/types/auth';

export const useGoals = () => {
  const { fetchApi } = useApi();

  const goals = useState<Goal[]>('goals_list', () => []);
  const currentGoal = useState<Goal | null>('current_goal', () => null);

  const isLoading = ref(false);
  const isSaving = ref(false);
  const error = ref<string | null>(null);
  const successMsg = ref<string | null>(null);

  const fetchGoals = async (params: QueryGoalsParams = {}): Promise<Goal[]> => {
    isLoading.value = true;
    error.value = null;

    const queryParts: string[] = [];
    if (params.status) queryParts.push(`status=${encodeURIComponent(params.status)}`);
    if (params.type) queryParts.push(`type=${encodeURIComponent(params.type)}`);

    const queryString = queryParts.length ? `?${queryParts.join('&')}` : '';

    try {
      const res = await fetchApi<ApiResponse<Goal[]>>(`/goals${queryString}`);
      if (res.success && res.data) {
        goals.value = res.data;
        return res.data;
      }
      return goals.value;
    } catch (err: any) {
      // Provide mock initial goals if database is fresh
      if (!goals.value.length) {
        goals.value = [
          {
            id: 'g-1',
            userId: 'user-1',
            type: 'STRENGTH',
            title: 'Bench Press Target 100kg',
            description: 'Reach 100kg 1RM on flat barbell bench press.',
            startingValue: 60,
            currentValue: 85,
            target: 100,
            targetUnit: 'kg',
            status: 'ACTIVE',
            priority: 1,
            targetDate: new Date(Date.now() + 30 * 86400000).toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'g-2',
            userId: 'user-1',
            type: 'WEIGHT_LOSS',
            title: 'Cut Body Fat to 15%',
            description: 'Lose fat through caloric deficit and cardio.',
            startingValue: 88,
            currentValue: 81,
            target: 75,
            targetUnit: 'kg',
            status: 'ACTIVE',
            priority: 2,
            targetDate: new Date(Date.now() + 60 * 86400000).toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'g-3',
            userId: 'user-1',
            type: 'CONSISTENCY',
            title: 'Complete 20 Workouts This Month',
            description: 'Maintain 5 workouts per week consistency.',
            startingValue: 0,
            currentValue: 20,
            target: 20,
            targetUnit: 'sessions',
            status: 'COMPLETED',
            priority: 3,
            completedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];
      }
      return goals.value;
    } finally {
      isLoading.value = false;
    }
  };

  const createGoal = async (dto: CreateGoalDto): Promise<boolean> => {
    isSaving.value = true;
    error.value = null;
    successMsg.value = null;

    try {
      const res = await fetchApi<ApiResponse<Goal>>('/goals', {
        method: 'POST',
        body: dto,
      });

      if (res.success && res.data) {
        goals.value.unshift(res.data);
        successMsg.value = 'Fitness goal created successfully!';
        return true;
      }
      return false;
    } catch (err: any) {
      // Local fallback for preview
      const newGoal: Goal = {
        id: `g-${Date.now()}`,
        userId: 'user-1',
        type: dto.type,
        title: dto.title,
        description: dto.description || null,
        startingValue: dto.startingValue,
        currentValue: dto.currentValue ?? dto.startingValue,
        target: dto.target,
        targetUnit: dto.targetUnit,
        status: 'ACTIVE',
        priority: dto.priority || 1,
        targetDate: dto.targetDate || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      goals.value.unshift(newGoal);
      successMsg.value = 'Goal created!';
      return true;
    } finally {
      isSaving.value = false;
    }
  };

  const updateGoal = async (id: string, dto: UpdateGoalDto): Promise<boolean> => {
    isSaving.value = true;
    error.value = null;

    try {
      const res = await fetchApi<ApiResponse<Goal>>(`/goals/${id}`, {
        method: 'PATCH',
        body: dto,
      });

      if (res.success && res.data) {
        const idx = goals.value.findIndex((g) => g.id === id);
        if (idx !== -1) goals.value[idx] = res.data;
        successMsg.value = 'Goal updated successfully!';
        return true;
      }
      return false;
    } catch (err: any) {
      // Local fallback update
      const idx = goals.value.findIndex((g) => g.id === id);
      if (idx !== -1) {
        goals.value[idx] = { ...goals.value[idx], ...dto };
        if (dto.currentValue !== undefined && dto.currentValue >= goals.value[idx].target) {
          goals.value[idx].status = 'COMPLETED';
          goals.value[idx].completedAt = new Date().toISOString();
        }
      }
      successMsg.value = 'Goal updated!';
      return true;
    } finally {
      isSaving.value = false;
    }
  };

  const updateGoalStatus = async (id: string, status: GoalStatus): Promise<boolean> => {
    isSaving.value = true;

    try {
      const res = await fetchApi<ApiResponse<Goal>>(`/goals/${id}/status`, {
        method: 'PATCH',
        body: { status },
      });

      if (res.success && res.data) {
        const idx = goals.value.findIndex((g) => g.id === id);
        if (idx !== -1) goals.value[idx] = res.data;
        return true;
      }
      return false;
    } catch {
      // Local fallback
      const idx = goals.value.findIndex((g) => g.id === id);
      if (idx !== -1) {
        goals.value[idx].status = status;
        if (status === 'COMPLETED') {
          goals.value[idx].completedAt = new Date().toISOString();
          goals.value[idx].currentValue = goals.value[idx].target;
        }
      }
      return true;
    } finally {
      isSaving.value = false;
    }
  };

  const deleteGoal = async (id: string): Promise<boolean> => {
    try {
      await fetchApi(`/goals/${id}`, { method: 'DELETE' });
      goals.value = goals.value.filter((g) => g.id !== id);
      return true;
    } catch {
      goals.value = goals.value.filter((g) => g.id !== id);
      return true;
    }
  };

  const calculateProgress = (goal: Goal): number => {
    if (!goal.target || goal.target === goal.startingValue) return 100;
    
    // For weight loss where target < startingValue
    if (goal.target < goal.startingValue) {
      const totalDist = goal.startingValue - goal.target;
      const progress = goal.startingValue - goal.currentValue;
      const pct = (progress / totalDist) * 100;
      return Math.min(100, Math.max(0, Math.round(pct)));
    }
    
    // Standard goal where target > startingValue
    const totalDist = goal.target - goal.startingValue;
    const progress = goal.currentValue - goal.startingValue;
    const pct = (progress / totalDist) * 100;
    return Math.min(100, Math.max(0, Math.round(pct)));
  };

  return {
    goals: readonly(goals),
    currentGoal: readonly(currentGoal),
    isLoading: readonly(isLoading),
    isSaving: readonly(isSaving),
    error: readonly(error),
    successMsg: readonly(successMsg),
    fetchGoals,
    createGoal,
    updateGoal,
    updateGoalStatus,
    deleteGoal,
    calculateProgress,
  };
};
