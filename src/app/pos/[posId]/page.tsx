"use client";

import React, { useEffect, useState } from "react";
import { getProductsByPosId } from "@/lib/products";
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
  const [posId, setPosId] = useState<string>("");

  useEffect(() => {
    const loadData = async () => {
      const resolvedParams = await params;
      const { posId: resolvedPosId } = resolvedParams;
      setPosId(resolvedPosId);

      const productsData = await getProductsByPosId(resolvedPosId);
      setProducts(productsData);
      setLoading(false);
    };

    loadData();
  }, [params]);

  useEffect(() => {
    if (!posId) return;

    // Function to reload products
    const reloadProducts = async () => {
      const productsData = await getProductsByPosId(posId);
      setProducts(productsData);
    };

    // Listen for storage changes (when admin updates products)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "products-data" || e.key === "pos-product-mappings") {
        reloadProducts();
      }
    };

    // Listen for custom product update events
    const handleProductUpdate = () => {
      reloadProducts();
    };

    // Listen for focus events (when user returns to tab)
    const handleFocus = () => {
      reloadProducts();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("productUpdated", handleProductUpdate);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("productUpdated", handleProductUpdate);
      window.removeEventListener("focus", handleFocus);
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

  if (!products) {
    return notFound();
  }

  return <POSClient products={products} posId={posId} />;
}
