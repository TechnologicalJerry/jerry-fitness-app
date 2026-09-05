export const habitResponseProperties = {
  id: { type: 'string', format: 'uuid' },
  userId: { type: 'string', format: 'uuid' },
  name: { type: 'string' },
  category: { type: 'string' },
  description: { type: 'string', nullable: true },
  targetValue: { type: 'number' },
  unit: { type: 'string' },
  frequencyType: { type: 'string' },
  isActive: { type: 'boolean' },
  createdAt: { type: 'string', format: 'date-time' },
  updatedAt: { type: 'string', format: 'date-time' },
};

export const createHabitSchema = {
  body: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', minLength: 1 },
      category: {
        type: 'string',
        enum: ['WORKOUT', 'HYDRATION', 'MEAL_LOGGING', 'STEPS', 'SLEEP_ROUTINE', 'MOBILITY', 'MEDITATION', 'CUSTOM'],
      },
      description: { type: 'string' },
      targetValue: { type: 'number', minimum: 0 },
      unit: { type: 'string' },
      frequencyType: { type: 'string', enum: ['DAILY', 'WEEKLY', 'CUSTOM'] },
      daysOfWeek: { type: 'array', items: { type: 'integer', minimum: 0, maximum: 6 } },
    },
  },
  response: {
    201: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: { type: 'object', properties: habitResponseProperties },
      },
    },
  },
};

export const logHabitCompletionSchema = {
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
      date: { type: 'string', format: 'date' },
      value: { type: 'number' },
      completed: { type: 'boolean', default: true },
      skipped: { type: 'boolean', default: false },
      notes: { type: 'string' },
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
            habitId: { type: 'string' },
            userId: { type: 'string' },
            date: { type: 'string' },
            completed: { type: 'boolean' },
            skipped: { type: 'boolean' },
            currentStreak: { type: 'integer' },
          },
        },
      },
    },
  },
};
