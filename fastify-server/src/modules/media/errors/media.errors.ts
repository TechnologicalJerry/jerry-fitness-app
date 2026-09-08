import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
  ConflictError,
} from '../../../common/errors/common-errors';

export class MediaNotFoundError extends NotFoundError {
  constructor(mediaId: string) {
    super(`Media asset with ID '${mediaId}' not found`);
  }
}

export class MediaAccessDeniedError extends ForbiddenError {
  constructor(message = 'You do not have permission to access or modify this media asset') {
    super(message);
  }
}

export class InvalidMediaTypeError extends BadRequestError {
  constructor(type: string) {
    super(`Unsupported media type '${type}'`);
  }
}

export class FileSizeLimitExceededError extends BadRequestError {
  constructor(size: number, maxSize: number, context: string) {
    super(
      `File size (${size} bytes) exceeds maximum allowed limit (${maxSize} bytes) for context '${context}'`,
    );
  }
}

export class StorageQuotaExceededError extends ConflictError {
  constructor(userId: string, requestedBytes: number, availableBytes: number) {
    super(
      `User '${userId}' storage quota exceeded. Requested: ${requestedBytes} bytes, Available: ${availableBytes} bytes`,
    );
  }
}

export class StorageProviderError extends Error {
  constructor(message: string, public readonly provider: string) {
    super(`[${provider}] Storage Provider Error: ${message}`);
  }
}

export class InvalidMediaStateError extends BadRequestError {
  constructor(currentStatus: string, expectedStatus: string) {
    super(
      `Media asset is in '${currentStatus}' status, but expected '${expectedStatus}' status`,
    );
  }
}

export class QuarantinedMediaError extends ForbiddenError {
  constructor(mediaId: string) {
    super(`Media asset '${mediaId}' has been quarantined due to security or content policy violations`);
  }
}

export class UnsupportedMimeTypeError extends BadRequestError {
  constructor(mimeType: string, context: string) {
    super(`MIME type '${mimeType}' is not permitted for context '${context}'`);
  }
}
