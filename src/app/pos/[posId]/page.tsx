"use client";

import React from "react";
import { usePOSTerminalWithProducts } from "@/lib/api";
import { apiProductToOldProduct } from "@/lib/api/adapters";
import POSClient from "@/components/POSClient";
import { notFound } from "next/navigation";
import { FullPageLoading } from "@/components/LoadingSpinner";
import { FullPageError } from "@/components/ErrorDisplay";
import { useTerminalRealTimeUpdates } from "@/lib/realtime/hooks";

export default function POSPage({
  params,
}: {
  params: { posId: string };
}) {
  const posId = params.posId;

  // Fetch terminal + products
  const {
    terminal,
    products,
    loading,
    error,
    retrying,
    retryCount,
    terminalNotFound,
    terminalInactive,
    refetch,
    retry,
  } = usePOSTerminalWithProducts(posId);

  // Real-time updates
  useTerminalRealTimeUpdates(posId, refetch, {
    enablePolling: true,
    pollingInterval: 30000, // 30s
    enableFocusRefresh: true,
  });

  // Loading state
  if (loading) {
    return (
      <FullPageLoading
        text={
          retrying
            ? `Retrying connection... (${retryCount}/3)`
            : "Loading terminal data..."
        }
      />
    );
  }

  // Terminal not found
  if (terminalNotFound) {
    return (
      <FullPageError
        title="POS Terminal Not Found"
        message={`The POS terminal with ID "${posId}" could not be found. It may have been removed or the ID is incorrect.`}
        type="not-found"
        onRetry={retry}
        onBack={() => (window.location.href = "/pos")}
        backText="View All Terminals"
        retryText="Try Again"
      />
    );
  }

  // Terminal inactive
  if (terminalInactive) {
    return (
      <FullPageError
        title="Terminal Offline"
        message="This POS terminal is currently offline. Please contact your administrator to activate it."
        type="warning"
        onRetry={retry}
        onBack={() => (window.location.href = "/pos")}
        backText="Back to Terminals"
        retryText="Check Status"
      />
    );
  }

  // Generic error
  if (error) {
    const isNetworkError =
      error.includes("Network") || error.includes("connection");

    return (
      <FullPageError
        title={isNetworkError ? "Connection Error" : "Unable to Load Data"}
        message={error}
        type={isNetworkError ? "network" : "error"}
        onRetry={retry}
        onBack={() => (window.location.href = "/pos")}
        backText="Back to Terminals"
        retryText={retrying ? `Retrying... (${retryCount}/3)` : "Try Again"}
      />
    );
  }

  // No data
  if (!terminal || !products) {
    return notFound();
  }

  // Convert API products to client format
  const convertedProducts = products.map(apiProductToOldProduct);

  return (
    <POSClient
      products={convertedProducts}
      posId={posId}
      terminal={terminal}
    />
  );
}
