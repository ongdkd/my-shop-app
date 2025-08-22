"use client";

import React, { useState, useEffect } from 'react';
import { 
  connectionStatusManager, 
  ConnectionStatus as ConnectionStatusType 
} from '@/lib/api/connectionStatus';

interface ConnectionStatusProps {
  showDetails?: boolean;
  className?: string;
}

export default function ConnectionStatus({ 
  showDetails = false, 
  className = "" 
}: ConnectionStatusProps) {
  const [status, setStatus] = useState<ConnectionStatusType>(
    connectionStatusManager.getStatus()
  );
  const [showDetailedError, setShowDetailedError] = useState(false);

  useEffect(() => {
    const handleStatusChange = (newStatus: ConnectionStatusType) => {
      setStatus(newStatus);
    };

    connectionStatusManager.addListener(handleStatusChange);

    return () => {
      connectionStatusManager.removeListener(handleStatusChange);
    };
  }, []);

  const handleRetry = async () => {
    await connectionStatusManager.forceCheck();
  };

  const getStatusColor = () => {
    if (status.isConnected) {
      return 'text-green-600 bg-green-100';
    }
    
    switch (status.error?.type) {
      case 'network':
        return 'text-red-600 bg-red-100';
      case 'auth':
        return 'text-yellow-600 bg-yellow-100';
      case 'database':
        return 'text-orange-600 bg-orange-100';
      case 'configuration':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = () => {
    if (status.isConnected) {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    }

    return (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    );
  };

  const getStatusText = () => {
    if (status.isConnected) {
      return 'Connected';
    }

    switch (status.error?.type) {
      case 'network':
        return 'Network Error';
      case 'auth':
        return 'Authentication Error';
      case 'database':
        return 'Database Error';
      case 'configuration':
        return 'Configuration Error';
      default:
        return 'Connection Error';
    }
  };

  if (!showDetails && status.isConnected) {
    // Show minimal indicator when connected
    return (
      <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()} ${className}`}>
        {getStatusIcon()}
        <span>Connected</span>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Status Indicator */}
      <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${getStatusColor()}`}>
        {getStatusIcon()}
        <span>{getStatusText()}</span>
        <span className="text-xs opacity-75">
          {status.lastChecked.toLocaleTimeString()}
        </span>
      </div>

      {/* Error Details */}
      {!status.isConnected && status.error && showDetails && (
        <div className="mt-3 p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-900">
              Connection Issue Details
            </h4>
            <button
              onClick={() => setShowDetailedError(!showDetailedError)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              {showDetailedError ? 'Hide' : 'Show'} Details
            </button>
          </div>
          
          <p className="text-sm text-gray-700 mb-3">
            {status.error.message}
          </p>

          {/* Suggestions */}
          {status.error.suggestions && status.error.suggestions.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-700 mb-1">
                Suggested Actions:
              </p>
              <ul className="text-xs text-gray-600 space-y-1">
                {status.error.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="text-gray-400">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Technical Details */}
          {showDetailedError && status.error.details && (
            <div className="mb-3 p-2 bg-gray-100 rounded text-xs font-mono text-gray-600">
              <p className="font-medium text-gray-700 mb-1">Technical Details:</p>
              <p>{status.error.code}: {status.error.details}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleRetry}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
            >
              Retry Connection
            </button>
            
            {status.error.type === 'auth' && (
              <button
                onClick={() => window.location.href = '/login'}
                className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition-colors"
              >
                Re-authenticate
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}