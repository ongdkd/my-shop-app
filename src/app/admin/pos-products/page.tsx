"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Product, PosTerminal, PosProductMapping } from "@/types";
import {
  getProducts,
  getPosMappings,
  updatePosMappings,
  addProduct,
  updateProduct,
  deleteProduct,
} from "@/lib/products";
import AddProductModal from "@/components/AddProductModal";
import EditProductModal from "@/components/EditProductModal";
import ImportProductsModal from "@/components/ImportProductsModal";

export default function AdminPosProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedPosId, setSelectedPosId] = useState("pos1");
  const [posProductMappings, setPosProductMappings] = useState<
    PosProductMapping[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const posTerminals: PosTerminal[] = [
    { id: "pos1", name: "POS 1", themeColor: "#3B82F6", isActive: true },
    { id: "pos2", name: "POS 2", themeColor: "#10B981", isActive: true },
    { id: "pos3", name: "POS 3", themeColor: "#F59E0B", isActive: true },
  ];

  // Check for POS ID in URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const posParam = urlParams.get("pos");
    if (posParam) {
      setSelectedPosId(posParam);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const allProducts = await getProducts(true); // Include hidden products for admin
      const mappings = getPosMappings();
      setProducts(allProducts);
      setPosProductMappings(mappings);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentMapping = () => {
    return posProductMappings.find(
      (mapping) => mapping.posId === selectedPosId
    );
  };

  // Get only products assigned to the selected POS (always show hidden products)
  const getPosProducts = () => {
    const mapping = getCurrentMapping();
    if (!mapping) return [];

    return products.filter((product) => {
      const isAssigned = mapping.productIds.includes(product.id);
      return isAssigned; // Always show all products, including hidden ones
    });
  };

  // Get counts for display
  const getProductCounts = () => {
    const mapping = getCurrentMapping();
    if (!mapping) return { total: 0, visible: 0, hidden: 0 };

    const assignedProducts = products.filter((product) =>
      mapping.productIds.includes(product.id)
    );

    const visible = assignedProducts.filter((p) => !p.hidden).length;
    const hidden = assignedProducts.filter((p) => p.hidden).length;

    return { total: assignedProducts.length, visible, hidden };
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const handleAddProduct = async (newProduct: Product) => {
    // Product already has ID from the modal

    await addProduct(newProduct);
    setProducts((prev) => [...prev, newProduct]);

    // Automatically assign to current POS
    const updatedMappings = posProductMappings.map((mapping) =>
      mapping.posId === selectedPosId
        ? { ...mapping, productIds: [...mapping.productIds, newProduct.id] }
        : mapping
    );

    updatePosMappings(updatedMappings);
    setPosProductMappings(updatedMappings);

    // Dispatch custom event to notify POS pages
    window.dispatchEvent(
      new CustomEvent("productUpdated", {
        detail: { action: "added", productId: newProduct.id },
      })
    );
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };

  const handleUpdateProduct = async (
    productId: string,
    updatedProduct: Product
  ) => {
    await updateProduct(productId, updatedProduct);
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? updatedProduct : p))
    );

    // Dispatch custom event to notify POS pages
    window.dispatchEvent(
      new CustomEvent("productUpdated", {
        detail: { action: "updated", productId },
      })
    );
  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct(productId);

        setProducts((prev) => {
          const filtered = prev.filter((p) => p.id !== productId);
          return filtered;
        });

        // Remove from all POS mappings (handled in deleteProduct function)
        const updatedMappings = posProductMappings.map((mapping) => ({
          ...mapping,
          productIds: mapping.productIds.filter((id) => id !== productId),
        }));
        setPosProductMappings(updatedMappings);

        // Dispatch custom event to notify POS pages
        window.dispatchEvent(
          new CustomEvent("productUpdated", {
            detail: { action: "deleted", productId },
          })
        );
      } catch (error) {
        console.error("Error deleting product:", error);
        alert("Failed to delete product. Please try again.");
      }
    }
  };

  const handleToggleProductVisibility = async (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const updatedHidden = !product.hidden;
    await updateProduct(productId, { hidden: updatedHidden });

    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, hidden: updatedHidden } : p
      )
    );

    // Dispatch custom event to notify POS pages
    window.dispatchEvent(
      new CustomEvent("productUpdated", {
        detail: { productId, hidden: updatedHidden },
      })
    );
  };

  const handleImportProducts = async (
    importedProducts: Omit<Product, "id">[]
  ) => {
    const newProducts: Product[] = importedProducts.map((productData) => ({
      ...productData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    }));

    // Add all products to storage
    for (const product of newProducts) {
      await addProduct(product);
    }

    setProducts((prev) => [...prev, ...newProducts]);

    // Automatically assign imported products to current POS
    const newProductIds = newProducts.map((p) => p.id);
    const updatedMappings = posProductMappings.map((mapping) =>
      mapping.posId === selectedPosId
        ? { ...mapping, productIds: [...mapping.productIds, ...newProductIds] }
        : mapping
    );

    updatePosMappings(updatedMappings);
    setPosProductMappings(updatedMappings);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  const posProducts = getPosProducts();
  const selectedPos = posTerminals.find((pos) => pos.id === selectedPosId);
  const productCounts = getProductCounts();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                POS Products Management
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Manage products for each POS terminal
              </p>
            </div>
            <button
              onClick={() => (window.location.href = "/admin/pos")}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm sm:text-base self-start sm:self-auto"
            >
              Back to POS Management
            </button>
          </div>
        </div>

        {/* POS Selection & Add Product */}
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-6">
          <div className="flex flex-col gap-4">
            {/* POS Selection */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Select POS Terminal:
              </label>
              <select
                value={selectedPosId}
                onChange={(e) => setSelectedPosId(e.target.value)}
                className="flex-1 sm:flex-none px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {posTerminals.map((pos) => (
                  <option key={pos.id} value={pos.id}>
                    {pos.name} (
                    {posProductMappings.find((m) => m.posId === pos.id)
                      ?.productIds.length || 0}{" "}
                    products)
                  </option>
                ))}
              </select>

              {selectedPos && (
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: selectedPos.themeColor }}
                  />
                  <span className="text-sm text-gray-600">
                    {selectedPos.name}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Add Product
              </button>

              <button
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                  />
                </svg>
                Import Products
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 sm:p-6 border-b">
            <div className="flex flex-col gap-4">
              {/* Header Info */}
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  {selectedPos?.name} Products ({posProducts.length})
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {productCounts.visible} visible, {productCounts.hidden} hidden
                </p>
              </div>

              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                {/* View Mode Toggle */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 whitespace-nowrap">
                    View:
                  </label>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        viewMode === "grid"
                          ? "bg-white shadow-sm"
                          : "text-gray-600"
                      }`}
                    >
                      Grid
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        viewMode === "list"
                          ? "bg-white shadow-sm"
                          : "text-gray-600"
                      }`}
                    >
                      List
                    </button>
                  </div>
                </div>

                {/* Batch Delete */}
                {selectedProducts.length > 0 && (
                  <button
                    onClick={async () => {
                      if (
                        confirm(
                          `Delete ${selectedProducts.length} selected products?`
                        )
                      ) {
                        try {
                          // Delete products directly without individual confirmations
                          for (const productId of selectedProducts) {
                            await deleteProduct(productId);

                            // Update local state
                            setProducts((prev) =>
                              prev.filter((p) => p.id !== productId)
                            );

                            // Remove from POS mappings
                            const updatedMappings = posProductMappings.map(
                              (mapping) => ({
                                ...mapping,
                                productIds: mapping.productIds.filter(
                                  (id) => id !== productId
                                ),
                              })
                            );
                            setPosProductMappings(updatedMappings);

                            // Dispatch event
                            window.dispatchEvent(
                              new CustomEvent("productUpdated", {
                                detail: { action: "deleted", productId },
                              })
                            );
                          }

                          setSelectedProducts([]);
                        } catch (error) {
                          console.error("Batch delete error:", error);
                          alert(
                            "Some products could not be deleted. Please try again."
                          );
                        }
                      }
                    }}
                    className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors font-medium"
                  >
                    Delete Selected ({selectedProducts.length})
                  </button>
                )}
              </div>
            </div>
          </div>

          {posProducts.length === 0 ? (
            <div className="p-6 sm:p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg
                  className="w-10 h-10 sm:w-12 sm:h-12 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                No products in {selectedPos?.name}
              </h3>
              <p className="text-gray-600 mb-4 text-sm sm:text-base">
                Add your first product to get started
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Add Product
                </button>

                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                    />
                  </svg>
                  Import Products
                </button>
              </div>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 p-4 sm:p-6">
              {posProducts.map((product) => (
                <div
                  key={product.id}
                  className={`border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all ${
                    product.hidden ? "opacity-60 bg-gray-50" : ""
                  }`}
                >
                  <div className="aspect-square bg-gray-100 relative">
                    <Image
                      src={product.image || "/images/place-holder.png"}
                      alt={product.name}
                      fill
                      className={`object-cover ${
                        product.hidden ? "grayscale" : ""
                      }`}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/images/place-holder.png";
                      }}
                    />
                    {product.hidden && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                        Hidden
                      </div>
                    )}
                  </div>

                  <div className="p-3 sm:p-4">
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="text-left w-full mb-2"
                    >
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate hover:text-blue-600 transition-colors">
                        {product.name}
                      </h3>
                    </button>

                    <div className="space-y-1 text-xs sm:text-sm text-gray-600 mb-3">
                      <div className="flex justify-between">
                        <span>Price:</span>
                        <span className="font-medium">
                          {formatPrice(product.price)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Deposit:</span>
                        <span className="font-medium">
                          {formatPrice(product.deposit)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Stock:</span>
                        <span className="font-medium">
                          {product.stock === "" ? "Unlimited" : product.stock}
                        </span>
                      </div>
                    </div>

                    {product.description && (
                      <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">
                        {product.description}
                      </p>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2 mb-2">
                      <button
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs sm:text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors touch-manipulation"
                        onClick={() => handleEditProduct(product)}
                      >
                        <svg
                          className="w-3 h-3 sm:w-4 sm:h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        Edit
                      </button>
                      <button
                        className="flex items-center justify-center gap-1 px-3 py-2 text-xs sm:text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors touch-manipulation"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        <svg
                          className="w-3 h-3 sm:w-4 sm:h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>

                    <button
                      className={`w-full flex items-center justify-center gap-1 px-3 py-2.5 text-xs sm:text-sm rounded transition-colors touch-manipulation font-medium ${
                        product.hidden
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-orange-100 text-orange-700 hover:bg-orange-200"
                      }`}
                      onClick={() => handleToggleProductVisibility(product.id)}
                    >
                      {product.hidden ? (
                        <>
                          <svg
                            className="w-3 h-3 sm:w-4 sm:h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          Show
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-3 h-3 sm:w-4 sm:h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                            />
                          </svg>
                          Hide
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div>
              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={
                            selectedProducts.length === posProducts.length &&
                            posProducts.length > 0
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProducts(posProducts.map((p) => p.id));
                            } else {
                              setSelectedProducts([]);
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Deposit
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {posProducts.map((product) => (
                      <tr
                        key={product.id}
                        className={`${product.hidden ? "bg-gray-50" : ""}`}
                      >
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProducts((prev) => [
                                  ...prev,
                                  product.id,
                                ]);
                              } else {
                                setSelectedProducts((prev) =>
                                  prev.filter((id) => id !== product.id)
                                );
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Image
                              src={product.image || "/images/place-holder.png"}
                              alt={product.name}
                              width={48}
                              height={48}
                              className={`w-10 h-10 sm:w-12 sm:h-12 object-cover rounded border mr-3 sm:mr-4 ${
                                product.hidden ? "grayscale" : ""
                              }`}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/images/place-holder.png";
                              }}
                            />
                            <div>
                              <button
                                onClick={() => handleEditProduct(product)}
                                className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
                              >
                                {product.name}
                              </button>
                              {product.description && (
                                <div className="text-xs sm:text-sm text-gray-500 truncate max-w-xs">
                                  {product.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatPrice(product.price)}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatPrice(product.deposit)}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.stock === "" ? "Unlimited" : product.stock}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() =>
                              handleToggleProductVisibility(product.id)
                            }
                            className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full transition-colors hover:opacity-80 touch-manipulation ${
                              product.hidden
                                ? "bg-red-100 text-red-800 hover:bg-red-200"
                                : "bg-green-100 text-green-800 hover:bg-green-200"
                            }`}
                          >
                            {product.hidden ? "Hidden" : "Visible"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile List View */}
              <div className="block sm:hidden space-y-3 p-4">
                {posProducts.map((product) => (
                  <div
                    key={product.id}
                    className={`bg-white border rounded-lg p-4 ${
                      product.hidden
                        ? "bg-gray-50 border-gray-300"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProducts((prev) => [
                              ...prev,
                              product.id,
                            ]);
                          } else {
                            setSelectedProducts((prev) =>
                              prev.filter((id) => id !== product.id)
                            );
                          }
                        }}
                        className="rounded border-gray-300 mt-1"
                      />

                      <Image
                        src={product.image || "/images/place-holder.png"}
                        alt={product.name}
                        width={64}
                        height={64}
                        className={`w-16 h-16 object-cover rounded border ${
                          product.hidden ? "grayscale" : ""
                        }`}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/images/place-holder.png";
                        }}
                      />

                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="text-left w-full mb-2"
                        >
                          <h3 className="font-semibold text-gray-900 text-sm truncate hover:text-blue-600 transition-colors">
                            {product.name}
                          </h3>
                        </button>

                        {product.description && (
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                            {product.description}
                          </p>
                        )}

                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
                          <div>
                            <span className="font-medium">Price:</span>{" "}
                            {formatPrice(product.price)}
                          </div>
                          <div>
                            <span className="font-medium">Deposit:</span>{" "}
                            {formatPrice(product.deposit)}
                          </div>
                          <div className="col-span-2">
                            <span className="font-medium">Stock:</span>{" "}
                            {product.stock === "" ? "Unlimited" : product.stock}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleToggleProductVisibility(product.id)
                            }
                            className={`flex-1 px-3 py-2 text-xs font-medium rounded transition-colors touch-manipulation ${
                              product.hidden
                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                : "bg-orange-100 text-orange-700 hover:bg-orange-200"
                            }`}
                          >
                            {product.hidden ? "Show" : "Hide"}
                          </button>

                          <button
                            onClick={() => handleEditProduct(product)}
                            className="px-3 py-2 text-xs font-medium bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors touch-manipulation"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Add Product Modal */}
        <AddProductModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAddProduct={handleAddProduct}
        />

        {/* Edit Product Modal */}
        <EditProductModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingProduct(null);
          }}
          onUpdateProduct={handleUpdateProduct}
          product={editingProduct}
        />

        {/* Import Products Modal */}
        <ImportProductsModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImportProducts={handleImportProducts}
          existingProducts={products}
        />
      </div>
    </div>
  );
}
