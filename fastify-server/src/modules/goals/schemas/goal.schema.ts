export const goalResponseProperties = {
  id: { type: 'string', format: 'uuid' },
  userId: { type: 'string', format: 'uuid' },
  type: { type: 'string' },
  title: { type: 'string' },
  description: { type: 'string', nullable: true },
  target: { type: 'number' },
  targetUnit: { type: 'string' },
  startingValue: { type: 'number' },
  currentValue: { type: 'number' },
  targetDate: { type: 'string', nullable: true },
  status: { type: 'string' },
  priority: { type: 'integer' },
  createdAt: { type: 'string', format: 'date-time' },
  updatedAt: { type: 'string', format: 'date-time' },
  completedAt: { type: 'string', nullable: true },
};

export const createGoalSchema = {
  body: {
    type: 'object',
    required: ['type', 'title', 'target', 'targetUnit', 'startingValue'],
    properties: {
      type: {
        type: 'string',
        enum: [
          'WEIGHT_LOSS',
          'MUSCLE_GAIN',
          'STRENGTH',
          'ENDURANCE',
          'MOBILITY',
          'CONSISTENCY',
          'GENERAL_FITNESS',
          'PERFORMANCE',
        ],
      },
      title: { type: 'string', minLength: 1 },
      description: { type: 'string' },
      target: { type: 'number' },
      targetUnit: { type: 'string' },
      startingValue: { type: 'number' },
      currentValue: { type: 'number' },
      targetDate: { type: 'string', format: 'date-time' },
      priority: { type: 'integer', minimum: 1 },
    },
  },
  response: {
    201: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: { type: 'object', properties: goalResponseProperties },
      },
    },
  },
};

export const updateGoalStatusSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', format: 'uuid' },
    },
  },
  body: {
    type: 'object',
    required: ['status'],
    properties: {
      status: {
        type: 'string',
        enum: ['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED', 'ARCHIVED'],
      },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: { type: 'object', properties: goalResponseProperties },
      },
    },
  },
};
