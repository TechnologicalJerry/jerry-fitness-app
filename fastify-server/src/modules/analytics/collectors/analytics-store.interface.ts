import {
  AnalyticsEventDto,
  IngestionResultDto,
  DateRangeQuery,
} from '../types/analytics.types';

export interface EventQueryFilter {
  eventType?: string;
  userId?: string;
  sessionId?: string;
  startDate?: Date;
  endDate?: Date;
  source?: string;
  limit?: number;
  offset?: number;
}

export interface AnalyticsStore {
  readonly storeName: string;

  writeEvent(event: AnalyticsEventDto): Promise<void>;

  writeBatch(events: AnalyticsEventDto[]): Promise<IngestionResultDto>;

  queryEvents(filter: EventQueryFilter): Promise<AnalyticsEventDto[]>;

  aggregate(metricName: string, filter: EventQueryFilter): Promise<number>;

  getTimeSeries(
    metricName: string,
    filter: EventQueryFilter,
    period: DateRangeQuery,
  ): Promise<Array<{ date: string; value: number }>>;
}
