"use client";

import React, { useEffect, useState } from "react";
import { usePOSTerminalWithProducts } from "@/lib/api";
import { apiProductToOldProduct } from "@/lib/api/adapters";
import POSClient from "@/components/POSClient";
import { notFound } from "next/navigation";
import { Product } from "@/types";
import { POSTerminal } from "@/lib/api/types";
import { FullPageLoading } from "@/components/LoadingSpinner";
import { FullPageError } from "@/components/ErrorDisplay";
import { useTerminalRealTimeUpdates } from "@/lib/realtime/hooks";

export default function POSPage({
  params,
}: {
  params: Promise<{ posId: string }>;
}) {
  const [posId, setPosId] = useState<string>("");
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize posId from params
  useEffect(() => {
    const initializePosId = async () => {
      const resolvedParams = await params;
      setPosId(resolvedParams.posId);
      setIsInitialized(true);
    };
    initializePosId();
  }, [params]);

  // Use the enhanced hook for terminal and products data
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
  } = usePOSTerminalWithProducts(isInitialized ? posId : null);

  // Set up real-time updates using the custom hook
  useTerminalRealTimeUpdates(
    posId,
    refetch,
    {
      enablePolling: true,
      pollingInterval: 30000, // 30 seconds
      enableFocusRefresh: true,
    }
  );

  // Show loading state
  if (!isInitialized || loading) {
    return (
      <FullPageLoading 
        text={retrying ? `Retrying connection... (${retryCount}/3)` : "Loading terminal data..."} 
      />
    );
  }

  // Handle terminal not found case
  if (terminalNotFound) {
    return (
      <FullPageError
        title="POS Terminal Not Found"
        message={`The POS terminal with ID "${posId}" could not be found. It may have been removed or the ID is incorrect.`}
        type="not-found"
        onRetry={retry}
        onBack={() => window.location.href = '/pos'}
        backText="View All Terminals"
        retryText="Try Again"
      />
    );
  }

  // Handle terminal inactive case
  if (terminalInactive) {
    return (
      <FullPageError
        title="Terminal Offline"
        message="This POS terminal is currently offline. Please contact your administrator to activate it."
        type="warning"
        onRetry={retry}
        onBack={() => window.location.href = '/pos'}
        backText="Back to Terminals"
        retryText="Check Status"
      />
    );
  }

  // Handle other errors
  if (error) {
    const isNetworkError = error.includes('Network') || error.includes('connection');
    
    return (
      <FullPageError
        title={isNetworkError ? "Connection Error" : "Unable to Load Data"}
        message={error}
        type={isNetworkError ? "network" : "error"}
        onRetry={retry}
        onBack={() => window.location.href = '/pos'}
        backText="Back to Terminals"
        retryText={retrying ? `Retrying... (${retryCount}/3)` : "Try Again"}
      />
    );
  }

  // Ensure we have required data
  if (!terminal || !products) {
    return notFound();
  }

  // Convert API products to old format for POSClient compatibility
  const convertedProducts = products.map(apiProductToOldProduct);

  return <POSClient products={convertedProducts} posId={posId} terminal={terminal} />;
}
