/**
 * Custom error classes for centralized error handling
 */

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public details?: any
  ) {
    super(400, message, 'VALIDATION_ERROR');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(401, message, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(403, message, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Not found') {
    super(404, message, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict') {
    super(409, message, 'CONFLICT');
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database error') {
    super(500, message, 'DATABASE_ERROR');
  }
}

export class UnknownError extends AppError {
  constructor(message: string = 'An unknown error occurred') {
    super(500, message, 'UNKNOWN_ERROR');
  }
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    stack?: string;
  };
}

export interface SuccessResponse<T = any> {
  success: true;
  data?: T;
  message?: string;
}

/**
 * Format error response
 */
export function formatErrorResponse(
  error: Error | AppError,
  includeStack: boolean = false
): ErrorResponse {
  if (error instanceof AppError) {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(includeStack && { stack: error.stack }),
      },
    };
    if ('details' in error && error.details) {
      response.error.details = error.details;
    }
    return response;
  }

  return {
    success: false,
    error: {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      ...(includeStack && { stack: error.stack }),
    },
  };
}

/**
 * Format success response
 */
export function formatSuccessResponse<T = any>(data?: T, message?: string): SuccessResponse<T> {
  return {
    success: true,
    ...(data !== undefined && { data }),
    ...(message && { message: message || 'Success' }),
  };
}
