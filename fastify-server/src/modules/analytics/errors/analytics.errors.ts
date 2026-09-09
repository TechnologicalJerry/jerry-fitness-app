import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from '../../../common/errors/common-errors';

export class InvalidAnalyticsEventError extends BadRequestError {
  constructor(message: string) {
    super(`Invalid Analytics Event: ${message}`);
  }
}

export class DuplicateEventError extends ConflictError {
  constructor(eventId: string) {
    super(`Analytics event with ID '${eventId}' has already been ingested`);
  }
}

export class EventBatchSizeExceededError extends BadRequestError {
  constructor(size: number, maxSize: number) {
    super(`Event batch size (${size}) exceeds maximum allowed limit (${maxSize})`);
  }
}

export class ReportNotFoundError extends NotFoundError {
  constructor(reportId: string) {
    super(`Report definition with ID '${reportId}' not found`);
  }
}

export class ReportExecutionError extends BadRequestError {
  constructor(message: string) {
    super(`Report execution failed: ${message}`);
  }
}

export class ExportNotFoundError extends NotFoundError {
  constructor(exportId: string) {
    super(`Analytics export '${exportId}' not found`);
  }
}

export class ExportAccessDeniedError extends ForbiddenError {
  constructor(message = 'You do not have permission to download this export') {
    super(message);
  }
}

export class AnalyticsStoreError extends Error {
  constructor(message: string, public readonly storeName: string) {
    super(`[${storeName}] Analytics Store Error: ${message}`);
  }
}

export class UnauthorizedAnalyticsAccessError extends ForbiddenError {
  constructor(message = 'Unauthorized access to analytics resources') {
    super(message);
  }
}
