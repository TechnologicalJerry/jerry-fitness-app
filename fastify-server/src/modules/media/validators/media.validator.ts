import { MediaContext, MediaType } from '../types/media.types';
import {
  FileSizeLimitExceededError,
  UnsupportedMimeTypeError,
  InvalidMediaTypeError,
} from '../errors/media.errors';

export interface ContextConfig {
  maxSizeBytes: number;
  allowedMimeTypes: string[];
  allowedMediaTypes: MediaType[];
}

export class MediaValidator {
  private static readonly CONTEXT_POLICIES: Record<MediaContext, ContextConfig> = {
    PROFILE_AVATAR: {
      maxSizeBytes: 5 * 1024 * 1024, // 5 MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      allowedMediaTypes: ['IMAGE'],
    },
    PROGRESS_PHOTO: {
      maxSizeBytes: 15 * 1024 * 1024, // 15 MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      allowedMediaTypes: ['IMAGE'],
    },
    EXERCISE_VIDEO: {
      maxSizeBytes: 250 * 1024 * 1024, // 250 MB
      allowedMimeTypes: ['video/mp4', 'video/quicktime', 'video/webm'],
      allowedMediaTypes: ['VIDEO'],
    },
    EXERCISE_THUMBNAIL: {
      maxSizeBytes: 10 * 1024 * 1024, // 10 MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      allowedMediaTypes: ['IMAGE'],
    },
    WORKOUT_MEDIA: {
      maxSizeBytes: 50 * 1024 * 1024, // 50 MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'video/mp4',
        'video/quicktime',
        'video/webm',
      ],
      allowedMediaTypes: ['IMAGE', 'VIDEO'],
    },
    RECIPE_IMAGE: {
      maxSizeBytes: 15 * 1024 * 1024, // 15 MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      allowedMediaTypes: ['IMAGE'],
    },
    TRAINER_MEDIA: {
      maxSizeBytes: 50 * 1024 * 1024, // 50 MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'video/mp4',
        'application/pdf',
      ],
      allowedMediaTypes: ['IMAGE', 'VIDEO', 'DOCUMENT'],
    },
    SOCIAL_POST: {
      maxSizeBytes: 100 * 1024 * 1024, // 100 MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'video/mp4',
        'video/quicktime',
        'video/webm',
      ],
      allowedMediaTypes: ['IMAGE', 'VIDEO'],
    },
    CHALLENGE_MEDIA: {
      maxSizeBytes: 50 * 1024 * 1024, // 50 MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'video/mp4',
        'video/webm',
      ],
      allowedMediaTypes: ['IMAGE', 'VIDEO'],
    },
  };

  public validateUploadRequest(
    context: MediaContext,
    mediaType: MediaType,
    contentType: string,
    sizeBytes: number,
  ): void {
    const policy = MediaValidator.CONTEXT_POLICIES[context];
    if (!policy) {
      throw new InvalidMediaTypeError(`Unknown context '${context}'`);
    }

    if (!policy.allowedMediaTypes.includes(mediaType)) {
      throw new InvalidMediaTypeError(
        `Media type '${mediaType}' is not allowed for context '${context}'`,
      );
    }

    if (!policy.allowedMimeTypes.includes(contentType.toLowerCase())) {
      throw new UnsupportedMimeTypeError(contentType, context);
    }

    if (sizeBytes > policy.maxSizeBytes) {
      throw new FileSizeLimitExceededError(sizeBytes, policy.maxSizeBytes, context);
    }
  }

  public sanitizeFileName(fileName: string): string {
    if (!fileName) return 'unnamed';

    // Strip directory path traversal sequences (../, ..\, etc.)
    const basename = fileName.replace(/^.*[\\/]/, '');

    // Replace invalid/dangerous characters with underscore
    const sanitized = basename.replace(/[^\w.-]/g, '_');

    // Prevent hidden files (dotfiles) or empty strings
    return sanitized.replace(/^\.+/, '') || 'file';
  }

  public generateSecureObjectKey(
    ownerId: string,
    mediaId: string,
    variantName = 'original',
  ): string {
    const sanitizedOwner = ownerId.replace(/[^a-zA-Z0-9-]/g, '');
    const sanitizedMediaId = mediaId.replace(/[^a-zA-Z0-9-]/g, '');
    const sanitizedVariant = variantName.replace(/[^a-zA-Z0-9-_]/g, '');

    return `media/${sanitizedOwner}/${sanitizedMediaId}/${sanitizedVariant}`;
  }

  public verifyMagicBytes(buffer: Buffer, declaredMimeType: string): boolean {
    if (!buffer || buffer.length < 4) return true;

    const hex = buffer.toString('hex', 0, 4).toUpperCase();

    if (declaredMimeType.includes('jpeg') || declaredMimeType.includes('jpg')) {
      return hex.startsWith('FFD8');
    }
    if (declaredMimeType.includes('png')) {
      return hex.startsWith('89504E47');
    }
    if (declaredMimeType.includes('gif')) {
      return hex.startsWith('47494638');
    }
    if (declaredMimeType.includes('pdf')) {
      return hex.startsWith('25504446');
    }

    return true; // Pass through if signature not checked
  }
}

export const mediaValidator = new MediaValidator();
