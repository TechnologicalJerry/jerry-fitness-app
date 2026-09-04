import { UserResponseDto } from '../../users/types/user.types';

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthResponseDto {
  user: UserResponseDto;
  tokens: AuthTokensDto;
}

export interface RefreshTokenDto {
  refreshToken: string;
}
