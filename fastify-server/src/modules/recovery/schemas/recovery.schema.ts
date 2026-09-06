export const submitRecoverySchema = {
  body: {
    type: 'object',
    required: ['subjectiveFatigueScore', 'sorenessScore', 'energyLevelScore', 'stressLevelScore'],
    properties: {
      date: { type: 'string', format: 'date' },
      sleepDurationHours: { type: 'number', minimum: 0, maximum: 24 },
      sleepQualityScore: { type: 'integer', minimum: 1, maximum: 10 },
      restingHeartRate: { type: 'integer', minimum: 30, maximum: 200 },
      subjectiveFatigueScore: { type: 'integer', minimum: 1, maximum: 10 },
      sorenessScore: { type: 'integer', minimum: 1, maximum: 10 },
      energyLevelScore: { type: 'integer', minimum: 1, maximum: 10 },
      stressLevelScore: { type: 'integer', minimum: 1, maximum: 10 },
    },
  },
};

export const todayRecoverySchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            recoveryScore: { type: 'number' },
            status: { type: 'string' },
            contributingFactors: { type: 'array', items: { type: 'string' } },
            recommendation: { type: 'string' },
            confidence: { type: 'number' },
            generatedAt: { type: 'string', format: 'date-time' },
            details: {
              type: 'object',
              properties: {
                sleepHours: { type: 'number', nullable: true },
                fatigue: { type: 'integer' },
                soreness: { type: 'integer' },
                energy: { type: 'integer' },
                stress: { type: 'integer' },
              },
            },
          },
        },
      },
    },
  },
};
