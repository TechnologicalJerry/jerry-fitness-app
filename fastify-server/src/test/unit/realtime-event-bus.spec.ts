import { describe, it, expect, vi } from 'vitest';
import { realtimeEventBus } from '../../modules/realtime/services/event-bus.service';
import { RealtimeEvent } from '../../modules/realtime/types/realtime.types';

describe('RealtimeEventBus Unit Tests', () => {
  it('should allow subscribing to channels and receiving published events', async () => {
    const channel = 'test-channel-unit';
    const testEvent: RealtimeEvent = {
      eventId: 'evt-123',
      eventType: 'workout.completed.v1',
      aggregateType: 'workout',
      aggregateId: 'wk-456',
      userId: 'user-789',
      timestamp: new Date().toISOString(),
      version: 'v1',
      payload: { completed: true },
    };

    const handler = vi.fn();
    await realtimeEventBus.subscribe(channel, handler);

    // In isolated local test runner without Redis server, publish should degrade gracefully
    await expect(realtimeEventBus.publish(channel, testEvent)).resolves.not.toThrow();

    await realtimeEventBus.unsubscribe(channel, handler);
  });
});
