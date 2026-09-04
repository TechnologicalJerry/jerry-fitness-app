import crypto from 'crypto';
import { userRepository, UserRepository } from '../../users/repositories/user.repository';
import { userService, UserService } from '../../users/services/user.service';
import { authRepository, AuthRepository } from '../repositories/auth.repository';
import { RegisterDto, LoginDto, AuthResponseDto, AuthTokensDto } from '../types/auth.types';
import { InvalidCredentialsError, InvalidTokenError } from '../errors/auth.errors';
import { UserAlreadyExistsError } from '../../users/errors/user.errors';
import { env } from '../../../config/env';

export class AuthService {
  constructor(
    private userRepo: UserRepository = userRepository,
    private userSvc: UserService = userService,
    private authRepo: AuthRepository = authRepository,
  ) {}

  private generateJwt(payload: Record<string, unknown>, secret: string, expiresInMs: number): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    const exp = now + Math.floor(expiresInMs / 1000);
    const body = Buffer.from(JSON.stringify({ ...payload, iat: now, exp })).toString('base64url');
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${body}`)
      .digest('base64url');

    return `${header}.${body}.${signature}`;
  }

  public generateTokens(userId: string, role: string): AuthTokensDto {
    const accessToken = this.generateJwt(
      { sub: userId, role },
      env.JWT_SECRET,
      24 * 60 * 60 * 1000, // 24 hours
    );

    const refreshToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Persist refresh token asynchronously
    this.authRepo.createRefreshToken(userId, refreshToken, expiresAt).catch(() => {});

    return {
      accessToken,
      refreshToken,
      expiresIn: env.JWT_EXPIRES_IN,
    };
  }

  public async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) {
      throw new UserAlreadyExistsError(dto.email);
    }

    const passwordHash = this.userSvc.hashPassword(dto.password);
    const user = await this.userRepo.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    const userDto = this.userSvc.mapToDto(user);
    const tokens = this.generateTokens(user.id, user.role);

    return { user: userDto, tokens };
  }

  public async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.userRepo.findByEmail(dto.email);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const isValid = this.userSvc.verifyPassword(dto.password, user.passwordHash);
    if (!isValid) {
      throw new InvalidCredentialsError();
    }

    const userDto = this.userSvc.mapToDto(user);
    const tokens = this.generateTokens(user.id, user.role);

    return { user: userDto, tokens };
  }

  public async refreshTokens(refreshToken: string): Promise<{ tokens: AuthTokensDto }> {
    const tokenRecord = await this.authRepo.findRefreshToken(refreshToken);
    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new InvalidTokenError('Refresh token is invalid or has expired');
    }

    const user = await this.userRepo.findById(tokenRecord.userId);
    if (!user) {
      throw new InvalidTokenError('Associated user no longer exists');
    }

    await this.authRepo.revokeRefreshToken(refreshToken);
    const tokens = this.generateTokens(user.id, user.role);

    return { tokens };
  }
}

export const authService = new AuthService();
