import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import type { FastifyReply } from 'fastify';

export interface AuthUserPayload {
  id: string;
  role: string;
}

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    redis: Redis;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    optionalAuthenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    user?: AuthUserPayload;
  }
}
