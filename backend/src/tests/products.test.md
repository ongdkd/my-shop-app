# Product API Testing Guide

This guide provides examples for testing the Product API endpoints using curl or a REST client like Postman.

## Base URL
```
http://localhost:5000/api/v1/products
```

## Authentication
Most endpoints require authentication. Include the Bearer token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Test Endpoints

### 1. Get Product Categories (Public)
```bash
curl -X GET "http://localhost:5000/api/v1/products/categories"
```

### 2. Search Products (Public)
```bash
# Search for products containing "coffee"
curl -X GET "http://localhost:5000/api/v1/products/search?q=coffee&limit=10"

# Search with minimum query length
curl -X GET "http://localhost:5000/api/v1/products/search?q=co"
```

### 3. Get Product by Barcode (Public)
```bash
curl -X GET "http://localhost:5000/api/v1/products/barcode/1234567890123"
```

### 4. Get All Products (Authenticated)
```bash
curl -X GET "http://localhost:5000/api/v1/products" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# With pagination and filtering
curl -X GET "http://localhost:5000/api/v1/products?page=1&limit=10&category=Electronics&search=wireless" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. Get Product by ID (Authenticated)
```bash
curl -X GET "http://localhost:5000/api/v1/products/PRODUCT_UUID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 6. Create Product (Requires POS Access)
```bash
curl -X POST "http://localhost:5000/api/v1/products" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "barcode": "9876543210987",
    "name": "Test Product",
    "price": 29.99,
    "category": "Test Category",
    "stock_quantity": 100,
    "image_url": "https://example.com/image.jpg"
  }'
```

### 7. Update Product (Requires POS Access)
```bash
curl -X PUT "http://localhost:5000/api/v1/products/PRODUCT_UUID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Product Name",
    "price": 39.99,
    "stock_quantity": 150
  }'
```

### 8. Bulk Update Stock (Requires POS Access)
```bash
curl -X PATCH "http://localhost:5000/api/v1/products/bulk/stock" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "updates": [
      {"id": "PRODUCT_UUID_1", "stock_quantity": 50},
      {"id": "PRODUCT_UUID_2", "stock_quantity": 75}
    ]
  }'
```

### 9. Delete Product (Requires POS Access)
```bash
curl -X DELETE "http://localhost:5000/api/v1/products/PRODUCT_UUID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Expected Response Formats

### Success Response
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "barcode": "1234567890123",
    "name": "Product Name",
    "price": 29.99,
    "category": "Electronics",
    "stock_quantity": 100,
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product not found"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Common Error Codes
- `PRODUCT_NOT_FOUND` - Product doesn't exist
- `DUPLICATE_BARCODE` - Barcode already exists
- `VALIDATION_ERROR` - Invalid input data
- `UNAUTHORIZED` - Authentication required
- `INSUFFICIENT_PERMISSIONS` - Access denied
- `SUPABASE_NOT_CONFIGURED` - Database not available

## Testing Scenarios

### 1. Test Authentication
- Try accessing protected endpoints without token (should get 401)
- Try accessing admin endpoints with regular user token (should get 403)

### 2. Test Validation
- Try creating product with invalid barcode
- Try searching with query less than 2 characters
- Try bulk update with invalid data

### 3. Test Business Logic
- Create product with duplicate barcode (should get 409)
- Try to get non-existent product (should get 404)
- Test pagination with various page sizes

### 4. Test Performance
- Search with various query lengths
- Test bulk operations with multiple items
- Test pagination with large datasets