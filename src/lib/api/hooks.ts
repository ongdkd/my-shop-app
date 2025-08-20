import { useState, useEffect, useCallback } from 'react';
import { apiClient } from './client';
import { handleApiError, withRetry, debounce } from './errors';
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
  });

  const fetchProducts = useCallback(async (queryParams?: ProductQueryParams) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await withRetry(() => apiClient.getProducts(queryParams));
      setState({
        data: response.data,
        pagination: response.pagination,
        loading: false,
        error: null,
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
    fetchProducts(params);
  }, [fetchProducts, params]);

  const refetch = useCallback(() => fetchProducts(params), [fetchProducts, params]);

  return { ...state, refetch, fetchProducts };
};

export const useProduct = (id: string | null) => {
  const [state, setState] = useState<ApiState<Product>>({
    data: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!id) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    const fetchProduct = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const product = await apiClient.getProductById(id);
        setState({ data: product, loading: false, error: null });
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
  });

  const search = useCallback(
    debounce(async (query: string, limit?: number) => {
      if (!query.trim()) {
        setState({ data: [], pagination: null, loading: false, error: null });
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
  });

  useEffect(() => {
    if (!id) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    const fetchOrder = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const order = await apiClient.getOrderById(id);
        setState({ data: order, loading: false, error: null });
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
  });

  const fetchTerminals = useCallback(async (active?: boolean) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const terminals = await withRetry(() => apiClient.getPOSTerminals(active));
      setState({ data: terminals, loading: false, error: null });
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
  });

  useEffect(() => {
    if (!id) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    const fetchTerminal = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const terminal = await apiClient.getPOSTerminalById(id);
        setState({ data: terminal, loading: false, error: null });
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: handleApiError(error),
        }));
      }
    };

    fetchTerminal();
  }, [id]);

  return state;
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