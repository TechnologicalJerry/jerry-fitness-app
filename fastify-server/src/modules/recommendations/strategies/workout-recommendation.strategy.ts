import { WorkoutPlanData } from '../types/recommendation.types';

export interface WorkoutRecommendationInput {
  primaryGoal: string;
  fitnessLevel: string;
  availableEquipment: string[];
  preferredDurationMinutes: number;
  dislikedExercises: string[];
  recoveryScore: number;
  recentWorkloadRatio: number;
}

export interface WorkoutRecommendationStrategyResult {
  workout: WorkoutPlanData;
  reason: string;
  confidence: number;
  alternatives: WorkoutPlanData[];
}

export interface WorkoutRecommendationStrategy {
  recommend(input: WorkoutRecommendationInput): WorkoutRecommendationStrategyResult;
}

export class AdaptiveWorkoutStrategy implements WorkoutRecommendationStrategy {
  public recommend(input: WorkoutRecommendationInput): WorkoutRecommendationStrategyResult {
    // If recovery score is low or acute workload is high -> Recommend light active recovery / mobility
    if (input.recoveryScore < 50 || input.recentWorkloadRatio > 1.4) {
      const recoveryWorkout: WorkoutPlanData = {
        title: 'Active Mobility & Deload Recovery',
        targetMuscleGroups: ['Full Body', 'Joints'],
        estimatedDurationMinutes: Math.min(30, input.preferredDurationMinutes),
        difficulty: 'Beginner',
        exercises: [
          { id: 'ex-mob-1', name: 'Dynamic Cat-Cow Stretch', sets: 3, reps: '45s', restSeconds: 30 },
          { id: 'ex-mob-2', name: 'Thoracic Spine Rotations', sets: 3, reps: '10 per side', restSeconds: 30 },
          { id: 'ex-mob-3', name: 'Bodyweight Glute Bridges', sets: 3, reps: '12', restSeconds: 45 },
        ],
      };

      return {
        workout: recoveryWorkout,
        reason: 'Elevated workload ratio or lower recovery score detected. Recommended light active recovery.',
        confidence: 0.90,
        alternatives: [],
      };
    }

    // Standard Goal-Based Workout Selection
    let title = 'Hypertrophy Upper Body Focus';
    let targetMuscleGroups = ['Chest', 'Back', 'Shoulders'];
    let exercises = [
      { id: 'ex-str-1', name: 'Dumbbell Bench Press', sets: 4, reps: '8-10', restSeconds: 90 },
      { id: 'ex-str-2', name: 'Bent-Over Barbell Row', sets: 4, reps: '8-10', restSeconds: 90 },
      { id: 'ex-str-3', name: 'Overhead Dumbbell Press', sets: 3, reps: '10-12', restSeconds: 60 },
      { id: 'ex-str-4', name: 'Face Pulls', sets: 3, reps: '15', restSeconds: 45 },
    ];

    if (input.primaryGoal === 'STRENGTH') {
      title = 'Maximal Strength Lower Body';
      targetMuscleGroups = ['Quadriceps', 'Hamstrings', 'Glutes'];
      exercises = [
        { id: 'ex-str-5', name: 'Barbell Back Squat', sets: 5, reps: '5', restSeconds: 180 },
        { id: 'ex-str-6', name: 'Romanian Deadlift', sets: 4, reps: '6-8', restSeconds: 120 },
        { id: 'ex-str-7', name: 'Walking Dumbbell Lunges', sets: 3, reps: '10 per leg', restSeconds: 60 },
      ];
    } else if (input.primaryGoal === 'WEIGHT_LOSS' || input.primaryGoal === 'ENDURANCE') {
      title = 'Full Body Metabolic Conditioning';
      targetMuscleGroups = ['Full Body', 'Cardiovascular'];
      exercises = [
        { id: 'ex-met-1', name: 'Kettlebell / Dumbbell Swings', sets: 4, reps: '45s work', restSeconds: 30 },
        { id: 'ex-met-2', name: 'Push-Up to Renegade Row', sets: 4, reps: '10 total', restSeconds: 45 },
        { id: 'ex-met-3', name: 'Goblet Squat', sets: 4, reps: '15', restSeconds: 45 },
        { id: 'ex-met-4', name: 'Mountain Climbers', sets: 4, reps: '30s work', restSeconds: 30 },
      ];
    }

    // Filter out disliked exercises if any match
    exercises = exercises.filter(
      (e) => !input.dislikedExercises.some((d) => d.toLowerCase() === e.name.toLowerCase()),
    );

    const primaryWorkout: WorkoutPlanData = {
      title,
      targetMuscleGroups,
      estimatedDurationMinutes: input.preferredDurationMinutes,
      difficulty: input.fitnessLevel === 'beginner' ? 'Beginner' : 'Intermediate',
      exercises,
    };

    const alternativeWorkout: WorkoutPlanData = {
      title: 'Express 30-Minute Bodyweight Session',
      targetMuscleGroups: ['Full Body'],
      estimatedDurationMinutes: 30,
      difficulty: 'All Levels',
      exercises: [
        { id: 'ex-bw-1', name: 'Bodyweight Squats', sets: 4, reps: '20', restSeconds: 45 },
        { id: 'ex-bw-2', name: 'Standard Push-Ups', sets: 4, reps: '15', restSeconds: 45 },
        { id: 'ex-bw-3', name: 'Plank Hold', sets: 3, reps: '60s', restSeconds: 30 },
      ],
    };

    return {
      workout: primaryWorkout,
      reason: `Tailored for ${input.primaryGoal} and ${input.fitnessLevel} level with available equipment.`,
      confidence: 0.88,
      alternatives: [alternativeWorkout],
    };
  }
}
