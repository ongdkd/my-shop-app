// Shared types between frontend and backend
// These should match the backend types exactly

// =============================================
// PRODUCT TYPES
// =============================================

export interface Product {
  id: string;
  barcode: string;
  name: string;
  price: number;
  image_url?: string;
  category?: string;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProductRequest {
  barcode: string;
  name: string;
  price: number;
  image_url?: string;
  category?: string;
  stock_quantity?: number;
}

export interface UpdateProductRequest {
  barcode?: string;
  name?: string;
  price?: number;
  image_url?: string;
  category?: string;
  stock_quantity?: number;
  is_active?: boolean;
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  is_active?: boolean;
}

// =============================================
// ORDER TYPES
// =============================================

export interface Order {
  id: string;
  order_number: string;
  pos_terminal_id?: string;
  customer_id?: string;
  total_amount: number;
  payment_method: PaymentMethod;
  order_status: OrderStatus;
  order_date: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  created_at: string;
}

export interface OrderWithItems extends Order {
  order_items: (OrderItem & {
    product?: Product;
  })[];
  pos_terminal?: POSTerminal;
  customer?: Customer;
}

export interface CreateOrderRequest {
  pos_terminal_id?: string;
  customer_id?: string;
  payment_method: PaymentMethod;
  order_items: {
    product_id: string;
    quantity: number;
    unit_price: number;
  }[];
}

export interface OrderQueryParams {
  page?: number;
  limit?: number;
  pos_terminal_id?: string;
  start_date?: string;
  end_date?: string;
  order_status?: OrderStatus;
  payment_method?: PaymentMethod;
}

// =============================================
// POS TERMINAL TYPES
// =============================================

export interface POSTerminal {
  id: string;
  terminal_name: string;
  location?: string;
  is_active: boolean;
  configuration: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreatePOSTerminalRequest {
  terminal_name: string;
  location?: string;
  configuration?: Record<string, any>;
}

export interface UpdatePOSTerminalRequest {
  terminal_name?: string;
  location?: string;
  is_active?: boolean;
  configuration?: Record<string, any>;
}

// =============================================
// CUSTOMER TYPES
// =============================================

export interface Customer {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

// =============================================
// ENUM TYPES
// =============================================

export type PaymentMethod = 'cash' | 'card' | 'digital';
export type OrderStatus = 'pending' | 'completed' | 'cancelled';

// =============================================
// API RESPONSE TYPES
// =============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  timestamp: string;
}

// =============================================
// ERROR TYPES
// =============================================

export class ApiError extends Error {
  public status: number;
  constructor(
    public code: string,
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = statusCode || 0;
  }
}

// =============================================
// AUTHENTICATION TYPES
// =============================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    role: string;
  };
  token: string;
  refreshToken?: string;
  expires_at: string;
}

export interface User {
  id: string;
  email: string;
  role: string;
  name?: string;
  created_at?: string;
}