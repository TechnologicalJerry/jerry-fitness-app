<template>
  <div class="search-page">
    <div class="search-container">
      <!-- Search Hero Banner -->
      <div class="search-hero">
        <div class="hero-left">
          <div class="pill-badge">
            <span class="pulse-dot"></span>
            <span>Exercise & Media Database &bull; Fastify Search Engine</span>
          </div>
          <h1 class="hero-title">Exercise Library & Global Search</h1>
          <p class="hero-subtitle">Search exercises by muscle group, equipment, difficulty, or query workout plans and goals.</p>
        </div>
      </div>

      <!-- Main Search Box -->
      <div class="search-box-card">
        <div class="input-wrapper">
          <svg xmlns="http://www.w3.org/2000/svg" class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search exercises, goals, or muscle groups (e.g. Bench Press, Squat, Chest)..."
            class="search-input"
            @input="handleSearchInput"
          />
          <button v-if="searchQuery" @click="searchQuery = ''; handleSearchInput()" class="clear-btn">&times;</button>
        </div>
      </div>

      <!-- Filter Controls Section -->
      <div class="filters-section">
        <!-- Muscle Category Filters -->
        <div class="filter-row">
          <span class="filter-label">Muscle Group:</span>
          <div class="chip-group">
            <button
              v-for="muscle in ['ALL', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core']"
              :key="muscle"
              class="chip-btn"
              :class="{ selected: selectedMuscle === muscle }"
              @click="selectedMuscle = muscle; triggerSearch()"
            >
              {{ muscle }}
            </button>
          </div>
        </div>

        <!-- Equipment Filters -->
        <div class="filter-row">
          <span class="filter-label">Equipment:</span>
          <div class="chip-group">
            <button
              v-for="equip in ['ALL', 'BARBELL', 'DUMBBELL', 'CABLE', 'MACHINE', 'BODYWEIGHT']"
              :key="equip"
              class="chip-btn"
              :class="{ selected: selectedEquipment === equip }"
              @click="selectedEquipment = equip; triggerSearch()"
            >
              {{ equip }}
            </button>
          </div>
        </div>
      </div>

      <!-- Exercise Grid -->
      <div v-if="exerciseResults.length > 0" class="exercise-grid">
        <div
          v-for="exercise in exerciseResults"
          :key="exercise.id"
          class="exercise-card"
        >
          <div class="card-top">
            <span class="category-pill">{{ exercise.category }}</span>
            <span class="difficulty-badge" :class="exercise.difficulty.toLowerCase()">
              {{ exercise.difficulty }}
            </span>
          </div>

          <h3 class="exercise-title">{{ exercise.name }}</h3>

          <div class="equipment-row">
            <span class="equip-tag">🏋️ {{ exercise.equipment }}</span>
          </div>

          <div class="muscles-row">
            <span v-for="(m, midx) in exercise.targetMuscles" :key="midx" class="muscle-tag">
              ✓ {{ m }}
            </span>
          </div>

          <button @click="openExerciseModal(exercise)" class="btn-instructions">
            📖 View Instructions
          </button>
        </div>
      </div>

      <!-- Empty Results State -->
      <div v-else class="empty-state card">
        <div class="empty-icon">🔍</div>
        <h3>No Exercises Found</h3>
        <p>Try clearing or broadening your search filters.</p>
      </div>
    </div>

    <!-- Instructions Modal -->
    <div v-if="selectedExerciseModal" class="modal-overlay" @click.self="selectedExerciseModal = null">
      <div class="modal-card">
        <div class="modal-header">
          <h2>{{ selectedExerciseModal.name }}</h2>
          <button @click="selectedExerciseModal = null" class="close-btn">&times;</button>
        </div>

        <div class="modal-body">
          <div class="modal-tags-row">
            <span class="category-pill">{{ selectedExerciseModal.category }}</span>
            <span class="equip-tag">🏋️ {{ selectedExerciseModal.equipment }}</span>
            <span class="difficulty-badge" :class="selectedExerciseModal.difficulty.toLowerCase()">
              {{ selectedExerciseModal.difficulty }}
            </span>
          </div>

          <h3 class="instructions-heading">Step-by-Step Execution Guide:</h3>
          <ol class="instructions-list">
            <li v-for="(step, sidx) in (selectedExerciseModal.instructions || [])" :key="sidx">
              {{ step }}
            </li>
          </ol>
        </div>

        <div class="modal-footer">
          <button @click="selectedExerciseModal = null" class="btn-cancel">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ExerciseSearchResult } from '~/types/search';

definePageMeta({
  middleware: 'auth',
});

const { exerciseResults, searchExercises } = useSearch();

const searchQuery = ref('');
const selectedMuscle = ref('ALL');
const selectedEquipment = ref('ALL');
const selectedExerciseModal = ref<ExerciseSearchResult | null>(null);

onMounted(async () => {
  await searchExercises(selectedMuscle.value, selectedEquipment.value, searchQuery.value);
});

const handleSearchInput = async () => {
  await triggerSearch();
};

const triggerSearch = async () => {
  await searchExercises(selectedMuscle.value, selectedEquipment.value, searchQuery.value);
};

const openExerciseModal = (exercise: ExerciseSearchResult) => {
  selectedExerciseModal.value = exercise;
};
</script>

<style scoped>
.search-page {
  max-width: 1150px;
  margin: 2rem auto;
  padding: 0 1.5rem;
}

.search-hero {
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

.search-box-card {
  margin-bottom: 1.5rem;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 1.25rem;
  width: 22px;
  height: 22px;
  color: #818cf8;
}

.search-input {
  width: 100%;
  padding: 1.1rem 3rem 1.1rem 3.25rem;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  color: #f8fafc;
  font-size: 1.05rem;
  outline: none;
  backdrop-filter: blur(16px);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.2);
}

.clear-btn {
  position: absolute;
  right: 1.25rem;
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 1.5rem;
  cursor: pointer;
}

.filters-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  margin-bottom: 1.5rem;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: #94a3b8;
  width: 110px;
}

.chip-group {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.chip-btn {
  padding: 0.45rem 1rem;
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
  color: #ffffff;
}

.exercise-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.exercise-card {
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

.exercise-card:hover {
  border-color: rgba(99, 102, 241, 0.35);
  transform: translateY(-2px);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.85rem;
}

.category-pill {
  padding: 0.2rem 0.6rem;
  background: rgba(99, 102, 241, 0.2);
  color: #a5b4fc;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
}

.difficulty-badge {
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 700;
}

.difficulty-badge.beginner { background: rgba(16, 185, 129, 0.2); color: #34d399; }
.difficulty-badge.intermediate { background: rgba(245, 158, 11, 0.2); color: #fcd34d; }
.difficulty-badge.advanced { background: rgba(244, 63, 94, 0.2); color: #fb7185; }

.exercise-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #f8fafc;
  margin: 0 0 0.65rem;
}

.equipment-row {
  margin-bottom: 0.75rem;
}

.equip-tag {
  font-size: 0.8rem;
  color: #cbd5e1;
  font-weight: 600;
}

.muscles-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 1.25rem;
}

.muscle-tag {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  color: #94a3b8;
  border-radius: 4px;
}

.btn-instructions {
  padding: 0.65rem 1rem;
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.3);
  color: #a5b4fc;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-instructions:hover {
  background: rgba(99, 102, 241, 0.25);
  color: #ffffff;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
}

.empty-icon { font-size: 3rem; margin-bottom: 1rem; }

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
  max-width: 520px;
  padding: 2rem;
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.modal-header h2 {
  font-size: 1.3rem;
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

.modal-tags-row {
  display: flex;
  gap: 0.65rem;
  margin-bottom: 1.25rem;
}

.instructions-heading {
  font-size: 0.95rem;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0 0 0.75rem;
}

.instructions-list {
  padding-left: 1.25rem;
  margin: 0 0 1.5rem;
  color: #cbd5e1;
  font-size: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
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
</style>
