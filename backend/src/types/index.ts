// Re-export all database types
export * from './database';

// =============================================
// EXPRESS REQUEST EXTENSIONS
// =============================================

import { Request } from 'express';
import { User } from '@supabase/supabase-js';

export interface AuthenticatedRequest extends Request {
  user?: User;
  token?: string;
  userRole?: string;
}

// =============================================
// MIDDLEWARE TYPES
// =============================================

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  timestamp: string;
}

// =============================================
// VALIDATION TYPES
// =============================================

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// =============================================
// SERVICE LAYER TYPES
// =============================================

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PaginationOptions {
  page: number;
  limit: number;
  offset: number;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterOptions {
  [key: string]: any;
}

// =============================================
// BUSINESS LOGIC TYPES
// =============================================

export interface OrderCalculation {
  subtotal: number;
  tax?: number;
  discount?: number;
  total: number;
}

export interface InventoryUpdate {
  product_id: string;
  quantity_change: number;
  reason: 'sale' | 'restock' | 'adjustment' | 'return';
}

export interface SalesReport {
  period: {
    start_date: string;
    end_date: string;
  };
  summary: {
    total_orders: number;
    total_revenue: number;
    average_order_value: number;
  };
  by_payment_method: {
    payment_method: string;
    order_count: number;
    total_amount: number;
  }[];
  by_terminal: {
    terminal_name: string;
    order_count: number;
    total_amount: number;
  }[];
  top_products: {
    product_name: string;
    quantity_sold: number;
    revenue: number;
  }[];
}

// =============================================
// CONFIGURATION TYPES
// =============================================

export interface ServerConfig {
  port: number;
  host: string;
  nodeEnv: string;
  corsOrigins: string[];
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}

export interface DatabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  databaseUrl?: string;
}

export interface AuthConfig {
  jwtSecret: string;
  tokenExpiry: string;
}

// =============================================
// UTILITY TYPES
// =============================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// =============================================
// HTTP STATUS CODES
// =============================================

export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

// =============================================
// ERROR CODES
// =============================================

export enum ErrorCode {
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Resource errors
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  DUPLICATE_BARCODE = 'DUPLICATE_BARCODE',
  
  // Business logic errors
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  INVALID_ORDER_STATE = 'INVALID_ORDER_STATE',
  TERMINAL_INACTIVE = 'TERMINAL_INACTIVE',
  
  // Database errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  
  // Server errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}