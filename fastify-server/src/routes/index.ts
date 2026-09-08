import { FastifyInstance } from 'fastify';
import { healthRoutes } from '../modules/health/routes/health.routes';
import { userRoutes } from '../modules/users/routes/user.routes';
import { authRoutes } from '../modules/auth/routes/auth.routes';
import { personalizationRoutes } from '../modules/personalization/routes/personalization.routes';
import { goalRoutes } from '../modules/goals/routes/goal.routes';
import { recoveryRoutes } from '../modules/recovery/routes/recovery.routes';
import { trainingLoadRoutes } from '../modules/training-load/routes/training-load.routes';
import { habitRoutes } from '../modules/habits/routes/habit.routes';
import { adherenceRoutes } from '../modules/adherence/routes/adherence.routes';
import { dailyPlanRoutes } from '../modules/daily-plan/routes/daily-plan.routes';
import { recommendationRoutes } from '../modules/recommendations/routes/recommendation.routes';
import { realtimeRoutes } from '../modules/realtime/routes/realtime.routes';
import { registerWebSocketHandler } from '../modules/realtime/websocket/websocket.handler';
import { searchRoutes } from '../modules/search/routes/search.routes';
import { mediaRoutes } from '../modules/media/routes/media.routes';

export async function appRoutes(fastify: FastifyInstance): Promise<void> {
  // Top-level health endpoints for orchestration/load balancers
  await fastify.register(healthRoutes);

  // Version 1 API Prefix
  await fastify.register(
    async (v1) => {
      await v1.register(healthRoutes, { prefix: '/health' });
      await v1.register(userRoutes, { prefix: '/users' });
      await v1.register(authRoutes, { prefix: '/auth' });
      await v1.register(personalizationRoutes);
      await v1.register(goalRoutes, { prefix: '/goals' });
      await v1.register(recoveryRoutes, { prefix: '/recovery' });
      await v1.register(trainingLoadRoutes, { prefix: '/training-load' });
      await v1.register(habitRoutes, { prefix: '/habits' });
      await v1.register(adherenceRoutes, { prefix: '/adherence' });
      await v1.register(dailyPlanRoutes, { prefix: '/daily-plan' });
      await v1.register(recommendationRoutes);
      await v1.register(realtimeRoutes);
      await v1.register(searchRoutes);
      await v1.register(mediaRoutes);
      await v1.register(registerWebSocketHandler);
    },
    { prefix: '/api/v1' },
  );
}
