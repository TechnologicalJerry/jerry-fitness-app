import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import os from 'os';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('3000'),
  HOST: z.string().default('0.0.0.0'),
  APP_NAME: z.string().default('Jerry Fitness Backend'),
  APP_VERSION: z.string().default('1.0.0'),

  DATABASE_URL: z.string().url().or(z.string().min(1)),
  REDIS_URL: z.string().min(1).default('redis://localhost:6379'),

  JWT_SECRET: z.string().min(16).default('super-secret-jwt-key-min-32-chars-length!!'),
  JWT_EXPIRES_IN: z.string().default('1d'),

  CORS_ORIGIN: z.string().default('*'),

  RATE_LIMIT_MAX: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('100'),
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('60000'),

  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),

  S3_ENDPOINT: z.string().default('http://localhost:9000'),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().default('jerry-fitness-media'),
  S3_ACCESS_KEY_ID: z.string().default('minioadmin'),
  S3_SECRET_ACCESS_KEY: z.string().default('minioadmin'),
  CDN_BASE_URL: z.string().default('http://localhost:9000/jerry-fitness-media'),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Invalid environment variables schema:', result.error.format());
    throw new Error('Environment configuration validation failed. Check your environment variables.');
  }

  return result.data;
}

export const env = parseEnv();
export const osHostId = os.hostname();
