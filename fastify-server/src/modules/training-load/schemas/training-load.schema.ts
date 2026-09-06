export const logTrainingSessionSchema = {
  body: {
    type: 'object',
    required: ['sessionVolume', 'intensity', 'durationMinutes'],
    properties: {
      date: { type: 'string', format: 'date' },
      sessionVolume: { type: 'number', minimum: 0 },
      intensity: { type: 'number', minimum: 1, maximum: 10 },
      durationMinutes: { type: 'integer', minimum: 1, maximum: 360 },
    },
  },
};

export const trainingLoadSummarySchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            date: { type: 'string' },
            sessionVolume: { type: 'number' },
            intensity: { type: 'number' },
            durationMinutes: { type: 'integer' },
            workload: { type: 'number' },
            acuteWorkload: { type: 'number' },
            chronicWorkload: { type: 'number' },
            workloadRatio: { type: 'number' },
            monotony: { type: 'number' },
            consistencyScore: { type: 'number' },
            status: { type: 'string' },
            trend: { type: 'string' },
          },
        },
      },
    },
  },
};
