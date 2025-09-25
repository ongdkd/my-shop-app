// Real-time notification system for POS updates
// Uses custom events and periodic polling for real-time updates

export interface NotificationEvent {
  type: 'product_updated' | 'terminal_updated' | 'product_assignment_changed';
  data: {
    terminalId?: string;
    productId?: string;
    productIds?: string[];
    action?: 'assigned' | 'removed' | 'updated';
    timestamp: string;
  };
}

export class NotificationManager {
  private static instance: NotificationManager;
  private eventTarget: EventTarget;
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {
    this.eventTarget = new EventTarget();
  }

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  // Emit a notification event
  emit(event: NotificationEvent): void {
    const customEvent = new CustomEvent(event.type, {
      detail: event.data,
    });
    
    this.eventTarget.dispatchEvent(customEvent);
    
    // Also emit on window for global listeners
    if (typeof window !== 'undefined') {
      window.dispatchEvent(customEvent);
    }

    console.log('Notification emitted:', event);
  }

  // Listen for notification events
  on(eventType: NotificationEvent['type'], callback: (data: NotificationEvent['data']) => void): () => void {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<NotificationEvent['data']>;
      callback(customEvent.detail);
    };

    this.eventTarget.addEventListener(eventType, handler);

    // Return cleanup function
    return () => {
      this.eventTarget.removeEventListener(eventType, handler);
    };
  }

  // Listen for notification events on window (for cross-component communication)
  onWindow(eventType: NotificationEvent['type'], callback: (data: NotificationEvent['data']) => void): () => void {
    if (typeof window === 'undefined') {
      return () => {};
    }

    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<NotificationEvent['data']>;
      callback(customEvent.detail);
    };

    window.addEventListener(eventType, handler);

    // Return cleanup function
    return () => {
      window.removeEventListener(eventType, handler);
    };
  }

  // Notify about product updates
  notifyProductUpdate(productId: string, terminalId?: string): void {
    this.emit({
      type: 'product_updated',
      data: {
        productId,
        terminalId,
        action: 'updated',
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Notify about terminal updates
  notifyTerminalUpdate(terminalId: string): void {
    this.emit({
      type: 'terminal_updated',
      data: {
        terminalId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Notify about product assignment changes
  notifyProductAssignmentChange(
    terminalId: string,
    productIds: string[],
    action: 'assigned' | 'removed'
  ): void {
    this.emit({
      type: 'product_assignment_changed',
      data: {
        terminalId,
        productIds,
        action,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Start periodic polling for a terminal (fallback for real-time updates)
  startTerminalPolling(terminalId: string, callback: () => void, intervalMs: number = 30000): void {
    // Clear existing interval if any
    this.stopTerminalPolling(terminalId);

    const interval = setInterval(() => {
      callback();
    }, intervalMs);

    this.pollingIntervals.set(terminalId, interval);
  }

  // Stop periodic polling for a terminal
  stopTerminalPolling(terminalId: string): void {
    const interval = this.pollingIntervals.get(terminalId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(terminalId);
    }
  }

  // Stop all polling
  stopAllPolling(): void {
    this.pollingIntervals.forEach((interval) => {
      clearInterval(interval);
    });
    this.pollingIntervals.clear();
  }

  // Show toast notification (integrates with existing toast system)
  showToast(message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info'): void {
    // Emit a custom event that can be caught by components using the toast context
    if (typeof window !== 'undefined') {
      const toastEvent = new CustomEvent('show-notification-toast', {
        detail: { message, type, timestamp: new Date().toISOString() },
      });
      window.dispatchEvent(toastEvent);
    }
  }
}

// Export singleton instance
export const notificationManager = NotificationManager.getInstance();

// Convenience functions
export const emitProductUpdate = (productId: string, terminalId?: string) => {
  notificationManager.notifyProductUpdate(productId, terminalId);
};

export const emitTerminalUpdate = (terminalId: string) => {
  notificationManager.notifyTerminalUpdate(terminalId);
};

export const emitProductAssignmentChange = (
  terminalId: string,
  productIds: string[],
  action: 'assigned' | 'removed'
) => {
  notificationManager.notifyProductAssignmentChange(terminalId, productIds, action);
};

// Hook for using notifications in React components
export const useNotifications = () => {
  return {
    emitProductUpdate,
    emitTerminalUpdate,
    emitProductAssignmentChange,
    showToast: notificationManager.showToast.bind(notificationManager),
    on: notificationManager.on.bind(notificationManager),
    onWindow: notificationManager.onWindow.bind(notificationManager),
  };
};