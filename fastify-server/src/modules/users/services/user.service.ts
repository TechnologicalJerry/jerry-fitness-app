import crypto from 'crypto';
import { User } from '@prisma/client';
import { userRepository, UserRepository } from '../repositories/user.repository';
import { UserResponseDto, UpdateUserDto, QueryUsersParams } from '../types/user.types';
import { UserNotFoundError, UserAlreadyExistsError } from '../errors/user.errors';

export class UserService {
  constructor(private repo: UserRepository = userRepository) {}

  public mapToDto(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  public hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${derivedKey}`;
  }

  public verifyPassword(password: string, hash: string): boolean {
    const [salt, key] = hash.split(':');
    if (!salt || !key) return false;
    const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(derivedKey, 'hex'));
  }

  public async getUserById(id: string): Promise<UserResponseDto> {
    const user = await this.repo.findById(id);
    if (!user) {
      throw new UserNotFoundError(id);
    }
    return this.mapToDto(user);
  }

  public async listUsers(params: QueryUsersParams): Promise<{ users: UserResponseDto[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 20;

    const { users, total } = await this.repo.findMany(params);
    const dtos = users.map((u) => this.mapToDto(u));
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      users: dtos,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  public async createUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: any;
  }): Promise<UserResponseDto> {
    const existing = await this.repo.findByEmail(data.email);
    if (existing) {
      throw new UserAlreadyExistsError(data.email);
    }

    const passwordHash = this.hashPassword(data.password);
    const user = await this.repo.create({
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
    });

    return this.mapToDto(user);
  }

  public async updateUser(id: string, data: UpdateUserDto): Promise<UserResponseDto> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new UserNotFoundError(id);
    }

    const updated = await this.repo.update(id, data);
    return this.mapToDto(updated);
  }

  public async deleteUser(id: string): Promise<{ message: string; id: string }> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new UserNotFoundError(id);
    }

    await this.repo.softDelete(id);
    return { message: 'User deleted successfully', id };
  }
}

export const userService = new UserService();
