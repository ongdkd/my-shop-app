# API Client Documentation

This directory contains a comprehensive API client for the My Shop POS system. It provides both custom React hooks and React Query integration for optimal caching and state management.

## Quick Start

```typescript
import { apiClient, useProductsQuery } from '@/lib/api';

// Using the API client directly
const products = await apiClient.getProducts();

// Using React Query hooks (recommended)
function ProductList() {
  const { data, loading, error } = useProductsQuery();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      {data?.data.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

## Architecture

### Core Components

1. **ApiClient** (`client.ts`) - Main HTTP client with authentication
2. **Types** (`types.ts`) - TypeScript interfaces matching backend
3. **Hooks** (`hooks.ts`) - Custom React hooks for API operations
4. **Queries** (`queries.ts`) - React Query hooks with caching
5. **Error Handling** (`errors.ts`) - Centralized error management
6. **Configuration** (`config.ts`) - Environment and endpoint configuration

### Additional Utilities

- **Interceptors** (`interceptors.ts`) - Request/response middleware
- **Testing** (`testing.ts`) - Mock data and testing utilities
- **Adapters** (`adapters.ts`) - Data transformation utilities

## API Client Usage

### Authentication

```typescript
import { apiClient } from '@/lib/api';

// Login
const response = await apiClient.login({
  email: 'user@example.com',
  password: 'password'
});

// Check authentication status
const isAuthenticated = apiClient.isAuthenticated();

// Get current user
const user = apiClient.getCurrentUser();

// Logout
await apiClient.logout();
```

### Products

```typescript
// Get all products
const products = await apiClient.getProducts({
  page: 1,
  limit: 20,
  category: 'Electronics',
  search: 'phone'
});

// Get product by ID
const product = await apiClient.getProductById('product-id');

// Get product by barcode (for POS scanning)
const product = await apiClient.getProductByBarcode('1234567890');

// Search products
const results = await apiClient.searchProducts('search term');

// Create product
const newProduct = await apiClient.createProduct({
  barcode: '1234567890',
  name: 'New Product',
  price: 19.99,
  stock_quantity: 100
});

// Update product
const updatedProduct = await apiClient.updateProduct('product-id', {
  price: 24.99,
  stock_quantity: 150
});

// Delete product
await apiClient.deleteProduct('product-id');
```

### Orders

```typescript
// Get all orders
const orders = await apiClient.getOrders({
  page: 1,
  limit: 20,
  start_date: '2024-01-01',
  end_date: '2024-01-31'
});

// Get order by ID
const order = await apiClient.getOrderById('order-id');

// Create order
const newOrder = await apiClient.createOrder({
  pos_terminal_id: 'terminal-id',
  payment_method: 'card',
  order_items: [
    {
      product_id: 'product-id',
      quantity: 2,
      unit_price: 19.99
    }
  ]
});

// Get sales summary
const summary = await apiClient.getSalesSummary('2024-01-01', '2024-01-31');
```

### POS Terminals

```typescript
// Get all terminals
const terminals = await apiClient.getPOSTerminals();

// Get active terminals only
const activeTerminals = await apiClient.getPOSTerminals(true);

// Get terminal by ID
const terminal = await apiClient.getPOSTerminalById('terminal-id');

// Create terminal
const newTerminal = await apiClient.createPOSTerminal({
  terminal_name: 'Main Counter',
  location: 'Store Front'
});

// Update terminal
const updatedTerminal = await apiClient.updatePOSTerminal('terminal-id', {
  location: 'New Location'
});

// Get terminal stats
const stats = await apiClient.getPOSTerminalStats('terminal-id', 30);
```

## React Hooks Usage

### Custom Hooks

```typescript
import { useProducts, useProductMutations } from '@/lib/api';

function ProductManager() {
  const { data, loading, error, refetch } = useProducts({ page: 1, limit: 20 });
  const { createProduct, updateProduct, deleteProduct, loading: mutating } = useProductMutations();

  const handleCreate = async (productData) => {
    const newProduct = await createProduct(productData);
    if (newProduct) {
      refetch(); // Refresh the list
    }
  };

  return (
    <div>
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      {data?.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

### React Query Hooks (Recommended)

```typescript
import { useProductsQuery, useCreateProductMutation } from '@/lib/api';

function ProductManager() {
  const { data, isLoading, error } = useProductsQuery({ page: 1, limit: 20 });
  const createProductMutation = useCreateProductMutation({
    onSuccess: () => {
      // Automatically invalidates and refetches products
      console.log('Product created successfully!');
    }
  });

  const handleCreate = (productData) => {
    createProductMutation.mutate(productData);
  };

  return (
    <div>
      {isLoading && <div>Loading...</div>}
      {error && <div>Error: {error.message}</div>}
      {data?.data.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

## Error Handling

The API client provides comprehensive error handling:

```typescript
import { handleApiError, isAuthError, isNetworkError } from '@/lib/api';

try {
  const product = await apiClient.getProductById('invalid-id');
} catch (error) {
  const errorMessage = handleApiError(error);
  
  if (isAuthError(error)) {
    // Redirect to login
    router.push('/login');
  } else if (isNetworkError(error)) {
    // Show network error message
    showToast('Network error. Please try again.');
  } else {
    // Show generic error
    showToast(errorMessage);
  }
}
```

## Configuration

### Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NODE_ENV=development
```

### Custom Configuration

```typescript
import { getApiConfig } from '@/lib/api';

const config = getApiConfig();
console.log(config.baseURL); // Current API base URL
```

## Testing

### Mock Data

```typescript
import { MockApiClient, mockProducts, createTestProduct } from '@/lib/api/testing';

// Use mock client in tests
const mockClient = new MockApiClient();
const products = await mockClient.getProducts();

// Create test data
const testProduct = createTestProduct({
  name: 'Test Product',
  price: 9.99
});
```

### API Health Check

```typescript
import { runApiHealthCheck } from '@/lib/api/testing';

const { healthy, results } = await runApiHealthCheck('http://localhost:5000');
console.log('API Health:', healthy ? 'OK' : 'FAILED');
console.log('Results:', results);
```

## Best Practices

1. **Use React Query hooks** for better caching and state management
2. **Handle errors consistently** using the provided error utilities
3. **Validate data** before sending to the API
4. **Use TypeScript** for type safety
5. **Cache appropriately** - products can be cached longer than orders
6. **Handle loading states** in your UI components
7. **Implement retry logic** for network failures
8. **Use optimistic updates** for better UX

## Performance Tips

1. **Enable stale-while-revalidate** for frequently accessed data
2. **Use pagination** for large datasets
3. **Implement search debouncing** to avoid excessive API calls
4. **Cache static data** like product categories
5. **Use background refetching** for real-time updates
6. **Implement offline support** for critical operations

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check if auth token is valid and not expired
2. **Network errors**: Verify API server is running and accessible
3. **CORS errors**: Ensure frontend domain is allowed in backend CORS config
4. **Type errors**: Make sure frontend and backend types are synchronized

### Debug Mode

Enable logging in development:

```typescript
// This is automatically enabled in development mode
// Check browser console for detailed API logs
```

### Health Check

```typescript
const isHealthy = await apiClient.healthCheck();
if (!isHealthy) {
  console.error('API server is not responding');
}
```