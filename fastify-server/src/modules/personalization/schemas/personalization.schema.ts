export const personalizationProfileResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    userId: { type: 'string', format: 'uuid' },
    fitnessLevel: { type: 'string' },
    primaryGoal: { type: 'string' },
    secondaryGoals: { type: 'array', items: { type: 'string' } },
    trainingExperienceMonths: { type: 'integer' },
    preferredDurationMinutes: { type: 'integer' },
    preferredDays: { type: 'array', items: { type: 'string' } },
    preferredTimeOfDay: { type: 'string' },
    preferredLocation: { type: 'string' },
    availableEquipment: { type: 'array', items: { type: 'string' } },
    preferredWorkoutTypes: { type: 'array', items: { type: 'string' } },
    dislikedExercises: { type: 'array', items: { type: 'string' } },
    preferredExercises: { type: 'array', items: { type: 'string' } },
    dietaryPreferences: { type: 'array', items: { type: 'string' } },
    preferredMealFrequency: { type: 'integer' },
    activityLevel: { type: 'string' },
    recoveryPreferences: { type: 'object', additionalProperties: true },
    notificationPreferences: { type: 'object', additionalProperties: true },
    version: { type: 'integer' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

export const updatePersonalizationSchema = {
  body: {
    type: 'object',
    properties: {
      fitnessLevel: { type: 'string' },
      primaryGoal: { type: 'string', enum: ['WEIGHT_LOSS', 'MUSCLE_GAIN', 'STRENGTH', 'ENDURANCE', 'MOBILITY', 'CONSISTENCY', 'GENERAL_FITNESS', 'PERFORMANCE'] },
      secondaryGoals: { type: 'array', items: { type: 'string' } },
      trainingExperienceMonths: { type: 'integer', minimum: 0 },
      preferredDurationMinutes: { type: 'integer', minimum: 10, maximum: 180 },
      preferredDays: { type: 'array', items: { type: 'string' } },
      preferredTimeOfDay: { type: 'string' },
      preferredLocation: { type: 'string' },
      availableEquipment: { type: 'array', items: { type: 'string' } },
      preferredWorkoutTypes: { type: 'array', items: { type: 'string' } },
      dislikedExercises: { type: 'array', items: { type: 'string' } },
      preferredExercises: { type: 'array', items: { type: 'string' } },
      dietaryPreferences: { type: 'array', items: { type: 'string' } },
      preferredMealFrequency: { type: 'integer', minimum: 1, maximum: 8 },
      activityLevel: { type: 'string' },
      recoveryPreferences: { type: 'object', additionalProperties: true },
      notificationPreferences: { type: 'object', additionalProperties: true },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: personalizationProfileResponseSchema,
      },
    },
  },
};

export const userPreferenceSchema = {
  body: {
    type: 'object',
    required: ['category', 'key', 'value'],
    properties: {
      category: { type: 'string' },
      key: { type: 'string' },
      value: {},
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            category: { type: 'string' },
            key: { type: 'string' },
            value: {},
            version: { type: 'integer' },
          },
        },
      },
    },
  },
};
