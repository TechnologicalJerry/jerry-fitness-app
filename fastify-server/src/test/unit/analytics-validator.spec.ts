import { describe, it, expect } from 'vitest';
import { analyticsEventValidator } from '../../modules/analytics/collectors/analytics-event.validator';

describe('AnalyticsEventValidator Unit Tests', () => {
  it('should pass validation for a valid analytics event', () => {
    expect(() => {
      analyticsEventValidator.validateEvent({
        eventId: 'evt-1001',
        eventType: 'WORKOUT_COMPLETED',
        metadata: { durationMinutes: 45 },
      });
    }).not.toThrow();
  });

  it('should throw error if eventId or eventType is missing', () => {
    expect(() => {
      analyticsEventValidator.validateEvent({
        eventId: '',
        eventType: 'WORKOUT_COMPLETED',
      });
    }).toThrow();

    expect(() => {
      analyticsEventValidator.validateEvent({
        eventId: 'evt-1002',
        eventType: '',
      });
    }).toThrow();
  });

  it('should sanitize sensitive metadata keys to prevent credential leaks', () => {
    const rawMetadata = {
      userEmail: 'user@test.com',
      password: 'super-secret-password',
      accessToken: 'jwt.token.string',
      creditCardNumber: '4111222233334444',
      workoutGoal: 'Hypertrophy',
    };

    const sanitized = analyticsEventValidator.sanitizeMetadata(rawMetadata);

    expect(sanitized.userEmail).toBe('user@test.com');
    expect(sanitized.password).toBe('[REDACTED]');
    expect(sanitized.accessToken).toBe('[REDACTED]');
    expect(sanitized.creditCardNumber).toBe('[REDACTED]');
    expect(sanitized.workoutGoal).toBe('Hypertrophy');
  });

  it('should reject batch exceeding max batch size limit', () => {
    const largeBatch = Array.from({ length: 501 }, (_, i) => ({
      eventId: `evt-${i}`,
      eventType: 'PAGE_VIEW',
    }));

    expect(() => {
      analyticsEventValidator.validateBatch(largeBatch);
    }).toThrow();
  });
});
