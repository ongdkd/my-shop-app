import { useState, useEffect, useCallback } from 'react';
import { apiClient } from './client';
import { handleApiError, withRetry, debounce } from './errors';
import { withNetworkRetry, withTerminalRetry, withProductRetry, getRetryMessage } from './retryUtils';
import {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  ProductQueryParams,
  OrderWithItems,
  CreateOrderRequest,
  OrderQueryParams,
  POSTerminal,
  CreatePOSTerminalRequest,
  UpdatePOSTerminalRequest,
  PaginatedResponse,
} from './types';

// Generic hook state interface
interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  retrying: boolean;
  retryCount: number;
}

interface PaginatedApiState<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null;
  loading: boolean;
  error: string | null;
  retrying: boolean;
  retryCount: number;
}

// =============================================
// PRODUCTS HOOKS
// =============================================

export const useProducts = (params?: ProductQueryParams) => {
  const [state, setState] = useState<PaginatedApiState<Product>>({
    data: [],
    pagination: null,
    loading: true,
    error: null,
    retrying: false,
    retryCount: 0,
  });

  const fetchProducts = useCallback(async (queryParams?: ProductQueryParams) => {
    setState(prev => ({ ...prev, loading: true, error: null, retrying: false, retryCount: 0 }));

    try {
      const response = await withProductRetry(() => apiClient.getProducts(queryParams));
      setState({
        data: response.data,
        pagination: response.pagination,
        loading: false,
        error: null,
        retrying: false,
        retryCount: 0,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: handleApiError(error),
        retrying: false,
      }));
    }
  }, []);

  const retryFetch = useCallback(async () => {
    setState(prev => ({ ...prev, retrying: true, error: null, retryCount: prev.retryCount + 1 }));
    
    try {
      const response = await withProductRetry(() => apiClient.getProducts(params));
      setState(prev => ({
        data: response.data,
        pagination: response.pagination,
        loading: false,
        error: null,
        retrying: false,
        retryCount: prev.retryCount,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: handleApiError(error),
        retrying: false,
      }));
    }
  }, [params]);

  useEffect(() => {
    fetchProducts(params);
  }, [fetchProducts, params]);

  const refetch = useCallback(() => fetchProducts(params), [fetchProducts, params]);

  return { ...state, refetch, fetchProducts, retry: retryFetch };
};

export const useProduct = (id: string | null) => {
  const [state, setState] = useState<ApiState<Product>>({
    data: null,
    loading: false,
    error: null,
    retrying: false,
    retryCount: 0,
  });

  useEffect(() => {
    if (!id) {
      setState({ data: null, loading: false, error: null, retrying: false, retryCount: 0 });
      return;
    }

    const fetchProduct = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const product = await apiClient.getProductById(id);
        setState({ data: product, loading: false, error: null, retrying: false, retryCount: 0 });
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: handleApiError(error),
        }));
      }
    };

    fetchProduct();
  }, [id]);

  return state;
};

export const useProductSearch = () => {
  const [state, setState] = useState<PaginatedApiState<Product>>({
    data: [],
    pagination: null,
    loading: false,
    error: null,
    retrying: false,
    retryCount: 0,
  });

  const search = useCallback(
    debounce(async (query: string, limit?: number) => {
      if (!query.trim()) {
        setState({ data: [], pagination: null, loading: false, error: null, retrying: false, retryCount: 0 });
        return;
      }

      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const response = await apiClient.searchProducts(query, limit);
        setState({
          data: response.data,
          pagination: response.pagination,
          loading: false,
          error: null,
          retrying: false,
          retryCount: 0,
        });
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: handleApiError(error),
        }));
      }
    }, 300),
    []
  );

  return { ...state, search };
};

export const useProductMutations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProduct = useCallback(async (product: CreateProductRequest): Promise<Product | null> => {
    setLoading(true);
    setError(null);

    try {
      const newProduct = await apiClient.createProduct(product);
      setLoading(false);
      return newProduct;
    } catch (error) {
      setLoading(false);
      setError(handleApiError(error));
      return null;
    }
  }, []);

  const updateProduct = useCallback(async (id: string, product: UpdateProductRequest): Promise<Product | null> => {
    setLoading(true);
    setError(null);

    try {
      const updatedProduct = await apiClient.updateProduct(id, product);
      setLoading(false);
      return updatedProduct;
    } catch (error) {
      setLoading(false);
      setError(handleApiError(error));
      return null;
    }
  }, []);

  const deleteProduct = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await apiClient.deleteProduct(id);
      setLoading(false);
      return true;
    } catch (error) {
      setLoading(false);
      setError(handleApiError(error));
      return false;
    }
  }, []);

  return {
    createProduct,
    updateProduct,
    deleteProduct,
    loading,
    error,
  };
};

// =============================================
// ORDERS HOOKS
// =============================================

export const useOrders = (params?: OrderQueryParams) => {
  const [state, setState] = useState<PaginatedApiState<OrderWithItems>>({
    data: [],
    pagination: null,
    loading: true,
    error: null,
    retrying: false,
    retryCount: 0,
  });

  const fetchOrders = useCallback(async (queryParams?: OrderQueryParams) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await withRetry(() => apiClient.getOrders(queryParams));
      setState({
        data: response.data,
        pagination: response.pagination,
        loading: false,
        error: null,
        retrying: false,
        retryCount: 0,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: handleApiError(error),
      }));
    }
  }, []);

  useEffect(() => {
    fetchOrders(params);
  }, [fetchOrders, params]);

  const refetch = useCallback(() => fetchOrders(params), [fetchOrders, params]);

  return { ...state, refetch, fetchOrders };
};

export const useOrder = (id: string | null) => {
  const [state, setState] = useState<ApiState<OrderWithItems>>({
    data: null,
    loading: false,
    error: null,
    retrying: false,
    retryCount: 0,
  });

  useEffect(() => {
    if (!id) {
      setState({ data: null, loading: false, error: null, retrying: false, retryCount: 0 });
      return;
    }

    const fetchOrder = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const order = await apiClient.getOrderById(id);
        setState({ data: order, loading: false, error: null, retrying: false, retryCount: 0 });
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: handleApiError(error),
        }));
      }
    };

    fetchOrder();
  }, [id]);

  return state;
};

export const useCreateOrder = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrder = useCallback(async (order: CreateOrderRequest): Promise<OrderWithItems | null> => {
    setLoading(true);
    setError(null);

    try {
      const newOrder = await apiClient.createOrder(order);
      setLoading(false);
      return newOrder;
    } catch (error) {
      setLoading(false);
      setError(handleApiError(error));
      return null;
    }
  }, []);

  return { createOrder, loading, error };
};

// =============================================
// POS TERMINALS HOOKS
// =============================================

export const usePOSTerminals = (activeOnly?: boolean) => {
  const [state, setState] = useState<ApiState<POSTerminal[]>>({
    data: null,
    loading: true,
    error: null,
    retrying: false,
    retryCount: 0,
  });

  const fetchTerminals = useCallback(async (active?: boolean) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const terminals = await withRetry(() => apiClient.getPOSTerminals(active));
      setState({ data: terminals, loading: false, error: null, retrying: false, retryCount: 0 });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: handleApiError(error),
      }));
    }
  }, []);

  useEffect(() => {
    fetchTerminals(activeOnly);
  }, [fetchTerminals, activeOnly]);

  const refetch = useCallback(() => fetchTerminals(activeOnly), [fetchTerminals, activeOnly]);

  return { ...state, refetch, fetchTerminals };
};

export const usePOSTerminal = (id: string | null) => {
  const [state, setState] = useState<ApiState<POSTerminal>>({
    data: null,
    loading: false,
    error: null,
    retrying: false,
    retryCount: 0,
  });

  const fetchTerminal = useCallback(async () => {
    if (!id) {
      setState({ data: null, loading: false, error: null, retrying: false, retryCount: 0 });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null, retrying: false, retryCount: 0 }));

    try {
      const terminal = await withTerminalRetry(() => apiClient.getPOSTerminalById(id));
      setState({ data: terminal, loading: false, error: null, retrying: false, retryCount: 0 });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: handleApiError(error),
        retrying: false,
      }));
    }
  }, [id]);

  const retryFetch = useCallback(async () => {
    if (!id) return;

    setState(prev => ({ ...prev, retrying: true, error: null, retryCount: prev.retryCount + 1 }));
    
    try {
      const terminal = await withTerminalRetry(() => apiClient.getPOSTerminalById(id));
      setState(prev => ({
        data: terminal,
        loading: false,
        error: null,
        retrying: false,
        retryCount: prev.retryCount,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: handleApiError(error),
        retrying: false,
      }));
    }
  }, [id]);

  useEffect(() => {
    fetchTerminal();
  }, [fetchTerminal]);

  return { ...state, refetch: fetchTerminal, retry: retryFetch };
};

export const usePOSTerminalMutations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTerminal = useCallback(async (terminal: CreatePOSTerminalRequest): Promise<POSTerminal | null> => {
    setLoading(true);
    setError(null);

    try {
      const newTerminal = await apiClient.createPOSTerminal(terminal);
      setLoading(false);
      return newTerminal;
    } catch (error) {
      setLoading(false);
      setError(handleApiError(error));
      return null;
    }
  }, []);

  const updateTerminal = useCallback(async (id: string, terminal: UpdatePOSTerminalRequest): Promise<POSTerminal | null> => {
    setLoading(true);
    setError(null);

    try {
      const updatedTerminal = await apiClient.updatePOSTerminal(id, terminal);
      setLoading(false);
      return updatedTerminal;
    } catch (error) {
      setLoading(false);
      setError(handleApiError(error));
      return null;
    }
  }, []);

  const deleteTerminal = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await apiClient.deletePOSTerminal(id);
      setLoading(false);
      return true;
    } catch (error) {
      setLoading(false);
      setError(handleApiError(error));
      return false;
    }
  }, []);

  return {
    createTerminal,
    updateTerminal,
    deleteTerminal,
    loading,
    error,
  };
};

// Hook for fetching terminal products
export const useTerminalProducts = (terminalId: string | null) => {
  const [state, setState] = useState<ApiState<Product[]>>({
    data: null,
    loading: false,
    error: null,
    retrying: false,
    retryCount: 0,
  });

  const fetchProducts = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, loading: true, error: null, retrying: false, retryCount: 0 }));

    try {
      const products = await withTerminalRetry(() => apiClient.getTerminalProducts(id));
      setState({ data: products, loading: false, error: null, retrying: false, retryCount: 0 });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: handleApiError(error),
        retrying: false,
      }));
    }
  }, []);

  const retryFetch = useCallback(async () => {
    if (!terminalId) return;

    setState(prev => ({ ...prev, retrying: true, error: null, retryCount: prev.retryCount + 1 }));
    
    try {
      const products = await withTerminalRetry(() => apiClient.getTerminalProducts(terminalId));
      setState(prev => ({
        data: products,
        loading: false,
        error: null,
        retrying: false,
        retryCount: prev.retryCount,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: handleApiError(error),
        retrying: false,
      }));
    }
  }, [terminalId]);

  useEffect(() => {
    if (!terminalId) {
      setState({ data: null, loading: false, error: null, retrying: false, retryCount: 0 });
      return;
    }

    fetchProducts(terminalId);
  }, [terminalId, fetchProducts]);

  const refetch = useCallback(() => {
    if (terminalId) {
      fetchProducts(terminalId);
    }
  }, [terminalId, fetchProducts]);

  return { ...state, refetch, retry: retryFetch };
};

// Hook for managing terminal product assignments
export const useTerminalProductMutations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assignProducts = useCallback(async (terminalId: string, productIds: string[]): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await apiClient.assignProductsToTerminal(terminalId, productIds);
      setLoading(false);
      return true;
    } catch (error) {
      setLoading(false);
      setError(handleApiError(error));
      return false;
    }
  }, []);

  const removeProducts = useCallback(async (terminalId: string, productIds: string[]): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await apiClient.removeProductsFromTerminal(terminalId, productIds);
      setLoading(false);
      return true;
    } catch (error) {
      setLoading(false);
      setError(handleApiError(error));
      return false;
    }
  }, []);

  return {
    assignProducts,
    removeProducts,
    loading,
    error,
  };
};

// Combined hook for terminal with products (useful for POS pages)
export const usePOSTerminalWithProducts = (terminalId: string | null) => {
  const terminalState = usePOSTerminal(terminalId);
  const productsState = useTerminalProducts(terminalId);

  const refetchAll = useCallback(async () => {
    if (terminalId) {
      await Promise.all([
        terminalState.refetch(),
        productsState.refetch(),
      ]);
    }
  }, [terminalId, terminalState.refetch, productsState.refetch]);

  const retryAll = useCallback(async () => {
    if (terminalId) {
      await Promise.all([
        terminalState.retry(),
        productsState.retry(),
      ]);
    }
  }, [terminalId, terminalState.retry, productsState.retry]);

  return {
    terminal: terminalState.data,
    products: productsState.data || [],
    loading: terminalState.loading || productsState.loading,
    error: terminalState.error || productsState.error,
    retrying: terminalState.retrying || productsState.retrying,
    retryCount: Math.max(terminalState.retryCount, productsState.retryCount),
    terminalNotFound: terminalState.error?.includes('not found') || false,
    terminalInactive: terminalState.data && !terminalState.data.is_active,
    refetch: refetchAll,
    retry: retryAll,
  };
};

// Hook for querying terminals (with search/filter capabilities)
export const usePOSTerminalsQuery = (params?: { active?: boolean; search?: string }) => {
  const [state, setState] = useState<ApiState<POSTerminal[]>>({
    data: null,
    loading: true,
    error: null,
    retrying: false,
    retryCount: 0,
  });

  const fetchTerminals = useCallback(async (queryParams?: { active?: boolean; search?: string }) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const terminals = await withRetry(() => apiClient.getPOSTerminals(queryParams?.active));
      
      // Apply search filter if provided
      let filteredTerminals = terminals;
      if (queryParams?.search) {
        const searchTerm = queryParams.search.toLowerCase();
        filteredTerminals = terminals.filter(terminal => 
          terminal.terminal_name.toLowerCase().includes(searchTerm) ||
          terminal.location?.toLowerCase().includes(searchTerm) ||
          terminal.id.toLowerCase().includes(searchTerm)
        );
      }

      setState({ data: filteredTerminals, loading: false, error: null, retrying: false, retryCount: 0 });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: handleApiError(error),
      }));
    }
  }, []);

  useEffect(() => {
    fetchTerminals(params);
  }, [fetchTerminals, params]);

  const refetch = useCallback(() => fetchTerminals(params), [fetchTerminals, params]);

  return { ...state, refetch, fetchTerminals };
};

// =============================================
// AUTHENTICATION HOOKS
// =============================================

// Note: This hook is deprecated. Use the AuthContext instead.
// Keeping for backward compatibility during migration.
export const useAuth = () => {
  const [user, setUser] = useState(apiClient.getCurrentUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.login({ email, password });
      setUser(response.user);
      setLoading(false);
      return true;
    } catch (error) {
      setLoading(false);
      setError(handleApiError(error));
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    
    try {
      await apiClient.logout();
    } catch (error) {
      console.warn('Logout error:', error);
    } finally {
      setUser(null);
      setLoading(false);
    }
  }, []);

  const isAuthenticated = useCallback(() => {
    return apiClient.isAuthenticated() && user !== null;
  }, [user]);

  return {
    user,
    login,
    logout,
    isAuthenticated,
    loading,
    error,
  };
};