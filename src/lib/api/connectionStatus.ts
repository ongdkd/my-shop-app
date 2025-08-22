import { apiClient } from './client';

export interface ConnectionStatus {
  isConnected: boolean;
  lastChecked: Date;
  error?: {
    type: 'network' | 'auth' | 'database' | 'server' | 'configuration';
    code: string;
    message: string;
    details?: any;
    suggestions?: string[];
  };
}

export interface DetailedHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: {
      status: 'connected' | 'disconnected' | 'error';
      responseTime?: number;
      error?: string;
    };
    authentication: {
      status: 'configured' | 'misconfigured' | 'error';
      provider: 'supabase';
      error?: string;
    };
    api: {
      status: 'running';
      version: string;
      uptime: number;
    };
  };
  environment: {
    nodeEnv: string;
    port: number;
    corsEnabled: boolean;
  };
}

export class ConnectionStatusManager {
  private status: ConnectionStatus = {
    isConnected: false,
    lastChecked: new Date(),
  };
  
  private monitoringInterval?: NodeJS.Timeout;
  private listeners: Array<(status: ConnectionStatus) => void> = [];
  private checkInterval = 30000; // 30 seconds
  private retryAttempts = 0;
  private maxRetryAttempts = 3;
  private retryDelay = 1000; // Start with 1 second

  constructor() {
    // Initial check
    this.forceCheck();
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return { ...this.status };
  }

  /**
   * Start periodic monitoring
   */
  startMonitoring(): void {
    if (this.monitoringInterval) {
      return; // Already monitoring
    }

    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.checkInterval);
  }

  /**
   * Stop periodic monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
  }

  /**
   * Force an immediate connection check
   */
  async forceCheck(): Promise<ConnectionStatus> {
    await this.performHealthCheck();
    return this.getStatus();
  }

  /**
   * Add a listener for status changes
   */
  addListener(listener: (status: ConnectionStatus) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remove a status change listener
   */
  removeListener(listener: (status: ConnectionStatus) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Perform health check with retry logic
   */
  private async performHealthCheck(): Promise<void> {
    try {
      const isHealthy = await this.checkApiHealth();
      
      if (isHealthy) {
        this.updateStatus({
          isConnected: true,
          lastChecked: new Date(),
        });
        this.retryAttempts = 0; // Reset retry counter on success
      } else {
        await this.handleConnectionFailure();
      }
    } catch (error) {
      await this.handleConnectionFailure(error);
    }
  }

  /**
   * Check API health using multiple endpoints
   */
  private async checkApiHealth(): Promise<boolean> {
    try {
      // Try basic health check first
      const basicHealth = await apiClient.healthCheck();
      if (!basicHealth) {
        return false;
      }

      // Try detailed health check for more information
      try {
        const response = await fetch(`${apiClient['baseURL']}/health/detailed`);
        if (response.ok) {
          const healthData = await response.json();
          return healthData.success && healthData.data.status !== 'unhealthy';
        }
      } catch (detailedError) {
        // If detailed check fails but basic check passed, still consider it healthy
        console.warn('Detailed health check failed, but basic check passed:', detailedError);
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Handle connection failure with retry logic
   */
  private async handleConnectionFailure(error?: any): Promise<void> {
    this.retryAttempts++;

    const connectionError = this.categorizeError(error);
    
    this.updateStatus({
      isConnected: false,
      lastChecked: new Date(),
      error: connectionError,
    });

    // Implement exponential backoff for retries
    if (this.retryAttempts < this.maxRetryAttempts) {
      const delay = this.retryDelay * Math.pow(2, this.retryAttempts - 1);
      setTimeout(() => {
        this.performHealthCheck();
      }, delay);
    }
  }

  /**
   * Categorize errors for better user feedback
   */
  private categorizeError(error: any): ConnectionStatus['error'] {
    if (!error) {
      return {
        type: 'server',
        code: 'HEALTH_CHECK_FAILED',
        message: 'Server health check failed',
        suggestions: [
          'Check if the backend server is running',
          'Verify the API URL configuration',
          'Check network connectivity'
        ]
      };
    }

    // Network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        type: 'network',
        code: 'NETWORK_ERROR',
        message: 'Unable to connect to the backend API',
        details: error.message,
        suggestions: [
          'Check your internet connection',
          'Verify the API URL is correct',
          'Check if the backend server is running'
        ]
      };
    }

    // Authentication errors
    if (error.status === 401 || error.status === 403) {
      return {
        type: 'auth',
        code: 'AUTHENTICATION_ERROR',
        message: 'Authentication failed',
        details: error.message,
        suggestions: [
          'Please log in again',
          'Check if your session has expired',
          'Verify authentication configuration'
        ]
      };
    }

    // Server errors
    if (error.status >= 500) {
      return {
        type: 'server',
        code: 'SERVER_ERROR',
        message: 'Backend server error',
        details: error.message,
        suggestions: [
          'The server is experiencing issues',
          'Please try again in a few minutes',
          'Contact system administrator if the problem persists'
        ]
      };
    }

    // Database errors (detected from error messages)
    if (error.message && error.message.toLowerCase().includes('database')) {
      return {
        type: 'database',
        code: 'DATABASE_ERROR',
        message: 'Database connection error',
        details: error.message,
        suggestions: [
          'Database connection is unavailable',
          'Check database configuration',
          'Contact system administrator'
        ]
      };
    }

    // Configuration errors
    if (error.message && (
      error.message.includes('SUPABASE') || 
      error.message.includes('configuration') ||
      error.message.includes('environment')
    )) {
      return {
        type: 'configuration',
        code: 'CONFIGURATION_ERROR',
        message: 'System configuration error',
        details: error.message,
        suggestions: [
          'System is not properly configured',
          'Check environment variables',
          'Contact system administrator'
        ]
      };
    }

    // Generic error
    return {
      type: 'server',
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred',
      details: error.message || 'Unknown error',
      suggestions: [
        'Please try again',
        'Refresh the page',
        'Contact support if the problem persists'
      ]
    };
  }

  /**
   * Update status and notify listeners
   */
  private updateStatus(newStatus: ConnectionStatus): void {
    const statusChanged = 
      this.status.isConnected !== newStatus.isConnected ||
      this.status.error?.code !== newStatus.error?.code;

    this.status = newStatus;

    if (statusChanged) {
      this.listeners.forEach(listener => {
        try {
          listener(this.getStatus());
        } catch (error) {
          console.error('Error in connection status listener:', error);
        }
      });
    }
  }

  /**
   * Get detailed health information
   */
  async getDetailedHealth(): Promise<DetailedHealthResponse | null> {
    try {
      const response = await fetch(`${apiClient['baseURL']}/health/detailed`);
      if (response.ok) {
        const data = await response.json();
        return data.success ? data.data : null;
      }
      return null;
    } catch (error) {
      console.error('Failed to get detailed health:', error);
      return null;
    }
  }

  /**
   * Test specific service health
   */
  async testServiceHealth(service: 'database' | 'auth'): Promise<boolean> {
    try {
      const response = await fetch(`${apiClient['baseURL']}/health/${service}`);
      if (response.ok) {
        const data = await response.json();
        return data.success;
      }
      return false;
    } catch (error) {
      console.error(`Failed to test ${service} health:`, error);
      return false;
    }
  }
}

// Create and export singleton instance
export const connectionStatusManager = new ConnectionStatusManager();

// Auto-start monitoring in browser environment
if (typeof window !== 'undefined') {
  connectionStatusManager.startMonitoring();
  
  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    connectionStatusManager.stopMonitoring();
  });
}