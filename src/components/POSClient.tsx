// app/component/POSClient.tsx
"use client";

import React from "react";
import Image from "next/image";
import ProductCard from "./ProductCard";
import Sidebar from "./Sidebar";
import CartPanel from "./CartPanel";
import { useEffect, useState } from "react";
import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import { useCartStore } from "@/store/cartStore";
import type { Product } from "@/types";

interface POSClientProps {
  products: Product[];
  posId?: string;
}

export default function POSClient({ products, posId }: POSClientProps) {
  const { addToCart, clearCartIfDifferentPos, setCurrentPos, getTotalItems, userName } =
    useCartStore();
  const [showCart, setShowCart] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const totalItems = getTotalItems();

  useEffect(() => {
    if (posId) {
      clearCartIfDifferentPos(posId);
      setCurrentPos(posId);
    }
  }, [posId, clearCartIfDifferentPos, setCurrentPos]);

  useEffect(() => {
    // Set initial sidebar state based on screen size (only once on mount)
    const isMobile = window.innerWidth < 640;
    setSidebarOpen(!isMobile); // Open on desktop, closed on mobile initially
  }, []); // Empty dependency array - only run once on mount

  useEffect(() => {
    // Handle body overflow based on current state
    const isMobile = window.innerWidth < 640;
    document.body.style.overflow =
      (sidebarOpen && isMobile) || showCart ? "hidden" : "auto";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [sidebarOpen, showCart]);

  const handleAddToCart = (product: Product) => {
    addToCart(product);
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <Sidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        showCart={showCart}
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 sm:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Top Header with Logo and Cart */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          {/* Logo and User Info */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Image
              src="/images/logo.png"
              alt="MyShop Logo"
              width={120}
              height={40}
              className="h-8 sm:h-10 w-auto"
            />
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gray-900">Kagayaku Shop</h1>
              {userName && (
                <p className="text-sm text-gray-600">ยินต้อนรับค่า, {userName}</p>
              )}
            </div>
            {/* Mobile user greeting */}
            {userName && (
              <div className="block sm:hidden">
                <p className="text-sm font-medium text-gray-900">{userName}</p>
              </div>
            )}
          </div>

          {/* Cart Button */}
          <button
            onClick={() => setShowCart(true)}
            className="relative bg-blue-600 p-2.5 sm:p-3 rounded-xl shadow-lg hover:bg-blue-700 transition-colors touch-manipulation"
          >
            <ShoppingCartIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-500 text-white text-xs font-bold min-w-5 h-5 sm:min-w-6 sm:h-6 flex items-center justify-center rounded-full px-1 animate-pulse">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main
        className={`transition-all duration-300 ${
          sidebarOpen ? "sm:pl-64" : ""
        } pt-20 sm:pt-24 px-4 sm:px-6 pb-8`}
      >
        <div className="max-w-7xl mx-auto">
          {/* Page Title */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-3 sm:gap-4 mb-4">
              <div className="w-1.5 sm:w-2 h-8 sm:h-12 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
              <div>
                <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
                  {posId ? `${posId.toUpperCase()} Terminal` : "All Products"}
                </h1>
                <p className="text-gray-600 text-sm sm:text-lg">
                  {products.length} products available
                </p>
              </div>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex justify-end mb-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-600'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-600'
                }`}
              >
                List
              </button>
            </div>
          </div>

          {/* Products Display */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={() => handleAddToCart(product)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg border p-3 sm:p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <Image
                      src={product.image || "/images/place-holder.png"}
                      alt={product.name}
                      width={64}
                      height={64}
                      className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded border flex-shrink-0"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/images/place-holder.png";
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{product.name}</h3>
                      {product.description && (
                        <p className="text-xs sm:text-sm text-gray-600 line-clamp-1 mt-1">{product.description}</p>
                      )}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-2">
                        <span className="text-base sm:text-lg font-bold text-blue-600">
                          ${product.price.toFixed(2)}
                        </span>
                        <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                          <span>Deposit: ${product.deposit.toFixed(2)}</span>
                          {product.stock !== "" && (
                            <span>Stock: {product.stock}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base font-medium touch-manipulation flex-shrink-0"
                    >
                      <span className="hidden sm:inline">Add to Cart</span>
                      <span className="sm:hidden">Add</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {products.length === 0 && (
            <div className="text-center py-12 sm:py-20">
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-6 sm:p-12 max-w-sm sm:max-w-md mx-auto">
                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <svg className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">No Products Available</h3>
                <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">Add some products to get started with your POS terminal</p>
                <button 
                  onClick={() => window.open('/admin/pos-products', '_blank')}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg sm:rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base touch-manipulation"
                >
                  Add Products
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <CartPanel isOpen={showCart} onClose={() => setShowCart(false)} />
    </div>
  );
}
