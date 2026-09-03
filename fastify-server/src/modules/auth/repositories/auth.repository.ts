import { RefreshToken } from '@prisma/client';
import { prismaService } from '../../../database/prisma.service';

export class AuthRepository {
  public async createRefreshToken(userId: string, token: string, expiresAt: Date): Promise<RefreshToken> {
    return prismaService.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }

  public async findRefreshToken(token: string): Promise<RefreshToken | null> {
    return prismaService.refreshToken.findFirst({
      where: {
        token,
        revokedAt: null,
      },
    });
  }

  public async revokeRefreshToken(token: string): Promise<RefreshToken> {
    return prismaService.refreshToken.update({
      where: { token },
      data: { revokedAt: new Date() },
    });
  }

  public async revokeAllUserTokens(userId: string): Promise<number> {
    const res = await prismaService.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return res.count;
  }
}

export const authRepository = new AuthRepository();
