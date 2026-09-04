import { User, Prisma } from '@prisma/client';
import { prismaService } from '../../../database/prisma.service';
import { CreateUserDto, UpdateUserDto, QueryUsersParams } from '../types/user.types';

export class UserRepository {
  public async findById(id: string): Promise<User | null> {
    return prismaService.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  public async findByEmail(email: string): Promise<User | null> {
    return prismaService.user.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        deletedAt: null,
      },
    });
  }

  public async create(data: CreateUserDto): Promise<User> {
    return prismaService.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        passwordHash: data.passwordHash,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        role: data.role,
        status: data.status,
      },
    });
  }

  public async update(id: string, data: UpdateUserDto): Promise<User> {
    return prismaService.user.update({
      where: { id },
      data,
    });
  }

  public async softDelete(id: string): Promise<User> {
    return prismaService.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'INACTIVE',
      },
    });
  }

  public async findMany(params: QueryUsersParams): Promise<{ users: User[]; total: number }> {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 20;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(params.role ? { role: params.role } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.search
        ? {
            OR: [
              { email: { contains: params.search, mode: 'insensitive' } },
              { firstName: { contains: params.search, mode: 'insensitive' } },
              { lastName: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      prismaService.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prismaService.user.count({ where }),
    ]);

    return { users, total };
  }
}

export const userRepository = new UserRepository();
