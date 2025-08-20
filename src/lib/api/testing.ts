// API testing utilities and mock data

import { 
  Product, 
  OrderWithItems, 
  POSTerminal, 
  User,
  PaginatedResponse,
  ApiResponse 
} from './types';

// Mock data for testing
export const mockProducts: Product[] = [
  {
    id: '1',
    barcode: '1234567890123',
    name: 'Test Product 1',
    price: 9.99,
    image_url: 'https://via.placeholder.com/150',
    category: 'Electronics',
    stock_quantity: 50,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    barcode: '2345678901234',
    name: 'Test Product 2',
    price: 19.99,
    category: 'Books',
    stock_quantity: 25,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

export const mockOrders: OrderWithItems[] = [
  {
    id: '1',
    order_number: 'ORD-20240101-001',
    pos_terminal_id: '1',
    customer_id: undefined,
    total_amount: 29.98,
    payment_method: 'card',
    order_status: 'completed',
    order_date: '2024-01-01T12:00:00Z',
    created_at: '2024-01-01T12:00:00Z',
    updated_at: '2024-01-01T12:00:00Z',
    order_items: [
      {
        id: '1',
        order_id: '1',
        product_id: '1',
        quantity: 2,
        unit_price: 9.99,
        line_total: 19.98,
        created_at: '2024-01-01T12:00:00Z',
        product: mockProducts[0],
      },
      {
        id: '2',
        order_id: '1',
        product_id: '2',
        quantity: 1,
        unit_price: 19.99,
        line_total: 19.99,
        created_at: '2024-01-01T12:00:00Z',
        product: mockProducts[1],
      },
    ],
  },
];

export const mockPOSTerminals: POSTerminal[] = [
  {
    id: '1',
    terminal_name: 'Main Counter',
    location: 'Store Front',
    is_active: true,
    configuration: {
      theme: 'light',
      currency: 'USD',
      tax_rate: 0.08,
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    terminal_name: 'Back Office',
    location: 'Storage Room',
    is_active: false,
    configuration: {
      theme: 'dark',
      currency: 'USD',
      tax_rate: 0.08,
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

export const mockUser: User = {
  id: '1',
  email: 'admin@example.com',
  role: 'admin',
  created_at: '2024-01-01T00:00:00Z',
};

// Mock API responses
export const createMockPaginatedResponse = <T>(
  data: T[],
  page: number = 1,
  limit: number = 20
): PaginatedResponse<T> => ({
  success: true,
  data,
  pagination: {
    page,
    limit,
    total: data.length,
    totalPages: Math.ceil(data.length / limit),
    hasNext: page * limit < data.length,
    hasPrev: page > 1,
  },
  timestamp: new Date().toISOString(),
});

export const createMockApiResponse = <T>(data: T): ApiResponse<T> => ({
  success: true,
  data,
  timestamp: new Date().toISOString(),
});

// Mock API client for testing
export class MockApiClient {
  private delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

  async getProducts() {
    await this.delay();
    return createMockPaginatedResponse(mockProducts);
  }

  async getProductById(id: string) {
    await this.delay();
    const product = mockProducts.find(p => p.id === id);
    if (!product) throw new Error('Product not found');
    return product;
  }

  async searchProducts(query: string) {
    await this.delay();
    const filtered = mockProducts.filter(p => 
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.barcode.includes(query)
    );
    return createMockPaginatedResponse(filtered);
  }

  async getOrders() {
    await this.delay();
    return createMockPaginatedResponse(mockOrders);
  }

  async getOrderById(id: string) {
    await this.delay();
    const order = mockOrders.find(o => o.id === id);
    if (!order) throw new Error('Order not found');
    return order;
  }

  async getPOSTerminals() {
    await this.delay();
    return mockPOSTerminals;
  }

  async getPOSTerminalById(id: string) {
    await this.delay();
    const terminal = mockPOSTerminals.find(t => t.id === id);
    if (!terminal) throw new Error('Terminal not found');
    return terminal;
  }

  async login() {
    await this.delay();
    return {
      token: 'mock-jwt-token',
      user: mockUser,
    };
  }

  async healthCheck() {
    await this.delay(100);
    return true;
  }
}

// Test utilities
export const createTestProduct = (overrides: Partial<Product> = {}): Product => ({
  id: Math.random().toString(36).substr(2, 9),
  barcode: Math.random().toString().substr(2, 13),
  name: 'Test Product',
  price: 9.99,
  stock_quantity: 10,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createTestOrder = (overrides: Partial<OrderWithItems> = {}): OrderWithItems => ({
  id: Math.random().toString(36).substr(2, 9),
  order_number: `ORD-${Date.now()}`,
  pos_terminal_id: '1',
  customer_id: undefined,
  total_amount: 19.98,
  payment_method: 'card',
  order_status: 'completed',
  order_date: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  order_items: [],
  ...overrides,
});

export const createTestPOSTerminal = (overrides: Partial<POSTerminal> = {}): POSTerminal => ({
  id: Math.random().toString(36).substr(2, 9),
  terminal_name: 'Test Terminal',
  location: 'Test Location',
  is_active: true,
  configuration: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// API endpoint testing
export const testApiEndpoint = async (
  endpoint: string,
  expectedStatus: number = 200
): Promise<boolean> => {
  try {
    const response = await fetch(endpoint);
    return response.status === expectedStatus;
  } catch (error) {
    console.error(`Failed to test endpoint ${endpoint}:`, error);
    return false;
  }
};

// Comprehensive API health check
export const runApiHealthCheck = async (baseURL: string): Promise<{
  healthy: boolean;
  results: Record<string, boolean>;
}> => {
  const endpoints = [
    { name: 'health', url: `${baseURL}/health` },
    { name: 'products', url: `${baseURL}/api/v1/products` },
    { name: 'orders', url: `${baseURL}/api/v1/orders` },
    { name: 'pos-terminals', url: `${baseURL}/api/v1/pos-terminals` },
  ];

  const results: Record<string, boolean> = {};
  
  for (const endpoint of endpoints) {
    results[endpoint.name] = await testApiEndpoint(endpoint.url);
  }

  const healthy = Object.values(results).every(result => result);

  return { healthy, results };
};