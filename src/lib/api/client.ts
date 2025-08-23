import {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  ProductQueryParams,
  Order,
  OrderWithItems,
  CreateOrderRequest,
  OrderQueryParams,
  POSTerminal,
  CreatePOSTerminalRequest,
  UpdatePOSTerminalRequest,
  ApiResponse,
  PaginatedResponse,
  ApiError,
  LoginRequest,
  LoginResponse,
  User,
} from "./types";
import {
  FormValidator,
  PRODUCT_VALIDATION_SCHEMA,
  ORDER_VALIDATION_SCHEMA,
  LOGIN_VALIDATION_SCHEMA,
} from "../validation";
import { supabase, authHelpers } from "../supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export class ApiClient {
  private baseURL: string;
  private authToken?: string;

  constructor(baseURL?: string) {
    this.baseURL =
      baseURL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    // Load token from localStorage if available
    if (typeof window !== 'undefined') {
      this.authToken = localStorage.getItem('auth_token') || undefined;
    }
  }

  private async initializeAuthToken(): Promise<void> {
    if (typeof window !== "undefined") {
      try {
        const session = await authHelpers.getSession();
        if (session?.access_token) {
          this.authToken = session.access_token;
        }
      } catch (error) {
        console.warn("Failed to initialize auth token:", error);
      }
    }
  }

  // =============================================
  // AUTHENTICATION METHODS
  // =============================================

  setAuthToken(token: string): void {
    this.authToken = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token);
    }
  }

  clearAuthToken(): void {
    this.authToken = undefined;
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
    }
  }

  getAuthToken(): string | undefined {
    return this.authToken;
  }

  isAuthenticated(): boolean {
    return !!this.authToken;
  }

  getBaseURL(): string {
    return this.baseURL;
  }

  // =============================================
  // HTTP HELPER METHODS
  // =============================================

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    // Ensure we have the latest auth token
    await this.ensureValidToken();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    // Add auth token if available
    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);

      // Handle authentication errors with automatic token refresh
      if (response.status === 401) {
        console.log("Authentication failed, attempting token refresh...");
        const refreshSuccess = await this.refreshAuth();

        if (refreshSuccess) {
          // Retry the request with the new token
          headers.Authorization = `Bearer ${this.authToken}`;
          const retryConfig: RequestInit = {
            ...options,
            headers,
          };

          const retryResponse = await fetch(url, retryConfig);

          if (retryResponse.status === 204) {
            return {} as T;
          }

          const retryData = await retryResponse.json();

          if (!retryResponse.ok) {
            throw new ApiError(
              retryData.error?.code || "API_ERROR",
              retryData.error?.message || "An error occurred",
              retryResponse.status,
              retryData.error?.details
            );
          }

          return retryData;
        } else {
          // Token refresh failed, throw authentication error
          throw new ApiError(
            "AUTHENTICATION_FAILED",
            "Authentication failed and token refresh was unsuccessful",
            401
          );
        }
      }

      // Handle different response types
      if (response.status === 204) {
        return {} as T; // No content
      }

      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          data.error?.code || "API_ERROR",
          data.error?.message || "An error occurred",
          response.status,
          data.error?.details
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        // Log authentication-related errors for debugging
        if (error.status === 401 || error.code === "AUTHENTICATION_FAILED") {
          console.error("Authentication error in API request:", {
            endpoint,
            error: error.message,
            hasToken: !!this.authToken,
            timestamp: new Date().toISOString(),
          });
        }
        throw error;
      }

      // Network or other errors
      console.error("Network error in API request:", {
        endpoint,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });

      throw new ApiError(
        "NETWORK_ERROR",
        error instanceof Error ? error.message : "Network error occurred"
      );
    }
  }

  private async ensureValidToken(): Promise<void> {
    if (typeof window === "undefined") return;

    try {
      const session = await authHelpers.getSession();
      if (session?.access_token) {
        // Check if token is about to expire (within 5 minutes)
        const expiresAt = session.expires_at
          ? new Date(session.expires_at * 1000)
          : null;
        const now = new Date();
        const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

        if (expiresAt && expiresAt < fiveMinutesFromNow) {
          console.log("Token expires soon, refreshing...");
          const refreshSuccess = await this.refreshAuth();
          if (!refreshSuccess) {
            console.warn("Token refresh failed, clearing token");
            this.authToken = undefined;
          }
        } else {
          this.authToken = session.access_token;
        }
      } else {
        this.authToken = undefined;
      }
    } catch (error) {
      console.warn("Failed to get current session:", error);
      this.authToken = undefined;
    }
  }

  private async get<T>(
    endpoint: string,
    params?: Record<string, any>
  ): Promise<T> {
    const url = new URL(`${this.baseURL}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return this.request<T>(url.pathname + url.search);
  }

  private async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  private async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  private async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  private async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: "DELETE",
    });
  }

  // =============================================
  // AUTHENTICATION API
  // =============================================

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    // Validate credentials before sending
    const validation = FormValidator.validate(
      credentials,
      LOGIN_VALIDATION_SCHEMA
    );
    if (!validation.isValid) {
      const errorMessage = Object.values(validation.errors).join(", ");
      throw new ApiError(
        "VALIDATION_ERROR",
        `Invalid credentials: ${errorMessage}`
      );
    }

    try {
      // Use Supabase authentication
      const authData = await authHelpers.signIn(
        credentials.email,
        credentials.password
      );

      if (!authData.user || !authData.session) {
        throw new ApiError("LOGIN_FAILED", "Authentication failed");
      }

      // Set the auth token for API requests
      this.setAuthToken(authData.session.access_token);

      // Store user info
      const user: User = {
        id: authData.user.id,
        email: authData.user.email || "",
        role: authHelpers.getUserRole(authData.user),
        name: authData.user.user_metadata?.name || authData.user.email || "",
        created_at: authData.user.created_at,
      };

      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(user));
      }

      return {
        user,
        token: authData.session.access_token,
        refreshToken: authData.session.refresh_token,
        expires_at:
          authData.session.expires_at?.toString() ||
          new Date(Date.now() + 3600000).toISOString(),
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        "LOGIN_FAILED",
        error instanceof Error ? error.message : "Login failed"
      );
    }
  }

  async logout(): Promise<void> {
    try {
      // Use Supabase authentication
      await authHelpers.signOut();
    } catch (error) {
      console.warn("Supabase logout failed:", error);
    } finally {
      // Clear local auth state
      this.clearAuthToken();
      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
      }
    }
  }

  getCurrentUser(): User | null {
    if (typeof window === "undefined") return null;

    try {
      const userStr = localStorage.getItem("user");
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  // Initialize authentication state from Supabase session
  async initializeAuth(): Promise<User | null> {
    try {
      const session = await authHelpers.getSession();

      if (session?.user && session?.access_token) {
        // Set the auth token for API requests
        this.setAuthToken(session.access_token);

        // Create user object
        const user: User = {
          id: session.user.id,
          email: session.user.email || "",
          role: authHelpers.getUserRole(session.user),
          name: session.user.user_metadata?.name || session.user.email || "",
          created_at: session.user.created_at,
        };

        // Store user info
        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(user));
        }

        return user;
      }

      return null;
    } catch (error) {
      console.warn("Failed to initialize auth:", error);
      return null;
    }
  }

  // Refresh authentication token
  async refreshAuth(): Promise<boolean> {
    try {
      const refreshData = await authHelpers.refreshSession();

      if (refreshData.session?.access_token) {
        this.setAuthToken(refreshData.session.access_token);
        return true;
      }

      return false;
    } catch (error) {
      console.warn("Failed to refresh auth:", error);
      return false;
    }
  }

  // =============================================
  // PRODUCTS API
  // =============================================

  async getProducts(
    params?: ProductQueryParams
  ): Promise<PaginatedResponse<Product>> {
    try {
      return await this.get<PaginatedResponse<Product>>(
        "/api/v1/products",
        params
      );
    } catch (error) {
      // Fallback to mock data when API is not available
      console.warn("API not available, using fallback products data");
      return this.getFallbackProducts(params);
    }
  }

  private getFallbackProducts(
    params?: ProductQueryParams
  ): PaginatedResponse<Product> {
    const fallbackProducts: Product[] = [
      {
        id: "1",
        name: "Sample Coffee",
        category: "Beverages",
        price: 4.99,
        stock_quantity: 50,
        barcode: "1234567890123",
        image_url: "/images/place-holder.png",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "2",
        name: "Sample Sandwich",
        category: "Food",
        price: 8.99,
        stock_quantity: 25,
        barcode: "2345678901234",
        image_url: "/images/place-holder.png",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "3",
        name: "Sample Pastry",
        category: "Food",
        price: 3.99,
        stock_quantity: 30,
        barcode: "3456789012345",
        image_url: "/images/place-holder.png",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    // Apply filters if provided
    let filteredProducts = fallbackProducts;

    if (params?.is_active !== undefined) {
      filteredProducts = filteredProducts.filter(
        (p) => p.is_active === params.is_active
      );
    }

    if (params?.category) {
      filteredProducts = filteredProducts.filter(
        (p) => p.category === params.category
      );
    }

    return {
      data: filteredProducts,
      pagination: {
        page: 1,
        limit: filteredProducts.length,
        total: filteredProducts.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
      success: true,
      timestamp: new Date().toISOString(),
    };
  }

  async getProductById(id: string): Promise<Product> {
    const response = await this.get<ApiResponse<Product>>(
      `/api/v1/products/${id}`
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new ApiError("PRODUCT_NOT_FOUND", "Product not found");
  }

  async getProductByBarcode(barcode: string): Promise<Product> {
    const response = await this.get<ApiResponse<Product>>(
      `/api/v1/products/barcode/${barcode}`
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new ApiError("PRODUCT_NOT_FOUND", "Product not found");
  }

  async searchProducts(
    query: string,
    limit?: number
  ): Promise<PaginatedResponse<Product>> {
    return this.get<PaginatedResponse<Product>>("/api/v1/products/search", {
      q: query,
      limit,
    });
  }

  async getProductCategories(): Promise<string[]> {
    const response = await this.get<ApiResponse<string[]>>(
      "/api/v1/products/categories"
    );

    if (response.success && response.data) {
      return response.data;
    }

    return [];
  }

  async createProduct(product: CreateProductRequest): Promise<Product> {
    // Validate product data before sending
    const validation = FormValidator.validate(
      product,
      PRODUCT_VALIDATION_SCHEMA
    );
    if (!validation.isValid) {
      const errorMessage = Object.values(validation.errors).join(", ");
      throw new ApiError(
        "VALIDATION_ERROR",
        `Invalid product data: ${errorMessage}`
      );
    }

    const response = await this.post<ApiResponse<Product>>(
      "/api/v1/products",
      product
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new ApiError("CREATE_FAILED", "Failed to create product");
  }

  async updateProduct(
    id: string,
    product: UpdateProductRequest
  ): Promise<Product> {
    const response = await this.put<ApiResponse<Product>>(
      `/api/v1/products/${id}`,
      product
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new ApiError("UPDATE_FAILED", "Failed to update product");
  }

  async deleteProduct(id: string): Promise<void> {
    await this.delete(`/api/v1/products/${id}`);
  }

  async bulkUpdateStock(
    updates: Array<{ id: string; stock_quantity: number }>
  ): Promise<any> {
    const response = await this.patch<ApiResponse<any>>(
      "/api/v1/products/bulk/stock",
      { updates }
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new ApiError("BULK_UPDATE_FAILED", "Failed to update stock");
  }

  // =============================================
  // ORDERS API
  // =============================================

  async getOrders(
    params?: OrderQueryParams
  ): Promise<PaginatedResponse<OrderWithItems>> {
    return this.get<PaginatedResponse<OrderWithItems>>(
      "/api/v1/orders",
      params
    );
  }

  async getOrderById(id: string): Promise<OrderWithItems> {
    const response = await this.get<ApiResponse<OrderWithItems>>(
      `/api/v1/orders/${id}`
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new ApiError("ORDER_NOT_FOUND", "Order not found");
  }

  async createOrder(order: CreateOrderRequest): Promise<OrderWithItems> {
    // Validate order data before sending
    const validation = FormValidator.validate(order, ORDER_VALIDATION_SCHEMA);
    if (!validation.isValid) {
      const errorMessage = Object.values(validation.errors).join(", ");
      throw new ApiError(
        "VALIDATION_ERROR",
        `Invalid order data: ${errorMessage}`
      );
    }

    const response = await this.post<ApiResponse<OrderWithItems>>(
      "/api/v1/orders",
      order
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new ApiError("CREATE_ORDER_FAILED", "Failed to create order");
  }

  async getOrdersByTerminal(
    terminalId: string,
    params?: OrderQueryParams
  ): Promise<PaginatedResponse<OrderWithItems>> {
    return this.get<PaginatedResponse<OrderWithItems>>(
      `/api/v1/orders/terminal/${terminalId}`,
      params
    );
  }

  async getOrdersByDateRange(
    startDate: string,
    endDate: string,
    params?: OrderQueryParams
  ): Promise<PaginatedResponse<OrderWithItems>> {
    return this.get<PaginatedResponse<OrderWithItems>>(
      "/api/v1/orders/date-range",
      {
        start_date: startDate,
        end_date: endDate,
        ...params,
      }
    );
  }

  async getSalesSummary(startDate: string, endDate: string): Promise<any> {
    const response = await this.get<ApiResponse<any>>(
      "/api/v1/orders/reports/summary",
      {
        start_date: startDate,
        end_date: endDate,
      }
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new ApiError("SALES_SUMMARY_FAILED", "Failed to get sales summary");
  }

  // =============================================
  // POS TERMINALS API
  // =============================================

  async getPOSTerminals(activeOnly?: boolean): Promise<POSTerminal[]> {
    const response = await this.get<ApiResponse<POSTerminal[]>>(
      "/api/v1/pos-terminals",
      activeOnly ? { active: "true" } : undefined
    );

    if (response.success && response.data) {
      return response.data;
    }

    return [];
  }

  async getPOSTerminalById(id: string): Promise<POSTerminal> {
    const response = await this.get<ApiResponse<POSTerminal>>(
      `/api/v1/pos-terminals/${id}`
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new ApiError("TERMINAL_NOT_FOUND", "POS terminal not found");
  }

  async createPOSTerminal(
    terminal: CreatePOSTerminalRequest
  ): Promise<POSTerminal> {
    const response = await this.post<ApiResponse<POSTerminal>>(
      "/api/v1/pos-terminals",
      terminal
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new ApiError(
      "CREATE_TERMINAL_FAILED",
      "Failed to create POS terminal"
    );
  }

  async updatePOSTerminal(
    id: string,
    terminal: UpdatePOSTerminalRequest
  ): Promise<POSTerminal> {
    const response = await this.put<ApiResponse<POSTerminal>>(
      `/api/v1/pos-terminals/${id}`,
      terminal
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new ApiError(
      "UPDATE_TERMINAL_FAILED",
      "Failed to update POS terminal"
    );
  }

  async deletePOSTerminal(id: string): Promise<void> {
    await this.delete(`/api/v1/pos-terminals/${id}`);
  }

  async getPOSTerminalConfiguration(id: string): Promise<Record<string, any>> {
    const response = await this.get<ApiResponse<Record<string, any>>>(
      `/api/v1/pos-terminals/${id}/configuration`
    );

    if (response.success && response.data) {
      return response.data;
    }

    return {};
  }

  async updatePOSTerminalConfiguration(
    id: string,
    configuration: Record<string, any>
  ): Promise<POSTerminal> {
    const response = await this.put<ApiResponse<POSTerminal>>(
      `/api/v1/pos-terminals/${id}/configuration`,
      configuration
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new ApiError(
      "UPDATE_CONFIG_FAILED",
      "Failed to update terminal configuration"
    );
  }

  async getPOSTerminalStats(id: string, days?: number): Promise<any> {
    const response = await this.get<ApiResponse<any>>(
      `/api/v1/pos-terminals/${id}/stats`,
      days ? { days } : undefined
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new ApiError("STATS_FAILED", "Failed to get terminal statistics");
  }

  // =============================================
  // HEALTH CHECK
  // =============================================

  async healthCheck(): Promise<boolean> {
    try {
      await this.get("/health");
      return true;
    } catch {
      return false;
    }
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();

// Initialize authentication on app start
if (typeof window !== "undefined") {
  // Listen for Supabase auth changes and update API client token
  supabase.auth.onAuthStateChange((event, session) => {
    if (session?.access_token) {
      apiClient.setAuthToken(session.access_token);
    } else {
      apiClient.clearAuthToken();
    }
  });

  // Initialize with current session
  apiClient.initializeAuth().catch(console.warn);
}
