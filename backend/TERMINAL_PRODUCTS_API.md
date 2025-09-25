# POS Terminal Products API

This document describes the new API endpoints for managing product assignments to POS terminals.

## Database Schema

A new table `pos_terminal_products` has been created to manage the many-to-many relationship between terminals and products:

```sql
CREATE TABLE pos_terminal_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  terminal_id UUID NOT NULL REFERENCES pos_terminals(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique product-terminal combinations
  UNIQUE(terminal_id, product_id)
);
```

## API Endpoints

### 1. Get Terminal Products

**GET** `/api/v1/pos-terminals/:id/products`

Returns all products assigned to a specific terminal.

**Authentication:** Required
**Authorization:** Any authenticated user

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "barcode": "123456789",
      "name": "Product Name",
      "price": 10.99,
      "image_url": "https://example.com/image.jpg",
      "category": "Category",
      "stock_quantity": 100,
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 2. Assign Products to Terminal

**POST** `/api/v1/pos-terminals/:id/products`

Assigns multiple products to a terminal (bulk operation).

**Authentication:** Required
**Authorization:** POS operators and admins

**Request Body:**
```json
{
  "productIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Products assigned successfully"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 3. Remove Products from Terminal

**DELETE** `/api/v1/pos-terminals/:id/products`

Removes multiple products from a terminal (bulk operation).

**Authentication:** Required
**Authorization:** POS operators and admins

**Request Body:**
```json
{
  "productIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Products removed successfully"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Error Responses

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Common Error Codes

- `TERMINAL_NOT_FOUND`: The specified terminal ID does not exist
- `PRODUCTS_NOT_FOUND`: One or more specified product IDs do not exist
- `INVALID_INPUT`: Invalid request parameters (empty arrays, etc.)
- `INVALID_REQUEST_BODY`: Malformed request body
- `INVALID_PRODUCT_IDS`: Product IDs are not valid UUIDs
- `DATABASE_ERROR`: Database operation failed
- `SUPABASE_NOT_CONFIGURED`: Database connection not available

## Implementation Details

### Service Layer

The `POSTerminalService` class has been extended with three new methods:

- `getTerminalProducts(terminalId: string)`: Retrieves products for a terminal
- `assignProductsToTerminal(terminalId: string, productIds: string[])`: Assigns products to a terminal
- `removeProductsFromTerminal(terminalId: string, productIds: string[])`: Removes products from a terminal

### Controller Layer

The `POSTerminalController` class has been extended with three new static methods:

- `getTerminalProducts`: Handles GET requests for terminal products
- `assignProductsToTerminal`: Handles POST requests for product assignment
- `removeProductsFromTerminal`: Handles DELETE requests for product removal

### Validation

New validation middleware `validateProductAssignment` ensures:

- Terminal ID is a valid UUID
- Product IDs array is not empty
- All product IDs are valid UUIDs

### Database Operations

- **Get Products**: Uses a JOIN query to fetch products through the relationship table
- **Assign Products**: Uses UPSERT to handle existing assignments gracefully
- **Remove Products**: Uses soft delete (sets `is_active = false`) to maintain audit trail

## Usage Examples

### cURL Examples

```bash
# Get products for a terminal
curl -X GET "http://localhost:5000/api/v1/pos-terminals/terminal-uuid/products" \
  -H "Authorization: Bearer your-jwt-token"

# Assign products to a terminal
curl -X POST "http://localhost:5000/api/v1/pos-terminals/terminal-uuid/products" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{"productIds": ["product-uuid-1", "product-uuid-2"]}'

# Remove products from a terminal
curl -X DELETE "http://localhost:5000/api/v1/pos-terminals/terminal-uuid/products" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{"productIds": ["product-uuid-1", "product-uuid-2"]}'
```

## Migration Required

To use these endpoints, the database migration `003_pos_terminal_products.sql` must be applied to create the relationship table and associated indexes.