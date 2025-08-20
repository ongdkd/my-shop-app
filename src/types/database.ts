// Database type definitions for Supabase
export interface Database {
  public: {
    Tables: {
      products: {
        Row: Product;
        Insert: ProductInsert;
        Update: ProductUpdate;
      };
      pos_terminals: {
        Row: POSTerminal;
        Insert: POSTerminalInsert;
        Update: POSTerminalUpdate;
      };
      customers: {
        Row: Customer;
        Insert: CustomerInsert;
        Update: CustomerUpdate;
      };
      orders: {
        Row: Order;
        Insert: OrderInsert;
        Update: OrderUpdate;
      };
      order_items: {
        Row: OrderItem;
        Insert: OrderItemInsert;
        Update: OrderItemUpdate;
      };
    };
  };
}

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

export interface ProductInsert {
  id?: string;
  barcode: string;
  name: string;
  price: number;
  image_url?: string;
  category?: string;
  stock_quantity?: number;
  is_active?: boolean;
}

export interface ProductUpdate {
  barcode?: string;
  name?: string;
  price?: number;
  image_url?: string;
  category?: string;
  stock_quantity?: number;
  is_active?: boolean;
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

export interface POSTerminalInsert {
  id?: string;
  terminal_name: string;
  location?: string;
  is_active?: boolean;
  configuration?: Record<string, any>;
}

export interface POSTerminalUpdate {
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

export interface CustomerInsert {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
}

export interface CustomerUpdate {
  name?: string;
  email?: string;
  phone?: string;
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

export interface OrderInsert {
  id?: string;
  order_number: string;
  pos_terminal_id?: string;
  customer_id?: string;
  total_amount: number;
  payment_method: PaymentMethod;
  order_status?: OrderStatus;
  order_date?: string;
}

export interface OrderUpdate {
  order_number?: string;
  pos_terminal_id?: string;
  customer_id?: string;
  total_amount?: number;
  payment_method?: PaymentMethod;
  order_status?: OrderStatus;
  order_date?: string;
}

// =============================================
// ORDER ITEM TYPES
// =============================================

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  created_at: string;
}

export interface OrderItemInsert {
  id?: string;
  order_id: string;
  product_id?: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface OrderItemUpdate {
  order_id?: string;
  product_id?: string;
  quantity?: number;
  unit_price?: number;
  line_total?: number;
}

// =============================================
// ENUM TYPES
// =============================================

export type PaymentMethod = 'cash' | 'card' | 'digital';
export type OrderStatus = 'pending' | 'completed' | 'cancelled';

// =============================================
// EXTENDED TYPES WITH RELATIONSHIPS
// =============================================

export interface OrderWithItems extends Order {
  order_items: (OrderItem & {
    product?: Product;
  })[];
  pos_terminal?: POSTerminal;
  customer?: Customer;
}

export interface OrderItemWithProduct extends OrderItem {
  product?: Product;
}

// =============================================
// API REQUEST/RESPONSE TYPES
// =============================================

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

export interface CreateCustomerRequest {
  name?: string;
  email?: string;
  phone?: string;
}

// =============================================
// QUERY PARAMETER TYPES
// =============================================

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  is_active?: boolean;
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

export interface DatabaseError {
  code: string;
  message: string;
  details?: any;
  hint?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}