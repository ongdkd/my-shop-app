// Offline detection and handling utilities

import { useState, useEffect } from 'react';

// Offline detection hook
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

// Offline storage for failed requests
class OfflineStorage {
  private storageKey = 'api_offline_queue';

  // Add failed request to queue
  addRequest(request: {
    url: string;
    method: string;
    body?: any;
    headers?: Record<string, string>;
    timestamp: number;
  }): void {
    const queue = this.getQueue();
    queue.push(request);
    localStorage.setItem(this.storageKey, JSON.stringify(queue));
  }

  // Get all queued requests
  getQueue(): Array<{
    url: string;
    method: string;
    body?: any;
    headers?: Record<string, string>;
    timestamp: number;
  }> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // Clear the queue
  clearQueue(): void {
    localStorage.removeItem(this.storageKey);
  }

  // Remove specific request from queue
  removeRequest(index: number): void {
    const queue = this.getQueue();
    queue.splice(index, 1);
    localStorage.setItem(this.storageKey, JSON.stringify(queue));
  }

  // Get queue size
  getQueueSize(): number {
    return this.getQueue().length;
  }
}

export const offlineStorage = new OfflineStorage();

// Hook for offline queue management
export const useOfflineQueue = () => {
  const [queueSize, setQueueSize] = useState(offlineStorage.getQueueSize());
  const isOnline = useOnlineStatus();

  useEffect(() => {
    const updateQueueSize = () => {
      setQueueSize(offlineStorage.getQueueSize());
    };

    // Update queue size periodically
    const interval = setInterval(updateQueueSize, 1000);

    return () => clearInterval(interval);
  }, []);

  const processQueue = async () => {
    if (!isOnline) return;

    const queue = offlineStorage.getQueue();
    const results = [];

    for (let i = 0; i < queue.length; i++) {
      const request = queue[i];
      
      try {
        const response = await fetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.body ? JSON.stringify(request.body) : undefined,
        });

        if (response.ok) {
          offlineStorage.removeRequest(i);
          results.push({ success: true, request });
        } else {
          results.push({ success: false, request, error: response.statusText });
        }
      } catch (error) {
        results.push({ success: false, request, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    setQueueSize(offlineStorage.getQueueSize());
    return results;
  };

  const clearQueue = () => {
    offlineStorage.clearQueue();
    setQueueSize(0);
  };

  return {
    queueSize,
    processQueue,
    clearQueue,
    isOnline,
  };
};

// Offline-aware API wrapper
export const withOfflineSupport = <T extends (...args: any[]) => Promise<any>>(
  apiFunction: T,
  options: {
    queueOnOffline?: boolean;
    showOfflineMessage?: boolean;
  } = {}
): T => {
  return (async (...args: Parameters<T>) => {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    if (!isOnline && options.queueOnOffline) {
      // Queue the request for later
      const [url, requestOptions] = args;
      offlineStorage.addRequest({
        url,
        method: requestOptions?.method || 'GET',
        body: requestOptions?.body,
        headers: requestOptions?.headers,
        timestamp: Date.now(),
      });

      if (options.showOfflineMessage) {
        console.warn('Request queued for when connection is restored');
      }

      throw new Error('Currently offline. Request has been queued.');
    }

    return apiFunction(...args);
  }) as T;
};