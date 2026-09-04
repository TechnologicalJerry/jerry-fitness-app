import { userResponseProperties } from '../../users/schemas/user.schema';

export const authTokensProperties = {
  accessToken: { type: 'string' },
  refreshToken: { type: 'string' },
  expiresIn: { type: 'string' },
};

export const registerSchema = {
  body: {
    type: 'object',
    required: ['email', 'password', 'firstName', 'lastName'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 8 },
      firstName: { type: 'string', minLength: 1 },
      lastName: { type: 'string', minLength: 1 },
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
            user: { type: 'object', properties: userResponseProperties },
            tokens: { type: 'object', properties: authTokensProperties },
          },
        },
      },
    },
  },
};

export const loginSchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string' },
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
            user: { type: 'object', properties: userResponseProperties },
            tokens: { type: 'object', properties: authTokensProperties },
          },
        },
      },
    },
  },
};

export const refreshTokenSchema = {
  body: {
    type: 'object',
    required: ['refreshToken'],
    properties: {
      refreshToken: { type: 'string' },
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
            tokens: { type: 'object', properties: authTokensProperties },
          },
        },
      },
    },
  },
};
