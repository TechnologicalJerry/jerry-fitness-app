import { NotFoundError, ConflictError } from '../../../common/errors/common-errors';

export class UserNotFoundError extends NotFoundError {
  constructor(identifier?: string) {
    super(identifier ? `User with identifier '${identifier}' was not found` : 'User not found');
  }
}

export class UserAlreadyExistsError extends ConflictError {
  constructor(email: string) {
    super(`User with email '${email}' already exists`);
  }
}
