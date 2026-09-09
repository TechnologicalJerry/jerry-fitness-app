import { postgresAnalyticsStore } from '../collectors/postgres-analytics.store';

export interface RevenueMetricsDto {
  totalSubscriptions: number;
  mrrCents: number;
  arrCents: number;
  arpuCents: number;
  grossRevenueCents: number;
  netRevenueCents: number;
  churnRatePct: number;
  conversionRatePct: number;
}

export class RevenueMetricsCalculator {
  public async calculateRevenueMetrics(): Promise<RevenueMetricsDto> {
    const subStarted = await postgresAnalyticsStore.queryEvents({
      eventType: 'SUBSCRIPTION_STARTED',
      limit: 1000,
    });

    const subCancelled = await postgresAnalyticsStore.queryEvents({
      eventType: 'SUBSCRIPTION_CANCELLED',
      limit: 1000,
    });

    let totalRevenueCents = 0;
    for (const e of subStarted) {
      totalRevenueCents += e.metadata?.amountCents || 1999;
    }

    const activeSubs = Math.max(0, subStarted.length - subCancelled.length);
    const mrr = activeSubs * 1999; // $19.99 per active subscription
    const arr = mrr * 12;
    const arpu = activeSubs > 0 ? Math.round(mrr / activeSubs) : 0;
    const churn = subStarted.length > 0 ? Math.round((subCancelled.length / subStarted.length) * 100) : 0;

    return {
      totalSubscriptions: activeSubs,
      mrrCents: mrr,
      arrCents: arr,
      arpuCents: arpu,
      grossRevenueCents: totalRevenueCents,
      netRevenueCents: Math.round(totalRevenueCents * 0.95), // Net after transaction fees
      churnRatePct: churn,
      conversionRatePct: 15,
    };
  }
}

export const revenueMetricsCalculator = new RevenueMetricsCalculator();
