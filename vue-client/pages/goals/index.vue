<template>
  <div class="goals-page">
    <div class="goals-container">
      <!-- Header Hero Banner -->
      <div class="goals-hero">
        <div class="hero-content">
          <h1 class="page-title">Fitness Goals Tracker</h1>
          <p class="page-subtitle">Set targets, monitor your progress, and celebrate every victory.</p>
        </div>
        <button @click="openCreateModal" class="btn-create-primary">
          <svg xmlns="http://www.w3.org/2000/svg" class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Create New Goal</span>
        </button>
      </div>

      <!-- Stats Summary Banner -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon indigo">🎯</div>
          <div class="stat-meta">
            <span class="stat-value">{{ totalGoalsCount }}</span>
            <span class="stat-label">Total Goals</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon violet">⚡</div>
          <div class="stat-meta">
            <span class="stat-value">{{ activeGoalsCount }}</span>
            <span class="stat-label">Active Goals</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon emerald">🏆</div>
          <div class="stat-meta">
            <span class="stat-value">{{ completedGoalsCount }}</span>
            <span class="stat-label">Completed</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon amber">📈</div>
          <div class="stat-meta">
            <span class="stat-value">{{ averageProgress }}%</span>
            <span class="stat-label">Avg Progress</span>
          </div>
        </div>
      </div>

      <!-- Filters & Controls Bar -->
      <div class="controls-bar">
        <div class="status-tabs">
          <button
            v-for="status in ['ALL', 'ACTIVE', 'COMPLETED', 'PAUSED']"
            :key="status"
            class="status-tab"
            :class="{ active: selectedStatus === status }"
            @click="selectedStatus = status"
          >
            {{ status }}
          </button>
        </div>

        <div class="filter-group">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search goals..."
            class="search-input"
          />
          <select v-model="selectedType" class="type-select">
            <option value="ALL">All Types</option>
            <option value="WEIGHT_LOSS">🔥 Weight Loss</option>
            <option value="MUSCLE_GAIN">💪 Muscle Gain</option>
            <option value="STRENGTH">🏋️ Strength</option>
            <option value="ENDURANCE">🏃 Endurance</option>
            <option value="MOBILITY">🧘 Mobility</option>
            <option value="CONSISTENCY">📆 Consistency</option>
            <option value="GENERAL_FITNESS">⚡ General</option>
          </select>
        </div>
      </div>

      <!-- Goals Grid -->
      <div v-if="filteredGoals.length > 0" class="goals-grid">
        <div
          v-for="goal in filteredGoals"
          :key="goal.id"
          class="goal-card"
          :class="{ completed: goal.status === 'COMPLETED', paused: goal.status === 'PAUSED' }"
        >
          <div class="card-top">
            <div class="type-icon-wrapper" :class="getTypeColorClass(goal.type)">
              <span class="type-emoji">{{ getTypeEmoji(goal.type) }}</span>
            </div>
            <div class="card-meta">
              <span class="priority-tag">Priority #{{ goal.priority || 1 }}</span>
              <span class="status-badge" :class="goal.status.toLowerCase()">
                {{ goal.status }}
              </span>
            </div>
          </div>

          <h3 class="goal-title">{{ goal.title }}</h3>
          <p v-if="goal.description" class="goal-desc">{{ goal.description }}</p>

          <!-- Progress Bar & Metric Numbers -->
          <div class="progress-section">
            <div class="progress-header">
              <span class="progress-pct">{{ calculateProgress(goal) }}% Completed</span>
              <span class="progress-values">
                <strong>{{ goal.currentValue }}</strong> / {{ goal.target }} {{ goal.targetUnit }}
              </span>
            </div>
            <div class="progress-track">
              <div
                class="progress-fill"
                :style="{ width: `${calculateProgress(goal)}%` }"
                :class="getTypeGradientClass(goal.type)"
              ></div>
            </div>
            <div class="progress-footer">
              <span class="start-val">Started at {{ goal.startingValue }} {{ goal.targetUnit }}</span>
              <span v-if="goal.targetDate" class="target-date">
                📅 {{ formatDate(goal.targetDate) }}
              </span>
            </div>
          </div>

          <!-- Card Actions -->
          <div class="card-actions">
            <button @click="openProgressModal(goal)" class="btn-action-primary">
              ⚡ Update Progress
            </button>
            <button
              v-if="goal.status === 'ACTIVE'"
              @click="handleToggleStatus(goal, 'PAUSED')"
              class="btn-action-secondary"
            >
              Pause
            </button>
            <button
              v-if="goal.status === 'PAUSED'"
              @click="handleToggleStatus(goal, 'ACTIVE')"
              class="btn-action-secondary"
            >
              Resume
            </button>
            <button
              v-if="goal.status !== 'COMPLETED'"
              @click="handleToggleStatus(goal, 'COMPLETED')"
              class="btn-action-success"
            >
              ✓ Complete
            </button>
            <button @click="handleDelete(goal.id)" class="btn-action-danger" title="Delete Goal">
              🗑️
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state card">
        <div class="empty-icon">🎯</div>
        <h3>No Goals Found</h3>
        <p>No fitness goals match your current filter criteria.</p>
        <button @click="openCreateModal" class="btn-create-primary">
          + Create Your First Goal
        </button>
      </div>
    </div>

    <!-- Create / Edit Goal Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h2>Create New Fitness Goal</h2>
          <button @click="showCreateModal = false" class="close-btn">&times;</button>
        </div>

        <form @submit.prevent="handleCreateSubmit" class="modal-form">
          <div class="form-group">
            <label class="form-label">Goal Title</label>
            <input
              v-model="createForm.title"
              type="text"
              required
              placeholder="e.g. Bench Press 100kg"
              class="form-input"
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Goal Category Type</label>
              <select v-model="createForm.type" class="form-select">
                <option value="STRENGTH">🏋️ Strength & Power</option>
                <option value="WEIGHT_LOSS">🔥 Weight Loss / Fat Reduction</option>
                <option value="MUSCLE_GAIN">💪 Muscle Gain</option>
                <option value="ENDURANCE">🏃 Endurance & Stamina</option>
                <option value="MOBILITY">🧘 Mobility & Flexibility</option>
                <option value="CONSISTENCY">📆 Workout Consistency</option>
                <option value="GENERAL_FITNESS">⚡ General Health</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Priority (1 = Highest)</label>
              <input
                v-model.number="createForm.priority"
                type="number"
                min="1"
                max="10"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Description (Optional)</label>
            <textarea
              v-model="createForm.description"
              rows="2"
              placeholder="Describe your training strategy or milestone target..."
              class="form-textarea"
            ></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Starting Value</label>
              <input
                v-model.number="createForm.startingValue"
                type="number"
                step="any"
                required
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Target Value</label>
              <input
                v-model.number="createForm.target"
                type="number"
                step="any"
                required
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Target Unit</label>
              <input
                v-model="createForm.targetUnit"
                type="text"
                required
                placeholder="kg, lbs, km, reps"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Target Completion Date (Optional)</label>
            <input
              v-model="createForm.targetDate"
              type="date"
              class="form-input"
            />
          </div>

          <div class="modal-footer">
            <button type="button" @click="showCreateModal = false" class="btn-cancel">Cancel</button>
            <button type="submit" class="btn-submit" :disabled="isSaving">
              {{ isSaving ? 'Saving Goal...' : 'Create Goal' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Quick Progress Update Modal -->
    <div v-if="showProgressModal && activeGoalForUpdate" class="modal-overlay" @click.self="showProgressModal = false">
      <div class="modal-card small-modal">
        <div class="modal-header">
          <h2>Update Goal Progress</h2>
          <button @click="showProgressModal = false" class="close-btn">&times;</button>
        </div>

        <div class="modal-body">
          <p class="goal-modal-title">
            <strong>{{ activeGoalForUpdate.title }}</strong>
          </p>
          <div class="progress-preview">
            <span>Current: <strong>{{ progressUpdateValue }}</strong> {{ activeGoalForUpdate.targetUnit }}</span>
            <span>Target: {{ activeGoalForUpdate.target }} {{ activeGoalForUpdate.targetUnit }}</span>
          </div>

          <div class="form-group">
            <label class="form-label">New Current Value</label>
            <input
              v-model.number="progressUpdateValue"
              type="number"
              step="any"
              class="form-input large-number"
            />
          </div>

          <div class="progress-track preview-track">
            <div
              class="progress-fill"
              :style="{ width: `${previewProgressPct}%` }"
            ></div>
          </div>
          <span class="preview-pct-label">{{ previewProgressPct }}% Progress Calculated</span>
        </div>

        <div class="modal-footer">
          <button type="button" @click="showProgressModal = false" class="btn-cancel">Cancel</button>
          <button @click="handleSaveProgress" class="btn-submit" :disabled="isSaving">
            Save Progress
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Goal, GoalType, GoalStatus } from '~/types/goals';

definePageMeta({
  middleware: 'auth',
});

const { goals, isSaving, fetchGoals, createGoal, updateGoal, updateGoalStatus, deleteGoal, calculateProgress } = useGoals();

const selectedStatus = ref('ALL');
const selectedType = ref('ALL');
const searchQuery = ref('');

const showCreateModal = ref(false);
const showProgressModal = ref(false);
const activeGoalForUpdate = ref<Goal | null>(null);
const progressUpdateValue = ref(0);

const createForm = reactive({
  title: '',
  type: 'STRENGTH' as GoalType,
  description: '',
  startingValue: 0,
  target: 100,
  targetUnit: 'kg',
  priority: 1,
  targetDate: '',
});

onMounted(async () => {
  await fetchGoals();
});

const totalGoalsCount = computed(() => goals.value.length);
const activeGoalsCount = computed(() => goals.value.filter((g) => g.status === 'ACTIVE').length);
const completedGoalsCount = computed(() => goals.value.filter((g) => g.status === 'COMPLETED').length);

const averageProgress = computed(() => {
  if (!goals.value.length) return 0;
  const sum = goals.value.reduce((acc, g) => acc + calculateProgress(g), 0);
  return Math.round(sum / goals.value.length);
});

const filteredGoals = computed(() => {
  return goals.value.filter((goal) => {
    // Status filter
    if (selectedStatus.value !== 'ALL' && goal.status !== selectedStatus.value) {
      return false;
    }
    // Type filter
    if (selectedType.value !== 'ALL' && goal.type !== selectedType.value) {
      return false;
    }
    // Search query
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      const titleMatch = goal.title.toLowerCase().includes(q);
      const descMatch = goal.description?.toLowerCase().includes(q) || false;
      return titleMatch || descMatch;
    }
    return true;
  });
});

const previewProgressPct = computed(() => {
  if (!activeGoalForUpdate.value) return 0;
  const tempGoal = { ...activeGoalForUpdate.value, currentValue: progressUpdateValue.value };
  return calculateProgress(tempGoal);
});

const getTypeEmoji = (type: GoalType) => {
  switch (type) {
    case 'WEIGHT_LOSS': return '🔥';
    case 'MUSCLE_GAIN': return '💪';
    case 'STRENGTH': return '🏋️';
    case 'ENDURANCE': return '🏃';
    case 'MOBILITY': return '🧘';
    case 'CONSISTENCY': return '📆';
    default: return '⚡';
  }
};

const getTypeColorClass = (type: GoalType) => {
  switch (type) {
    case 'WEIGHT_LOSS': return 'bg-rose';
    case 'MUSCLE_GAIN': return 'bg-violet';
    case 'STRENGTH': return 'bg-indigo';
    case 'ENDURANCE': return 'bg-emerald';
    default: return 'bg-blue';
  }
};

const getTypeGradientClass = (type: GoalType) => {
  switch (type) {
    case 'WEIGHT_LOSS': return 'grad-rose';
    case 'MUSCLE_GAIN': return 'grad-violet';
    case 'STRENGTH': return 'grad-indigo';
    case 'ENDURANCE': return 'grad-emerald';
    default: return 'grad-blue';
  }
};

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const openCreateModal = () => {
  createForm.title = '';
  createForm.description = '';
  createForm.type = 'STRENGTH';
  createForm.startingValue = 0;
  createForm.target = 100;
  createForm.targetUnit = 'kg';
  createForm.priority = 1;
  createForm.targetDate = '';
  showCreateModal.value = true;
};

const openProgressModal = (goal: Goal) => {
  activeGoalForUpdate.value = goal;
  progressUpdateValue.value = goal.currentValue;
  showProgressModal.value = true;
};

const handleCreateSubmit = async () => {
  const success = await createGoal({
    title: createForm.title,
    type: createForm.type,
    description: createForm.description || undefined,
    startingValue: createForm.startingValue,
    currentValue: createForm.startingValue,
    target: createForm.target,
    targetUnit: createForm.targetUnit,
    priority: createForm.priority,
    targetDate: createForm.targetDate ? new Date(createForm.targetDate).toISOString() : undefined,
  });

  if (success) {
    showCreateModal.value = false;
  }
};

const handleSaveProgress = async () => {
  if (!activeGoalForUpdate.value) return;
  const success = await updateGoal(activeGoalForUpdate.value.id, {
    currentValue: progressUpdateValue.value,
  });
  if (success) {
    showProgressModal.value = false;
  }
};

const handleToggleStatus = async (goal: Goal, newStatus: GoalStatus) => {
  await updateGoalStatus(goal.id, newStatus);
};

const handleDelete = async (id: string) => {
  if (confirm('Are you sure you want to archive this goal?')) {
    await deleteGoal(id);
  }
};
</script>

<style scoped>
.goals-page {
  max-width: 1150px;
  margin: 2rem auto;
  padding: 0 1.5rem;
}

.goals-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2.25rem;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  backdrop-filter: blur(16px);
  margin-bottom: 1.5rem;
}

.page-title {
  font-size: 1.85rem;
  font-weight: 800;
  color: #f8fafc;
  margin: 0 0 0.35rem;
}

.page-subtitle {
  font-size: 0.95rem;
  color: #94a3b8;
  margin: 0;
}

.btn-create-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: #ffffff;
  border: none;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.35);
}

.btn-create-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.5);
}

.btn-icon {
  width: 18px;
  height: 18px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon.indigo { background: rgba(99, 102, 241, 0.15); }
.stat-icon.violet { background: rgba(168, 85, 247, 0.15); }
.stat-icon.emerald { background: rgba(16, 185, 129, 0.15); }
.stat-icon.amber { background: rgba(245, 158, 11, 0.15); }

.stat-meta {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.4rem;
  font-weight: 800;
  color: #f8fafc;
  line-height: 1.1;
}

.stat-label {
  font-size: 0.8rem;
  color: #94a3b8;
  font-weight: 500;
}

.controls-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.status-tabs {
  display: flex;
  gap: 0.4rem;
}

.status-tab {
  padding: 0.5rem 1rem;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: #94a3b8;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.status-tab.active {
  background: rgba(99, 102, 241, 0.25);
  border-color: #6366f1;
  color: #ffffff;
}

.filter-group {
  display: flex;
  gap: 0.65rem;
}

.search-input,
.type-select {
  padding: 0.5rem 0.85rem;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  color: #f8fafc;
  font-size: 0.85rem;
  outline: none;
}

.search-input:focus,
.type-select:focus {
  border-color: #6366f1;
}

.goals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 1.5rem;
}

.goal-card {
  padding: 1.75rem;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  backdrop-filter: blur(16px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: border-color 0.2s, transform 0.2s;
}

.goal-card:hover {
  border-color: rgba(99, 102, 241, 0.35);
  transform: translateY(-2px);
}

.goal-card.completed {
  border-color: rgba(16, 185, 129, 0.3);
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.type-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.bg-indigo { background: rgba(99, 102, 241, 0.2); }
.bg-rose { background: rgba(244, 63, 94, 0.2); }
.bg-violet { background: rgba(168, 85, 247, 0.2); }
.bg-emerald { background: rgba(16, 185, 129, 0.2); }
.bg-blue { background: rgba(59, 130, 246, 0.2); }

.card-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.priority-tag {
  font-size: 0.7rem;
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.06);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
}

.status-badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 9999px;
  text-transform: uppercase;
}

.status-badge.active { background: rgba(99, 102, 241, 0.2); color: #a5b4fc; }
.status-badge.completed { background: rgba(16, 185, 129, 0.2); color: #6ee7b7; }
.status-badge.paused { background: rgba(245, 158, 11, 0.2); color: #fcd34d; }

.goal-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #f8fafc;
  margin: 0 0 0.4rem;
}

.goal-desc {
  font-size: 0.85rem;
  color: #94a3b8;
  margin: 0 0 1.25rem;
  line-height: 1.4;
}

.progress-section {
  margin-bottom: 1.25rem;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  margin-bottom: 0.4rem;
}

.progress-pct {
  font-weight: 700;
  color: #818cf8;
}

.progress-values {
  color: #cbd5e1;
}

.progress-track {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 9999px;
  overflow: hidden;
  margin-bottom: 0.4rem;
}

.progress-fill {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.4s ease;
}

.grad-indigo { background: linear-gradient(90deg, #6366f1, #818cf8); }
.grad-rose { background: linear-gradient(90deg, #f43f5e, #fb7185); }
.grad-violet { background: linear-gradient(90deg, #a855f7, #c084fc); }
.grad-emerald { background: linear-gradient(90deg, #10b981, #34d399); }
.grad-blue { background: linear-gradient(90deg, #3b82f6, #60a5fa); }

.progress-footer {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #64748b;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.btn-action-primary {
  flex: 1;
  padding: 0.45rem 0.75rem;
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.3);
  color: #a5b4fc;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-action-primary:hover {
  background: rgba(99, 102, 241, 0.25);
}

.btn-action-secondary {
  padding: 0.45rem 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-action-success {
  padding: 0.45rem 0.75rem;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #6ee7b7;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-action-danger {
  padding: 0.45rem 0.6rem;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
  border-radius: 8px;
  font-size: 0.8rem;
  cursor: pointer;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

/* Modals */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.modal-card {
  width: 100%;
  max-width: 520px;
  padding: 2rem;
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
}

.small-modal {
  max-width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #f8fafc;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 1.5rem;
  cursor: pointer;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
}

.form-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #cbd5e1;
}

.form-input,
.form-select,
.form-textarea {
  padding: 0.75rem 1rem;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  color: #f8fafc;
  font-size: 0.95rem;
  outline: none;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  border-color: #6366f1;
}

.large-number {
  font-size: 1.5rem;
  font-weight: 800;
  text-align: center;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.btn-cancel {
  padding: 0.65rem 1.25rem;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #cbd5e1;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
}

.btn-submit {
  padding: 0.65rem 1.5rem;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: #ffffff;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
}

.goal-modal-title {
  font-size: 1rem;
  color: #f1f5f9;
  margin: 0 0 1rem;
}

.progress-preview {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #94a3b8;
  margin-bottom: 1rem;
}

.preview-track {
  height: 10px;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.preview-pct-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #818cf8;
  display: block;
  text-align: center;
}
</style>
