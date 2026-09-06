import { ExerciseAlternative } from '../types/recommendation.types';

export interface ExerciseSubstitutionInput {
  targetExerciseId: string;
  availableEquipment: string[];
  dislikedExercises: string[];
  preferredExercises: string[];
}

export interface ExerciseRecommendationEngine {
  findAlternatives(input: ExerciseSubstitutionInput): ExerciseAlternative[];
}

export class DefaultExerciseRecommendationEngine implements ExerciseRecommendationEngine {
  private exerciseDatabase: Array<{
    id: string;
    name: string;
    targetMuscles: string[];
    movementPattern: string;
    requiredEquipment: string;
    difficulty: string;
  }> = [
    {
      id: 'barbell-back-squat',
      name: 'Barbell Back Squat',
      targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings'],
      movementPattern: 'Squat',
      requiredEquipment: 'barbell',
      difficulty: 'Intermediate',
    },
    {
      id: 'goblet-squat',
      name: 'Dumbbell Goblet Squat',
      targetMuscles: ['Quadriceps', 'Glutes'],
      movementPattern: 'Squat',
      requiredEquipment: 'dumbbells',
      difficulty: 'Beginner',
    },
    {
      id: 'leg-press',
      name: 'Leg Press Machine',
      targetMuscles: ['Quadriceps', 'Glutes'],
      movementPattern: 'Squat',
      requiredEquipment: 'gym_machine',
      difficulty: 'Beginner',
    },
    {
      id: 'bulgarian-split-squat',
      name: 'Bulgarian Split Squat',
      targetMuscles: ['Quadriceps', 'Glutes'],
      movementPattern: 'Single-Leg Squat',
      requiredEquipment: 'dumbbells',
      difficulty: 'Intermediate',
    },
    {
      id: 'barbell-bench-press',
      name: 'Barbell Bench Press',
      targetMuscles: ['Chest', 'Triceps', 'Shoulders'],
      movementPattern: 'Horizontal Push',
      requiredEquipment: 'barbell',
      difficulty: 'Intermediate',
    },
    {
      id: 'dumbbell-chest-press',
      name: 'Dumbbell Flat Bench Press',
      targetMuscles: ['Chest', 'Triceps', 'Shoulders'],
      movementPattern: 'Horizontal Push',
      requiredEquipment: 'dumbbells',
      difficulty: 'Beginner',
    },
    {
      id: 'push-ups',
      name: 'Bodyweight Push-Ups',
      targetMuscles: ['Chest', 'Triceps', 'Core'],
      movementPattern: 'Horizontal Push',
      requiredEquipment: 'bodyweight',
      difficulty: 'Beginner',
    },
  ];

  public findAlternatives(input: ExerciseSubstitutionInput): ExerciseAlternative[] {
    const target = this.exerciseDatabase.find((e) => e.id === input.targetExerciseId || e.name.toLowerCase() === input.targetExerciseId.toLowerCase());
    const movement = target ? target.movementPattern : 'Squat';
    const primaryMuscles = target ? target.targetMuscles : ['Quadriceps', 'Glutes'];

    const filtered = this.exerciseDatabase.filter((e) => {
      // Exclude target itself
      if (target && e.id === target.id) return false;
      // Exclude explicitly disliked exercises
      if (input.dislikedExercises.some((d) => d.toLowerCase() === e.name.toLowerCase() || d === e.id)) {
        return false;
      }
      return true;
    });

    const ranked: ExerciseAlternative[] = filtered.map((e) => {
      let score = 0;

      // Same movement pattern (+40 pts)
      if (e.movementPattern === movement) score += 40;

      // Matching target muscles (+15 pts per muscle)
      const matchingMuscles = e.targetMuscles.filter((m) => primaryMuscles.includes(m));
      score += matchingMuscles.length * 15;

      // Equipment availability (+20 pts)
      if (input.availableEquipment.includes(e.requiredEquipment) || e.requiredEquipment === 'bodyweight') {
        score += 20;
      }

      // Preferred exercise boost (+10 pts)
      if (input.preferredExercises.some((p) => p.toLowerCase() === e.name.toLowerCase() || p === e.id)) {
        score += 10;
      }

      return {
        id: e.id,
        name: e.name,
        targetMuscles: e.targetMuscles,
        movementPattern: e.movementPattern,
        requiredEquipment: e.requiredEquipment,
        difficulty: e.difficulty,
        score,
        reason: `Matches ${movement} pattern using ${e.requiredEquipment}.`,
      };
    });

    return ranked.sort((a, b) => b.score - a.score);
  }
}

export const exerciseRecommendationEngine = new DefaultExerciseRecommendationEngine();
