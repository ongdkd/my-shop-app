"use client";

import React, { useEffect } from "react";
import { useOrdersQuery } from "@/lib/api";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";

export default function AdminOrdersPage() {
  const { data: ordersData, isLoading: loading, error, refetch: refresh } = useOrdersQuery({ limit: 100 });
  const router = useRouter();

  // Convert API orders to legacy format for compatibility
  const orders = ordersData?.data?.map(apiOrder => ({
    id: apiOrder.id,
    userName: 'Customer', // Default since we don't have customer names
    posId: apiOrder.pos_terminal_id || 'unknown',
    items: apiOrder.order_items.map(item => ({
      id: item.product?.id || item.product_id || '',
      name: item.product?.name || 'Unknown Product',
      price: item.product?.price || item.unit_price,
      quantity: item.quantity,
    })),
    totalAmount: apiOrder.total_amount,
    depositAmount: 0, // Calculate if needed
    timestamp: new Date(apiOrder.order_date),
    status: apiOrder.order_status,
  })) || [];

  useEffect(() => {
    // Set up periodic refresh
    const refreshInterval = setInterval(() => {
      refresh();
    }, 30000); // Refresh every 30 seconds

    return () => {
      clearInterval(refreshInterval);
    };
  }, [refresh]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AuthGuard requiredRole="admin">
      <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Order Management
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                View and manage all customer orders
              </p>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 active:bg-gray-800 transition-colors touch-manipulation min-h-[44px] text-sm sm:text-base self-start sm:self-auto"
            >
              Back to Admin
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-600">{error.message || 'Failed to load orders'}</p>
              <button
                onClick={() => refresh()}
                className="text-sm text-red-700 hover:text-red-800 font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 sm:p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                All Orders ({orders?.length || 0})
              </h2>
              {loading && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                  Loading...
                </div>
              )}
            </div>
          </div>

          {!orders || orders.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                {loading ? "Loading orders..." : "No orders yet"}
              </h3>
              <p className="text-gray-600 text-sm sm:text-base">
                {loading ? "Please wait while we fetch your orders" : "Orders will appear here once customers start purchasing"}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        POS Terminal
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Items
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.id}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.userName}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.posId.toUpperCase()}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.items.length} items
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatPrice(order.totalAmount)}
                          {order.depositAmount > 0 && (
                            <span className="text-xs text-orange-600 block">
                              (${order.depositAmount.toFixed(2)} deposit)
                            </span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(order.timestamp)}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="block sm:hidden space-y-3 p-4">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900 text-sm">Order #{order.id}</h3>
                        <p className="text-xs text-gray-600">{order.userName}</p>
                      </div>
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {order.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-2">
                      <div>
                        <span className="font-medium">Terminal:</span> {order.posId.toUpperCase()}
                      </div>
                      <div>
                        <span className="font-medium">Items:</span> {order.items.length}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-end">
                      <div className="text-xs text-gray-600">
                        {formatDate(order.timestamp)}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900 text-sm">
                          {formatPrice(order.totalAmount)}
                        </div>
                        {order.depositAmount > 0 && (
                          <div className="text-xs text-orange-600">
                            (${order.depositAmount.toFixed(2)} deposit)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
    </AuthGuard>
  );
}