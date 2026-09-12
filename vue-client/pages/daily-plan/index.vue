<template>
  <div class="daily-plan-page">
    <div class="daily-plan-container">
      <!-- Hero Banner & Recovery Status -->
      <div class="plan-hero">
        <div class="hero-left">
          <div class="date-badge">
            <span class="pulse-dot"></span>
            <span>Today's Daily Plan &bull; {{ formattedTodayDate }}</span>
          </div>
          <h1 class="hero-title">Daily Fitness & Habit Command Center</h1>
          <p class="hero-subtitle">Your personalized workout recommendation, nutrition targets, hydration tracking, and habits for maximum performance.</p>
        </div>

        <div class="hero-right">
          <!-- Recovery Readiness Card -->
          <div v-if="dailyPlan?.recoveryRecommendation" class="recovery-card">
            <div class="recovery-score-circle">
              <span class="score-num">{{ dailyPlan.recoveryRecommendation.score }}</span>
              <span class="score-unit">/100</span>
            </div>
            <div class="recovery-meta">
              <span class="recovery-label">Recovery Score</span>
              <span class="readiness-tag" :class="dailyPlan.recoveryRecommendation.status.toLowerCase()">
                ⚡ {{ dailyPlan.recoveryRecommendation.status }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Dashboard Grid -->
      <div class="dashboard-grid">
        <!-- Recommended Workout Card -->
        <div v-if="dailyPlan?.workoutRecommendation" class="card workout-card full-width">
          <div class="card-header">
            <div class="icon-circle indigo">🏋️</div>
            <div>
              <h2>Today's Recommended Workout</h2>
              <span class="workout-subtitle">
                {{ dailyPlan.workoutRecommendation.type }} &bull; {{ dailyPlan.workoutRecommendation.durationMinutes }} mins &bull;
                <span class="intensity-badge" :class="dailyPlan.workoutRecommendation.intensity.toLowerCase()">
                  {{ dailyPlan.workoutRecommendation.intensity }} Intensity
                </span>
              </span>
            </div>
          </div>

          <div class="workout-body">
            <h3 class="workout-title">{{ dailyPlan.workoutRecommendation.title }}</h3>
            <p class="workout-desc">{{ dailyPlan.workoutRecommendation.description }}</p>

            <div v-if="dailyPlan.workoutRecommendation.exercises" class="exercise-list">
              <div
                v-for="(ex, idx) in dailyPlan.workoutRecommendation.exercises"
                :key="idx"
                class="exercise-item"
              >
                <div class="ex-left">
                  <span class="ex-num">#{{ idx + 1 }}</span>
                  <span class="ex-name">{{ ex.name }}</span>
                </div>
                <span class="ex-reps">{{ ex.sets }} sets &times; {{ ex.reps }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Nutrition Targets Card -->
        <div v-if="dailyPlan?.nutritionTargets" class="card">
          <div class="card-header">
            <div class="icon-circle violet">🥗</div>
            <h2>Daily Nutrition Targets</h2>
          </div>
          <div class="card-body">
            <div class="macro-target-main">
              <span class="macro-val">{{ dailyPlan.nutritionTargets.calories }}</span>
              <span class="macro-unit">Target Calories (kcal)</span>
            </div>

            <div class="macro-grid">
              <div class="macro-item">
                <div class="macro-header">
                  <span>Protein</span>
                  <strong>{{ dailyPlan.nutritionTargets.proteinGrams }}g</strong>
                </div>
                <div class="macro-track">
                  <div class="macro-bar protein" style="width: 75%;"></div>
                </div>
              </div>

              <div class="macro-item">
                <div class="macro-header">
                  <span>Carbs</span>
                  <strong>{{ dailyPlan.nutritionTargets.carbsGrams }}g</strong>
                </div>
                <div class="macro-track">
                  <div class="macro-bar carbs" style="width: 60%;"></div>
                </div>
              </div>

              <div class="macro-item">
                <div class="macro-header">
                  <span>Fats</span>
                  <strong>{{ dailyPlan.nutritionTargets.fatsGrams }}g</strong>
                </div>
                <div class="macro-track">
                  <div class="macro-bar fats" style="width: 50%;"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Hydration Tracker Card -->
        <div class="card">
          <div class="card-header">
            <div class="icon-circle blue">💧</div>
            <h2>Hydration Tracker</h2>
          </div>
          <div class="card-body">
            <div class="hydration-display">
              <div class="water-amount">
                <span class="current-water">{{ currentWaterMl }}</span>
                <span class="target-water">/ {{ dailyPlan?.hydrationTargetMl || 3000 }} ml</span>
              </div>
              <span class="hydration-pct">{{ hydrationPct }}% Target Reached</span>
            </div>

            <div class="progress-track hydration-track">
              <div class="progress-fill hydration-fill" :style="{ width: `${hydrationPct}%` }"></div>
            </div>

            <div class="hydration-actions">
              <button @click="addWater(250)" class="btn-water">+250ml Glass</button>
              <button @click="addWater(500)" class="btn-water">+500ml Bottle</button>
              <button @click="currentWaterMl = 0" class="btn-reset-water">Reset</button>
            </div>
          </div>
        </div>

        <!-- Habit Tracker & Checklist Card -->
        <div class="card full-width">
          <div class="card-header flex-between">
            <div class="header-left-title">
              <div class="icon-circle emerald">✅</div>
              <div>
                <h2>Habit Adherence & Checklist</h2>
                <span v-if="habitSummary" class="sub-text">
                  Completed Today: {{ habitSummary.completedToday }} / {{ habitSummary.totalHabits }} ({{ habitSummary.todayAdherencePercent }}%) &bull; Best Streak: 🔥 {{ habitSummary.longestStreak }} days
                </span>
              </div>
            </div>
            <button @click="showCreateHabitModal = true" class="btn-create-habit">
              + New Habit
            </button>
          </div>

          <div class="card-body">
            <div v-if="habits.length > 0" class="habits-list">
              <div
                v-for="habit in habits"
                :key="habit.id"
                class="habit-item"
                :class="{ completed: habit.completedToday }"
              >
                <div class="habit-check-wrapper" @click="handleToggleHabit(habit)">
                  <input
                    type="checkbox"
                    :checked="habit.completedToday"
                    class="habit-checkbox"
                  />
                </div>

                <div class="habit-info">
                  <div class="habit-name-row">
                    <span class="habit-name">{{ habit.name }}</span>
                    <span class="category-badge" :class="habit.category.toLowerCase()">
                      {{ habit.category }}
                    </span>
                  </div>
                  <p v-if="habit.description" class="habit-desc">{{ habit.description }}</p>
                </div>

                <div class="habit-streak">
                  <span class="streak-badge">
                    🔥 {{ habit.currentStreak }} day streak
                  </span>
                  <span class="habit-target">{{ habit.targetValue }} {{ habit.unit }}</span>
                </div>
              </div>
            </div>

            <div v-else class="empty-habits">
              <p>No active habits yet. Click "+ New Habit" to start building positive routines!</p>
            </div>
          </div>
        </div>

        <!-- Reminders & Challenges Card -->
        <div v-if="dailyPlan?.reminders || dailyPlan?.challenges" class="card full-width">
          <div class="card-header">
            <div class="icon-circle amber">📌</div>
            <h2>Reminders & Daily Challenges</h2>
          </div>
          <div class="card-body grid-2">
            <div class="reminders-section">
              <h3>🔔 Today's Reminders</h3>
              <ul class="task-checklist">
                <li v-for="(rem, idx) in dailyPlan?.reminders" :key="idx" class="task-item">
                  <input type="checkbox" class="task-checkbox" />
                  <span>{{ rem }}</span>
                </li>
              </ul>
            </div>

            <div class="challenges-section">
              <h3>🏆 Active Daily Challenges</h3>
              <ul class="task-checklist">
                <li v-for="(chal, idx) in dailyPlan?.challenges" :key="idx" class="task-item challenge">
                  <span class="star-icon">⭐</span>
                  <span>{{ chal }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Habit Modal -->
    <div v-if="showCreateHabitModal" class="modal-overlay" @click.self="showCreateHabitModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h2>Create New Habit</h2>
          <button @click="showCreateHabitModal = false" class="close-btn">&times;</button>
        </div>

        <form @submit.prevent="handleCreateHabitSubmit" class="modal-form">
          <div class="form-group">
            <label class="form-label">Habit Name</label>
            <input
              v-model="habitForm.name"
              type="text"
              required
              placeholder="e.g. 10,000 Daily Steps"
              class="form-input"
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Category</label>
              <select v-model="habitForm.category" class="form-select">
                <option value="HYDRATION">💧 Hydration</option>
                <option value="NUTRITION">🥗 Nutrition</option>
                <option value="WORKOUT">🏋️ Workout</option>
                <option value="SLEEP">😴 Sleep</option>
                <option value="RECOVERY">🔋 Recovery</option>
                <option value="MINDFULNESS">🧘 Mindfulness</option>
                <option value="OTHER">✨ Other</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Frequency</label>
              <select v-model="habitForm.frequencyType" class="form-select">
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Target Value</label>
              <input
                v-model.number="habitForm.targetValue"
                type="number"
                min="1"
                required
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Target Unit</label>
              <input
                v-model="habitForm.unit"
                type="text"
                required
                placeholder="times, ml, hrs, mins, steps"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Description (Optional)</label>
            <textarea
              v-model="habitForm.description"
              rows="2"
              placeholder="Motivational notes or rules for this habit..."
              class="form-textarea"
            ></textarea>
          </div>

          <div class="modal-footer">
            <button type="button" @click="showCreateHabitModal = false" class="btn-cancel">Cancel</button>
            <button type="submit" class="btn-submit" :disabled="isHabitSaving">
              {{ isHabitSaving ? 'Creating Habit...' : 'Create Habit' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Habit, HabitCategory, FrequencyType } from '~/types/habits';

definePageMeta({
  middleware: 'auth',
});

const { dailyPlan, fetchDailyPlan } = useDailyPlan();
const { habits, habitSummary, isSaving: isHabitSaving, fetchHabits, fetchSummary, createHabit, logCompletion } = useHabits();

const currentWaterMl = ref(1500);
const showCreateHabitModal = ref(false);

const habitForm = reactive({
  name: '',
  category: 'HYDRATION' as HabitCategory,
  frequencyType: 'DAILY' as FrequencyType,
  targetValue: 1,
  unit: 'times',
  description: '',
});

onMounted(async () => {
  await fetchDailyPlan();
  await fetchHabits();
  await fetchSummary();
});

const formattedTodayDate = computed(() => {
  return new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
});

const hydrationPct = computed(() => {
  const target = dailyPlan.value?.hydrationTargetMl || 3000;
  return Math.min(100, Math.round((currentWaterMl.value / target) * 100));
});

const addWater = (amount: number) => {
  currentWaterMl.value = Math.min(5000, currentWaterMl.value + amount);
};

const handleToggleHabit = async (habit: Habit) => {
  await logCompletion(habit.id, {
    completed: !habit.completedToday,
  });
};

const handleCreateHabitSubmit = async () => {
  const success = await createHabit({
    name: habitForm.name,
    category: habitForm.category,
    frequencyType: habitForm.frequencyType,
    targetValue: habitForm.targetValue,
    unit: habitForm.unit,
    description: habitForm.description || undefined,
  });

  if (success) {
    showCreateHabitModal.value = false;
    habitForm.name = '';
    habitForm.description = '';
  }
};
</script>

<style scoped>
.daily-plan-page {
  max-width: 1150px;
  margin: 2rem auto;
  padding: 0 1.5rem;
}

.plan-hero {
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

.date-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.85rem;
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 9999px;
  color: #a5b4fc;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.pulse-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #6366f1;
  box-shadow: 0 0 8px #6366f1;
}

.hero-title {
  font-size: 1.85rem;
  font-weight: 800;
  color: #f8fafc;
  margin: 0 0 0.35rem;
}

.hero-subtitle {
  font-size: 0.95rem;
  color: #94a3b8;
  margin: 0;
  max-width: 650px;
}

.recovery-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
}

.recovery-score-circle {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981, #059669);
  color: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
}

.score-num {
  font-size: 1.15rem;
  font-weight: 800;
  line-height: 1;
}

.score-unit {
  font-size: 0.65rem;
  opacity: 0.8;
}

.recovery-meta {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.recovery-label {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 500;
}

.readiness-tag {
  font-size: 0.75rem;
  font-weight: 800;
  color: #34d399;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

.full-width {
  grid-column: 1 / -1;
}

.card {
  padding: 1.75rem;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  backdrop-filter: blur(16px);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin-bottom: 1.25rem;
}

.flex-between {
  justify-content: space-between;
}

.header-left-title {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.icon-circle {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-circle.indigo { background: rgba(99, 102, 241, 0.15); }
.icon-circle.violet { background: rgba(168, 85, 247, 0.15); }
.icon-circle.blue { background: rgba(59, 130, 246, 0.15); }
.icon-circle.emerald { background: rgba(16, 185, 129, 0.15); }
.icon-circle.amber { background: rgba(245, 158, 11, 0.15); }

.card-header h2 {
  font-size: 1.15rem;
  font-weight: 700;
  color: #f8fafc;
  margin: 0;
}

.workout-subtitle, .sub-text {
  font-size: 0.85rem;
  color: #94a3b8;
}

.intensity-badge {
  font-weight: 700;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
}

.intensity-badge.high { color: #f43f5e; background: rgba(244, 63, 94, 0.15); }

.workout-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #f8fafc;
  margin: 0 0 0.4rem;
}

.workout-desc {
  font-size: 0.9rem;
  color: #cbd5e1;
  margin: 0 0 1.25rem;
}

.exercise-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 0.75rem;
}

.exercise-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1rem;
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
}

.ex-left {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.ex-num {
  font-size: 0.8rem;
  font-weight: 800;
  color: #818cf8;
}

.ex-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #f1f5f9;
}

.ex-reps {
  font-size: 0.8rem;
  color: #94a3b8;
  font-weight: 500;
}

.macro-target-main {
  text-align: center;
  padding: 1rem;
  background: rgba(30, 41, 59, 0.4);
  border-radius: 14px;
  margin-bottom: 1.25rem;
}

.macro-val {
  font-size: 2rem;
  font-weight: 800;
  color: #c084fc;
  line-height: 1;
  display: block;
}

.macro-unit {
  font-size: 0.8rem;
  color: #94a3b8;
}

.macro-grid {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.macro-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #cbd5e1;
  margin-bottom: 0.35rem;
}

.macro-track {
  height: 8px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 9999px;
  overflow: hidden;
}

.macro-bar {
  height: 100%;
  border-radius: 9999px;
}

.macro-bar.protein { background: linear-gradient(90deg, #6366f1, #818cf8); }
.macro-bar.carbs { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
.macro-bar.fats { background: linear-gradient(90deg, #f59e0b, #fbbf24); }

.hydration-display {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.current-water {
  font-size: 1.8rem;
  font-weight: 800;
  color: #60a5fa;
}

.target-water {
  font-size: 0.9rem;
  color: #94a3b8;
}

.hydration-pct {
  font-size: 0.85rem;
  font-weight: 700;
  color: #3b82f6;
}

.hydration-track {
  height: 10px;
  margin-bottom: 1.25rem;
}

.hydration-fill {
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
}

.hydration-actions {
  display: flex;
  gap: 0.65rem;
}

.btn-water {
  flex: 1;
  padding: 0.6rem;
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: #93c5fd;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-water:hover {
  background: rgba(59, 130, 246, 0.25);
}

.btn-reset-water {
  padding: 0.6rem 0.85rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  border-radius: 10px;
  font-size: 0.8rem;
  cursor: pointer;
}

.btn-create-habit {
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #10b981, #059669);
  color: #ffffff;
  border: none;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
}

.habits-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.habit-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  transition: all 0.2s;
}

.habit-item.completed {
  background: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.25);
}

.habit-checkbox {
  width: 20px;
  height: 20px;
  accent-color: #10b981;
  cursor: pointer;
}

.habit-info {
  flex: 1;
}

.habit-name-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.habit-name {
  font-size: 1rem;
  font-weight: 700;
  color: #f1f5f9;
}

.category-badge {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
}

.category-badge.hydration { background: rgba(59, 130, 246, 0.2); color: #93c5fd; }
.category-badge.nutrition { background: rgba(168, 85, 247, 0.2); color: #e9d5ff; }
.category-badge.sleep { background: rgba(99, 102, 241, 0.2); color: #a5b4fc; }
.category-badge.recovery { background: rgba(16, 185, 129, 0.2); color: #6ee7b7; }

.habit-desc {
  font-size: 0.8rem;
  color: #94a3b8;
  margin: 0.2rem 0 0;
}

.habit-streak {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.streak-badge {
  font-size: 0.8rem;
  font-weight: 700;
  color: #fb923c;
}

.habit-target {
  font-size: 0.75rem;
  color: #64748b;
}

.grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .grid-2 { grid-template-columns: 1fr; }
}

.reminders-section h3, .challenges-section h3 {
  font-size: 0.95rem;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0 0 0.85rem;
}

.task-checklist {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  font-size: 0.85rem;
  color: #cbd5e1;
  padding: 0.6rem 0.85rem;
  background: rgba(30, 41, 59, 0.4);
  border-radius: 8px;
}

.task-checkbox {
  accent-color: #6366f1;
}

.star-icon {
  font-size: 0.9rem;
}

/* Modal */
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
  max-width: 480px;
  padding: 2rem;
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
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
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.form-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #cbd5e1;
}

.form-input, .form-select, .form-textarea {
  padding: 0.75rem 1rem;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  color: #f8fafc;
  font-size: 0.95rem;
  outline: none;
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
  background: linear-gradient(135deg, #10b981, #059669);
  color: #ffffff;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
}
</style>
