// Main API exports - everything you need to work with the API

// Client
export { ApiClient, apiClient } from './client';

// Types
export type {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  ProductQueryParams,
  Order,
  OrderWithItems,
  OrderItem,
  CreateOrderRequest,
  OrderQueryParams,
  POSTerminal,
  CreatePOSTerminalRequest,
  UpdatePOSTerminalRequest,
  User,
  LoginRequest,
  LoginResponse,
  ApiResponse,
  PaginatedResponse,
  ApiError,
} from './types';

// Custom Hooks (for projects not using React Query)
export {
  useProducts,
  useProduct,
  useProductSearch,
  useProductMutations,
  useOrders,
  useOrder,
  useCreateOrder,
  usePOSTerminals,
  usePOSTerminal,
  usePOSTerminalMutations,
  useAuth,
} from './hooks';

// React Query Hooks (recommended for better caching)
export {
  queryKeys,
  useProductsQuery,
  useProductQuery,
  useProductSearchQuery,
  useProductCategoriesQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useOrdersQuery,
  useOrderQuery,
  useOrdersByTerminalQuery,
  useSalesSummaryQuery,
  useCreateOrderMutation,
  usePOSTerminalsQuery,
  usePOSTerminalQuery,
  usePOSTerminalStatsQuery,
  useCreatePOSTerminalMutation,
  useUpdatePOSTerminalMutation,
  useDeletePOSTerminalMutation,
} from './queries';

// Configuration
export {
  getApiConfig,
  API_ENDPOINTS,
  HTTP_STATUS,
  TIMEOUTS,
  CACHE_KEYS,
  CACHE_TIMES,
} from './config';

// Interceptors
export {
  defaultRequestInterceptor,
  defaultResponseInterceptor,
  loggingInterceptor,
  performanceInterceptor,
  retryInterceptor,
  cacheInterceptor,
  cache,
} from './interceptors';

// Error handling
export {
  handleApiError,
  isAuthError,
  isNetworkError,
  isValidationError,
  withRetry,
  debounce,
} from './errors';

// Adapters (if needed for data transformation)
export {
  apiProductToOldProduct,
  oldProductToApiCreateRequest,
  oldProductToApiUpdateRequest,
  apiPosTerminalToOldPosTerminal,
  oldPosTerminalToApiCreateRequest,
  oldPosTerminalToApiUpdateRequest,
  cartItemsToApiOrderRequest,
  apiOrderToOldOrder,
  stringToPaymentMethod,
  formatCurrency,
  formatDateForApi,
  parseApiDate,
} from './adapters';

// Offline support
export {
  useOnlineStatus,
  useOfflineQueue,
  withOfflineSupport,
  offlineStorage,
} from './offline';