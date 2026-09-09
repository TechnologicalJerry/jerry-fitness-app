export const ingestEventsSchema = {
  description: 'Ingest client or device analytics events in batched payload',
  tags: ['Analytics'],
  body: {
    type: 'object',
    required: ['events'],
    properties: {
      events: {
        type: 'array',
        minItems: 1,
        maxItems: 500,
        items: {
          type: 'object',
          required: ['eventId', 'eventType'],
          properties: {
            eventId: { type: 'string' },
            eventType: { type: 'string' },
            eventVersion: { type: 'string', default: 'v1' },
            userId: { type: 'string' },
            anonymousId: { type: 'string' },
            sessionId: { type: 'string' },
            timestamp: { type: 'string' },
            source: { type: 'string', enum: ['client', 'server', 'background'], default: 'client' },
            platform: { type: 'string', enum: ['web', 'ios', 'android', 'desktop'], default: 'web' },
            appVersion: { type: 'string' },
            metadata: { type: 'object' },
          },
        },
      },
    },
  },
};

export const analyticsQuerySchema = {
  description: 'Query user analytics dashboard',
  tags: ['Analytics'],
  querystring: {
    type: 'object',
    properties: {
      startDate: { type: 'string' },
      endDate: { type: 'string' },
      period: { type: 'string', enum: ['7d', '30d', '90d', '1y', 'custom'], default: '30d' },
      timezone: { type: 'string', default: 'UTC' },
    },
  },
};

export const requestExportSchema = {
  description: 'Request asynchronous background analytics report export (CSV or JSON)',
  tags: ['Analytics'],
  body: {
    type: 'object',
    required: ['exportType', 'category'],
    properties: {
      exportType: { type: 'string', enum: ['CSV', 'JSON'] },
      category: { type: 'string', enum: ['USER', 'FITNESS', 'NUTRITION', 'REVENUE'] },
      startDate: { type: 'string' },
      endDate: { type: 'string' },
    },
  },
};
