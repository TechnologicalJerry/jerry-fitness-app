export const getWorkoutRecommendationSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            title: { type: 'string' },
            recommendation: { type: 'string' },
            reason: { type: 'string' },
            confidence: { type: 'number' },
            factors: { type: 'array', items: { type: 'string' } },
            data: { type: 'object', additionalProperties: true },
            generatedAt: { type: 'string', format: 'date-time' },
            expiresAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  },
};

export const submitFeedbackSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', format: 'uuid' },
    },
  },
  body: {
    type: 'object',
    required: ['feedbackType'],
    properties: {
      feedbackType: {
        type: 'string',
        enum: [
          'USEFUL',
          'NOT_USEFUL',
          'TOO_DIFFICULT',
          'TOO_EASY',
          'NOT_RELEVANT',
          'UNAVAILABLE_EQUIPMENT',
          'DISLIKED_EXERCISE',
          'ALREADY_COMPLETED',
        ],
      },
      notes: { type: 'string' },
    },
  },
  response: {
    201: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            feedbackId: { type: 'string' },
          },
        },
      },
    },
  },
};
