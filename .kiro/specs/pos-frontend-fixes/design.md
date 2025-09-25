# Design Document

## Overview

This design addresses two critical frontend issues in the POS system:
1. POS pages not properly fetching terminal data from the database
2. Admin panel "Open POS Terminal" button incorrectly routing to POS client instead of product management

The solution involves updating the POS page routing logic, implementing proper API integration for terminal data fetching, and creating a new admin product management interface.

## Architecture

### Current State Analysis

**POS Page Issues:**
- `/pos/[posId]/page.tsx` currently uses `getProductsByPosId()` but doesn't fetch terminal details
- Terminal name is hardcoded as "POS Terminal {posId}" instead of using database values
- No validation that the terminal ID exists or is active

**Admin Panel Issues:**
- "Open POS Terminal" button in `/admin/pos/page.tsx` opens `/pos/{id}` (POS client)
- No dedicated product management interface for terminals
- Admin users expect to manage products, not use the POS interface

### Proposed Architecture

```
Frontend Components:
├── /pos/[posId]/page.tsx (Updated)
│   ├── Fetch terminal details via API
│   ├── Display actual terminal name
│   └── Handle terminal not found cases
├── /admin/pos-terminals/[id]/products/page.tsx (New)
│   ├── Product assignment interface
│   ├── Terminal-specific product management
│   └── Admin-only access
└── /admin/pos/page.tsx (Updated)
    ├── "Manage Products" button → product management
    └── "Launch POS" button → POS client
```

## Components and Interfaces

### 1. Updated POS Page Component

**File:** `src/app/pos/[posId]/page.tsx`

**Key Changes:**
- Add terminal data fetching using `/api/v1/pos-terminals/{id}`
- Display actual terminal name from database
- Handle terminal not found/inactive states
- Validate terminal exists before loading products

**New State Management:**
```typescript
interface POSPageState {
  terminal: POSTerminal | null;
  products: Product[];
  loading: boolean;
  error: string | null;
  terminalNotFound: boolean;
}
```

### 2. New Terminal Product Management Page

**File:** `src/app/admin/pos-terminals/[id]/products/page.tsx`

**Features:**
- Display terminal information (name, status, configuration)
- List all available products with assignment status
- Bulk assign/unassign products to terminal
- Search and filter products
- Real-time updates when products are modified

**Component Structure:**
```typescript
interface TerminalProductsPageProps {
  params: { id: string };
}

interface TerminalProductsState {
  terminal: POSTerminal | null;
  allProducts: Product[];
  assignedProducts: Product[];
  loading: boolean;
  error: string | null;
}
```

### 3. Updated Admin POS Management

**File:** `src/app/admin/pos/page.tsx`

**Button Changes:**
- Replace single "Open POS Terminal" with two buttons:
  - "Manage Products" → `/admin/pos-terminals/{id}/products`
  - "Launch POS" → `/pos/{id}` (opens in new tab)

## Data Models

### Terminal Data Structure
```typescript
interface POSTerminal {
  id: string;
  terminal_name: string;
  location: string;
  is_active: boolean;
  configuration: {
    theme_color: string;
    theme: string;
    receipt_printer: boolean;
    cash_drawer: boolean;
  };
  created_at: string;
  updated_at: string;
}
```

### Product Assignment Structure
```typescript
interface ProductAssignment {
  terminal_id: string;
  product_id: string;
  assigned_at: string;
  is_active: boolean;
}
```

## API Integration

### Required API Endpoints

1. **Get Terminal by ID**
   - `GET /api/v1/pos-terminals/{id}`
   - Returns terminal details or 404 if not found

2. **Get Terminal Products**
   - `GET /api/v1/pos-terminals/{id}/products`
   - Returns products assigned to specific terminal

3. **Assign Products to Terminal**
   - `POST /api/v1/pos-terminals/{id}/products`
   - Bulk assign products to terminal

4. **Remove Products from Terminal**
   - `DELETE /api/v1/pos-terminals/{id}/products`
   - Bulk remove product assignments

### API Client Updates

**File:** `src/lib/api/client.ts`

Add new methods:
```typescript
// Get terminal details
async getTerminal(id: string): Promise<POSTerminal>

// Get products for specific terminal
async getTerminalProducts(id: string): Promise<Product[]>

// Assign products to terminal
async assignProductsToTerminal(terminalId: string, productIds: string[]): Promise<void>

// Remove products from terminal
async removeProductsFromTerminal(terminalId: string, productIds: string[]): Promise<void>
```

## Error Handling

### Terminal Not Found
- Display user-friendly error message
- Provide navigation back to terminal list
- Log error for debugging

### API Connection Issues
- Show connection status indicator
- Retry mechanism for failed requests
- Graceful degradation when offline

### Invalid Terminal States
- Handle inactive terminals
- Display appropriate warnings
- Prevent access to disabled terminals

## Testing Strategy

### Unit Tests
- Terminal data fetching logic
- Product assignment/removal functions
- Error handling scenarios
- State management updates

### Integration Tests
- API endpoint integration
- Navigation flow between pages
- Admin permission validation
- Real-time updates functionality

### User Acceptance Tests
- Admin can manage terminal products
- POS displays correct terminal information
- Navigation works as expected
- Error states are user-friendly

## Implementation Phases

### Phase 1: API Integration
1. Update API client with terminal methods
2. Add terminal data fetching to POS page
3. Implement error handling for terminal not found

### Phase 2: Admin Product Management
1. Create terminal products management page
2. Implement product assignment interface
3. Add bulk operations for product management

### Phase 3: Navigation Updates
1. Update admin panel button routing
2. Add separate "Launch POS" and "Manage Products" buttons
3. Implement proper access controls

### Phase 4: Testing & Polish
1. Add comprehensive error handling
2. Implement loading states and user feedback
3. Add real-time updates and notifications
4. Performance optimization and testing