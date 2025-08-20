// React Query integration for better caching and state management
// This provides an alternative to the custom hooks with better caching

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { apiClient } from './client';
import { handleApiError } from './errors';
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

// Query keys for consistent caching
export const queryKeys = {
  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: (params?: ProductQueryParams) => [...queryKeys.products.lists(), params] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.products.details(), id] as const,
    search: (query: string) => [...queryKeys.products.all, 'search', query] as const,
    categories: () => [...queryKeys.products.all, 'categories'] as const,
  },
  orders: {
    all: ['orders'] as const,
    lists: () => [...queryKeys.orders.all, 'list'] as const,
    list: (params?: OrderQueryParams) => [...queryKeys.orders.lists(), params] as const,
    details: () => [...queryKeys.orders.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.orders.details(), id] as const,
    byTerminal: (terminalId: string) => [...queryKeys.orders.all, 'terminal', terminalId] as const,
    summary: (startDate: string, endDate: string) => [...queryKeys.orders.all, 'summary', startDate, endDate] as const,
  },
  posTerminals: {
    all: ['posTerminals'] as const,
    lists: () => [...queryKeys.posTerminals.all, 'list'] as const,
    list: (activeOnly?: boolean) => [...queryKeys.posTerminals.lists(), activeOnly] as const,
    details: () => [...queryKeys.posTerminals.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.posTerminals.details(), id] as const,
    config: (id: string) => [...queryKeys.posTerminals.all, 'config', id] as const,
    stats: (id: string, days?: number) => [...queryKeys.posTerminals.all, 'stats', id, days] as const,
  },
} as const;

// =============================================
// PRODUCT QUERIES
// =============================================

export const useProductsQuery = (
  params?: ProductQueryParams,
  options?: UseQueryOptions<PaginatedResponse<Product>>
) => {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: () => apiClient.getProducts(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export const useProductQuery = (
  id: string | null,
  options?: UseQueryOptions<Product>
) => {
  return useQuery({
    queryKey: queryKeys.products.detail(id!),
    queryFn: () => apiClient.getProductById(id!),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

export const useProductSearchQuery = (
  query: string,
  limit?: number,
  options?: UseQueryOptions<PaginatedResponse<Product>>
) => {
  return useQuery({
    queryKey: queryKeys.products.search(query),
    queryFn: () => apiClient.searchProducts(query, limit),
    enabled: query.length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

export const useProductCategoriesQuery = (
  options?: UseQueryOptions<string[]>
) => {
  return useQuery({
    queryKey: queryKeys.products.categories(),
    queryFn: () => apiClient.getProductCategories(),
    staleTime: 30 * 60 * 1000, // 30 minutes
    ...options,
  });
};

// =============================================
// PRODUCT MUTATIONS
// =============================================

export const useCreateProductMutation = (
  options?: UseMutationOptions<Product, Error, CreateProductRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (product: CreateProductRequest) => apiClient.createProduct(product),
    onSuccess: () => {
      // Invalidate and refetch products
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
    onError: (error) => {
      console.error('Create product error:', handleApiError(error));
    },
    ...options,
  });
};

export const useUpdateProductMutation = (
  options?: UseMutationOptions<Product, Error, { id: string; product: UpdateProductRequest }>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, product }) => apiClient.updateProduct(id, product),
    onSuccess: (data, { id }) => {
      // Update the specific product in cache
      queryClient.setQueryData(queryKeys.products.detail(id), data);
      // Invalidate product lists
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
    },
    onError: (error) => {
      console.error('Update product error:', handleApiError(error));
    },
    ...options,
  });
};

export const useDeleteProductMutation = (
  options?: UseMutationOptions<void, Error, string>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.deleteProduct(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.products.detail(id) });
      // Invalidate product lists
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
    },
    onError: (error) => {
      console.error('Delete product error:', handleApiError(error));
    },
    ...options,
  });
};

// =============================================
// ORDER QUERIES
// =============================================

export const useOrdersQuery = (
  params?: OrderQueryParams,
  options?: UseQueryOptions<PaginatedResponse<OrderWithItems>>
) => {
  return useQuery({
    queryKey: queryKeys.orders.list(params),
    queryFn: () => apiClient.getOrders(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

export const useOrderQuery = (
  id: string | null,
  options?: UseQueryOptions<OrderWithItems>
) => {
  return useQuery({
    queryKey: queryKeys.orders.detail(id!),
    queryFn: () => apiClient.getOrderById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export const useOrdersByTerminalQuery = (
  terminalId: string,
  params?: OrderQueryParams,
  options?: UseQueryOptions<PaginatedResponse<OrderWithItems>>
) => {
  return useQuery({
    queryKey: queryKeys.orders.byTerminal(terminalId),
    queryFn: () => apiClient.getOrdersByTerminal(terminalId, params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

export const useSalesSummaryQuery = (
  startDate: string,
  endDate: string,
  options?: UseQueryOptions<any>
) => {
  return useQuery({
    queryKey: queryKeys.orders.summary(startDate, endDate),
    queryFn: () => apiClient.getSalesSummary(startDate, endDate),
    enabled: !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// =============================================
// ORDER MUTATIONS
// =============================================

export const useCreateOrderMutation = (
  options?: UseMutationOptions<OrderWithItems, Error, CreateOrderRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (order: CreateOrderRequest) => apiClient.createOrder(order),
    onSuccess: () => {
      // Invalidate orders and related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all }); // Stock might have changed
    },
    onError: (error) => {
      console.error('Create order error:', handleApiError(error));
    },
    ...options,
  });
};

// =============================================
// POS TERMINAL QUERIES
// =============================================

export const usePOSTerminalsQuery = (
  activeOnly?: boolean,
  options?: UseQueryOptions<POSTerminal[]>
) => {
  return useQuery({
    queryKey: queryKeys.posTerminals.list(activeOnly),
    queryFn: () => apiClient.getPOSTerminals(activeOnly),
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

export const usePOSTerminalQuery = (
  id: string | null,
  options?: UseQueryOptions<POSTerminal>
) => {
  return useQuery({
    queryKey: queryKeys.posTerminals.detail(id!),
    queryFn: () => apiClient.getPOSTerminalById(id!),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

export const usePOSTerminalStatsQuery = (
  id: string | null,
  days?: number,
  options?: UseQueryOptions<any>
) => {
  return useQuery({
    queryKey: queryKeys.posTerminals.stats(id!, days),
    queryFn: () => apiClient.getPOSTerminalStats(id!, days),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// =============================================
// POS TERMINAL MUTATIONS
// =============================================

export const useCreatePOSTerminalMutation = (
  options?: UseMutationOptions<POSTerminal, Error, CreatePOSTerminalRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (terminal: CreatePOSTerminalRequest) => apiClient.createPOSTerminal(terminal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posTerminals.all });
    },
    onError: (error) => {
      console.error('Create POS terminal error:', handleApiError(error));
    },
    ...options,
  });
};

export const useUpdatePOSTerminalMutation = (
  options?: UseMutationOptions<POSTerminal, Error, { id: string; terminal: UpdatePOSTerminalRequest }>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, terminal }) => apiClient.updatePOSTerminal(id, terminal),
    onSuccess: (data, { id }) => {
      queryClient.setQueryData(queryKeys.posTerminals.detail(id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.posTerminals.lists() });
    },
    onError: (error) => {
      console.error('Update POS terminal error:', handleApiError(error));
    },
    ...options,
  });
};

export const useDeletePOSTerminalMutation = (
  options?: UseMutationOptions<void, Error, string>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.deletePOSTerminal(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.posTerminals.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.posTerminals.lists() });
    },
    onError: (error) => {
      console.error('Delete POS terminal error:', handleApiError(error));
    },
    ...options,
  });
};