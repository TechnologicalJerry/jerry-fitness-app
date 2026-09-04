import { describe, it, expect } from 'vitest';
import { env } from '../../config/env';

describe('Environment Configuration', () => {
  it('should load default configuration values correctly', () => {
    expect(env.NODE_ENV).toBeDefined();
    expect(typeof env.PORT).toBe('number');
    expect(env.HOST).toBeDefined();
    expect(env.APP_NAME).toBe('Jerry Fitness Backend');
    expect(env.JWT_SECRET).toBeDefined();
  });
});
