<template>
  <div class="tr-page">
    <div class="tr-container">
      <!-- Hero Header Banner -->
      <div class="tr-hero">
        <div class="hero-left">
          <div class="pill-badge">
            <span class="pulse-dot"></span>
            <span>ACWR Strain Protocol &bull; Fastify Science Engine</span>
          </div>
          <h1 class="hero-title">Training Load & Recovery Dashboard</h1>
          <p class="hero-subtitle">Monitor your Acute-to-Chronic Workload Ratio (ACWR), HRV recovery metrics, and prevent overtraining burnout.</p>
        </div>

        <div class="hero-actions">
          <button @click="showLogSessionModal = true" class="btn-primary-action">
            🏋️ Log Workout Workload
          </button>
          <button @click="showLogRecoveryModal = true" class="btn-secondary-action">
            ⚡ Log Daily Recovery
          </button>
        </div>
      </div>

      <!-- ACWR Workload Strain Gauges Grid -->
      <div v-if="loadSummary" class="acwr-summary-grid">
        <!-- ACWR Ratio Card -->
        <div class="acwr-main-card">
          <div class="acwr-header">
            <div class="acwr-badge-row">
              <span class="acwr-tag">ACWR Ratio</span>
              <span class="status-pill" :class="loadSummary.status.toLowerCase()">
                {{ loadSummary.status }}
              </span>
            </div>
            <div class="acwr-number-display">
              <span class="acwr-num">{{ loadSummary.acwrRatio.toFixed(2) }}</span>
              <span class="acwr-range">Sweet Spot: 0.80 - 1.30</span>
            </div>
          </div>

          <p class="acwr-advice">{{ loadSummary.recommendation }}</p>

          <div class="acwr-meter-wrapper">
            <div class="acwr-meter-track">
              <div
                class="acwr-meter-pointer"
                :style="{ left: `${getAcwrPointerPercent(loadSummary.acwrRatio)}%` }"
              ></div>
            </div>
            <div class="meter-labels">
              <span>0.5 (Under)</span>
              <span>1.0 (Optimal)</span>
              <span>1.5+ (High Risk)</span>
            </div>
          </div>
        </div>

        <!-- Acute & Chronic Load Cards -->
        <div class="load-metrics-card">
          <div class="load-metric-item">
            <div class="load-icon acute">⚡</div>
            <div>
              <span class="load-val">{{ loadSummary.acuteLoad }}</span>
              <span class="load-lbl">Acute Workload (7-Day Avg)</span>
            </div>
          </div>

          <div class="load-metric-item">
            <div class="load-icon chronic">📈</div>
            <div>
              <span class="load-val">{{ loadSummary.chronicLoad }}</span>
              <span class="load-lbl">Chronic Workload (28-Day Avg)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recovery Readiness & Wellness Breakdown -->
      <div v-if="todayRecovery" class="recovery-section card">
        <div class="card-header">
          <div class="icon-circle emerald">🔋</div>
          <div>
            <h2>Today's Recovery Readiness</h2>
            <span class="sub-text">Calculated readiness score & biometrics breakdown</span>
          </div>
        </div>

        <div class="recovery-grid">
          <div class="readiness-ring-card">
            <div class="ring-circle">
              <span class="ring-num">{{ todayRecovery.readinessScore }}</span>
              <span class="ring-unit">/100</span>
            </div>
            <span class="readiness-status-tag" :class="todayRecovery.status.toLowerCase()">
              {{ todayRecovery.status }} READINESS
            </span>
          </div>

          <div class="metrics-grid">
            <div class="metric-box">
              <span class="metric-icon">😴</span>
              <span class="metric-val">{{ todayRecovery.metrics?.sleepHours || 8.0 }}h</span>
              <span class="metric-lbl">Sleep Duration</span>
            </div>

            <div class="metric-box">
              <span class="metric-icon">💓</span>
              <span class="metric-val">{{ todayRecovery.metrics?.hrvMs || 75 }} ms</span>
              <span class="metric-lbl">HRV (Heart Rate Var)</span>
            </div>

            <div class="metric-box">
              <span class="metric-icon">💪</span>
              <span class="metric-val">{{ todayRecovery.metrics?.sorenessLevel || 2 }} / 10</span>
              <span class="metric-lbl">Muscle Soreness</span>
            </div>

            <div class="metric-box">
              <span class="metric-icon">⚡</span>
              <span class="metric-val">{{ todayRecovery.metrics?.energyLevel || 8 }} / 10</span>
              <span class="metric-lbl">Energy Level</span>
            </div>
          </div>
        </div>

        <p class="recovery-advice-text">
          💡 <strong>Coach Advice:</strong> {{ todayRecovery.advice }}
        </p>
      </div>

      <!-- Log History Lists -->
      <div class="history-grid">
        <!-- Training Logs List -->
        <div class="card">
          <div class="card-header">
            <div class="icon-circle indigo">🏋️</div>
            <h2>Recent Workout Logs</h2>
          </div>
          <div class="card-body">
            <div v-if="sessionLogs.length > 0" class="log-list">
              <div v-for="log in sessionLogs" :key="log.id" class="log-item">
                <div class="log-info">
                  <h4 class="log-title">{{ log.workoutTitle || 'Workout Session' }}</h4>
                  <span class="log-date">{{ formatDate(log.loggedAt) }}</span>
                </div>
                <div class="log-metrics">
                  <span class="rpe-badge">RPE {{ log.rpe }}</span>
                  <span class="strain-val">Workload: {{ log.workloadScore || log.durationMinutes * log.rpe }} pts</span>
                </div>
              </div>
            </div>
            <div v-else class="empty-logs">
              <p>No workout sessions logged yet. Click "Log Workout Workload" above!</p>
            </div>
          </div>
        </div>

        <!-- Recovery Logs History List -->
        <div class="card">
          <div class="card-header">
            <div class="icon-circle violet">🌙</div>
            <h2>Historical Recovery Records</h2>
          </div>
          <div class="card-body">
            <div v-if="recoveryHistory.length > 0" class="log-list">
              <div v-for="(rec, idx) in recoveryHistory" :key="idx" class="log-item">
                <div class="log-info">
                  <h4 class="log-title">{{ rec.date }}</h4>
                  <span class="log-date">{{ rec.sleepHours }}h sleep &bull; HRV: {{ rec.hrvMs || 75 }}ms</span>
                </div>
                <div class="log-metrics">
                  <span class="readiness-mini-tag" :class="rec.status.toLowerCase()">
                    {{ rec.readinessScore }} pts ({{ rec.status }})
                  </span>
                </div>
              </div>
            </div>
            <div v-else class="empty-logs">
              <p>No historical recovery logs submitted yet.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Log Workout Session Modal -->
    <div v-if="showLogSessionModal" class="modal-overlay" @click.self="showLogSessionModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h2>Log Workout Workload Session</h2>
          <button @click="showLogSessionModal = false" class="close-btn">&times;</button>
        </div>

        <form @submit.prevent="handleLogSessionSubmit" class="modal-form">
          <div class="form-group">
            <label class="form-label">Workout Title</label>
            <input
              v-model="sessionForm.workoutTitle"
              type="text"
              required
              placeholder="e.g. Heavy Upper Body Push"
              class="form-input"
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Duration (Minutes)</label>
              <input
                v-model.number="sessionForm.durationMinutes"
                type="number"
                min="10"
                max="240"
                required
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label class="form-label">RPE Exertion (1 to 10)</label>
              <input
                v-model.number="sessionForm.rpe"
                type="number"
                min="1"
                max="10"
                required
                class="form-input"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Calculated Workload Score: <strong>{{ sessionForm.durationMinutes * sessionForm.rpe }}</strong> pts</label>
          </div>

          <div class="form-group">
            <label class="form-label">Total Volume Tonnage (kg - Optional)</label>
            <input
              v-model.number="sessionForm.tonnageKg"
              type="number"
              placeholder="e.g. 4500"
              class="form-input"
            />
          </div>

          <div class="modal-footer">
            <button type="button" @click="showLogSessionModal = false" class="btn-cancel">Cancel</button>
            <button type="submit" class="btn-submit" :disabled="isSessionSaving">
              {{ isSessionSaving ? 'Saving...' : 'Log Workout Session' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Log Daily Recovery Modal -->
    <div v-if="showLogRecoveryModal" class="modal-overlay" @click.self="showLogRecoveryModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h2>Log Daily Recovery & Biometrics</h2>
          <button @click="showLogRecoveryModal = false" class="close-btn">&times;</button>
        </div>

        <form @submit.prevent="handleLogRecoverySubmit" class="modal-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Sleep Duration (Hours)</label>
              <input
                v-model.number="recoveryForm.sleepHours"
                type="number"
                step="0.1"
                min="0"
                max="16"
                required
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label class="form-label">HRV (ms - Optional)</label>
              <input
                v-model.number="recoveryForm.hrvMs"
                type="number"
                placeholder="75"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Muscle Soreness (1 = Fresh, 10 = Severe Soreness): {{ recoveryForm.sorenessLevel }}</label>
            <input v-model.number="recoveryForm.sorenessLevel" type="range" min="1" max="10" class="form-range" />
          </div>

          <div class="form-group">
            <label class="form-label">Energy Level (1 = Exhausted, 10 = Peak Energy): {{ recoveryForm.energyLevel }}</label>
            <input v-model.number="recoveryForm.energyLevel" type="range" min="1" max="10" class="form-range" />
          </div>

          <div class="form-group">
            <label class="form-label">Stress Level (1 = Calm, 10 = High Stress): {{ recoveryForm.stressLevel }}</label>
            <input v-model.number="recoveryForm.stressLevel" type="range" min="1" max="10" class="form-range" />
          </div>

          <div class="modal-footer">
            <button type="button" @click="showLogRecoveryModal = false" class="btn-cancel">Cancel</button>
            <button type="submit" class="btn-submit" :disabled="isRecoverySaving">
              {{ isRecoverySaving ? 'Saving...' : 'Submit Recovery Logs' }}
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

const { loadSummary, sessionLogs, isSaving: isSessionSaving, fetchLoadSummary, fetchHistory: fetchLoadHistory, logSession } = useTrainingLoad();
const { todayRecovery, recoveryHistory, isSaving: isRecoverySaving, fetchTodayRecovery, fetchHistory: fetchRecoveryHistory, submitRecovery } = useRecovery();

const showLogSessionModal = ref(false);
const showLogRecoveryModal = ref(false);

const sessionForm = reactive({
  workoutTitle: 'Heavy Upper Body Push',
  durationMinutes: 60,
  rpe: 8,
  tonnageKg: 4200,
});

const recoveryForm = reactive({
  sleepHours: 8.0,
  hrvMs: 75,
  sorenessLevel: 3,
  energyLevel: 8,
  stressLevel: 3,
  fatigueLevel: 3,
});

onMounted(async () => {
  await fetchLoadSummary();
  await fetchLoadHistory();
  await fetchTodayRecovery();
  await fetchRecoveryHistory();
});

const getAcwrPointerPercent = (ratio: number) => {
  // ACWR 0.5 = 10%, ACWR 1.0 = 50%, ACWR 1.5+ = 90%
  const clamped = Math.min(2.0, Math.max(0.4, ratio));
  return Math.round(((clamped - 0.4) / 1.6) * 100);
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'Recently';
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const handleLogSessionSubmit = async () => {
  const success = await logSession({
    workoutTitle: sessionForm.workoutTitle,
    durationMinutes: sessionForm.durationMinutes,
    rpe: sessionForm.rpe,
    tonnageKg: sessionForm.tonnageKg || undefined,
  });

  if (success) {
    showLogSessionModal.value = false;
  }
};

const handleLogRecoverySubmit = async () => {
  const success = await submitRecovery({
    sleepHours: recoveryForm.sleepHours,
    hrvMs: recoveryForm.hrvMs || undefined,
    sorenessLevel: recoveryForm.sorenessLevel,
    energyLevel: recoveryForm.energyLevel,
    stressLevel: recoveryForm.stressLevel,
    fatigueLevel: recoveryForm.fatigueLevel,
  });

  if (success) {
    showLogRecoveryModal.value = false;
  }
};
</script>

<style scoped>
.tr-page {
  max-width: 1150px;
  margin: 2rem auto;
  padding: 0 1.5rem;
}

.tr-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2.25rem;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  backdrop-filter: blur(16px);
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1.5rem;
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
  max-width: 650px;
}

.hero-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-primary-action {
  padding: 0.75rem 1.25rem;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: #ffffff;
  border: none;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.35);
}

.btn-secondary-action {
  padding: 0.75rem 1.25rem;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #6ee7b7;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
}

.acwr-summary-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

@media (max-width: 768px) {
  .acwr-summary-grid { grid-template-columns: 1fr; }
}

.acwr-main-card {
  padding: 1.75rem;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
}

.acwr-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.acwr-tag {
  font-size: 0.85rem;
  font-weight: 700;
  color: #a5b4fc;
}

.status-pill {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
}

.status-pill.optimal { background: rgba(16, 185, 129, 0.2); color: #34d399; }
.status-pill.overreaching { background: rgba(244, 63, 94, 0.2); color: #fb7185; }

.acwr-number-display {
  text-align: right;
}

.acwr-num {
  font-size: 2.2rem;
  font-weight: 800;
  color: #f8fafc;
  line-height: 1;
  display: block;
}

.acwr-range {
  font-size: 0.75rem;
  color: #94a3b8;
}

.acwr-advice {
  font-size: 0.9rem;
  color: #cbd5e1;
  margin: 0 0 1.5rem;
}

.acwr-meter-track {
  position: relative;
  width: 100%;
  height: 10px;
  background: linear-gradient(90deg, #60a5fa 0%, #34d399 35%, #34d399 65%, #f43f5e 100%);
  border-radius: 9999px;
  margin-bottom: 0.5rem;
}

.acwr-meter-pointer {
  position: absolute;
  top: -4px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ffffff;
  border: 3px solid #6366f1;
  box-shadow: 0 0 10px rgba(99, 102, 241, 0.8);
  transform: translateX(-50%);
  transition: left 0.4s ease;
}

.meter-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #64748b;
}

.load-metrics-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.load-metric-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  flex: 1;
}

.load-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.load-icon.acute { background: rgba(99, 102, 241, 0.15); }
.load-icon.chronic { background: rgba(168, 85, 247, 0.15); }

.load-val {
  font-size: 1.6rem;
  font-weight: 800;
  color: #f8fafc;
  display: block;
  line-height: 1.1;
}

.load-lbl {
  font-size: 0.8rem;
  color: #94a3b8;
}

.card {
  padding: 2rem;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  backdrop-filter: blur(16px);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin-bottom: 1.5rem;
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
.icon-circle.emerald { background: rgba(16, 185, 129, 0.15); }

.card-header h2 {
  font-size: 1.15rem;
  font-weight: 700;
  color: #f8fafc;
  margin: 0;
}

.sub-text {
  font-size: 0.85rem;
  color: #94a3b8;
}

.recovery-section {
  margin-bottom: 1.5rem;
}

.recovery-grid {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

@media (max-width: 768px) {
  .recovery-grid { grid-template-columns: 1fr; }
}

.readiness-ring-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
}

.ring-circle {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981, #059669);
  color: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

.ring-num {
  font-size: 1.8rem;
  font-weight: 800;
  line-height: 1;
}

.ring-unit {
  font-size: 0.75rem;
  opacity: 0.8;
}

.readiness-status-tag {
  font-size: 0.75rem;
  font-weight: 800;
  color: #34d399;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

@media (max-width: 768px) {
  .metrics-grid { grid-template-columns: repeat(2, 1fr); }
}

.metric-box {
  padding: 1rem;
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.metric-icon { font-size: 1.4rem; margin-bottom: 0.35rem; }

.metric-val {
  font-size: 1.1rem;
  font-weight: 700;
  color: #f1f5f9;
}

.metric-lbl {
  font-size: 0.75rem;
  color: #94a3b8;
}

.recovery-advice-text {
  padding: 1rem 1.25rem;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 12px;
  color: #a7f3d0;
  font-size: 0.9rem;
  margin: 0;
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .history-grid { grid-template-columns: 1fr; }
}

.log-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.log-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1rem;
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
}

.log-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0 0 0.2rem;
}

.log-date {
  font-size: 0.8rem;
  color: #94a3b8;
}

.log-metrics {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.2rem;
}

.rpe-badge {
  font-size: 0.75rem;
  font-weight: 700;
  background: rgba(99, 102, 241, 0.2);
  color: #a5b4fc;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
}

.strain-val {
  font-size: 0.8rem;
  color: #cbd5e1;
  font-weight: 600;
}

.readiness-mini-tag {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.readiness-mini-tag.excellent { background: rgba(16, 185, 129, 0.2); color: #34d399; }
.readiness-mini-tag.good { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }

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

.form-input, .form-range {
  padding: 0.75rem 1rem;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  color: #f8fafc;
  font-size: 0.95rem;
  outline: none;
}

.form-range {
  accent-color: #6366f1;
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
</style>
