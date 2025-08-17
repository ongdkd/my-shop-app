"use client";

import React from "react";
import { useOrderStore } from "@/store/orderStore";
import Link from "next/link";

export default function DashboardPage() {
  const { orders, getTotalRevenue, getTodayOrders } = useOrderStore();
  
  const todayOrders = getTodayOrders();
  const totalRevenue = getTotalRevenue();
  const recentOrders = orders.slice(-5).reverse(); // Last 5 orders

  const stats = [
    { name: "Total Orders Today", value: todayOrders.length },
    { name: "Total Revenue", value: `$${totalRevenue.toFixed(2)}` },
    { name: "Total Orders", value: orders.length },
    { name: "Active POS Terminals", value: 3 },
  ];

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        Dashboard Overview
      </h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <p className="text-gray-600 text-sm">{stat.name}</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Recent Orders</h2>
          <Link
            href="/orders"
            className="text-blue-600 text-sm hover:underline"
          >
            View all
          </Link>
        </div>

        <div className="divide-y">
          {recentOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No orders yet. Start selling to see orders here!
            </div>
          ) : (
            recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex justify-between items-center p-4 text-gray-700"
              >
                <span className="font-medium">{order.id}</span>
                <span>{order.userName}</span>
                <span>${order.totalAmount.toFixed(2)}</span>
                <span className="text-xs text-gray-500">
                  {new Date(order.timestamp).toLocaleDateString()}
                </span>
                <span className="text-sm font-medium px-2 py-1 rounded bg-green-100 text-green-700">
                  {order.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
