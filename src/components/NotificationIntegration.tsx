"use client";

import { useEffect } from 'react';
import { useToast } from './ToastNotification';

// Component that integrates the notification system with the existing toast provider
const NotificationIntegration: React.FC = () => {
  const { addToast } = useToast();

  useEffect(() => {
    const handleNotificationToast = (event: Event) => {
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
      window.addEventListener('show-notification-toast', handleNotificationToast);
      return () => window.removeEventListener('show-notification-toast', handleNotificationToast);
    }
  }, [addToast]);

  // This component doesn't render anything, it just handles events
  return null;
};

export default NotificationIntegration;