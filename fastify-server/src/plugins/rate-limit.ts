import fp from 'fastify-plugin';
import fastifyRateLimit, { RateLimitOptions } from '@fastify/rate-limit';
import { env } from '../config/env';
import { formatErrorResponse } from '../common/utils/response-formatter';
import { ErrorCodes } from '../common/constants/error-codes';

export default fp<RateLimitOptions>(async (fastify) => {
  await fastify.register(fastifyRateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW_MS,
    keyGenerator: (req) => {
      return (req.headers['x-forwarded-for'] as string) || req.ip;
    },
    errorResponseBuilder: (req, _context) => {
      const requestId = (req.headers['x-request-id'] as string) || 'unknown';
      return formatErrorResponse(
        ErrorCodes.TOO_MANY_REQUESTS,
        'Rate limit exceeded. Please try again later.',
        requestId,
      );
    },
  });
});
