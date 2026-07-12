/** Typed application errors → consistent HTTP responses via the error handler. */

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errors = {
  badRequest: (msg = 'Bad request', details?: unknown) =>
    new AppError(400, 'BAD_REQUEST', msg, details),
  unauthorized: (msg = 'Authentication required') => new AppError(401, 'UNAUTHORIZED', msg),
  forbidden: (msg = 'Insufficient permissions') => new AppError(403, 'FORBIDDEN', msg),
  notFound: (msg = 'Resource not found') => new AppError(404, 'NOT_FOUND', msg),
  conflict: (msg = 'Conflict', details?: unknown) => new AppError(409, 'CONFLICT', msg, details),
  unprocessable: (msg = 'Validation failed', details?: unknown) =>
    new AppError(422, 'UNPROCESSABLE_ENTITY', msg, details),
  internal: (msg = 'Internal server error') => new AppError(500, 'INTERNAL_ERROR', msg),
};
