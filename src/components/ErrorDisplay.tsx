"use client";

import React from "react";
import {
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  WifiIcon,
  ArrowPathIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface ErrorDisplayProps {
  error: string;
  type?: "error" | "warning" | "network" | "not-found";
  onRetry?: () => void;
  onDismiss?: () => void;
  retryText?: string;
  showRetry?: boolean;
  className?: string;
}

export default function ErrorDisplay({
  error,
  type = "error",
  onRetry,
  onDismiss,
  retryText = "Try Again",
  showRetry = true,
  className = "",
}: ErrorDisplayProps) {
  const getIcon = () => {
    switch (type) {
      case "warning":
        return <ExclamationTriangleIcon className="w-6 h-6" />;
      case "network":
        return <WifiIcon className="w-6 h-6" />;
      case "not-found":
        return <ExclamationCircleIcon className="w-6 h-6" />;
      default:
        return <ExclamationCircleIcon className="w-6 h-6" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case "warning":
        return {
          bg: "bg-yellow-50",
          border: "border-yellow-200",
          icon: "text-yellow-600",
          text: "text-yellow-800",
          button: "bg-yellow-600 hover:bg-yellow-700",
        };
      case "network":
        return {
          bg: "bg-orange-50",
          border: "border-orange-200",
          icon: "text-orange-600",
          text: "text-orange-800",
          button: "bg-orange-600 hover:bg-orange-700",
        };
      case "not-found":
        return {
          bg: "bg-gray-50",
          border: "border-gray-200",
          icon: "text-gray-600",
          text: "text-gray-800",
          button: "bg-gray-600 hover:bg-gray-700",
        };
      default:
        return {
          bg: "bg-red-50",
          border: "border-red-200",
          icon: "text-red-600",
          text: "text-red-800",
          button: "bg-red-600 hover:bg-red-700",
        };
    }
  };

  const colors = getColors();

  return (
    <div className={`${colors.bg} ${colors.border} border rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className={`${colors.icon} flex-shrink-0`}>
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`${colors.text} text-sm font-medium`}>
            {error}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {showRetry && onRetry && (
            <button
              onClick={onRetry}
              className={`${colors.button} text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5`}
            >
              <ArrowPathIcon className="w-4 h-4" />
              {retryText}
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className={`${colors.icon} hover:opacity-75 transition-opacity`}
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Full page error component
export function FullPageError({
  title,
  message,
  onRetry,
  onBack,
  backText = "Go Back",
  retryText = "Try Again",
  type = "error",
}: {
  title: string;
  message: string;
  onRetry?: () => void;
  onBack?: () => void;
  backText?: string;
  retryText?: string;
  type?: "error" | "warning" | "network" | "not-found";
}) {
  const getIcon = () => {
    switch (type) {
      case "warning":
        return <ExclamationTriangleIcon className="w-16 h-16 text-yellow-500" />;
      case "network":
        return <WifiIcon className="w-16 h-16 text-orange-500" />;
      case "not-found":
        return <ExclamationCircleIcon className="w-16 h-16 text-gray-500" />;
      default:
        return <ExclamationCircleIcon className="w-16 h-16 text-red-500" />;
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case "warning":
        return "bg-yellow-600 hover:bg-yellow-700";
      case "network":
        return "bg-orange-600 hover:bg-orange-700";
      case "not-found":
        return "bg-gray-600 hover:bg-gray-700";
      default:
        return "bg-red-600 hover:bg-red-700";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="mb-6">
          {getIcon()}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>
        <p className="text-gray-600 mb-6">
          {message}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className={`px-4 py-2 ${getButtonColor()} text-white rounded-md transition-colors flex items-center gap-2 justify-center`}
            >
              <ArrowPathIcon className="w-4 h-4" />
              {retryText}
            </button>
          )}
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              {backText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Inline error for forms and components
export function InlineError({
  error,
  onDismiss,
  className = "",
}: {
  error: string;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 text-red-600 text-sm ${className}`}>
      <ExclamationCircleIcon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">{error}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-400 hover:text-red-600 transition-colors"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// Toast-style error notification
export function ErrorToast({
  error,
  onDismiss,
  autoHide = true,
  duration = 5000,
}: {
  error: string;
  onDismiss: () => void;
  autoHide?: boolean;
  duration?: number;
}) {
  React.useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [autoHide, duration, onDismiss]);

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <ExclamationCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-red-800 text-sm font-medium">
              {error}
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}