export const getDailyPlanSchema = {
  querystring: {
    type: 'object',
    properties: {
      timezone: { type: 'string', default: 'UTC' },
      date: { type: 'string', format: 'date' },
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
            date: { type: 'string' },
            timezone: { type: 'string' },
            workoutRecommendation: { type: 'object', additionalProperties: true },
            recoveryRecommendation: { type: 'object', additionalProperties: true },
            nutritionTargets: {
              type: 'object',
              properties: {
                calories: { type: 'number' },
                proteinGrams: { type: 'number' },
                carbsGrams: { type: 'number' },
                fatsGrams: { type: 'number' },
              },
            },
            hydrationTargetMl: { type: 'integer' },
            habits: { type: 'array', items: { type: 'object', additionalProperties: true } },
            goalsSummary: { type: 'array', items: { type: 'object', additionalProperties: true } },
            reminders: { type: 'array', items: { type: 'string' } },
            challenges: { type: 'array', items: { type: 'string' } },
            generatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  },
};
