export const createConversationSchema = {
  body: {
    type: 'object',
    required: ['participantIds'],
    properties: {
      participantIds: { type: 'array', items: { type: 'string', format: 'uuid' }, minItems: 1 },
      title: { type: 'string' },
      isGroup: { type: 'boolean', default: false },
    },
  },
};

export const sendMessageSchema = {
  params: {
    type: 'object',
    required: ['conversationId'],
    properties: {
      conversationId: { type: 'string', format: 'uuid' },
    },
  },
  body: {
    type: 'object',
    required: ['content'],
    properties: {
      content: { type: 'string', minLength: 1 },
      messageType: {
        type: 'string',
        enum: ['TEXT', 'SYSTEM', 'WORKOUT', 'ACHIEVEMENT', 'PROGRESS', 'IMAGE', 'FILE'],
        default: 'TEXT',
      },
      recipientId: { type: 'string', format: 'uuid' },
    },
  },
};

export const getMessagesSchema = {
  params: {
    type: 'object',
    required: ['conversationId'],
    properties: {
      conversationId: { type: 'string', format: 'uuid' },
    },
  },
  querystring: {
    type: 'object',
    properties: {
      cursor: { type: 'string', format: 'uuid' },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
    },
  },
};
