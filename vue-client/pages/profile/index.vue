<template>
  <div class="profile-page">
    <div class="profile-container">
      <!-- Profile Header Hero -->
      <div class="profile-hero">
        <div class="hero-left">
          <div class="avatar-glow">{{ userInitials }}</div>
          <div class="user-meta">
            <h1 class="user-fullname">{{ user?.firstName }} {{ user?.lastName }}</h1>
            <p class="user-email">{{ user?.email }}</p>
            <div class="badge-row">
              <span class="role-badge">{{ user?.role || 'MEMBER' }}</span>
              <span class="goal-pill" v-if="personalizationForm.primaryGoal">
                🎯 {{ formatGoalName(personalizationForm.primaryGoal) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Feedback Banner -->
      <div v-if="profileError || personalizationError" class="alert-banner error">
        <span>⚠️ {{ profileError || personalizationError }}</span>
      </div>
      <div v-if="profileSuccess || personalizationSuccess" class="alert-banner success">
        <span>✨ {{ profileSuccess || personalizationSuccess }}</span>
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

      <!-- Tab 1: Account Information -->
      <div v-if="activeTab === 'account'" class="tab-content card">
        <div class="card-title">
          <h2>Account Details</h2>
          <p>Update your personal profile information</p>
        </div>

        <form @submit.prevent="handleSaveAccount" class="form-grid">
          <div class="form-group">
            <label class="form-label">First Name</label>
            <input
              v-model="accountForm.firstName"
              type="text"
              required
              class="form-input"
              :disabled="isProfileUpdating"
            />
          </div>
          <div class="form-group">
            <label class="form-label">Last Name</label>
            <input
              v-model="accountForm.lastName"
              type="text"
              required
              class="form-input"
              :disabled="isProfileUpdating"
            />
          </div>
          <div class="form-group full-width">
            <label class="form-label">Email Address (Read-only)</label>
            <input
              :value="user?.email"
              type="email"
              disabled
              class="form-input disabled-input"
            />
          </div>

          <div class="form-actions full-width">
            <button type="submit" class="btn-save" :disabled="isProfileUpdating">
              <span v-if="isProfileUpdating" class="spinner"></span>
              <span>{{ isProfileUpdating ? 'Saving...' : 'Save Account Info' }}</span>
            </button>
          </div>
        </form>
      </div>

      <!-- Tab 2: Fitness Profile & Goals -->
      <div v-if="activeTab === 'fitness'" class="tab-content card">
        <div class="card-title">
          <h2>Fitness & Goal Parameters</h2>
          <p>Customize your workout preferences and target objectives</p>
        </div>

        <form @submit.prevent="handleSavePersonalization" class="form-grid">
          <!-- Primary Goal -->
          <div class="form-group full-width">
            <label class="form-label">Primary Fitness Goal</label>
            <select v-model="personalizationForm.primaryGoal" class="form-select">
              <option value="WEIGHT_LOSS">🔥 Weight Loss / Fat Reduction</option>
              <option value="MUSCLE_GAIN">💪 Muscle Gain / Hypertrophy</option>
              <option value="STRENGTH">🏋️ Pure Strength & Power</option>
              <option value="ENDURANCE">🏃 Cardio & Stamina Endurance</option>
              <option value="GENERAL_FITNESS">⚡ General Fitness & Health</option>
              <option value="FLEXIBILITY">🧘 Mobility & Flexibility</option>
              <option value="RECOVERY">🔋 Active Recovery & Rehab</option>
            </select>
          </div>

          <!-- Fitness Level -->
          <div class="form-group full-width">
            <label class="form-label">Fitness Level</label>
            <div class="chip-group">
              <button
                v-for="level in ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ELITE']"
                :key="level"
                type="button"
                class="chip-btn"
                :class="{ selected: personalizationForm.fitnessLevel === level }"
                @click="personalizationForm.fitnessLevel = level"
              >
                {{ level }}
              </button>
            </div>
          </div>

          <!-- Training Experience & Duration -->
          <div class="form-group">
            <label class="form-label">Training Experience (Months)</label>
            <input
              v-model.number="personalizationForm.trainingExperienceMonths"
              type="number"
              min="0"
              max="240"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Preferred Workout Duration: {{ personalizationForm.preferredDurationMinutes }} mins</label>
            <input
              v-model.number="personalizationForm.preferredDurationMinutes"
              type="range"
              min="15"
              max="120"
              step="5"
              class="form-range"
            />
          </div>

          <!-- Preferred Location -->
          <div class="form-group">
            <label class="form-label">Preferred Location</label>
            <select v-model="personalizationForm.preferredLocation" class="form-select">
              <option value="GYM">🏢 Commercial Gym</option>
              <option value="HOME">🏠 Home Gym</option>
              <option value="OUTDOORS">🌳 Outdoors / Park</option>
            </select>
          </div>

          <!-- Preferred Time of Day -->
          <div class="form-group">
            <label class="form-label">Preferred Time of Day</label>
            <select v-model="personalizationForm.preferredTimeOfDay" class="form-select">
              <option value="MORNING">🌅 Morning (6 AM - 11 AM)</option>
              <option value="AFTERNOON">☀️ Afternoon (12 PM - 5 PM)</option>
              <option value="EVENING">🌙 Evening (6 PM - 10 PM)</option>
              <option value="FLEXIBLE">⏰ Flexible</option>
            </select>
          </div>

          <!-- Available Equipment -->
          <div class="form-group full-width">
            <label class="form-label">Available Equipment</label>
            <div class="tag-grid">
              <button
                v-for="equip in equipmentOptions"
                :key="equip"
                type="button"
                class="tag-btn"
                :class="{ active: isEquipmentSelected(equip) }"
                @click="toggleEquipment(equip)"
              >
                {{ isEquipmentSelected(equip) ? '✓ ' : '+ ' }}{{ equip }}
              </button>
            </div>
          </div>

          <div class="form-actions full-width">
            <button type="submit" class="btn-save" :disabled="isPersonalizationSaving">
              <span v-if="isPersonalizationSaving" class="spinner"></span>
              <span>{{ isPersonalizationSaving ? 'Saving...' : 'Save Fitness Profile' }}</span>
            </button>
          </div>
        </form>
      </div>

      <!-- Tab 3: Lifestyle & Nutrition -->
      <div v-if="activeTab === 'lifestyle'" class="tab-content card">
        <div class="card-title">
          <h2>Lifestyle & Nutrition Preferences</h2>
          <p>Configure activity level and dietary settings</p>
        </div>

        <form @submit.prevent="handleSavePersonalization" class="form-grid">
          <!-- Activity Level -->
          <div class="form-group full-width">
            <label class="form-label">Daily Activity Level</label>
            <select v-model="personalizationForm.activityLevel" class="form-select">
              <option value="SEDENTARY">🛋️ Sedentary (Desk Job, little exercise)</option>
              <option value="LIGHT">🚶 Lightly Active (1-3 days/week)</option>
              <option value="MODERATE">🚴 Moderately Active (3-5 days/week)</option>
              <option value="VERY_ACTIVE">🏋️ Very Active (6-7 days/week hard exercise)</option>
              <option value="EXTRA_ACTIVE">💥 Extra Active (Physical job + workouts)</option>
            </select>
          </div>

          <!-- Preferred Meal Frequency -->
          <div class="form-group">
            <label class="form-label">Preferred Daily Meal Frequency</label>
            <select v-model.number="personalizationForm.preferredMealFrequency" class="form-select">
              <option :value="2">2 Meals / Day</option>
              <option :value="3">3 Meals / Day (Standard)</option>
              <option :value="4">4 Meals / Day</option>
              <option :value="5">5+ Small Meals / Day</option>
            </select>
          </div>

          <!-- Dietary Preferences -->
          <div class="form-group full-width">
            <label class="form-label">Dietary Preferences</label>
            <div class="tag-grid">
              <button
                v-for="diet in dietaryOptions"
                :key="diet"
                type="button"
                class="tag-btn"
                :class="{ active: isDietSelected(diet) }"
                @click="toggleDietary(diet)"
              >
                {{ isDietSelected(diet) ? '✓ ' : '+ ' }}{{ diet }}
              </button>
            </div>
          </div>

          <div class="form-actions full-width">
            <button type="submit" class="btn-save" :disabled="isPersonalizationSaving">
              <span v-if="isPersonalizationSaving" class="spinner"></span>
              <span>{{ isPersonalizationSaving ? 'Saving...' : 'Save Lifestyle Info' }}</span>
            </button>
          </div>
        </form>
      </div>

      <!-- Tab 4: Preferences & Settings -->
      <div v-if="activeTab === 'preferences'" class="tab-content card">
        <div class="card-title">
          <h2>Application Preferences</h2>
          <p>Manage notification and display settings</p>
        </div>

        <div class="preference-list">
          <div class="preference-item">
            <div>
              <h3>Email Progress Summaries</h3>
              <p>Receive weekly summary reports of workouts and adherence.</p>
            </div>
            <label class="toggle-switch">
              <input
                type="checkbox"
                v-model="notificationPrefs.email"
                @change="savePreferenceToggle('notifications', 'email', notificationPrefs.email)"
              />
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="preference-item">
            <div>
              <h3>Workout Reminder Push Notifications</h3>
              <p>Get notified before your scheduled training sessions.</p>
            </div>
            <label class="toggle-switch">
              <input
                type="checkbox"
                v-model="notificationPrefs.workoutReminders"
                @change="savePreferenceToggle('notifications', 'workoutReminders', notificationPrefs.workoutReminders)"
              />
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="preference-item">
            <div>
              <h3>Dark Mode Theme</h3>
              <p>High-contrast slate dark aesthetic.</p>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" checked disabled />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GoalType } from '~/types/personalization';

definePageMeta({
  middleware: 'auth',
});

const { user } = useAuth();
const { isUpdating: isProfileUpdating, profileError, successMessage: profileSuccess, updateUserProfile } = useProfile();
const {
  profile,
  isLoading: isPersonalizationLoading,
  isSaving: isPersonalizationSaving,
  error: personalizationError,
  successMsg: personalizationSuccess,
  fetchProfile,
  updateProfile,
  setPreference,
} = usePersonalization();

const activeTab = ref('fitness');

const tabs = [
  { id: 'fitness', label: 'Fitness & Goals', icon: '🏋️' },
  { id: 'account', label: 'Account Info', icon: '👤' },
  { id: 'lifestyle', label: 'Lifestyle & Nutrition', icon: '🥗' },
  { id: 'preferences', label: 'Preferences', icon: '⚙️' },
];

const accountForm = reactive({
  firstName: user.value?.firstName || '',
  lastName: user.value?.lastName || '',
});

const personalizationForm = reactive({
  primaryGoal: 'MUSCLE_GAIN' as GoalType,
  fitnessLevel: 'INTERMEDIATE',
  trainingExperienceMonths: 12,
  preferredDurationMinutes: 45,
  preferredLocation: 'GYM',
  preferredTimeOfDay: 'MORNING',
  activityLevel: 'MODERATE',
  preferredMealFrequency: 3,
  availableEquipment: [] as string[],
  dietaryPreferences: [] as string[],
});

const notificationPrefs = reactive({
  email: true,
  workoutReminders: true,
});

const equipmentOptions = [
  'DUMBBELL',
  'BARBELL',
  'KETTLEBELL',
  'BENCH',
  'CABLE_MACHINE',
  'PULLUP_BAR',
  'RESISTANCE_BANDS',
  'BODYWEIGHT',
  'TREADMILL',
  'ROWER',
];

const dietaryOptions = [
  'HIGH_PROTEIN',
  'VEGAN',
  'VEGETARIAN',
  'KETO',
  'PALEO',
  'LOW_CARB',
  'INTERMITTENT_FASTING',
  'DAIRY_FREE',
  'GLUTEN_FREE',
];

const userInitials = computed(() => {
  if (!user.value) return 'U';
  const f = user.value.firstName?.[0] || '';
  const l = user.value.lastName?.[0] || '';
  return (f + l).toUpperCase() || 'U';
});

onMounted(async () => {
  if (user.value) {
    accountForm.firstName = user.value.firstName;
    accountForm.lastName = user.value.lastName;
  }

  const loaded = await fetchProfile();
  if (loaded) {
    personalizationForm.primaryGoal = (loaded.primaryGoal || 'MUSCLE_GAIN') as GoalType;
    personalizationForm.fitnessLevel = loaded.fitnessLevel || 'INTERMEDIATE';
    personalizationForm.trainingExperienceMonths = loaded.trainingExperienceMonths ?? 12;
    personalizationForm.preferredDurationMinutes = loaded.preferredDurationMinutes ?? 45;
    personalizationForm.preferredLocation = loaded.preferredLocation || 'GYM';
    personalizationForm.preferredTimeOfDay = loaded.preferredTimeOfDay || 'MORNING';
    personalizationForm.activityLevel = loaded.activityLevel || 'MODERATE';
    personalizationForm.preferredMealFrequency = loaded.preferredMealFrequency ?? 3;
    personalizationForm.availableEquipment = [...(loaded.availableEquipment || ['DUMBBELL', 'BARBELL'])];
    personalizationForm.dietaryPreferences = [...(loaded.dietaryPreferences || ['HIGH_PROTEIN'])];
  }
});

const formatGoalName = (goal: string) => {
  return goal.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
};

const isEquipmentSelected = (equip: string) => personalizationForm.availableEquipment.includes(equip);

const toggleEquipment = (equip: string) => {
  const index = personalizationForm.availableEquipment.indexOf(equip);
  if (index > -1) {
    personalizationForm.availableEquipment.splice(index, 1);
  } else {
    personalizationForm.availableEquipment.push(equip);
  }
};

const isDietSelected = (diet: string) => personalizationForm.dietaryPreferences.includes(diet);

const toggleDietary = (diet: string) => {
  const index = personalizationForm.dietaryPreferences.indexOf(diet);
  if (index > -1) {
    personalizationForm.dietaryPreferences.splice(index, 1);
  } else {
    personalizationForm.dietaryPreferences.push(diet);
  }
};

const handleSaveAccount = async () => {
  await updateUserProfile({
    firstName: accountForm.firstName,
    lastName: accountForm.lastName,
  });
};

const handleSavePersonalization = async () => {
  await updateProfile({
    primaryGoal: personalizationForm.primaryGoal,
    fitnessLevel: personalizationForm.fitnessLevel,
    trainingExperienceMonths: personalizationForm.trainingExperienceMonths,
    preferredDurationMinutes: personalizationForm.preferredDurationMinutes,
    preferredLocation: personalizationForm.preferredLocation,
    preferredTimeOfDay: personalizationForm.preferredTimeOfDay,
    activityLevel: personalizationForm.activityLevel,
    preferredMealFrequency: personalizationForm.preferredMealFrequency,
    availableEquipment: personalizationForm.availableEquipment,
    dietaryPreferences: personalizationForm.dietaryPreferences,
  });
};

const savePreferenceToggle = async (category: string, key: string, value: boolean) => {
  await setPreference({ category, key, value });
};
</script>

<style scoped>
.profile-page {
  max-width: 1050px;
  margin: 2rem auto;
  padding: 0 1.5rem;
}

.profile-hero {
  padding: 2.25rem;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  backdrop-filter: blur(16px);
  margin-bottom: 1.5rem;
}

.hero-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.avatar-glow {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #ffffff;
  font-size: 1.8rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 24px rgba(99, 102, 241, 0.45);
}

.user-fullname {
  font-size: 1.75rem;
  font-weight: 800;
  color: #f8fafc;
  margin: 0 0 0.25rem;
}

.user-email {
  font-size: 0.95rem;
  color: #94a3b8;
  margin: 0 0 0.75rem;
}

.badge-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.role-badge {
  padding: 0.25rem 0.75rem;
  background: rgba(99, 102, 241, 0.2);
  border: 1px solid rgba(99, 102, 241, 0.35);
  color: #a5b4fc;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
}

.goal-pill {
  padding: 0.25rem 0.75rem;
  background: rgba(168, 85, 247, 0.2);
  border: 1px solid rgba(168, 85, 247, 0.35);
  color: #e9d5ff;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
}

.alert-banner {
  padding: 0.85rem 1.25rem;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.alert-banner.error {
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

.alert-banner.success {
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #6ee7b7;
}

.tab-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  overflow-x: auto;
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
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #f1f5f9;
  background: rgba(255, 255, 255, 0.06);
}

.tab-btn.active {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(139, 92, 246, 0.25));
  border-color: rgba(99, 102, 241, 0.4);
  color: #ffffff;
}

.card {
  padding: 2.25rem;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  backdrop-filter: blur(16px);
}

.card-title {
  margin-bottom: 2rem;
}

.card-title h2 {
  font-size: 1.35rem;
  font-weight: 700;
  color: #f8fafc;
  margin: 0 0 0.35rem;
}

.card-title p {
  font-size: 0.9rem;
  color: #94a3b8;
  margin: 0;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.full-width {
  grid-column: 1 / -1;
}

.form-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #cbd5e1;
}

.form-input,
.form-select {
  padding: 0.75rem 1rem;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  color: #f8fafc;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-select:focus {
  border-color: #6366f1;
}

.disabled-input {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-range {
  accent-color: #6366f1;
  height: 6px;
  border-radius: 3px;
  margin-top: 0.5rem;
}

.chip-group {
  display: flex;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.chip-btn {
  padding: 0.55rem 1.1rem;
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #94a3b8;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.chip-btn:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.08);
}

.chip-btn.selected {
  background: rgba(99, 102, 241, 0.25);
  border-color: #6366f1;
  color: #818cf8;
}

.tag-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-btn {
  padding: 0.4rem 0.85rem;
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: #94a3b8;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.tag-btn:hover {
  color: #ffffff;
}

.tag-btn.active {
  background: rgba(16, 185, 129, 0.18);
  border-color: rgba(16, 185, 129, 0.4);
  color: #34d399;
}

.form-actions {
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
}

.btn-save {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.75rem;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: #ffffff;
  border: none;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
}

.btn-save:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45);
}

.btn-save:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.preference-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.preference-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem;
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
}

.preference-item h3 {
  font-size: 1rem;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0 0 0.25rem;
}

.preference-item p {
  font-size: 0.85rem;
  color: #94a3b8;
  margin: 0;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 26px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.15);
  transition: 0.3s;
  border-radius: 9999px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: #6366f1;
}

input:checked + .toggle-slider:before {
  transform: translateX(22px);
}
</style>
