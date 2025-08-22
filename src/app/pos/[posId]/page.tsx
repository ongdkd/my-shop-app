"use client";

import React, { useEffect, useState } from "react";
import { getProductsByPosId } from "@/lib/products-api";
import POSClient from "@/components/POSClient";
import { notFound } from "next/navigation";
import { Product } from "@/types";

export default function POSPage({
  params,
}: {
  params: Promise<{ posId: string }>;
}) {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posId, setPosId] = useState<string>("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setError(null);
        const resolvedParams = await params;
        const { posId: resolvedPosId } = resolvedParams;
        setPosId(resolvedPosId);

        const productsData = await getProductsByPosId(resolvedPosId);
        setProducts(productsData);
      } catch (err) {
        console.error("Error loading POS data:", err);
        setError("Unable to load products. Please try again.");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params]);

  useEffect(() => {
    if (!posId) return;

    // Function to reload products
    const reloadProducts = async () => {
      try {
        const productsData = await getProductsByPosId(posId);
        setProducts(productsData);
        setError(null);
      } catch (err) {
        console.error("Error reloading products:", err);
        setError("Unable to load products. Please try again.");
      }
    };

    // Listen for custom product update events (from admin interface)
    const handleProductUpdate = () => {
      reloadProducts();
    };

    // Listen for focus events (when user returns to tab) - refresh from API
    const handleFocus = () => {
      reloadProducts();
    };

    // Periodic refresh to sync with database changes
    const refreshInterval = setInterval(() => {
      reloadProducts();
    }, 30000); // Refresh every 30 seconds

    window.addEventListener("productUpdated", handleProductUpdate);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("productUpdated", handleProductUpdate);
      window.removeEventListener("focus", handleFocus);
      clearInterval(refreshInterval);
    };
  }, [posId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  // Handle error state with customer-friendly UI
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => window.location.href = '/pos'}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span className="hidden sm:inline">Back to Terminals</span>
                </button>
                <div className="h-6 w-px bg-gray-300 hidden sm:block" />
                <h1 className="text-lg font-semibold text-gray-900">
                  POS Terminal {posId}
                </h1>
              </div>
            </div>
          </div>
        </div>
        {/* Error State */}
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Products</h3>
            <p className="text-gray-600 mb-6">
              We're having trouble connecting to our product database. Please try again.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/pos'}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Back to Terminals
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!products) {
    return notFound();
  }

  return <POSClient products={products} posId={posId} />;
}
