<template>
  <div class="analytics-page">
    <div class="analytics-container">
      <!-- Header Hero -->
      <div class="analytics-hero">
        <div class="hero-left">
          <div class="pill-badge">
            <span class="pulse-dot"></span>
            <span>Performance Intelligence &bull; Fastify Analytics Engine</span>
          </div>
          <h1 class="hero-title">Analytics & AI Recommendations</h1>
          <p class="hero-subtitle">Comprehensive workout volume trends, macro adherence metrics, and real-time AI fitness suggestions.</p>
        </div>

        <button @click="showExportModal = true" class="btn-export">
          📥 Export Fitness Data
        </button>
      </div>

      <!-- Overview Stats Bar -->
      <div v-if="userSummary" class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon indigo">🏋️</div>
          <div class="stat-meta">
            <span class="stat-value">{{ userSummary.totalWorkouts }}</span>
            <span class="stat-label">Total Workouts Completed</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon violet">📈</div>
          <div class="stat-meta">
            <span class="stat-value">{{ (fitnessAnalytics?.trainingVolumeTotalKg || 48500).toLocaleString() }} kg</span>
            <span class="stat-label">Total Volume Lifted</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon emerald">🎯</div>
          <div class="stat-meta">
            <span class="stat-value">{{ userSummary.goalCompletionRatePct }}%</span>
            <span class="stat-label">Goal Completion Rate</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon amber">🔥</div>
          <div class="stat-meta">
            <span class="stat-value">{{ userSummary.currentStreakDays }} Days</span>
            <span class="stat-label">Active Streak</span>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="tab-bar">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span>{{ tab.label }}</span>
        </button>
      </div>

      <!-- Tab 1: Fitness & Tonnage -->
      <div v-if="activeTab === 'fitness'" class="tab-content card">
        <div class="card-title">
          <h2>Fitness Volume & Frequency Trends</h2>
          <p>Weekly training tonnage and muscle group targeting distribution</p>
        </div>

        <div class="fitness-grid">
          <!-- Volume Time Series Chart Preview -->
          <div class="chart-box">
            <h3>Weekly Training Volume (kg)</h3>
            <div class="bar-chart">
              <div
                v-for="item in (fitnessAnalytics?.timeSeries || [])"
                :key="item.date"
                class="bar-column"
              >
                <div class="bar-fill-container">
                  <div
                    class="bar-fill"
                    :style="{ height: `${Math.min(100, (item.volumeKg / 15000) * 100)}%` }"
                  >
                    <span class="bar-tooltip">{{ item.volumeKg }} kg</span>
                  </div>
                </div>
                <span class="bar-label">{{ item.date }}</span>
              </div>
            </div>
          </div>

          <!-- Muscle Group Distribution Breakdown -->
          <div class="muscle-box">
            <h3>Muscle Group Targeting Distribution</h3>
            <div class="muscle-list">
              <div
                v-for="(pct, muscle) in (fitnessAnalytics?.muscleGroupDistribution || {})"
                :key="muscle"
                class="muscle-item"
              >
                <div class="muscle-label-row">
                  <span>{{ muscle }}</span>
                  <strong>{{ pct }}%</strong>
                </div>
                <div class="progress-track">
                  <div class="progress-fill" :style="{ width: `${pct}%` }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 2: Nutrition & Hydration -->
      <div v-if="activeTab === 'nutrition'" class="tab-content card">
        <div class="card-title">
          <h2>Nutrition & Hydration Consistency</h2>
          <p>Average daily macronutrient intake and hydration logs</p>
        </div>

        <div class="nutrition-summary-grid">
          <div class="macro-stat-card">
            <span class="macro-lbl">Avg Daily Calories</span>
            <span class="macro-num purple">{{ nutritionAnalytics?.averageDailyCalories || 2350 }} kcal</span>
          </div>
          <div class="macro-stat-card">
            <span class="macro-lbl">Avg Protein</span>
            <span class="macro-num indigo">{{ nutritionAnalytics?.averageProteinGrams || 175 }}g</span>
          </div>
          <div class="macro-stat-card">
            <span class="macro-lbl">Avg Carbs</span>
            <span class="macro-num blue">{{ nutritionAnalytics?.averageCarbsGrams || 230 }}g</span>
          </div>
          <div class="macro-stat-card">
            <span class="macro-lbl">Avg Hydration</span>
            <span class="macro-num emerald">{{ nutritionAnalytics?.hydrationAverageMl || 2850 }} ml</span>
          </div>
        </div>
      </div>

      <!-- Tab 3: Body Progress -->
      <div v-if="activeTab === 'progress'" class="tab-content card">
        <div class="card-title">
          <h2>Body Composition & Personal Records</h2>
          <p>Weight progression timeline and max strength milestones</p>
        </div>

        <div class="progress-grid">
          <div class="pr-box">
            <h3>🏆 Strength Personal Records</h3>
            <div class="pr-list">
              <div
                v-for="(pr, idx) in (progressAnalytics?.strengthProgression || [])"
                :key="idx"
                class="pr-item"
              >
                <div class="pr-left">
                  <span class="pr-name">{{ pr.exerciseName }}</span>
                  <span class="pr-date">{{ pr.date }}</span>
                </div>
                <span class="pr-val">{{ pr.maxWeightKg }} kg</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 4: AI Recommendations Feed -->
      <div v-if="activeTab === 'ai'" class="tab-content card">
        <div class="card-title">
          <h2>AI Fitness & Recovery Suggestions</h2>
          <p>Personalized suggestions generated by Fastify AI Engine</p>
        </div>

        <div v-if="recommendations.length > 0" class="recommendations-list">
          <div
            v-for="rec in recommendations"
            :key="rec.id"
            class="rec-card"
          >
            <div class="rec-header">
              <span class="rec-type-badge">{{ rec.type }}</span>
              <span class="confidence-badge">
                ⚡ {{ Math.round(rec.confidence * 100) }}% Confidence
              </span>
            </div>

            <h3 class="rec-title">{{ rec.title }}</h3>
            <p class="rec-text">{{ rec.recommendation }}</p>
            <p class="rec-reason"><strong>Why:</strong> {{ rec.reason }}</p>

            <div class="factors-row">
              <span v-for="(factor, fidx) in rec.factors" :key="fidx" class="factor-tag">
                ✓ {{ factor }}
              </span>
            </div>

            <div class="rec-actions">
              <button @click="handleDismissRec(rec.id!)" class="btn-rec-dismiss">Dismiss</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Export Modal -->
    <div v-if="showExportModal" class="modal-overlay" @click.self="showExportModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h2>Export Fitness Analytics Data</h2>
          <button @click="showExportModal = false" class="close-btn">&times;</button>
        </div>

        <form @submit.prevent="handleExportSubmit" class="modal-form">
          <div class="form-group">
            <label class="form-label">Export Format</label>
            <select v-model="exportForm.exportType" class="form-select">
              <option value="CSV">📊 CSV Spreadsheet</option>
              <option value="JSON">📜 JSON Raw Object</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Category</label>
            <select v-model="exportForm.category" class="form-select">
              <option value="WORKOUTS">🏋️ Workout History & Tonnage</option>
              <option value="NUTRITION">🥗 Nutrition & Hydration</option>
              <option value="RECOVERY">🔋 Recovery & HRV Logs</option>
              <option value="GOALS">🎯 Goals & Habit Streaks</option>
            </select>
          </div>

          <div class="modal-footer">
            <button type="button" @click="showExportModal = false" class="btn-cancel">Cancel</button>
            <button type="submit" class="btn-submit" :disabled="isExporting">
              {{ isExporting ? 'Generating...' : 'Download Export' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
});

const { userSummary, fitnessAnalytics, nutritionAnalytics, progressAnalytics, isExporting, fetchUserSummary, fetchFitnessAnalytics, fetchNutritionAnalytics, fetchProgressAnalytics, requestExport } = useAnalytics();
const { recommendations, fetchRecommendations, submitFeedback } = useRecommendations();

const activeTab = ref('fitness');
const showExportModal = ref(false);

const tabs = [
  { id: 'fitness', label: 'Fitness & Tonnage', icon: '🏋️' },
  { id: 'nutrition', label: 'Nutrition & Hydration', icon: '🥗' },
  { id: 'progress', label: 'Body Progress', icon: '📈' },
  { id: 'ai', label: 'AI Recommendations', icon: '🤖' },
];

const exportForm = reactive({
  exportType: 'CSV' as 'CSV' | 'JSON',
  category: 'WORKOUTS',
});

onMounted(async () => {
  await fetchUserSummary();
  await fetchFitnessAnalytics();
  await fetchNutritionAnalytics();
  await fetchProgressAnalytics();
  await fetchRecommendations();
});

const handleExportSubmit = async () => {
  const success = await requestExport({
    exportType: exportForm.exportType,
    category: exportForm.category,
  });

  if (success) {
    alert(`Export for ${exportForm.category} in ${exportForm.exportType} format requested successfully!`);
    showExportModal.value = false;
  }
};

const handleDismissRec = async (id: string) => {
  await submitFeedback(id, { feedbackType: 'DISMISSED' });
};
</script>

<style scoped>
.analytics-page {
  max-width: 1150px;
  margin: 2rem auto;
  padding: 0 1.5rem;
}

.analytics-hero {
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

.pill-badge {
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
}

.btn-export {
  padding: 0.75rem 1.35rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #f1f5f9;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-export:hover {
  background: rgba(255, 255, 255, 0.14);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

@media (max-width: 768px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
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
  font-size: 1.35rem;
  font-weight: 800;
  color: #f8fafc;
  line-height: 1.1;
}

.stat-label {
  font-size: 0.8rem;
  color: #94a3b8;
}

.tab-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  color: #94a3b8;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

.tab-btn.active {
  background: rgba(99, 102, 241, 0.25);
  border-color: #6366f1;
  color: #ffffff;
}

.card {
  padding: 2rem;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
}

.card-title h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #f8fafc;
  margin: 0 0 0.35rem;
}

.card-title p {
  font-size: 0.9rem;
  color: #94a3b8;
  margin: 0 0 1.5rem;
}

.fitness-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .fitness-grid { grid-template-columns: 1fr; }
}

.chart-box, .muscle-box {
  padding: 1.5rem;
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
}

.chart-box h3, .muscle-box h3 {
  font-size: 1rem;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0 0 1.25rem;
}

.bar-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 180px;
  padding-top: 1rem;
}

.bar-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  width: 40px;
}

.bar-fill-container {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  position: relative;
}

.bar-fill {
  width: 100%;
  background: linear-gradient(180deg, #6366f1, #4f46e5);
  border-radius: 6px 6px 0 0;
  position: relative;
  transition: height 0.4s ease;
}

.bar-tooltip {
  position: absolute;
  top: -24px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.7rem;
  font-weight: 700;
  color: #a5b4fc;
}

.bar-label {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 0.5rem;
}

.muscle-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.muscle-label-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #cbd5e1;
  margin-bottom: 0.35rem;
}

.progress-track {
  height: 8px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 9999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #818cf8, #c084fc);
  border-radius: 9999px;
}

.nutrition-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
}

.macro-stat-card {
  padding: 1.5rem;
  background: rgba(30, 41, 59, 0.4);
  border-radius: 16px;
  text-align: center;
}

.macro-lbl { font-size: 0.85rem; color: #94a3b8; display: block; margin-bottom: 0.5rem; }
.macro-num { font-size: 1.6rem; font-weight: 800; }
.macro-num.purple { color: #c084fc; }
.macro-num.indigo { color: #818cf8; }
.macro-num.blue { color: #60a5fa; }
.macro-num.emerald { color: #34d399; }

.recommendations-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.rec-card {
  padding: 1.5rem;
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
}

.rec-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.rec-type-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  background: rgba(99, 102, 241, 0.2);
  color: #a5b4fc;
  border-radius: 4px;
}

.confidence-badge {
  font-size: 0.8rem;
  font-weight: 800;
  color: #34d399;
}

.rec-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #f8fafc;
  margin: 0 0 0.5rem;
}

.rec-text {
  font-size: 0.95rem;
  color: #f1f5f9;
  margin: 0 0 0.5rem;
}

.rec-reason {
  font-size: 0.85rem;
  color: #94a3b8;
  margin: 0 0 1rem;
}

.factors-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.factor-tag {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  color: #cbd5e1;
  border-radius: 4px;
}

.rec-actions {
  display: flex;
  justify-content: flex-end;
}

.btn-rec-dismiss {
  padding: 0.4rem 0.85rem;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
  border-radius: 8px;
  font-size: 0.8rem;
  cursor: pointer;
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
  max-width: 440px;
  padding: 2rem;
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
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

.form-label { font-size: 0.85rem; font-weight: 600; color: #cbd5e1; }
.form-select { padding: 0.75rem 1rem; background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 10px; color: #f8fafc; outline: none; }

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.btn-cancel { padding: 0.65rem 1.25rem; background: transparent; border: 1px solid rgba(255, 255, 255, 0.15); color: #cbd5e1; border-radius: 10px; font-weight: 600; cursor: pointer; }
.btn-submit { padding: 0.65rem 1.5rem; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #ffffff; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; }
</style>
