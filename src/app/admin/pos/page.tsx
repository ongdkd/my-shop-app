"use client";

import React from "react";
import AuthGuard from "@/components/AuthGuard";

export default function AdminPOSPage() {
  return (
    <AuthGuard requiredRole="admin">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  POS Terminal Management
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">
                  Manage your POS terminals and customize their themes
                </p>
              </div>
              <button
                onClick={() => (window.location.href = "/admin")}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 active:bg-gray-800 transition-colors touch-manipulation min-h-[44px] text-sm sm:text-base self-start sm:self-auto"
              >
                Back to Admin
              </button>
            </div>
          </div>

          {/* Temporary message */}
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <div className="mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                POS Terminal Management
              </h3>
              <p className="text-gray-600">
                This feature is being updated to use the new database API.
                <br />
                Please use the POS Products page to manage terminals for now.
              </p>
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => (window.location.href = "/admin/pos-products")}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Go to POS Products
              </button>
              <button
                onClick={() => (window.location.href = "/admin")}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Back to Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
