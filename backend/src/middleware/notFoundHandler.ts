import { Request, Response } from 'express';
import { ErrorResponse, HttpStatusCode, ErrorCode } from '../types';

export const notFoundHandler = (req: Request, res: Response): void => {
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: ErrorCode.RESOURCE_NOT_FOUND,
      message: `Route ${req.method} ${req.path} not found`,
      details: {
        method: req.method,
        path: req.path,
        availableRoutes: [
          'GET /health',
          'GET /api',
          'GET /api/v1/products',
          'GET /api/v1/orders',
          'GET /api/v1/pos-terminals',
          'POST /api/v1/auth/login',
        ],
      },
    },
    timestamp: new Date().toISOString(),
  };

  res.status(HttpStatusCode.NOT_FOUND).json(errorResponse);
};