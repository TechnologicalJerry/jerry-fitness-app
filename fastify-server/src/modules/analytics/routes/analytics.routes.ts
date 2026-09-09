import { FastifyInstance } from 'fastify';
import { analyticsController } from '../controllers/analytics.controller';
import {
  ingestEventsSchema,
  analyticsQuerySchema,
  requestExportSchema,
} from '../schemas/analytics.schema';

export async function analyticsRoutes(fastify: FastifyInstance): Promise<void> {
  // --- Event Ingestion ---
  fastify.post(
    '/analytics/events',
    {
      preHandler: [fastify.optionalAuthenticate],
      schema: ingestEventsSchema,
    },
    analyticsController.ingestEvents.bind(analyticsController),
  );

  // --- User Analytics Dashboards ---
  fastify.get(
    '/analytics/me',
    {
      preHandler: [fastify.authenticate],
      schema: { description: 'Get user summary analytics', tags: ['Analytics'] },
    },
    analyticsController.getUserSummary.bind(analyticsController),
  );

  fastify.get(
    '/analytics/fitness',
    {
      preHandler: [fastify.authenticate],
      schema: analyticsQuerySchema,
    },
    analyticsController.getFitnessAnalytics.bind(analyticsController),
  );

  fastify.get(
    '/analytics/nutrition',
    {
      preHandler: [fastify.authenticate],
      schema: analyticsQuerySchema,
    },
    analyticsController.getNutritionAnalytics.bind(analyticsController),
  );

  fastify.get(
    '/analytics/progress',
    {
      preHandler: [fastify.authenticate],
      schema: analyticsQuerySchema,
    },
    analyticsController.getProgressAnalytics.bind(analyticsController),
  );

  fastify.get(
    '/analytics/adherence',
    {
      preHandler: [fastify.authenticate],
      schema: analyticsQuerySchema,
    },
    analyticsController.getAdherenceAnalytics.bind(analyticsController),
  );

  fastify.get(
    '/analytics/trends',
    {
      preHandler: [fastify.authenticate],
      schema: analyticsQuerySchema,
    },
    analyticsController.getTrendsAnalytics.bind(analyticsController),
  );

  fastify.get(
    '/analytics/trainer/clients',
    {
      preHandler: [fastify.authenticate],
      schema: { description: 'Get authorized trainer client analytics', tags: ['Trainer', 'Analytics'] },
    },
    analyticsController.getTrainerClientAnalytics.bind(analyticsController),
  );

  // --- Exports ---
  fastify.post(
    '/analytics/exports',
    {
      preHandler: [fastify.authenticate],
      schema: requestExportSchema,
    },
    analyticsController.requestExport.bind(analyticsController),
  );

  fastify.get(
    '/analytics/exports/:exportId',
    {
      preHandler: [fastify.authenticate],
      schema: { description: 'Get background export status and download URL', tags: ['Analytics'] },
    },
    analyticsController.getExportStatus.bind(analyticsController),
  );

  // --- Admin Analytics Endpoints ---
  fastify.get(
    '/admin/analytics/overview',
    {
      preHandler: [fastify.authenticate, fastify.requireAdmin],
      schema: { description: 'Get system platform analytics overview (Admin)', tags: ['Admin', 'Analytics'] },
    },
    analyticsController.getAdminOverview.bind(analyticsController),
  );

  fastify.get(
    '/admin/analytics/users',
    {
      preHandler: [fastify.authenticate, fastify.requireAdmin],
      schema: { description: 'Get user growth, DAU/WAU/MAU analytics (Admin)', tags: ['Admin', 'Analytics'] },
    },
    analyticsController.getAdminUsers.bind(analyticsController),
  );

  fastify.get(
    '/admin/analytics/engagement',
    {
      preHandler: [fastify.authenticate, fastify.requireAdmin],
      schema: { description: 'Get feature engagement & session analytics (Admin)', tags: ['Admin', 'Analytics'] },
    },
    analyticsController.getAdminEngagement.bind(analyticsController),
  );

  fastify.get(
    '/admin/analytics/revenue',
    {
      preHandler: [fastify.authenticate, fastify.requireAdmin],
      schema: { description: 'Get monetization MRR, ARR, ARPU, churn analytics (Admin)', tags: ['Admin', 'Analytics'] },
    },
    analyticsController.getAdminRevenue.bind(analyticsController),
  );

  fastify.get(
    '/admin/analytics/content',
    {
      preHandler: [fastify.authenticate, fastify.requireAdmin],
      schema: { description: 'Get content popularity & search gap analytics (Admin)', tags: ['Admin', 'Analytics'] },
    },
    analyticsController.getAdminContent.bind(analyticsController),
  );

  fastify.get(
    '/admin/analytics/retention',
    {
      preHandler: [fastify.authenticate, fastify.requireAdmin],
      schema: { description: 'Get cohort retention analytics (Admin)', tags: ['Admin', 'Analytics'] },
    },
    analyticsController.getAdminRetention.bind(analyticsController),
  );
}
