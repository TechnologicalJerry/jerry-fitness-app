import { FastifyRequest, FastifyReply } from 'fastify';
import { analyticsService } from '../services/analytics.service';
import {
  BatchIngestEventsDto,
  DateRangeQuery,
  AnalyticsExportRequestDto,
} from '../types/analytics.types';

export class AnalyticsController {
  // --- Ingestion ---
  public async ingestEvents(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user?.id;
    const body = request.body as BatchIngestEventsDto;

    const result = await analyticsService.ingestEvents(userId, body);

    reply.status(202).send({
      success: true,
      data: result,
    });
  }

  // --- User Dashboards ---
  public async getUserSummary(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const summary = await analyticsService.getUserSummaryAnalytics(userId);

    reply.send({
      success: true,
      data: summary,
    });
  }

  public async getFitnessAnalytics(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const query = (request.query as DateRangeQuery) || {};

    const data = await analyticsService.getFitnessAnalytics(userId, query);

    reply.send({
      success: true,
      data,
    });
  }

  public async getNutritionAnalytics(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const query = (request.query as DateRangeQuery) || {};

    const data = await analyticsService.getNutritionAnalytics(userId, query);

    reply.send({
      success: true,
      data,
    });
  }

  public async getProgressAnalytics(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const query = (request.query as DateRangeQuery) || {};

    const data = await analyticsService.getProgressAnalytics(userId, query);

    reply.send({
      success: true,
      data,
    });
  }

  public async getAdherenceAnalytics(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const query = (request.query as DateRangeQuery) || {};

    const data = await analyticsService.getAdherenceAnalytics(userId, query);

    reply.send({
      success: true,
      data,
    });
  }

  public async getTrendsAnalytics(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const query = (request.query as DateRangeQuery) || {};

    const data = await analyticsService.getTrendsAnalytics(userId, query);

    reply.send({
      success: true,
      data,
    });
  }

  public async getTrainerClientAnalytics(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const trainerId = request.user!.id;
    const userRole = request.user!.role;

    const data = await analyticsService.getTrainerClientAnalytics(trainerId, userRole);

    reply.send({
      success: true,
      data,
    });
  }

  // --- Exports ---
  public async requestExport(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const userRole = request.user!.role;
    const body = request.body as AnalyticsExportRequestDto;

    const res = await analyticsService.requestExport(userId, userRole, body);

    reply.status(202).send({
      success: true,
      data: res,
    });
  }

  public async getExportStatus(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const userRole = request.user!.role;
    const { exportId } = request.params as { exportId: string };

    const status = await analyticsService.getExportStatus(userId, userRole, exportId);

    reply.send({
      success: true,
      data: status,
    });
  }

  // --- Admin Analytics ---
  public async getAdminOverview(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const overview = await analyticsService.getAdminOverviewAnalytics();

    reply.send({
      success: true,
      data: overview,
    });
  }

  public async getAdminUsers(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const data = await analyticsService.getAdminUserAnalytics();

    reply.send({
      success: true,
      data,
    });
  }

  public async getAdminEngagement(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const data = await analyticsService.getAdminEngagementAnalytics();

    reply.send({
      success: true,
      data,
    });
  }

  public async getAdminRevenue(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const data = await analyticsService.getAdminRevenueAnalytics();

    reply.send({
      success: true,
      data,
    });
  }

  public async getAdminContent(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const data = await analyticsService.getAdminContentAnalytics();

    reply.send({
      success: true,
      data,
    });
  }

  public async getAdminRetention(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { dimension } = (request.query as { dimension?: string }) || {};
    const data = await analyticsService.getAdminRetentionAnalytics(dimension);

    reply.send({
      success: true,
      data,
    });
  }
}

export const analyticsController = new AnalyticsController();
