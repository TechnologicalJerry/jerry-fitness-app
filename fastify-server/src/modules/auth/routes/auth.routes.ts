import { FastifyInstance } from 'fastify';
import { authController } from '../controllers/auth.controller';
import { registerSchema, loginSchema, refreshTokenSchema } from '../schemas/auth.schema';

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post(
    '/register',
    {
      schema: {
        description: 'Register a new user account',
        tags: ['Authentication'],
        ...registerSchema,
      },
    },
    authController.register.bind(authController),
  );

  fastify.post(
    '/login',
    {
      schema: {
        description: 'Authenticate with email and password',
        tags: ['Authentication'],
        ...loginSchema,
      },
    },
    authController.login.bind(authController),
  );

  fastify.post(
    '/refresh-token',
    {
      schema: {
        description: 'Obtain new access token using a valid refresh token',
        tags: ['Authentication'],
        ...refreshTokenSchema,
      },
    },
    authController.refreshToken.bind(authController),
  );
}
