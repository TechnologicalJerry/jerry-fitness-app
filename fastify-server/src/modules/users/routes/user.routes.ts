import { FastifyInstance } from 'fastify';
import { userController } from '../controllers/user.controller';
import {
  getUserByIdSchema,
  listUsersSchema,
  createUserSchema,
  updateUserSchema,
  deleteUserSchema,
} from '../schemas/user.schema';

export async function userRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get(
    '/',
    {
      schema: {
        description: 'List users with pagination, role/status filter, and search keyword',
        tags: ['Users'],
        ...listUsersSchema,
      },
    },
    userController.listUsers.bind(userController),
  );

  fastify.get(
    '/:id',
    {
      schema: {
        description: 'Get user by UUID',
        tags: ['Users'],
        ...getUserByIdSchema,
      },
    },
    userController.getUserById.bind(userController),
  );

  fastify.post(
    '/',
    {
      schema: {
        description: 'Create a new user account',
        tags: ['Users'],
        ...createUserSchema,
      },
    },
    userController.createUser.bind(userController),
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        description: 'Update existing user profile fields',
        tags: ['Users'],
        ...updateUserSchema,
      },
    },
    userController.updateUser.bind(userController),
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        description: 'Soft delete a user account by ID',
        tags: ['Users'],
        ...deleteUserSchema,
      },
    },
    userController.deleteUser.bind(userController),
  );
}
