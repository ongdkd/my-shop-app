import { ApiError } from './types';
import { withRetry, RetryOptions } from './retryUtils';

/**
 * Enhanced error handling for API operations with user-friendly messages
 */
export class EnhancedApiError extends Error {
  public readonly originalError: unknown;
  public readonly userMessage: string;
  public readonly isRetryable: boolean;
  public readonly errorType: 'network' | 'auth' | 'validation' | 'not-found' | 'server' | 'unknown';

  constructor(
    originalError: unknown,
    userMessage?: string,
    isRetryable: boolean = false,
    errorType: EnhancedApiError['errorType'] = 'unknown'
  ) {
    super(userMessage || 'An unexpected error occurred');
    this.name = 'EnhancedApiError';
    this.originalError = originalError;
    this.userMessage = userMessage || this.message;
    this.isRetryable = isRetryable;
    this.errorType = errorType;
  }
}

/**
 * Convert API errors to user-friendly enhanced errors
 */
export function enhanceApiError(error: unknown): EnhancedApiError {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'NETWORK_ERROR':
        return new EnhancedApiError(
          error,
          'Unable to connect to the server. Please check your internet connection and try again.',
          true,
          'network'
        );
      
      case 'UNAUTHORIZED':
      case 'AUTHENTICATION_FAILED':
        return new EnhancedApiError(
          error,
          'Your session has expired. Please log in again.',
          false,
          'auth'
        );
      
      case 'FORBIDDEN':
        return new EnhancedApiError(
          error,
          'You do not have permission to perform this action.',
          false,
          'auth'
        );
      
      case 'TERMINAL_NOT_FOUND':
        return new EnhancedApiError(
          error,
          'The POS terminal could not be found. It may have been removed or the ID is incorrect.',
          false,
          'not-found'
        );
      
      case 'TERMINAL_INACTIVE':
        return new EnhancedApiError(
          error,
          'This POS terminal is currently offline. Please contact your administrator.',
          false,
          'validation'
        );
      
      case 'PRODUCT_NOT_FOUND':
        return new EnhancedApiError(
          error,
          'The requested product could not be found.',
          false,
          'not-found'
        );
      
      case 'VALIDATION_ERROR':
        return new EnhancedApiError(
          error,
          error.details?.length > 0 
            ? error.details.map((d: any) => d.message).join(', ')
            : 'The provided data is invalid. Please check your input and try again.',
          false,
          'validation'
        );
      
      case 'INSUFFICIENT_STOCK':
        return new EnhancedApiError(
          error,
          'There is not enough stock available for this product.',
          false,
          'validation'
        );
      
      case 'DUPLICATE_BARCODE':
        return new EnhancedApiError(
          error,
          'A product with this barcode already exists.',
          false,
          'validation'
        );
      
      case 'RATE_LIMIT_EXCEEDED':
        return new EnhancedApiError(
          error,
          'Too many requests. Please wait a moment and try again.',
          true,
          'server'
        );
      
      default:
        // Server errors (5xx) are generally retryable
        const isServerError = error.status >= 500;
        return new EnhancedApiError(
          error,
          isServerError 
            ? 'The server is experiencing issues. Please try again in a moment.'
            : error.message || 'An unexpected error occurred.',
          isServerError,
          isServerError ? 'server' : 'unknown'
        );
    }
  }

  // Handle network errors
  if (error instanceof Error) {
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return new EnhancedApiError(
        error,
        'Unable to connect to the server. Please check your internet connection and try again.',
        true,
        'network'
      );
    }
  }

  // Default case
  return new EnhancedApiError(
    error,
    'An unexpected error occurred. Please try again.',
    true,
    'unknown'
  );
}

/**
 * Execute an API operation with enhanced error handling and retry logic
 */
export async function executeWithErrorHandling<T>(
  operation: () => Promise<T>,
  options: {
    retryOptions?: RetryOptions;
    onRetry?: (error: EnhancedApiError, attempt: number) => void;
    onError?: (error: EnhancedApiError) => void;
  } = {}
): Promise<T> {
  const { retryOptions, onRetry, onError } = options;

  try {
    if (retryOptions) {
      return await withRetry(operation, {
        ...retryOptions,
        retryCondition: (error, attempt) => {
          const enhancedError = enhanceApiError(error);
          
          // Call retry callback if provided
          if (onRetry) {
            onRetry(enhancedError, attempt);
          }
          
          // Use enhanced error's retryable flag
          return enhancedError.isRetryable;
        },
      });
    } else {
      return await operation();
    }
  } catch (error) {
    const enhancedError = enhanceApiError(error);
    
    // Call error callback if provided
    if (onError) {
      onError(enhancedError);
    }
    
    throw enhancedError;
  }
}

/**
 * Create a wrapper for API operations with consistent error handling
 */
export function createApiWrapper(defaultRetryOptions?: RetryOptions) {
  return <T>(
    operation: () => Promise<T>,
    options: {
      retryOptions?: RetryOptions;
      onRetry?: (error: EnhancedApiError, attempt: number) => void;
      onError?: (error: EnhancedApiError) => void;
    } = {}
  ) => {
    return executeWithErrorHandling(operation, {
      ...options,
      retryOptions: options.retryOptions || defaultRetryOptions,
    });
  };
}

/**
 * Specialized wrappers for different types of operations
 */
export const executeTerminalOperation = createApiWrapper({
  maxRetries: 2,
  baseDelay: 2000,
  retryCondition: (error) => {
    const enhanced = enhanceApiError(error);
    return enhanced.isRetryable && enhanced.errorType !== 'not-found';
  },
});

export const executeProductOperation = createApiWrapper({
  maxRetries: 2,
  baseDelay: 1500,
  retryCondition: (error) => {
    const enhanced = enhanceApiError(error);
    return enhanced.isRetryable && !['validation', 'not-found'].includes(enhanced.errorType);
  },
});

export const executeNetworkOperation = createApiWrapper({
  maxRetries: 3,
  baseDelay: 1000,
  retryCondition: (error) => {
    const enhanced = enhanceApiError(error);
    return enhanced.errorType === 'network' || enhanced.errorType === 'server';
  },
});

/**
 * Get appropriate error display props based on error type
 */
export function getErrorDisplayProps(error: EnhancedApiError) {
  switch (error.errorType) {
    case 'network':
      return {
        type: 'network' as const,
        title: 'Connection Error',
        showRetry: true,
      };
    
    case 'auth':
      return {
        type: 'error' as const,
        title: 'Authentication Error',
        showRetry: false,
      };
    
    case 'validation':
      return {
        type: 'warning' as const,
        title: 'Invalid Data',
        showRetry: false,
      };
    
    case 'not-found':
      return {
        type: 'not-found' as const,
        title: 'Not Found',
        showRetry: true,
      };
    
    case 'server':
      return {
        type: 'error' as const,
        title: 'Server Error',
        showRetry: true,
      };
    
    default:
      return {
        type: 'error' as const,
        title: 'Error',
        showRetry: error.isRetryable,
      };
  }
}

/**
 * Format error message for logging
 */
export function formatErrorForLogging(error: EnhancedApiError): string {
  const timestamp = new Date().toISOString();
  const originalMessage = error.originalError instanceof Error 
    ? error.originalError.message 
    : String(error.originalError);
  
  return `[${timestamp}] ${error.errorType.toUpperCase()}: ${error.userMessage} (Original: ${originalMessage})`;
}

/**
 * Check if error should trigger a notification
 */
export function shouldShowNotification(error: EnhancedApiError): boolean {
  // Don't show notifications for validation errors or not found errors
  // as they are usually handled inline
  return !['validation', 'not-found'].includes(error.errorType);
}