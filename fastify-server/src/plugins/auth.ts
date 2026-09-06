import fp from 'fastify-plugin';
import { FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import { env } from '../config/env';
import { UnauthorizedError } from '../common/errors/common-errors';

export function verifyJwtToken(token: string): { sub: string; role: string } {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new UnauthorizedError('Invalid token format');
  }

  const [header, payload, signature] = parts;
  if (!header || !payload || !signature) {
    throw new UnauthorizedError('Malformed token');
  }

  const expectedSignature = crypto
    .createHmac('sha256', env.JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');

  if (signature !== expectedSignature) {
    throw new UnauthorizedError('Invalid token signature');
  }

  const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
  const now = Math.floor(Date.now() / 1000);

  if (decodedPayload.exp && decodedPayload.exp < now) {
    throw new UnauthorizedError('Token has expired');
  }

  return {
    sub: decodedPayload.sub,
    role: decodedPayload.role || 'MEMBER',
  };
}

export default fp(async (fastify) => {
  fastify.decorate(
    'authenticate',
    async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedError('Missing or malformed Authorization header');
      }

      const token = authHeader.substring(7).trim();
      const decoded = verifyJwtToken(token);

      request.user = {
        id: decoded.sub,
        role: decoded.role,
      };
    },
  );
});
