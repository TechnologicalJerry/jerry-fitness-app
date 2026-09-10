export const createOrganizationSchema = {
  body: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', minLength: 2 },
      slug: { type: 'string', minLength: 2 },
      description: { type: 'string' },
      logoUrl: { type: 'string' },
      type: {
        type: 'string',
        enum: [
          'PERSONAL',
          'GYM',
          'FITNESS_STUDIO',
          'TRAINING_BUSINESS',
          'CORPORATE',
          'SPORTS_TEAM',
          'ENTERPRISE',
          'OTHER',
        ],
      },
      metadata: { type: 'object' },
    },
  },
};

export const updateOrganizationSchema = {
  body: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 2 },
      description: { type: 'string' },
      logoUrl: { type: 'string' },
      metadata: { type: 'object' },
    },
  },
};

export const transferOwnershipSchema = {
  body: {
    type: 'object',
    required: ['newOwnerUserId'],
    properties: {
      newOwnerUserId: { type: 'string', format: 'uuid' },
    },
  },
};

export const createInvitationSchema = {
  body: {
    type: 'object',
    required: ['email'],
    properties: {
      email: { type: 'string', format: 'email' },
      role: {
        type: 'string',
        enum: ['OWNER', 'ADMIN', 'MANAGER', 'TRAINER', 'MEMBER', 'VIEWER'],
      },
      teamId: { type: 'string', format: 'uuid' },
    },
  },
};

export const createTeamSchema = {
  body: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', minLength: 2 },
      slug: { type: 'string' },
      description: { type: 'string' },
    },
  },
};

export const addTeamMemberSchema = {
  body: {
    type: 'object',
    required: ['userId'],
    properties: {
      userId: { type: 'string', format: 'uuid' },
      role: { type: 'string' },
    },
  },
};

export const updateMemberRoleSchema = {
  body: {
    type: 'object',
    required: ['role'],
    properties: {
      role: {
        type: 'string',
        enum: ['OWNER', 'ADMIN', 'MANAGER', 'TRAINER', 'MEMBER', 'VIEWER'],
      },
    },
  },
};

export const addDomainSchema = {
  body: {
    type: 'object',
    required: ['domain'],
    properties: {
      domain: { type: 'string', minLength: 3 },
    },
  },
};
