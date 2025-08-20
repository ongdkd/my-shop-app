import { ApiError } from './types';

// Error handling utilities for the API client

export const handleApiError = (error: unknown): string => {
  if (error instanceof ApiError) {
    // Handle specific API errors
    switch (error.code) {
      case 'UNAUTHORIZED':
        return 'Please log in to continue';
      case 'FORBIDDEN':
        return 'You do not have permission to perform this action';
      case 'PRODUCT_NOT_FOUND':
        return 'Product not found';
      case 'ORDER_NOT_FOUND':
        return 'Order not found';
      case 'TERMINAL_NOT_FOUND':
        return 'POS terminal not found';
      case 'DUPLICATE_BARCODE':
        return 'A product with this barcode already exists';
      case 'VALIDATION_ERROR':
        return error.details?.length > 0 
          ? error.details.map((d: any) => d.message).join(', ')
          : 'Invalid input data';
      case 'NETWORK_ERROR':
        return 'Network error. Please check your connection and try again';
      case 'INSUFFICIENT_STOCK':
        return 'Insufficient stock for this product';
      case 'INVALID_ORDER_STATE':
        return 'Cannot modify order in current state';
      case 'TERMINAL_INACTIVE':
        return 'POS terminal is inactive';
      case 'RATE_LIMIT_EXCEEDED':
        return 'Too many requests. Please wait and try again';
      default:
        return error.message || 'An unexpected error occurred';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
};

export const isAuthError = (error: unknown): boolean => {
  return error instanceof ApiError && 
    (error.code === 'UNAUTHORIZED' || error.code === 'FORBIDDEN' || error.statusCode === 401);
};

export const isNetworkError = (error: unknown): boolean => {
  return error instanceof ApiError && error.code === 'NETWORK_ERROR';
};

export const isValidationError = (error: unknown): boolean => {
  return error instanceof ApiError && error.code === 'VALIDATION_ERROR';
};

// Retry logic for network errors
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on auth errors or validation errors
      if (isAuthError(error) || isValidationError(error)) {
        throw error;
      }

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Only retry on network errors
      if (isNetworkError(error)) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
        continue;
      }

      // Don't retry on other types of errors
      throw error;
    }
  }

  throw lastError;
};

// Debounce utility for search and other frequent operations
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};