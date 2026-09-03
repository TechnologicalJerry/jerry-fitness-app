import { FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';

export async function requestIdMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const existingId = request.headers['x-request-id'];
  const requestId = typeof existingId === 'string' && existingId.trim() ? existingId : randomUUID();

  request.headers['x-request-id'] = requestId;
  reply.header('x-request-id', requestId);
}
