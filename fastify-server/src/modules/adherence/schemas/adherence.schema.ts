export const adherenceSchema = {
  querystring: {
    type: 'object',
    properties: {
      window: { type: 'integer', enum: [7, 14, 30, 90], default: 7 },
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
            windowDays: { type: 'integer' },
            overallAdherence: { type: 'number' },
            workoutAdherence: { type: 'number' },
            nutritionAdherence: { type: 'number' },
            hydrationAdherence: { type: 'number' },
            habitAdherence: { type: 'number' },
            trend: { type: 'string' },
            generatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  },
};
