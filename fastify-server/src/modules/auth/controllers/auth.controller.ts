import { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from '../services/auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from '../types/auth.types';
import { formatSuccessResponse } from '../../../common/utils/response-formatter';
import { HttpStatus } from '../../../common/constants/http-status';

export class AuthController {
  public async register(
    request: FastifyRequest<{ Body: RegisterDto }>,
    reply: FastifyReply,
  ): Promise<void> {
    const result = await authService.register(request.body);
    return reply.status(HttpStatus.CREATED).send(formatSuccessResponse(result));
  }

  public async login(
    request: FastifyRequest<{ Body: LoginDto }>,
    reply: FastifyReply,
  ): Promise<void> {
    const result = await authService.login(request.body);
    return reply.status(HttpStatus.OK).send(formatSuccessResponse(result));
  }

  public async refreshToken(
    request: FastifyRequest<{ Body: RefreshTokenDto }>,
    reply: FastifyReply,
  ): Promise<void> {
    const result = await authService.refreshTokens(request.body.refreshToken);
    return reply.status(HttpStatus.OK).send(formatSuccessResponse(result));
  }
}

export const authController = new AuthController();
