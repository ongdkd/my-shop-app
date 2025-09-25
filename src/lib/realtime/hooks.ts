import { useEffect, useCallback, useRef } from 'react';
import { notificationManager, NotificationEvent } from './notifications';

// Hook for listening to real-time updates for a specific terminal
export const useTerminalRealTimeUpdates = (
  terminalId: string | null,
  onUpdate: () => void,
  options: {
    enablePolling?: boolean;
    pollingInterval?: number;
    enableFocusRefresh?: boolean;
  } = {}
) => {
  const {
    enablePolling = true,
    pollingInterval = 30000, // 30 seconds
    enableFocusRefresh = true,
  } = options;

  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const handleUpdate = useCallback(() => {
    onUpdateRef.current();
  }, []);

  useEffect(() => {
    if (!terminalId) return;

    const cleanupFunctions: (() => void)[] = [];

    // Listen for product updates
    const unsubscribeProductUpdate = notificationManager.onWindow(
      'product_updated',
      (data) => {
        // Update if it's a global product update or specific to this terminal
        if (!data.terminalId || data.terminalId === terminalId) {
          handleUpdate();
        }
      }
    );
    cleanupFunctions.push(unsubscribeProductUpdate);

    // Listen for terminal updates
    const unsubscribeTerminalUpdate = notificationManager.onWindow(
      'terminal_updated',
      (data) => {
        if (data.terminalId === terminalId) {
          handleUpdate();
        }
      }
    );
    cleanupFunctions.push(unsubscribeTerminalUpdate);

    // Listen for product assignment changes
    const unsubscribeAssignmentChange = notificationManager.onWindow(
      'product_assignment_changed',
      (data) => {
        if (data.terminalId === terminalId) {
          handleUpdate();
        }
      }
    );
    cleanupFunctions.push(unsubscribeAssignmentChange);

    // Set up periodic polling as fallback
    if (enablePolling) {
      notificationManager.startTerminalPolling(terminalId, handleUpdate, pollingInterval);
    }

    // Listen for window focus events to refresh data
    if (enableFocusRefresh) {
      const handleFocus = () => {
        handleUpdate();
      };
      window.addEventListener('focus', handleFocus);
      cleanupFunctions.push(() => window.removeEventListener('focus', handleFocus));
    }

    // Cleanup function
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
      if (enablePolling) {
        notificationManager.stopTerminalPolling(terminalId);
      }
    };
  }, [terminalId, handleUpdate, enablePolling, pollingInterval, enableFocusRefresh]);
};

// Hook for listening to product assignment changes (for admin interface)
export const useProductAssignmentUpdates = (
  terminalId: string | null,
  onAssignmentChange: (data: { productIds: string[]; action: 'assigned' | 'removed' }) => void
) => {
  const onAssignmentChangeRef = useRef(onAssignmentChange);
  onAssignmentChangeRef.current = onAssignmentChange;

  useEffect(() => {
    if (!terminalId) return;

    const unsubscribe = notificationManager.onWindow(
      'product_assignment_changed',
      (data) => {
        if (data.terminalId === terminalId && data.productIds && data.action && 
            (data.action === 'assigned' || data.action === 'removed')) {
          onAssignmentChangeRef.current({
            productIds: data.productIds,
            action: data.action,
          });
        }
      }
    );

    return unsubscribe;
  }, [terminalId]);
};

// Hook for listening to global product updates (for product management)
export const useGlobalProductUpdates = (onProductUpdate: (productId: string) => void) => {
  const onProductUpdateRef = useRef(onProductUpdate);
  onProductUpdateRef.current = onProductUpdate;

  useEffect(() => {
    const unsubscribe = notificationManager.onWindow(
      'product_updated',
      (data) => {
        if (data.productId) {
          onProductUpdateRef.current(data.productId);
        }
      }
    );

    return unsubscribe;
  }, []);
};

// Hook for integrating notification toasts with the existing toast system
export const useNotificationToasts = (addToast: (toast: { type: string; title: string; message?: string }) => void) => {
  useEffect(() => {
    const handleToast = (event: Event) => {
      const customEvent = event as CustomEvent<{
        message: string;
        type: 'success' | 'info' | 'warning' | 'error';
        timestamp: string;
      }>;
      
      // Map notification types to toast types
      const typeMap = {
        'success': 'success',
        'info': 'info', 
        'warning': 'warning',
        'error': 'error'
      } as const;
      
      addToast({
        type: typeMap[customEvent.detail.type] || 'info',
        title: customEvent.detail.message,
      });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('show-notification-toast', handleToast);
      return () => window.removeEventListener('show-notification-toast', handleToast);
    }
  }, [addToast]);
};

// Hook for connection status monitoring
export const useConnectionMonitoring = (
  onConnectionChange: (isOnline: boolean) => void
) => {
  const onConnectionChangeRef = useRef(onConnectionChange);
  onConnectionChangeRef.current = onConnectionChange;

  useEffect(() => {
    const handleOnline = () => onConnectionChangeRef.current(true);
    const handleOffline = () => onConnectionChangeRef.current(false);

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Initial state
      onConnectionChangeRef.current(navigator.onLine);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);
};