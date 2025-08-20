// Request and response interceptors for the API client

import { ApiError } from './types';
import { getApiConfig } from './config';

export interface RequestInterceptor {
  onRequest?: (config: RequestInit & { url: string }) => RequestInit & { url: string };
  onRequestError?: (error: Error) => Promise<never>;
}

export interface ResponseInterceptor {
  onResponse?: (response: Response) => Response | Promise<Response>;
  onResponseError?: (error: ApiError) => Promise<never>;
}

// Default request interceptor
export const defaultRequestInterceptor: RequestInterceptor = {
  onRequest: (config) => {
    const apiConfig = getApiConfig();
    
    // Add default headers
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...config.headers,
    };

    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), apiConfig.timeout);

    // Log request in development
    if (apiConfig.enableLogging) {
      console.log(`🚀 API Request: ${config.method || 'GET'} ${config.url}`, {
        headers,
        body: config.body,
      });
    }

    return {
      ...config,
      headers,
      signal: controller.signal,
    };
  },
  
  onRequestError: async (error) => {
    const apiConfig = getApiConfig();
    
    if (apiConfig.enableLogging) {
      console.error('❌ API Request Error:', error);
    }
    
    throw error;
  },
};

// Default response interceptor
export const defaultResponseInterceptor: ResponseInterceptor = {
  onResponse: (response) => {
    const apiConfig = getApiConfig();
    
    // Log response in development
    if (apiConfig.enableLogging) {
      console.log(`📥 API Response: ${response.status} ${response.url}`, {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });
    }

    return response;
  },
  
  onResponseError: async (error) => {
    const apiConfig = getApiConfig();
    
    if (apiConfig.enableLogging) {
      console.error('❌ API Response Error:', error);
    }

    // Handle specific error cases
    if (error.statusCode === 401) {
      // Clear auth token on unauthorized
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      }
      
      // Redirect to login if not already there
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    throw error;
  },
};

// Logging interceptor
export const loggingInterceptor: RequestInterceptor & ResponseInterceptor = {
  onRequest: (config) => {
    console.group(`🚀 ${config.method || 'GET'} ${config.url}`);
    console.log('Headers:', config.headers);
    if (config.body) {
      console.log('Body:', config.body);
    }
    console.groupEnd();
    return config;
  },

  onResponse: (response) => {
    console.group(`📥 ${response.status} ${response.url}`);
    console.log('Status:', response.status, response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    console.groupEnd();
    return response;
  },

  onRequestError: async (error) => {
    console.error('❌ Request Error:', error);
    throw error;
  },

  onResponseError: async (error) => {
    console.error('❌ Response Error:', error);
    throw error;
  },
};

// Performance monitoring interceptor
export const performanceInterceptor: RequestInterceptor & ResponseInterceptor = {
  onRequest: (config) => {
    // Add timestamp to track request duration
    (config as any).__startTime = performance.now();
    return config;
  },

  onResponse: (response) => {
    const startTime = (response as any).__startTime;
    if (startTime) {
      const duration = performance.now() - startTime;
      console.log(`⏱️ Request took ${duration.toFixed(2)}ms: ${response.url}`);
      
      // Warn about slow requests
      if (duration > 2000) {
        console.warn(`🐌 Slow request detected: ${response.url} took ${duration.toFixed(2)}ms`);
      }
    }
    return response;
  },
};

// Retry interceptor
export const retryInterceptor = (maxRetries: number = 3, delay: number = 1000): ResponseInterceptor => ({
  onResponseError: async (error) => {
    const shouldRetry = (error.statusCode && error.statusCode >= 500) || error.code === 'NETWORK_ERROR';
    
    if (shouldRetry && (error as any).__retryCount < maxRetries) {
      (error as any).__retryCount = ((error as any).__retryCount || 0) + 1;
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * (error as any).__retryCount));
      
      // This would need to be handled by the calling code
      console.log(`🔄 Retrying request (attempt ${(error as any).__retryCount}/${maxRetries})`);
    }
    
    throw error;
  },
});

// Cache interceptor (simple in-memory cache)
class SimpleCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

const cache = new SimpleCache();

export const cacheInterceptor = (ttl: number = 5 * 60 * 1000): RequestInterceptor & ResponseInterceptor => ({
  onRequest: (config) => {
    // Only cache GET requests
    if (config.method === 'GET' || !config.method) {
      const cacheKey = config.url;
      const cachedData = cache.get(cacheKey);
      
      if (cachedData) {
        console.log(`💾 Cache hit: ${config.url}`);
        // This would need special handling to return cached data
        (config as any).__cached = cachedData;
      }
    }
    
    return config;
  },

  onResponse: (response) => {
    // Cache successful GET responses
    if ((response.status === 200) && (response.url.includes('GET') || !response.url.includes('POST'))) {
      response.clone().json().then(data => {
        cache.set(response.url, data, ttl);
        console.log(`💾 Cached response: ${response.url}`);
      }).catch(() => {
        // Ignore cache errors
      });
    }
    
    return response;
  },
});

// Export cache instance for manual cache management
export { cache };