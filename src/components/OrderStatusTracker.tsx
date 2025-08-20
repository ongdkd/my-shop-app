"use client";

import React, { useEffect, useState } from "react";
import { useOrderQuery } from "@/lib/api";
import { CheckCircleIcon, ClockIcon, XCircleIcon } from "@heroicons/react/24/outline";

interface OrderStatusTrackerProps {
  orderId: string;
  onStatusChange?: (status: string) => void;
}

export default function OrderStatusTracker({ orderId, onStatusChange }: OrderStatusTrackerProps) {
  const { data: order, isLoading: loading, error, refetch } = useOrderQuery(orderId);
  const [lastStatus, setLastStatus] = useState<string | null>(null);

  // Poll for order status updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  // Notify parent component of status changes
  useEffect(() => {
    if (order && order.order_status !== lastStatus) {
      setLastStatus(order.order_status);
      onStatusChange?.(order.order_status);
    }
  }, [order, lastStatus, onStatusChange]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-600">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        <span>Loading order status...</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <XCircleIcon className="w-5 h-5" />
        <span>Unable to load order status</span>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'cancelled':
        return <XCircleIcon className="w-5 h-5 text-red-600" />;
      default:
        return <ClockIcon className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Order Completed';
      case 'cancelled':
        return 'Order Cancelled';
      case 'pending':
        return 'Order Pending';
      default:
        return 'Processing Order';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'cancelled':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  return (
    <div className="flex items-center gap-2">
      {getStatusIcon(order.order_status)}
      <span className={`font-medium ${getStatusColor(order.order_status)}`}>
        {getStatusText(order.order_status)}
      </span>
      <span className="text-sm text-gray-500">
        (Order #{order.order_number})
      </span>
    </div>
  );
}