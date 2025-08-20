// API configuration and environment setup

export interface ApiConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  enableLogging: boolean;
}

// Default configuration
const defaultConfig: ApiConfig = {
  baseURL: 'http://localhost:5000',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  enableLogging: false,
};

// Environment-specific configurations
const configs: Record<string, Partial<ApiConfig>> = {
  development: {
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
    enableLogging: true,
  },
  production: {
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://your-api-domain.com',
    enableLogging: false,
    timeout: 15000, // Shorter timeout in production
  },
  test: {
    baseURL: 'http://localhost:5000',
    timeout: 5000,
    retryAttempts: 1,
    enableLogging: false,
  },
};

// Get configuration for current environment
export const getApiConfig = (): ApiConfig => {
  const env = process.env.NODE_ENV || 'development';
  const envConfig = configs[env] || {};
  
  return {
    ...defaultConfig,
    ...envConfig,
  };
};

// API endpoints configuration
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    LOGOUT: '/api/v1/auth/logout',
    ME: '/api/v1/auth/me',
    REFRESH: '/api/v1/auth/refresh',
  },
  
  // Products
  PRODUCTS: {
    BASE: '/api/v1/products',
    BY_ID: (id: string) => `/api/v1/products/${id}`,
    BY_BARCODE: (barcode: string) => `/api/v1/products/barcode/${barcode}`,
    SEARCH: '/api/v1/products/search',
    CATEGORIES: '/api/v1/products/categories',
    BULK_STOCK: '/api/v1/products/bulk/stock',
  },
  
  // Orders
  ORDERS: {
    BASE: '/api/v1/orders',
    BY_ID: (id: string) => `/api/v1/orders/${id}`,
    BY_TERMINAL: (terminalId: string) => `/api/v1/orders/terminal/${terminalId}`,
    DATE_RANGE: '/api/v1/orders/date-range',
    REPORTS: {
      SUMMARY: '/api/v1/orders/reports/summary',
    },
  },
  
  // POS Terminals
  POS_TERMINALS: {
    BASE: '/api/v1/pos-terminals',
    BY_ID: (id: string) => `/api/v1/pos-terminals/${id}`,
    CONFIGURATION: (id: string) => `/api/v1/pos-terminals/${id}/configuration`,
    STATS: (id: string) => `/api/v1/pos-terminals/${id}/stats`,
  },
  
  // Health
  HEALTH: '/health',
} as const;

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Request timeout configurations
export const TIMEOUTS = {
  FAST: 5000,    // 5 seconds - for quick operations
  NORMAL: 15000, // 15 seconds - for normal operations
  SLOW: 30000,   // 30 seconds - for slow operations like file uploads
} as const;

// Cache configurations
export const CACHE_KEYS = {
  PRODUCTS: 'products',
  PRODUCT: (id: string) => `product:${id}`,
  ORDERS: 'orders',
  ORDER: (id: string) => `order:${id}`,
  POS_TERMINALS: 'pos-terminals',
  POS_TERMINAL: (id: string) => `pos-terminal:${id}`,
  USER: 'user',
} as const;

export const CACHE_TIMES = {
  SHORT: 5 * 60 * 1000,    // 5 minutes
  MEDIUM: 15 * 60 * 1000,  // 15 minutes
  LONG: 60 * 60 * 1000,    // 1 hour
} as const;