import { describe, it, expect } from 'vitest';
import { mediaValidator } from '../../modules/media/validators/media.validator';

describe('MediaValidator Unit Tests', () => {
  it('should sanitize unsafe filenames to prevent path traversal and script execution', () => {
    const unsafeName = '../../../../var/www/shell.php';
    const sanitized = mediaValidator.sanitizeFileName(unsafeName);
    expect(sanitized).not.toContain('../');
    expect(sanitized).toBe('shell.php');
  });

  it('should generate secure object keys based on tenant/owner and asset ID', () => {
    const key = mediaValidator.generateSecureObjectKey('user-123', 'media-456', 'original');
    expect(key).toBe('media/user-123/media-456/original');
  });

  it('should validate allowed mime types and size limits for profile avatar context', () => {
    expect(() => {
      mediaValidator.validateUploadRequest('PROFILE_AVATAR', 'IMAGE', 'image/jpeg', 2 * 1024 * 1024);
    }).not.toThrow();

    // Oversized avatar (exceeds 5MB)
    expect(() => {
      mediaValidator.validateUploadRequest('PROFILE_AVATAR', 'IMAGE', 'image/jpeg', 10 * 1024 * 1024);
    }).toThrow();
  });

  it('should reject invalid media types for progress photos', () => {
    expect(() => {
      mediaValidator.validateUploadRequest('PROGRESS_PHOTO', 'VIDEO', 'video/mp4', 5 * 1024 * 1024);
    }).toThrow();
  });
});
