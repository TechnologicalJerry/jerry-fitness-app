import { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { AppError } from '../common/errors/app-error';
import { formatErrorResponse } from '../common/utils/response-formatter';
import { ErrorCodes } from '../common/constants/error-codes';
import { HttpStatus } from '../common/constants/http-status';

export default fp(async (fastify: FastifyInstance) => {
  fastify.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
    const requestId = (request.headers['x-request-id'] as string) || 'unknown';
    return reply
      .status(HttpStatus.NOT_FOUND)
      .send(
        formatErrorResponse(
          ErrorCodes.NOT_FOUND,
          `Route ${request.method} ${request.url} not found`,
          requestId,
        ),
      );
  });

  fastify.setErrorHandler((error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) => {
    const requestId = (request.headers['x-request-id'] as string) || 'unknown';

    // 1. Custom AppError instances
    if (error instanceof AppError) {
      request.log.warn(
        { err: error, code: error.code, statusCode: error.statusCode, requestId },
        `AppError [${error.code}]: ${error.message}`,
      );

      return reply
        .status(error.statusCode)
        .send(formatErrorResponse(error.code, error.message, requestId, error.details));
    }

    // 2. Fastify Schema Validation Error
    const fastifyErr = error as FastifyError;
    if (fastifyErr.validation) {
      request.log.warn({ err: error, requestId }, 'Schema validation error');

      return reply.status(HttpStatus.UNPROCESSABLE_ENTITY).send(
        formatErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Input validation failed',
          requestId,
          {
            issues: fastifyErr.validation.map((v) => ({
              path: v.instancePath || v.params,
              message: v.message,
            })),
          },
        ),
      );
    }

    // 3. Prisma Known Request Errors (e.g. Unique constraint)
    const errObj = error as unknown as Record<string, unknown>;
    if (typeof errObj['code'] === 'string' && errObj['code'].startsWith('P')) {
      request.log.warn({ err: error, prismaCode: errObj['code'], requestId }, 'Prisma error encountered');

      if (errObj['code'] === 'P2002') {
        return reply.status(HttpStatus.CONFLICT).send(
          formatErrorResponse(
            ErrorCodes.CONFLICT,
            'A record with this unique attribute already exists',
            requestId,
            { meta: errObj['meta'] },
          ),
        );
      }

      if (errObj['code'] === 'P2025') {
        return reply.status(HttpStatus.NOT_FOUND).send(
          formatErrorResponse(
            ErrorCodes.NOT_FOUND,
            'Target record to operate on was not found',
            requestId,
          ),
        );
      }
    }

    // 4. Unexpected / Unhandled Internal Errors
    request.log.error({ err: error, requestId }, 'Unhandled exception encountered');

    return reply
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .send(
        formatErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'An unexpected internal server error occurred',
          requestId,
        ),
      );
  });
});
