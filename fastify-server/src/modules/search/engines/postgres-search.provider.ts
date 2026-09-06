import { PrismaClient } from '@prisma/client';
import { prismaService } from '../../../database/prisma.service';
import {
  SearchProvider,
  SearchHealthStatus,
} from './search-provider.interface';
import {
  CategorizedSearchResults,
  ExerciseSearchFilters,
  FoodSearchFilters,
  RecipeSearchFilters,
  WorkoutDiscoverFilters,
  TrainerSearchFilters,
  ChallengeDiscoverFilters,
  SearchResultItem,
  AutocompleteSuggestion,
  SearchEntityType,
} from '../types/search.types';
import { searchRanker } from '../ranking/search-ranker';

export class PostgresSearchProvider implements SearchProvider {
  public readonly providerName = 'PostgreSQL';
  private db: PrismaClient;

  constructor(customPrisma?: PrismaClient) {
    this.db = customPrisma || prismaService;
  }

  public async health(): Promise<SearchHealthStatus> {
    try {
      await this.db.$queryRaw`SELECT 1`;
      return {
        status: 'healthy',
        providerName: this.providerName,
        details: { database: 'connected' },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        providerName: this.providerName,
        details: { error: error instanceof Error ? error.message : String(error) },
      };
    }
  }

  public async searchGlobal(
    query: string,
    limit = 10,
    userId?: string,
  ): Promise<CategorizedSearchResults> {
    const normalizedQuery = query.toLowerCase().trim();

    const [exercises, workouts, recipes, foods, trainers, challenges] = await Promise.all([
      this.searchExercises({ query, limit }, userId),
      this.discoverWorkouts({ query, limit }, userId),
      this.searchRecipes({ query, limit }),
      this.searchFoods({ query, limit }),
      this.searchTrainers({ query, limit }),
      this.discoverChallenges({ query, limit }),
    ]);

    const total =
      exercises.total +
      workouts.total +
      recipes.total +
      foods.total +
      trainers.total +
      challenges.total;

    return {
      query,
      normalizedQuery,
      results: {
        exercises: exercises.items,
        workouts: workouts.items,
        recipes: recipes.items,
        foods: foods.items,
        trainers: trainers.items,
        challenges: challenges.items,
      },
      pagination: {
        total,
      },
    };
  }

  public async searchExercises(
    filters: ExerciseSearchFilters,
    _userId?: string,
  ): Promise<{ items: SearchResultItem[]; nextCursor?: string; total: number }> {
    const take = Math.min(filters.limit || 20, 50);
    const where: any = {
      isReported: false,
      visibility: 'PUBLIC',
    };

    if (filters.query) {
      const q = filters.query.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { muscleGroup: { contains: q, mode: 'insensitive' } },
        { primaryMuscle: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (filters.muscle) {
      where.OR = [
        { primaryMuscle: { equals: filters.muscle, mode: 'insensitive' } },
        { muscleGroup: { equals: filters.muscle, mode: 'insensitive' } },
      ];
    }
    if (filters.equipment) {
      where.equipment = { equals: filters.equipment, mode: 'insensitive' };
    }
    if (filters.difficulty) {
      where.difficulty = { equals: filters.difficulty, mode: 'insensitive' };
    }
    if (filters.category) {
      where.category = { equals: filters.category, mode: 'insensitive' };
    }
    if (filters.movementPattern) {
      where.movementPattern = { equals: filters.movementPattern, mode: 'insensitive' };
    }
    if (filters.exerciseType) {
      where.exerciseType = { equals: filters.exerciseType, mode: 'insensitive' };
    }

    let orderBy: any = { createdAt: 'desc' };
    if (filters.sort === 'popularity') {
      orderBy = { popularityScore: 'desc' };
    } else if (filters.sort === 'difficulty') {
      orderBy = { difficulty: 'asc' };
    } else if (filters.sort === 'newest') {
      orderBy = { createdAt: 'desc' };
    }

    const total = await this.db.exercise.count({ where });

    const queryArgs: any = {
      where,
      take: take + 1,
      orderBy,
    };

    if (filters.cursor) {
      queryArgs.cursor = { id: filters.cursor };
      queryArgs.skip = 1;
    }

    const records = await this.db.exercise.findMany(queryArgs);

    let hasMore = false;
    let nextCursor: string | undefined;
    if (records.length > take) {
      hasMore = true;
      const nextItem = records.pop();
      nextCursor = nextItem?.id;
    }

    const items: SearchResultItem[] = records.map((ex) => ({
      id: ex.id,
      entityType: 'EXERCISE',
      title: ex.name,
      description: ex.description || undefined,
      score: 1.0,
      metadata: {
        muscleGroup: ex.muscleGroup,
        primaryMuscle: ex.primaryMuscle,
        secondaryMuscles: ex.secondaryMuscles,
        equipment: ex.equipment,
        difficulty: ex.difficulty,
        category: ex.category,
        movementPattern: ex.movementPattern,
        exerciseType: ex.exerciseType,
        popularityScore: ex.popularityScore,
        viewsCount: ex.viewsCount,
        createdAt: ex.createdAt.toISOString(),
      },
    }));

    const ranked = searchRanker.rank(items, filters.query);

    return {
      items: ranked,
      nextCursor: hasMore ? nextCursor : undefined,
      total,
    };
  }

  public async searchFoods(
    filters: FoodSearchFilters,
  ): Promise<{ items: SearchResultItem[]; nextCursor?: string; total: number }> {
    const take = Math.min(filters.limit || 20, 50);
    const where: any = {};

    if (filters.query) {
      const q = filters.query.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (filters.category) {
      where.category = { equals: filters.category, mode: 'insensitive' };
    }
    if (filters.minCalories !== undefined || filters.maxCalories !== undefined) {
      where.calories = {};
      if (filters.minCalories !== undefined) where.calories.gte = filters.minCalories;
      if (filters.maxCalories !== undefined) where.calories.lte = filters.maxCalories;
    }
    if (filters.minProtein !== undefined || filters.maxProtein !== undefined) {
      where.protein = {};
      if (filters.minProtein !== undefined) where.protein.gte = filters.minProtein;
      if (filters.maxProtein !== undefined) where.protein.lte = filters.maxProtein;
    }
    if (filters.minCarbs !== undefined || filters.maxCarbs !== undefined) {
      where.carbs = {};
      if (filters.minCarbs !== undefined) where.carbs.gte = filters.minCarbs;
      if (filters.maxCarbs !== undefined) where.carbs.lte = filters.maxCarbs;
    }
    if (filters.minFat !== undefined || filters.maxFat !== undefined) {
      where.fat = {};
      if (filters.minFat !== undefined) where.fat.gte = filters.minFat;
      if (filters.maxFat !== undefined) where.fat.lte = filters.maxFat;
    }
    if (filters.dietaryTag) {
      where.dietaryTags = { has: filters.dietaryTag };
    }

    const total = await this.db.food.count({ where });

    const queryArgs: any = {
      where,
      take: take + 1,
      orderBy: { popularityScore: 'desc' },
    };

    if (filters.cursor) {
      queryArgs.cursor = { id: filters.cursor };
      queryArgs.skip = 1;
    }

    const records = await this.db.food.findMany(queryArgs);

    let nextCursor: string | undefined;
    if (records.length > take) {
      const nextItem = records.pop();
      nextCursor = nextItem?.id;
    }

    const items: SearchResultItem[] = records.map((f) => ({
      id: f.id,
      entityType: 'FOOD',
      title: f.name,
      description: f.brand ? `Brand: ${f.brand}` : undefined,
      score: 1.0,
      metadata: {
        brand: f.brand,
        category: f.category,
        calories: f.calories,
        protein: f.protein,
        carbs: f.carbs,
        fat: f.fat,
        dietaryTags: f.dietaryTags,
        popularityScore: f.popularityScore,
        createdAt: f.createdAt.toISOString(),
      },
    }));

    const ranked = searchRanker.rank(items, filters.query);

    return {
      items: ranked,
      nextCursor,
      total,
    };
  }

  public async searchRecipes(
    filters: RecipeSearchFilters,
  ): Promise<{ items: SearchResultItem[]; nextCursor?: string; total: number }> {
    const take = Math.min(filters.limit || 20, 50);
    const where: any = {
      isReported: false,
      visibility: 'PUBLIC',
    };

    if (filters.query) {
      const q = filters.query.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (filters.category) {
      where.category = { equals: filters.category, mode: 'insensitive' };
    }
    if (filters.mealType) {
      where.mealType = { equals: filters.mealType, mode: 'insensitive' };
    }
    if (filters.minCalories !== undefined || filters.maxCalories !== undefined) {
      where.calories = {};
      if (filters.minCalories !== undefined) where.calories.gte = filters.minCalories;
      if (filters.maxCalories !== undefined) where.calories.lte = filters.maxCalories;
    }
    if (filters.minProtein !== undefined) {
      where.protein = { gte: filters.minProtein };
    }
    if (filters.maxPrepTime !== undefined) {
      where.prepTimeMinutes = { lte: filters.maxPrepTime };
    }
    if (filters.dietaryPreference) {
      where.dietaryPreferences = { has: filters.dietaryPreference };
    }

    let orderBy: any = { createdAt: 'desc' };
    if (filters.sort === 'popularity') {
      orderBy = { popularityScore: 'desc' };
    } else if (filters.sort === 'highest_protein') {
      orderBy = { protein: 'desc' };
    } else if (filters.sort === 'lowest_calories') {
      orderBy = { calories: 'asc' };
    }

    const total = await this.db.recipe.count({ where });

    const queryArgs: any = {
      where,
      take: take + 1,
      orderBy,
    };

    if (filters.cursor) {
      queryArgs.cursor = { id: filters.cursor };
      queryArgs.skip = 1;
    }

    const records = await this.db.recipe.findMany(queryArgs);

    let nextCursor: string | undefined;
    if (records.length > take) {
      const nextItem = records.pop();
      nextCursor = nextItem?.id;
    }

    const items: SearchResultItem[] = records.map((r) => ({
      id: r.id,
      entityType: 'RECIPE',
      title: r.title,
      description: r.description || undefined,
      score: 1.0,
      metadata: {
        category: r.category,
        calories: r.calories,
        protein: r.protein,
        prepTimeMinutes: r.prepTimeMinutes,
        cookTimeMinutes: r.cookTimeMinutes,
        servings: r.servings,
        dietaryPreferences: r.dietaryPreferences,
        mealType: r.mealType,
        rating: r.rating,
        popularityScore: r.popularityScore,
        createdAt: r.createdAt.toISOString(),
      },
    }));

    const ranked = searchRanker.rank(items, filters.query);

    return {
      items: ranked,
      nextCursor,
      total,
    };
  }

  public async discoverWorkouts(
    filters: WorkoutDiscoverFilters,
    _userId?: string,
  ): Promise<{ items: SearchResultItem[]; nextCursor?: string; total: number }> {
    const take = Math.min(filters.limit || 20, 50);
    const where: any = {
      isReported: false,
      visibility: 'PUBLIC',
    };

    if (filters.query) {
      const q = filters.query.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { goal: { contains: q, mode: 'insensitive' } },
        { workoutType: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (filters.goal) {
      where.goal = { equals: filters.goal, mode: 'insensitive' };
    }
    if (filters.difficulty) {
      where.difficulty = { equals: filters.difficulty, mode: 'insensitive' };
    }
    if (filters.workoutType) {
      where.workoutType = { equals: filters.workoutType, mode: 'insensitive' };
    }
    if (filters.trainerId) {
      where.trainerId = filters.trainerId;
    }
    if (filters.maxDuration) {
      where.durationMinutes = { lte: filters.maxDuration };
    }
    if (filters.equipment) {
      where.equipment = { has: filters.equipment };
    }
    if (filters.muscleGroup) {
      where.muscleGroups = { has: filters.muscleGroup };
    }

    if (filters.section === 'beginner') {
      where.difficulty = 'BEGINNER';
    }

    let orderBy: any = { createdAt: 'desc' };
    if (filters.section === 'popular' || filters.section === 'trending') {
      orderBy = { popularityScore: 'desc' };
    } else if (filters.section === 'recent') {
      orderBy = { createdAt: 'desc' };
    }

    const total = await this.db.workout.count({ where });

    const queryArgs: any = {
      where,
      take: take + 1,
      orderBy,
    };

    if (filters.cursor) {
      queryArgs.cursor = { id: filters.cursor };
      queryArgs.skip = 1;
    }

    const records = await this.db.workout.findMany(queryArgs);

    let nextCursor: string | undefined;
    if (records.length > take) {
      const nextItem = records.pop();
      nextCursor = nextItem?.id;
    }

    const items: SearchResultItem[] = records.map((w) => ({
      id: w.id,
      entityType: 'WORKOUT',
      title: w.title,
      description: w.description || undefined,
      score: 1.0,
      metadata: {
        goal: w.goal,
        difficulty: w.difficulty,
        durationMinutes: w.durationMinutes,
        equipment: w.equipment,
        muscleGroups: w.muscleGroups,
        workoutType: w.workoutType,
        trainerId: w.trainerId,
        rating: w.rating,
        completionsCount: w.completionsCount,
        popularityScore: w.popularityScore,
        createdAt: w.createdAt.toISOString(),
      },
    }));

    const ranked = searchRanker.rank(items, filters.query);

    return {
      items: ranked,
      nextCursor,
      total,
    };
  }

  public async searchTrainers(
    filters: TrainerSearchFilters,
  ): Promise<{ items: SearchResultItem[]; nextCursor?: string; total: number }> {
    const take = Math.min(filters.limit || 20, 50);
    const where: any = {
      isPublic: true,
    };

    if (filters.query) {
      const q = filters.query.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { bio: { contains: q, mode: 'insensitive' } },
        { location: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (filters.specialty) {
      where.specialties = { has: filters.specialty };
    }
    if (filters.language) {
      where.languages = { has: filters.language };
    }
    if (filters.minExperienceYears !== undefined) {
      where.experienceYears = { gte: filters.minExperienceYears };
    }
    if (filters.minRating !== undefined) {
      where.rating = { gte: filters.minRating };
    }

    let orderBy: any = { rating: 'desc' };
    if (filters.sort === 'newest') {
      orderBy = { createdAt: 'desc' };
    } else if (filters.sort === 'popularity') {
      orderBy = { popularityScore: 'desc' };
    }

    const total = await this.db.trainerProfile.count({ where });

    const queryArgs: any = {
      where,
      take: take + 1,
      orderBy,
    };

    if (filters.cursor) {
      queryArgs.cursor = { id: filters.cursor };
      queryArgs.skip = 1;
    }

    const records = await this.db.trainerProfile.findMany(queryArgs);

    let nextCursor: string | undefined;
    if (records.length > take) {
      const nextItem = records.pop();
      nextCursor = nextItem?.id;
    }

    // Only expose public fields! Never expose private user details.
    const items: SearchResultItem[] = records.map((t) => ({
      id: t.id,
      entityType: 'TRAINER',
      title: t.name,
      description: t.bio || undefined,
      score: 1.0,
      metadata: {
        specialties: t.specialties,
        experienceYears: t.experienceYears,
        rating: t.rating,
        hourlyRate: t.hourlyRate,
        currency: t.currency,
        location: t.location,
        languages: t.languages,
        certifications: t.certifications,
        popularityScore: t.popularityScore,
        createdAt: t.createdAt.toISOString(),
      },
    }));

    const ranked = searchRanker.rank(items, filters.query);

    return {
      items: ranked,
      nextCursor,
      total,
    };
  }

  public async discoverChallenges(
    filters: ChallengeDiscoverFilters,
  ): Promise<{ items: SearchResultItem[]; nextCursor?: string; total: number }> {
    const take = Math.min(filters.limit || 20, 50);
    const where: any = {
      isReported: false,
      visibility: 'PUBLIC',
    };

    if (filters.query) {
      const q = filters.query.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { challengeType: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (filters.type) {
      where.challengeType = { equals: filters.type, mode: 'insensitive' };
    }
    if (filters.difficulty) {
      where.difficulty = { equals: filters.difficulty, mode: 'insensitive' };
    }
    if (filters.status) {
      where.status = { equals: filters.status, mode: 'insensitive' };
    }

    let orderBy: any = { createdAt: 'desc' };
    if (filters.sort === 'participants') {
      orderBy = { participantCount: 'desc' };
    } else if (filters.sort === 'popularity') {
      orderBy = { popularityScore: 'desc' };
    } else if (filters.sort === 'newest') {
      orderBy = { createdAt: 'desc' };
    }

    const total = await this.db.challenge.count({ where });

    const queryArgs: any = {
      where,
      take: take + 1,
      orderBy,
    };

    if (filters.cursor) {
      queryArgs.cursor = { id: filters.cursor };
      queryArgs.skip = 1;
    }

    const records = await this.db.challenge.findMany(queryArgs);

    let nextCursor: string | undefined;
    if (records.length > take) {
      const nextItem = records.pop();
      nextCursor = nextItem?.id;
    }

    const items: SearchResultItem[] = records.map((c) => ({
      id: c.id,
      entityType: 'CHALLENGE',
      title: c.title,
      description: c.description || undefined,
      score: 1.0,
      metadata: {
        challengeType: c.challengeType,
        difficulty: c.difficulty,
        status: c.status,
        durationDays: c.durationDays,
        participantCount: c.participantCount,
        popularityScore: c.popularityScore,
        createdAt: c.createdAt.toISOString(),
      },
    }));

    const ranked = searchRanker.rank(items, filters.query);

    return {
      items: ranked,
      nextCursor,
      total,
    };
  }

  public async suggest(
    query: string,
    entityTypes?: SearchEntityType[],
    limit = 10,
  ): Promise<AutocompleteSuggestion[]> {
    const q = query.trim();
    if (!q) return [];

    const suggestions: AutocompleteSuggestion[] = [];
    const maxPerType = Math.ceil(limit / 5);

    const typesToSearch = entityTypes && entityTypes.length > 0 ? entityTypes : ['EXERCISE', 'WORKOUT', 'FOOD', 'RECIPE', 'TRAINER'];

    const tasks: Promise<void>[] = [];

    if (typesToSearch.includes('EXERCISE')) {
      tasks.push(
        this.db.exercise
          .findMany({
            where: { name: { startsWith: q, mode: 'insensitive' }, isReported: false, visibility: 'PUBLIC' },
            take: maxPerType,
            select: { id: true, name: true },
          })
          .then((res) => {
            res.forEach((item) =>
              suggestions.push({ id: item.id, text: item.name, entityType: 'EXERCISE' }),
            );
          }),
      );
    }

    if (typesToSearch.includes('WORKOUT')) {
      tasks.push(
        this.db.workout
          .findMany({
            where: { title: { startsWith: q, mode: 'insensitive' }, isReported: false, visibility: 'PUBLIC' },
            take: maxPerType,
            select: { id: true, title: true },
          })
          .then((res) => {
            res.forEach((item) =>
              suggestions.push({ id: item.id, text: item.title, entityType: 'WORKOUT' }),
            );
          }),
      );
    }

    if (typesToSearch.includes('FOOD')) {
      tasks.push(
        this.db.food
          .findMany({
            where: { name: { startsWith: q, mode: 'insensitive' } },
            take: maxPerType,
            select: { id: true, name: true },
          })
          .then((res) => {
            res.forEach((item) =>
              suggestions.push({ id: item.id, text: item.name, entityType: 'FOOD' }),
            );
          }),
      );
    }

    if (typesToSearch.includes('RECIPE')) {
      tasks.push(
        this.db.recipe
          .findMany({
            where: { title: { startsWith: q, mode: 'insensitive' }, isReported: false, visibility: 'PUBLIC' },
            take: maxPerType,
            select: { id: true, title: true },
          })
          .then((res) => {
            res.forEach((item) =>
              suggestions.push({ id: item.id, text: item.title, entityType: 'RECIPE' }),
            );
          }),
      );
    }

    if (typesToSearch.includes('TRAINER')) {
      tasks.push(
        this.db.trainerProfile
          .findMany({
            where: { name: { startsWith: q, mode: 'insensitive' }, isPublic: true },
            take: maxPerType,
            select: { id: true, name: true },
          })
          .then((res) => {
            res.forEach((item) =>
              suggestions.push({ id: item.id, text: item.name, entityType: 'TRAINER' }),
            );
          }),
      );
    }

    await Promise.all(tasks);

    return suggestions.slice(0, limit);
  }

  public async indexEntity(_entityType: SearchEntityType, _entityId: string): Promise<void> {
    // In PostgreSQL, primary tables act as the search index source of truth.
  }

  public async updateIndex(_entityType: SearchEntityType, _entityId: string): Promise<void> {
    // In PostgreSQL, primary tables act as the search index source of truth.
  }

  public async removeFromIndex(_entityType: SearchEntityType, _entityId: string): Promise<void> {
    // In PostgreSQL, primary tables act as the search index source of truth.
  }

  public async rebuildIndex(entityType?: SearchEntityType): Promise<{ processed: number; errors: number }> {
    let processed = 0;
    if (!entityType || entityType === 'EXERCISE') {
      processed += await this.db.exercise.count();
    }
    if (!entityType || entityType === 'WORKOUT') {
      processed += await this.db.workout.count();
    }
    if (!entityType || entityType === 'FOOD') {
      processed += await this.db.food.count();
    }
    if (!entityType || entityType === 'RECIPE') {
      processed += await this.db.recipe.count();
    }
    if (!entityType || entityType === 'TRAINER') {
      processed += await this.db.trainerProfile.count();
    }
    if (!entityType || entityType === 'CHALLENGE') {
      processed += await this.db.challenge.count();
    }

    return { processed, errors: 0 };
  }
}

export const postgresSearchProvider = new PostgresSearchProvider();
