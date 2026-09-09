import { analyticsRepository } from '../repositories/analytics.repository';
import { reportingEngine } from '../reports/reporting.engine';
import { backgroundQueueService } from '../../../jobs/queue.service';
import { AnalyticsExportRequestDto } from '../types/analytics.types';
import { ExportNotFoundError, ExportAccessDeniedError } from '../errors/analytics.errors';
import { logger } from '../../../observability/logger';

export class ExportService {
  public async requestExport(userId: string, userRole: string, dto: AnalyticsExportRequestDto) {
    const exportRecord = await analyticsRepository.createAnalyticsExport({
      userId,
      exportType: dto.exportType,
    });

    // Enqueue background processing job
    backgroundQueueService.enqueueJob('ANALYTICS_EXPORT', {
      exportId: exportRecord.id,
      userId,
      userRole,
      dto,
    });

    logger.info({ exportId: exportRecord.id, userId }, 'Enqueued analytics export background job');

    return {
      exportId: exportRecord.id,
      status: 'PENDING',
      exportType: dto.exportType,
      message: 'Export generation enqueued. Use exportId to check status.',
    };
  }

  public async processExportJob(
    exportId: string,
    userId: string,
    userRole: string,
    dto: AnalyticsExportRequestDto,
  ): Promise<void> {
    try {
      const reportResult = await reportingEngine.executeReport(userId, userRole, {
        category: dto.category,
        startDate: dto.startDate,
        endDate: dto.endDate,
      });

      let exportContent = '';
      if (dto.exportType === 'JSON') {
        exportContent = JSON.stringify(reportResult, null, 2);
      } else {
        // Simple CSV formatting
        exportContent = `Category,GeneratedAt,Metric,Value\n`;
        exportContent += `"${dto.category}","${reportResult.generatedAt}","data","${JSON.stringify(reportResult.data).replace(/"/g, '""')}"\n`;
      }

      const fileKey = `exports/${userId}/${exportId}.${dto.exportType.toLowerCase()}`;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours TTL
      const downloadUrl = `/api/v1/analytics/exports/${exportId}/download`;

      await analyticsRepository.updateAnalyticsExport(exportId, {
        status: 'COMPLETED',
        fileKey,
        downloadUrl,
        expiresAt,
      });

      logger.info({ exportId, fileKey, bytes: exportContent.length }, 'Completed analytics export generation');
    } catch (err: any) {
      logger.error({ err, exportId }, 'Failed to generate analytics export');
      await analyticsRepository.updateAnalyticsExport(exportId, {
        status: 'FAILED',
      });
    }
  }

  public async getExportStatus(userId: string, userRole: string, exportId: string) {
    const exportRecord = await analyticsRepository.getAnalyticsExport(exportId);
    if (!exportRecord) {
      throw new ExportNotFoundError(exportId);
    }

    if (exportRecord.userId !== userId && userRole !== 'ADMIN') {
      throw new ExportAccessDeniedError();
    }

    return exportRecord;
  }
}

export const exportService = new ExportService();
