import { NotFoundError, BadRequestError, ForbiddenError } from '../../../common/errors/common-errors';

export class SavedSearchNotFoundError extends NotFoundError {
  constructor(id: string) {
    super(`Saved search with ID '${id}' not found`);
  }
}

export class SavedSearchAccessDeniedError extends ForbiddenError {
  constructor() {
    super('You do not have permission to access or modify this saved search');
  }
}

export class InvalidSearchQueryError extends BadRequestError {
  constructor(reason: string) {
    super(`Invalid search query: ${reason}`);
  }
}

export class SearchProviderError extends Error {
  constructor(message: string, public readonly provider: string) {
    super(`[${provider}] Search Provider Error: ${message}`);
  }
}
