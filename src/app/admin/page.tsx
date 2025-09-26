"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useOrdersQuery, usePOSTerminalsQuery } from "@/lib/api";
import AuthGuard from "@/components/AuthGuard";

export default function AdminPage() {
  const router = useRouter();

  // Orders → fetch smaller payload (limit + essential fields only if backend supports)
  const {
    data: ordersData,
    isLoading: ordersLoading,
    refetch: refreshOrders,
  } = useOrdersQuery({ limit: 50 });

  // POS Terminals → only active ones
  const {
    data: posTerminals = [],
    loading: posLoading,
    refetch: refreshTerminals,
  } = usePOSTerminalsQuery({ active: true });

  const orders = ordersData?.data || [];
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    // ✅ Refresh both orders + terminals every 60s
    const refreshInterval = setInterval(() => {
      refreshOrders();
      refreshTerminals();
    }, 60000);

    return () => clearInterval(refreshInterval);
  }, [refreshOrders, refreshTerminals]);

  // ======================
  // Stats Calculations
  // ======================

  const todayOrders = useMemo(() => {
    if (!isClient) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return orders.filter((order) => {
      const orderDate = new Date(order.order_date);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    });
  }, [isClient, orders]);

  const totalRevenue = useMemo(() => {
    if (!isClient) return 0;
    return orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  }, [isClient, orders]);

  const activePosCount = posTerminals?.length || 0;

  // ======================
  // UI Config
  // ======================

  const adminRoutes = [
    {
      title: "Dashboard",
      description: "View sales analytics and order statistics",
      href: "admin/dashboard",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: "bg-blue-500",
      stats: `${todayOrders.length} orders today`,
    },
    {
      title: "POS Terminals",
      description: "Manage POS terminals and customize themes",
      href: "/admin/pos",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      color: "bg-purple-500",
      stats: `${activePosCount} terminals active`,
    },
    {
      title: "POS Operations",
      description: "Access POS terminals for sales operations",
      href: "/pos",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v5a2 2 0 01-2 2H9a2 2 0 01-2-2v-5m6 0V9a2 2 0 00-2-2H9a2 2 0 00-2-2v5" />
        </svg>
      ),
      color: "bg-green-500",
      stats: "Start selling",
    },
    {
      title: "Orders",
      description: "View and manage customer orders",
      href: "/admin/orders",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: "bg-indigo-500",
      stats: `${orders?.length || 0} total orders`,
    },
  ];

  const quickStats = [
    {
      title: "Today's Revenue",
      value: `$${totalRevenue.toFixed(2)}`,
      color: "text-green-600 bg-green-100",
    },
    {
      title: "Orders Today",
      value: todayOrders.length.toString(),
      color: "text-blue-600 bg-blue-100",
    },
    {
      title: "Total Orders",
      value: (orders?.length || 0).toString(),
      color: "text-purple-600 bg-purple-100",
    },
    {
      title: "Active POS",
      value: activePosCount.toString(),
      color: "text-orange-600 bg-orange-100",
    },
  ];

  // ======================
  // Render
  // ======================

  return (
    <AuthGuard requiredRole="admin">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600">
              Manage your POS system, products, and orders
            </p>
          </div>

          {/* Loading State */}
          {(ordersLoading || posLoading) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-blue-700">Loading dashboard data...</p>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            {quickStats.map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm border p-3 sm:p-4 lg:p-6"
              >
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                  {stat.title}
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                  {(ordersLoading || posLoading) ? "..." : stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Navigation Cards */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
              Administration
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {adminRoutes.map((route, index) => (
                <div
                  key={index}
                  onClick={() => router.push(route.href)}
                  className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 cursor-pointer group touch-manipulation"
                >
                  <div className="p-4 sm:p-6">
                    <div className="flex items-center mb-3 sm:mb-4">
                      <div
                        className={`p-2 sm:p-3 rounded-lg ${route.color} text-white group-hover:scale-110 transition-transform`}
                      >
                        {route.icon}
                      </div>
                      <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                          {route.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">
                          {route.stats}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4">
                      {route.description}
                    </p>
                    <div className="flex items-center text-blue-600 text-xs sm:text-sm font-medium group-hover:text-blue-700">
                      Access {route.title}
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4 ml-1 group-hover:translate-x-1 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-gray-500 text-sm">
            <p>POS Management System - Admin Dashboard</p>
            <p className="mt-1">Manage your business operations efficiently</p>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
