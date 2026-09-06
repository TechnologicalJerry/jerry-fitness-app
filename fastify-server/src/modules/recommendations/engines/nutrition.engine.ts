export interface NutritionRecommendationInput {
  primaryGoal: string;
  activityLevel: string;
  dietaryPreferences: string[];
}

export interface NutritionRecommendationResult {
  calorieTarget: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  hydrationMl: number;
  suggestions: string[];
}

export interface NutritionRecommendationEngine {
  generateRecommendations(input: NutritionRecommendationInput): NutritionRecommendationResult;
}

export class DefaultNutritionRecommendationEngine implements NutritionRecommendationEngine {
  public generateRecommendations(input: NutritionRecommendationInput): NutritionRecommendationResult {
    let calories = 2200;
    let protein = 160;
    let carbs = 220;
    let fats = 70;

    if (input.primaryGoal === 'MUSCLE_GAIN' || input.primaryGoal === 'STRENGTH') {
      calories = 2600;
      protein = 180;
      carbs = 280;
      fats = 80;
    } else if (input.primaryGoal === 'WEIGHT_LOSS') {
      calories = 1900;
      protein = 170;
      carbs = 160;
      fats = 60;
    }

    const suggestions: string[] = [
      `Aim for ${protein}g of protein evenly distributed across your meals.`,
      'Consume a post-workout snack with a 3:1 carb-to-protein ratio within 45 minutes.',
      'Maintain continuous hydration throughout your training window.',
    ];

    if (input.dietaryPreferences.includes('vegan') || input.dietaryPreferences.includes('vegetarian')) {
      suggestions.push('Consider plant-based protein sources such as lentils, tofu, edamame, and pea protein.');
    }

    return {
      calorieTarget: calories,
      proteinGrams: protein,
      carbsGrams: carbs,
      fatsGrams: fats,
      hydrationMl: 2800,
      suggestions,
    };
  }
}

export const nutritionRecommendationEngine = new DefaultNutritionRecommendationEngine();
