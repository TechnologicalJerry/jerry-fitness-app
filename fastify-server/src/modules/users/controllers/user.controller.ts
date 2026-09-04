import { FastifyRequest, FastifyReply } from 'fastify';
import { userService } from '../services/user.service';
import { formatSuccessResponse } from '../../../common/utils/response-formatter';
import { HttpStatus } from '../../../common/constants/http-status';
import { QueryUsersParams, UpdateUserDto } from '../types/user.types';

export class UserController {
  public async getUserById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    const user = await userService.getUserById(request.params.id);
    return reply.status(HttpStatus.OK).send(formatSuccessResponse(user));
  }

  public async listUsers(
    request: FastifyRequest<{ Querystring: QueryUsersParams }>,
    reply: FastifyReply,
  ): Promise<void> {
    const { users, meta } = await userService.listUsers(request.query);
    return reply.status(HttpStatus.OK).send(formatSuccessResponse(users, meta));
  }

  public async createUser(
    request: FastifyRequest<{
      Body: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        role?: any;
      };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    const user = await userService.createUser(request.body);
    return reply.status(HttpStatus.CREATED).send(formatSuccessResponse(user));
  }

  public async updateUser(
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateUserDto }>,
    reply: FastifyReply,
  ): Promise<void> {
    const updated = await userService.updateUser(request.params.id, request.body);
    return reply.status(HttpStatus.OK).send(formatSuccessResponse(updated));
  }

  public async deleteUser(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    const result = await userService.deleteUser(request.params.id);
    return reply.status(HttpStatus.OK).send(formatSuccessResponse(result));
  }
}

export const userController = new UserController();
