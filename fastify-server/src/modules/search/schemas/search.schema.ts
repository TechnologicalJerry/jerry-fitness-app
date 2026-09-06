export const globalSearchSchema = {
  description: 'Global search across all public entities (exercises, workouts, recipes, foods, trainers, challenges)',
  tags: ['Search'],
  querystring: {
    type: 'object',
    properties: {
      query: { type: 'string', maxLength: 200 },
      limit: { type: 'integer', minimum: 1, maximum: 50, default: 10 },
    },
  },
};

export const exerciseSearchSchema = {
  description: 'Advanced exercise search and discovery',
  tags: ['Search', 'Exercises'],
  querystring: {
    type: 'object',
    properties: {
      query: { type: 'string', maxLength: 200 },
      muscle: { type: 'string' },
      equipment: { type: 'string' },
      difficulty: { type: 'string' },
      category: { type: 'string' },
      movementPattern: { type: 'string' },
      exerciseType: { type: 'string' },
      sort: { type: 'string', enum: ['relevance', 'popularity', 'difficulty', 'newest'] },
      limit: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
      cursor: { type: 'string' },
    },
  },
};

export const foodSearchSchema = {
  description: 'Scalable food search with nutritional range filters',
  tags: ['Search', 'Nutrition'],
  querystring: {
    type: 'object',
    properties: {
      query: { type: 'string', maxLength: 200 },
      category: { type: 'string' },
      minCalories: { type: 'number', minimum: 0 },
      maxCalories: { type: 'number', minimum: 0 },
      minProtein: { type: 'number', minimum: 0 },
      maxProtein: { type: 'number', minimum: 0 },
      minCarbs: { type: 'number', minimum: 0 },
      maxCarbs: { type: 'number', minimum: 0 },
      minFat: { type: 'number', minimum: 0 },
      maxFat: { type: 'number', minimum: 0 },
      dietaryTag: { type: 'string' },
      limit: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
      cursor: { type: 'string' },
    },
  },
};

export const recipeSearchSchema = {
  description: 'Recipe search with filters and sorting',
  tags: ['Search', 'Nutrition'],
  querystring: {
    type: 'object',
    properties: {
      query: { type: 'string', maxLength: 200 },
      category: { type: 'string' },
      minCalories: { type: 'number' },
      maxCalories: { type: 'number' },
      minProtein: { type: 'number' },
      maxPrepTime: { type: 'integer' },
      dietaryPreference: { type: 'string' },
      mealType: { type: 'string' },
      sort: { type: 'string', enum: ['relevance', 'popularity', 'highest_protein', 'lowest_calories', 'newest'] },
      limit: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
      cursor: { type: 'string' },
    },
  },
};

export const workoutDiscoverSchema = {
  description: 'Workout discovery and recommendations',
  tags: ['Search', 'Workouts'],
  querystring: {
    type: 'object',
    properties: {
      query: { type: 'string', maxLength: 200 },
      goal: { type: 'string' },
      difficulty: { type: 'string' },
      maxDuration: { type: 'integer' },
      equipment: { type: 'string' },
      muscleGroup: { type: 'string' },
      workoutType: { type: 'string' },
      trainerId: { type: 'string', format: 'uuid' },
      section: { type: 'string', enum: ['beginner', 'popular', 'recommended', 'trending', 'recent'] },
      limit: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
      cursor: { type: 'string' },
    },
  },
};

export const trainerSearchSchema = {
  description: 'Search trainers by specialty, rating, and language',
  tags: ['Search', 'Trainers'],
  querystring: {
    type: 'object',
    properties: {
      query: { type: 'string', maxLength: 200 },
      specialty: { type: 'string' },
      minExperienceYears: { type: 'integer', minimum: 0 },
      minRating: { type: 'number', minimum: 0, maximum: 5 },
      language: { type: 'string' },
      sort: { type: 'string', enum: ['relevance', 'popularity', 'rating', 'newest'] },
      limit: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
      cursor: { type: 'string' },
    },
  },
};

export const challengeDiscoverSchema = {
  description: 'Challenge discovery and filter options',
  tags: ['Search', 'Challenges'],
  querystring: {
    type: 'object',
    properties: {
      query: { type: 'string', maxLength: 200 },
      type: { type: 'string' },
      difficulty: { type: 'string' },
      status: { type: 'string' },
      sort: { type: 'string', enum: ['relevance', 'popularity', 'newest', 'participants'] },
      limit: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
      cursor: { type: 'string' },
    },
  },
};

export const autocompleteSchema = {
  description: 'Fast autocomplete search suggestions with Redis caching',
  tags: ['Search'],
  querystring: {
    type: 'object',
    required: ['query'],
    properties: {
      query: { type: 'string', minLength: 1, maxLength: 100 },
      limit: { type: 'integer', minimum: 1, maximum: 20, default: 10 },
      types: { type: 'string' }, // Comma separated entity types
    },
  },
};

export const createSavedSearchSchema = {
  description: 'Save a search query and filter set for the current user',
  tags: ['Search'],
  body: {
    type: 'object',
    required: ['name', 'query'],
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 100 },
      query: { type: 'string', minLength: 1, maxLength: 200 },
      filters: { type: 'object' },
      entityType: { type: 'string' },
    },
  },
};

export const updateSavedSearchSchema = {
  description: 'Update a saved search configuration',
  tags: ['Search'],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', format: 'uuid' },
    },
  },
  body: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 100 },
      query: { type: 'string', minLength: 1, maxLength: 200 },
      filters: { type: 'object' },
      entityType: { type: 'string' },
    },
  },
};
