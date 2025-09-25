"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  MinusIcon,
  CheckIcon,
  XMarkIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { Product } from "@/lib/api/types";
import { 
  usePOSTerminal, 
  useProducts, 
  useTerminalProducts, 
  useTerminalProductMutations 
} from "@/lib/api/hooks";
import AuthGuard from "@/components/AuthGuard";
import ConnectionStatus from "@/components/ConnectionStatus";
import { FullPageLoading, ButtonLoading } from "@/components/LoadingSpinner";
import ErrorDisplay, { FullPageError } from "@/components/ErrorDisplay";
import { emitProductAssignmentChange } from "@/lib/realtime/notifications";
import { useSuccessToast, useErrorToast } from "@/components/ToastNotification";

interface ProductWithAssignment extends Product {
  isAssigned: boolean;
}

export default function TerminalProductsPage() {
  const params = useParams();
  const router = useRouter();
  const terminalId = params.id as string;

  // Use hooks for data fetching
  const { 
    data: terminal, 
    loading: terminalLoading, 
    error: terminalError, 
    retrying: terminalRetrying,
    retry: retryTerminal 
  } = usePOSTerminal(terminalId);
  
  const { 
    data: allProducts = [], 
    loading: productsLoading, 
    error: productsError,
    retrying: productsRetrying,
    refetch: refetchProducts,
    retry: retryProducts 
  } = useProducts({ is_active: true });
  
  const { 
    data: assignedProducts = [], 
    loading: assignedLoading, 
    error: assignedError,
    retrying: assignedRetrying,
    refetch: refetchAssigned,
    retry: retryAssigned 
  } = useTerminalProducts(terminalId);
  
  const { 
    assignProducts, 
    removeProducts, 
    loading: mutationLoading, 
    error: mutationError 
  } = useTerminalProductMutations();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [localError, setLocalError] = useState<string | null>(null);
  
  // Get toast functions
  const showSuccessToast = useSuccessToast();
  const showErrorToast = useErrorToast();

  const loading = terminalLoading || productsLoading || assignedLoading;
  const retrying = terminalRetrying || productsRetrying || assignedRetrying;
  const error = terminalError || productsError || assignedError || mutationError || localError;
  const terminalNotFound = terminalError?.includes('not found') || false;

  // Get unique categories from all products
  const categories = React.useMemo(() => {
    const cats = new Set(allProducts.map(p => p.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [allProducts]);

  // Create products with assignment status
  const productsWithAssignment: ProductWithAssignment[] = React.useMemo(() => {
    const assignedIds = new Set((assignedProducts || []).map(p => p.id));
    
    return allProducts.map(product => ({
      ...product,
      isAssigned: assignedIds.has(product.id),
    }));
  }, [allProducts, assignedProducts]);

  // Filter products based on search and category
  const filteredProducts = React.useMemo(() => {
    let filtered = productsWithAssignment;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        product =>
          product.name.toLowerCase().includes(query) ||
          product.barcode.toLowerCase().includes(query) ||
          (product.category && product.category.toLowerCase().includes(query))
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    return filtered.sort((a, b) => {
      // Sort assigned products first, then by name
      if (a.isAssigned && !b.isAssigned) return -1;
      if (!a.isAssigned && b.isAssigned) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [productsWithAssignment, searchQuery, selectedCategory]);

  // Handle product selection
  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  // Handle bulk assign
  const handleBulkAssign = async () => {
    if (selectedProducts.size === 0) return;

    const productsToAssign = Array.from(selectedProducts).filter(id => {
      const product = productsWithAssignment.find(p => p.id === id);
      return product && !product.isAssigned;
    });

    if (productsToAssign.length > 0) {
      const success = await assignProducts(terminalId, productsToAssign);
      if (success) {
        // Emit notification for real-time updates
        emitProductAssignmentChange(terminalId, productsToAssign, 'assigned');
        
        // Show success toast
        showSuccessToast(
          `Successfully assigned ${productsToAssign.length} product${productsToAssign.length > 1 ? 's' : ''} to terminal`
        );
        
        await refetchAssigned();
        setSelectedProducts(new Set());
      } else {
        setLocalError("Failed to assign products. Please try again.");
        showErrorToast("Failed to assign products. Please try again.");
      }
    }
  };

  // Handle bulk unassign
  const handleBulkUnassign = async () => {
    if (selectedProducts.size === 0) return;

    const productsToUnassign = Array.from(selectedProducts).filter(id => {
      const product = productsWithAssignment.find(p => p.id === id);
      return product && product.isAssigned;
    });

    if (productsToUnassign.length > 0) {
      const success = await removeProducts(terminalId, productsToUnassign);
      if (success) {
        // Emit notification for real-time updates
        emitProductAssignmentChange(terminalId, productsToUnassign, 'removed');
        
        // Show success toast
        showSuccessToast(
          `Successfully removed ${productsToUnassign.length} product${productsToUnassign.length > 1 ? 's' : ''} from terminal`
        );
        
        await refetchAssigned();
        setSelectedProducts(new Set());
      } else {
        setLocalError("Failed to unassign products. Please try again.");
        showErrorToast("Failed to unassign products. Please try again.");
      }
    }
  };

  // Handle individual product toggle
  const handleProductToggle = async (product: ProductWithAssignment) => {
    let success = false;
    const action = product.isAssigned ? 'removed' : 'assigned';
    
    if (product.isAssigned) {
      success = await removeProducts(terminalId, [product.id]);
    } else {
      success = await assignProducts(terminalId, [product.id]);
    }

    if (success) {
      // Emit notification for real-time updates
      emitProductAssignmentChange(terminalId, [product.id], action);
      
      // Show success toast
      showSuccessToast(
        `Product "${product.name}" ${action === 'assigned' ? 'added to' : 'removed from'} terminal`
      );
      
      await refetchAssigned();
    } else {
      setLocalError("Failed to update product assignment. Please try again.");
      showErrorToast("Failed to update product assignment. Please try again.");
    }
  };

  // Clear error
  const clearError = () => {
    setLocalError(null);
  };

  // Retry all data
  const retryAll = async () => {
    await Promise.all([
      retryTerminal(),
      retryProducts(),
      retryAssigned(),
    ]);
  };

  // Loading state
  if (loading) {
    return (
      <AuthGuard requiredRole="admin">
        <FullPageLoading 
          text={retrying ? "Retrying connection..." : "Loading terminal data..."} 
        />
      </AuthGuard>
    );
  }

  // Terminal not found state
  if (terminalNotFound) {
    return (
      <AuthGuard requiredRole="admin">
        <FullPageError
          title="Terminal Not Found"
          message={`The POS terminal with ID "${terminalId}" could not be found.`}
          type="not-found"
          onRetry={retryAll}
          onBack={() => router.push("/admin/pos")}
          backText="Back to POS Terminals"
          retryText="Try Again"
        />
      </AuthGuard>
    );
  }

  // General error state
  if (error && !terminal) {
    const isNetworkError = error.includes('Network') || error.includes('connection');
    
    return (
      <AuthGuard requiredRole="admin">
        <FullPageError
          title={isNetworkError ? "Connection Error" : "Unable to Load Data"}
          message={error}
          type={isNetworkError ? "network" : "error"}
          onRetry={retryAll}
          onBack={() => router.push("/admin/pos")}
          backText="Back to POS Terminals"
          retryText={retrying ? "Retrying..." : "Try Again"}
        />
      </AuthGuard>
    );
  }

  const assignedCount = assignedProducts?.length || 0;
  const totalCount = allProducts.length;
  const selectedAssignedCount = Array.from(selectedProducts).filter(id => {
    const product = productsWithAssignment.find(p => p.id === id);
    return product && product.isAssigned;
  }).length;
  const selectedUnassignedCount = selectedProducts.size - selectedAssignedCount;

  return (
    <AuthGuard requiredRole="admin">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <button
                    onClick={() => router.push("/admin/pos")}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <ArrowLeftIcon className="w-5 h-5" />
                  </button>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    Product Management
                  </h1>
                </div>
                {terminal && (
                  <div className="ml-10">
                    <h2 className="text-lg font-medium text-gray-700 mb-1">
                      {terminal.terminal_name}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {assignedCount} of {totalCount} products assigned
                    </p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <ConnectionStatus showDetails={false} />
                <button
                  onClick={() => window.open(`/pos/${terminalId}`, "_blank")}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Launch POS
                </button>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mt-4">
                <ErrorDisplay
                  error={error}
                  type={error.includes('Network') ? 'network' : 'error'}
                  onRetry={retryAll}
                  onDismiss={clearError}
                  retryText={retrying ? "Retrying..." : "Try Again"}
                  showRetry={!retrying}
                />
              </div>
            )}
          </div>

          {/* Search and Filter Controls */}
          <div className="mb-6 bg-white rounded-lg shadow-sm border p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products by name, barcode, or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="sm:w-48">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedProducts.size > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {selectedProducts.size} products selected
                  </span>
                  <div className="flex gap-2">
                    {selectedUnassignedCount > 0 && (
                      <button
                        onClick={handleBulkAssign}
                        disabled={mutationLoading}
                        className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {mutationLoading ? (
                          <ButtonLoading text={`Assigning...`} />
                        ) : (
                          <>
                            <PlusIcon className="w-4 h-4" />
                            Assign ({selectedUnassignedCount})
                          </>
                        )}
                      </button>
                    )}
                    {selectedAssignedCount > 0 && (
                      <button
                        onClick={handleBulkUnassign}
                        disabled={mutationLoading}
                        className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {mutationLoading ? (
                          <ButtonLoading text={`Unassigning...`} />
                        ) : (
                          <>
                            <MinusIcon className="w-4 h-4" />
                            Unassign ({selectedAssignedCount})
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedProducts(new Set())}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MagnifyingGlassIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Products Found
              </h3>
              <p className="text-gray-600">
                {searchQuery || selectedCategory !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "No products are available in the system."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className={`bg-white rounded-lg shadow-sm border overflow-hidden transition-all ${
                    product.isAssigned
                      ? "border-green-200 bg-green-50"
                      : "border-gray-200"
                  } ${
                    selectedProducts.has(product.id)
                      ? "ring-2 ring-blue-500"
                      : ""
                  }`}
                >
                  {/* Product Image */}
                  <div className="aspect-square bg-gray-100 relative">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-400 text-sm">No Image</span>
                      </div>
                    )}
                    
                    {/* Assignment Status Badge */}
                    <div className="absolute top-2 right-2">
                      {product.isAssigned ? (
                        <div className="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                          <CheckIcon className="w-3 h-3" />
                          Assigned
                        </div>
                      ) : (
                        <div className="bg-gray-400 text-white px-2 py-1 rounded-full text-xs font-medium">
                          Not Assigned
                        </div>
                      )}
                    </div>

                    {/* Selection Checkbox */}
                    <div className="absolute top-2 left-2">
                      <input
                        type="checkbox"
                        checked={selectedProducts.has(product.id)}
                        onChange={() => toggleProductSelection(product.id)}
                        className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-2">
                      {product.category || "No Category"}
                    </p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-semibold text-gray-900">
                        ${product.price.toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-500">
                        Stock: {product.stock_quantity}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-3 font-mono">
                      {product.barcode}
                    </p>

                    {/* Toggle Button */}
                    <button
                      onClick={() => handleProductToggle(product)}
                      disabled={mutationLoading}
                      className={`w-full py-2 px-3 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        product.isAssigned
                          ? "bg-red-100 text-red-700 hover:bg-red-200"
                          : "bg-green-100 text-green-700 hover:bg-green-200"
                      }`}
                    >
                      {mutationLoading ? (
                        <ButtonLoading text={product.isAssigned ? "Removing..." : "Adding..."} />
                      ) : (
                        product.isAssigned ? "Remove from Terminal" : "Add to Terminal"
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}