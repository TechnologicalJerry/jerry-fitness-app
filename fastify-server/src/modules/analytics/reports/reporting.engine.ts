import { analyticsRepository } from '../repositories/analytics.repository';
import { fitnessMetricsCalculator } from '../metrics/fitness-metrics.calculator';
import { nutritionMetricsCalculator } from '../metrics/nutrition-metrics.calculator';
import { revenueMetricsCalculator } from '../metrics/revenue-metrics.calculator';
import { userMetricsCalculator } from '../metrics/user-metrics.calculator';
import { ReportQueryDto } from '../types/analytics.types';
import { ReportExecutionError } from '../errors/analytics.errors';

export class ReportingEngine {
  public async executeReport(userId: string, userRole: string, dto: ReportQueryDto): Promise<any> {
    const startTime = Date.now();

    // Verify RBAC access for category
    if ((dto.category === 'REVENUE' || dto.category === 'ADMIN') && userRole !== 'ADMIN') {
      throw new ReportExecutionError('Unauthorized access to administrative report category');
    }

    let reportData: any;

    switch (dto.category) {
      case 'FITNESS':
        reportData = await fitnessMetricsCalculator.calculateFitnessMetrics(userId, {
          startDate: dto.startDate,
          endDate: dto.endDate,
        });
        break;
      case 'NUTRITION':
        reportData = await nutritionMetricsCalculator.calculateNutritionMetrics(userId, {
          startDate: dto.startDate,
          endDate: dto.endDate,
        });
        break;
      case 'REVENUE':
        reportData = await revenueMetricsCalculator.calculateRevenueMetrics();
        break;
      case 'USER':
      default:
        reportData = await userMetricsCalculator.calculateUserSummary(userId);
        break;
    }

    const executionTimeMs = Date.now() - startTime;

    // Log report execution asynchronously
    if (dto.reportId) {
      const exec = await analyticsRepository.createReportExecution({
        reportId: dto.reportId,
        executedBy: userId,
        parameters: dto.parameters,
      });
      await analyticsRepository.updateReportExecution(exec.id, 'COMPLETED', reportData, executionTimeMs);
    }

    return {
      reportCategory: dto.category || 'USER',
      generatedAt: new Date().toISOString(),
      executionTimeMs,
      data: reportData,
    };
  }
}

export const reportingEngine = new ReportingEngine();
