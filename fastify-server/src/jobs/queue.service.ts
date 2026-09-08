import { logger } from '../observability/logger';
import { adherenceService } from '../modules/adherence/services/adherence.service';
import { dailyPlanService } from '../modules/daily-plan/services/daily-plan.service';

export interface BackgroundJob<T = any> {
  id: string;
  name: string;
  payload: T;
  retries: number;
  maxRetries: number;
  backoffMs: number;
}

export class BackgroundQueueService {
  private queue: BackgroundJob[] = [];
  private isProcessing = false;

  public enqueueJob<T>(name: string, payload: T, maxRetries = 3): string {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const job: BackgroundJob<T> = {
      id: jobId,
      name,
      payload,
      retries: 0,
      maxRetries,
      backoffMs: 1000,
    };

    this.queue.push(job);
    logger.info({ jobId, name }, 'Enqueued background job');

    this.processQueue().catch((err) => {
      logger.error({ err }, 'Error processing background queue');
    });

    return jobId;
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job) break;

      try {
        logger.info({ jobId: job.id, jobName: job.name }, 'Processing background job');

        switch (job.name) {
          case 'DAILY_PLAN_GENERATION':
            await dailyPlanService.getDailyPlan(job.payload.userId, job.payload.timezone);
            break;
          case 'ADHERENCE_AGGREGATION':
            await adherenceService.getAdherence(job.payload.userId, job.payload.windowDays || 7);
            break;
          case 'SEARCH_ANALYTICS_LOG': {
            const { searchRepository } = await import('../modules/search/repositories/search.repository');
            await searchRepository.logAnalytics(job.payload);
            break;
          }
          case 'SEARCH_FULL_REINDEX': {
            const { searchIndexingService } = await import('../modules/search/indexing/search-indexing.service');
            await searchIndexingService.executeFullReindex(job.payload?.entityType);
            break;
          }
          case 'MEDIA_PROCESSING': {
            const { mediaQueueService } = await import('../modules/media/jobs/media-queue.service');
            await mediaQueueService.processMediaAsset(job.payload.mediaId);
            break;
          }
          case 'MEDIA_CLEANUP': {
            const { mediaQueueService } = await import('../modules/media/jobs/media-queue.service');
            await mediaQueueService.runOrphanCleanup();
            break;
          }
          default:
            logger.warn({ jobName: job.name }, 'Unknown background job type');
        }

        logger.info({ jobId: job.id, jobName: job.name }, 'Background job completed successfully');
      } catch (error) {
        job.retries += 1;
        logger.error(
          { err: error, jobId: job.id, retries: job.retries, maxRetries: job.maxRetries },
          'Background job execution failed',
        );

        if (job.retries < job.maxRetries) {
          job.backoffMs *= 2; // Exponential backoff
          setTimeout(() => {
            this.queue.push(job);
            this.processQueue().catch(() => {});
          }, job.backoffMs);
        } else {
          logger.fatal({ jobId: job.id, jobName: job.name }, 'Background job exhausted all retry attempts');
        }
      }
    }

    this.isProcessing = false;
  }
}

export const backgroundQueueService = new BackgroundQueueService();
