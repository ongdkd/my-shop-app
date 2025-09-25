import { ApiError } from './types';

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: unknown, attempt: number) => boolean;
  onRetry?: (error: unknown, attempt: number) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryCondition: (error: unknown) => {
    // Don't retry on client errors (4xx) or authentication errors
    if (error instanceof ApiError) {
      return !(error.status >= 400 && error.status < 500);
    }
    return true;
  },
  onRetry: () => {},
};

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 1; attempt <= opts.maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on the last attempt
      if (attempt > opts.maxRetries) {
        break;
      }

      // Check if we should retry this error
      if (!opts.retryCondition(error, attempt)) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.baseDelay * Math.pow(opts.backoffFactor, attempt - 1),
        opts.maxDelay
      );

      // Add some jitter to prevent thundering herd
      const jitteredDelay = delay + Math.random() * 1000;

      // Call retry callback
      opts.onRetry(error, attempt);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, jitteredDelay));
    }
  }

  throw lastError;
}

/**
 * Create a retry wrapper for API calls with specific retry logic
 */
export function createRetryWrapper(options: RetryOptions = {}) {
  return <T>(fn: () => Promise<T>) => withRetry(fn, options);
}

/**
 * Retry specifically for network errors
 */
export const withNetworkRetry = createRetryWrapper({
  maxRetries: 3,
  baseDelay: 1000,
  retryCondition: (error) => {
    if (error instanceof ApiError) {
      return error.code === 'NETWORK_ERROR' || error.status >= 500;
    }
    return true;
  },
});

/**
 * Retry for terminal-specific operations
 */
export const withTerminalRetry = createRetryWrapper({
  maxRetries: 2,
  baseDelay: 2000,
  retryCondition: (error) => {
    if (error instanceof ApiError) {
      // Don't retry on terminal not found or inactive
      if (error.code === 'TERMINAL_NOT_FOUND' || error.code === 'TERMINAL_INACTIVE') {
        return false;
      }
      // Retry on network errors and server errors
      return error.code === 'NETWORK_ERROR' || error.status >= 500;
    }
    return true;
  },
});

/**
 * Retry for product operations
 */
export const withProductRetry = createRetryWrapper({
  maxRetries: 2,
  baseDelay: 1500,
  retryCondition: (error) => {
    if (error instanceof ApiError) {
      // Don't retry on validation errors or not found
      if (error.code === 'VALIDATION_ERROR' || error.code === 'PRODUCT_NOT_FOUND') {
        return false;
      }
      // Retry on network errors and server errors
      return error.code === 'NETWORK_ERROR' || error.status >= 500;
    }
    return true;
  },
});

/**
 * Create a debounced retry function for search operations
 */
export function createDebouncedRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  delay: number = 300,
  retryOptions: RetryOptions = {}
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return new Promise((resolve, reject) => {
      clearTimeout(timeoutId);
      
      timeoutId = setTimeout(async () => {
        try {
          const result = await withRetry(() => fn(...args), retryOptions);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  };
}

/**
 * Utility to check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof ApiError) {
    // Don't retry client errors
    if (error.status >= 400 && error.status < 500) {
      return false;
    }
    // Don't retry specific error codes
    if (['VALIDATION_ERROR', 'TERMINAL_NOT_FOUND', 'PRODUCT_NOT_FOUND'].includes(error.code)) {
      return false;
    }
  }
  return true;
}

/**
 * Get user-friendly retry message based on error type
 */
export function getRetryMessage(error: unknown, attempt: number): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'NETWORK_ERROR':
        return `Connection failed. Retrying... (${attempt}/3)`;
      case 'TERMINAL_INACTIVE':
        return 'Terminal is inactive. Please contact your administrator.';
      case 'TERMINAL_NOT_FOUND':
        return 'Terminal not found. Please check the terminal ID.';
      default:
        return `Request failed. Retrying... (${attempt}/3)`;
    }
  }
  return `Request failed. Retrying... (${attempt}/3)`;
}