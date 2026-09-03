import { UnauthorizedError } from '../../../common/errors/common-errors';

export class InvalidCredentialsError extends UnauthorizedError {
  constructor(message = 'Invalid email or password') {
    super(message);
  }
}

export class InvalidTokenError extends UnauthorizedError {
  constructor(message = 'Invalid or expired authentication token') {
    super(message);
  }
}
