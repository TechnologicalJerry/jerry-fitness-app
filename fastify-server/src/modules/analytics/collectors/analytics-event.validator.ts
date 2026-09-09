import { AnalyticsEventDto } from '../types/analytics.types';
import {
  InvalidAnalyticsEventError,
  EventBatchSizeExceededError,
} from '../errors/analytics.errors';

export class AnalyticsEventValidator {
  public static readonly MAX_BATCH_SIZE = 500;
  public static readonly MAX_EVENT_SIZE_BYTES = 64 * 1024; // 64 KB

  private static readonly DISALLOWED_PATTERNS = [
    'password',
    'token',
    'secret',
    'creditcard',
    'cardnumber',
    'cvv',
    'ssn',
    'privatekey',
  ];

  public validateBatch(events: AnalyticsEventDto[]): void {
    if (!Array.isArray(events) || events.length === 0) {
      throw new InvalidAnalyticsEventError('Event batch must be a non-empty array');
    }

    if (events.length > AnalyticsEventValidator.MAX_BATCH_SIZE) {
      throw new EventBatchSizeExceededError(
        events.length,
        AnalyticsEventValidator.MAX_BATCH_SIZE,
      );
    }

    for (let i = 0; i < events.length; i++) {
      const evt = events[i];
      if (evt) {
        this.validateEvent(evt, i);
      }
    }
  }

  public validateEvent(event: AnalyticsEventDto, index?: number): void {
    const prefix = index !== undefined ? `Event at index ${index}: ` : '';

    if (!event || typeof event !== 'object') {
      throw new InvalidAnalyticsEventError(`${prefix}Event must be an object`);
    }

    if (!event.eventId || typeof event.eventId !== 'string') {
      throw new InvalidAnalyticsEventError(`${prefix}eventId is required and must be a string`);
    }

    if (!event.eventType || typeof event.eventType !== 'string') {
      throw new InvalidAnalyticsEventError(`${prefix}eventType is required and must be a string`);
    }

    // Size limit check
    const eventString = JSON.stringify(event);
    if (Buffer.byteLength(eventString, 'utf8') > AnalyticsEventValidator.MAX_EVENT_SIZE_BYTES) {
      throw new InvalidAnalyticsEventError(
        `${prefix}Event payload size exceeds maximum limit of ${AnalyticsEventValidator.MAX_EVENT_SIZE_BYTES} bytes`,
      );
    }

    // Timestamp validation (Must not be > 5 mins in future or > 30 days in past)
    if (event.timestamp) {
      const eventTime = new Date(event.timestamp).getTime();
      if (isNaN(eventTime)) {
        throw new InvalidAnalyticsEventError(`${prefix}Invalid timestamp format`);
      }

      const now = Date.now();
      const fiveMinsFuture = now + 5 * 60 * 1000;
      const thirtyDaysPast = now - 30 * 24 * 60 * 60 * 1000;

      if (eventTime > fiveMinsFuture) {
        throw new InvalidAnalyticsEventError(
          `${prefix}Timestamp cannot be more than 5 minutes in the future`,
        );
      }

      if (eventTime < thirtyDaysPast) {
        throw new InvalidAnalyticsEventError(
          `${prefix}Timestamp cannot be older than 30 days`,
        );
      }
    }

    // Sanitize metadata to remove sensitive credentials
    if (event.metadata && typeof event.metadata === 'object') {
      event.metadata = this.sanitizeMetadata(event.metadata);
    }
  }

  public sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(metadata)) {
      const lowerKey = key.toLowerCase().replace(/[^a-z]/g, '');

      const isDisallowed = AnalyticsEventValidator.DISALLOWED_PATTERNS.some((pattern) =>
        lowerKey.includes(pattern),
      );

      if (isDisallowed) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeMetadata(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}

export const analyticsEventValidator = new AnalyticsEventValidator();
