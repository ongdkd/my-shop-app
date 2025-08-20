import { Request, Response, NextFunction } from 'express';
import { ErrorResponse, HttpStatusCode, ErrorCode } from '../types';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error for debugging
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Default error response
  let statusCode = error.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR;
  let errorCode = error.code || ErrorCode.INTERNAL_ERROR;
  let message = error.message || 'Internal server error';
  let details = error.details;

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = HttpStatusCode.BAD_REQUEST;
    errorCode = ErrorCode.VALIDATION_ERROR;
  } else if (error.name === 'UnauthorizedError') {
    statusCode = HttpStatusCode.UNAUTHORIZED;
    errorCode = ErrorCode.UNAUTHORIZED;
  } else if (error.name === 'ForbiddenError') {
    statusCode = HttpStatusCode.FORBIDDEN;
    errorCode = ErrorCode.INSUFFICIENT_PERMISSIONS;
  } else if (error.name === 'NotFoundError') {
    statusCode = HttpStatusCode.NOT_FOUND;
    errorCode = ErrorCode.RESOURCE_NOT_FOUND;
  } else if (error.name === 'ConflictError') {
    statusCode = HttpStatusCode.CONFLICT;
    errorCode = ErrorCode.RESOURCE_ALREADY_EXISTS;
  }

  // Handle Supabase errors
  if (error.message?.includes('duplicate key value violates unique constraint')) {
    statusCode = HttpStatusCode.CONFLICT;
    errorCode = ErrorCode.DUPLICATE_BARCODE;
    message = 'A product with this barcode already exists';
  } else if (error.message?.includes('violates foreign key constraint')) {
    statusCode = HttpStatusCode.BAD_REQUEST;
    errorCode = ErrorCode.CONSTRAINT_VIOLATION;
    message = 'Referenced resource does not exist';
  } else if (error.message?.includes('violates check constraint')) {
    statusCode = HttpStatusCode.BAD_REQUEST;
    errorCode = ErrorCode.VALIDATION_ERROR;
    message = 'Data validation failed';
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    statusCode = HttpStatusCode.UNAUTHORIZED;
    errorCode = ErrorCode.INVALID_TOKEN;
    message = 'Invalid authentication token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = HttpStatusCode.UNAUTHORIZED;
    errorCode = ErrorCode.TOKEN_EXPIRED;
    message = 'Authentication token has expired';
  }

  // Don't expose internal errors in production
  if (process.env['NODE_ENV'] === 'production' && statusCode === HttpStatusCode.INTERNAL_SERVER_ERROR) {
    message = 'Internal server error';
    details = undefined;
  }

  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: errorCode,
      message,
      ...(details && { details }),
    },
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(errorResponse);
};

// Custom error classes
export class ValidationError extends Error {
  statusCode = HttpStatusCode.BAD_REQUEST;
  code = ErrorCode.VALIDATION_ERROR;
  
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends Error {
  statusCode = HttpStatusCode.UNAUTHORIZED;
  code = ErrorCode.UNAUTHORIZED;
  
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  statusCode = HttpStatusCode.FORBIDDEN;
  code = ErrorCode.INSUFFICIENT_PERMISSIONS;
  
  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends Error {
  statusCode = HttpStatusCode.NOT_FOUND;
  code = ErrorCode.RESOURCE_NOT_FOUND;
  
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  statusCode = HttpStatusCode.CONFLICT;
  code = ErrorCode.RESOURCE_ALREADY_EXISTS;
  
  constructor(message: string = 'Resource already exists') {
    super(message);
    this.name = 'ConflictError';
  }
}

export class DatabaseError extends Error {
  statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;
  code = ErrorCode.DATABASE_ERROR;
  
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'DatabaseError';
  }
}