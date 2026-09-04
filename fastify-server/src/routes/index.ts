import { FastifyInstance } from 'fastify';
import { healthRoutes } from '../modules/health/routes/health.routes';
import { userRoutes } from '../modules/users/routes/user.routes';
import { authRoutes } from '../modules/auth/routes/auth.routes';

export async function appRoutes(fastify: FastifyInstance): Promise<void> {
  // Top-level health endpoints for orchestration/load balancers
  await fastify.register(healthRoutes);

  // Version 1 API Prefix
  await fastify.register(
    async (v1) => {
      await v1.register(healthRoutes, { prefix: '/health' });
      await v1.register(userRoutes, { prefix: '/users' });
      await v1.register(authRoutes, { prefix: '/auth' });
    },
    { prefix: '/api/v1' },
  );
}
