# Design Document

## Overview

The POS Terminal Management system currently falls back to demo mode when the backend API is unavailable or misconfigured. This design addresses the root causes of API connectivity issues and implements proper database integration with comprehensive error handling and user feedback.

## Architecture

### Current Issues Identified

1. **API Client Fallback Behavior**: The `ApiClient` class automatically returns fallback data when API calls fail, masking connectivity issues
2. **Environment Configuration**: Potential mismatches between frontend API URL and backend deployment URL
3. **Authentication Integration**: Supabase authentication tokens may not be properly synchronized with backend API calls
4. **Error Detection**: The frontend detects demo mode by checking for specific fallback terminal IDs ("pos1", "pos2", "pos3")

### Proposed Solution Architecture

```
Frontend (Next.js) → API Client → Backend API (Express) → Supabase Database
                                      ↓
                              Authentication Middleware
                                      ↓
                              POS Terminal Service
```

## Components and Interfaces

### 1. Enhanced API Client

**Purpose**: Improve error handling and remove automatic fallback behavior for POS terminals

**Key Changes**:

- Remove automatic fallback data for POS terminals
- Implement proper error propagation
- Add connection health checks
- Improve authentication token synchronization

**Interface**:

```typescript
interface EnhancedApiClient {
  // Health check methods
  healthCheck(): Promise<boolean>;
  checkDatabaseConnection(): Promise<boolean>;

  // POS Terminal methods (no fallback)
  getPOSTerminals(activeOnly?: boolean): Promise<POSTerminal[]>;
  createPOSTerminal(terminal: CreatePOSTerminalRequest): Promise<POSTerminal>;
  updatePOSTerminal(
    id: string,
    terminal: UpdatePOSTerminalRequest
  ): Promise<POSTerminal>;
  deletePOSTerminal(id: string): Promise<void>;

  // Error handling
  getLastError(): ApiError | null;
  isConnected(): boolean;
}
```

### 2. Connection Status Manager

**Purpose**: Monitor and report API connectivity status

**Responsibilities**:

- Periodic health checks
- Connection status caching
- Error categorization (network, auth, database, etc.)
- Retry logic with exponential backoff

**Interface**:

```typescript
interface ConnectionStatusManager {
  getStatus(): ConnectionStatus;
  startMonitoring(): void;
  stopMonitoring(): void;
  forceCheck(): Promise<ConnectionStatus>;
}

interface ConnectionStatus {
  isConnected: boolean;
  lastChecked: Date;
  error?: {
    type: "network" | "auth" | "database" | "server";
    message: string;
    details?: any;
  };
}
```

### 3. Enhanced POS Terminal Page

**Purpose**: Provide clear feedback about system status and handle all error scenarios

**Key Features**:

- Real-time connection status display
- Proper loading states
- Detailed error messages with actionable solutions
- Graceful degradation when API is unavailable
- No fallback to demo data

### 4. Backend Health Check Enhancements

**Purpose**: Provide detailed system health information

**New Endpoints**:

- `GET /health/detailed` - Comprehensive health check including database connectivity
- `GET /health/database` - Specific database connection test
- `GET /health/auth` - Authentication system status

## Data Models

### Enhanced Health Check Response

```typescript
interface DetailedHealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  services: {
    database: {
      status: "connected" | "disconnected" | "error";
      responseTime?: number;
      error?: string;
    };
    authentication: {
      status: "configured" | "misconfigured" | "error";
      provider: "supabase";
      error?: string;
    };
    api: {
      status: "running";
      version: string;
      uptime: number;
    };
  };
  environment: {
    nodeEnv: string;
    port: number;
    corsEnabled: boolean;
  };
}
```

### Connection Error Types

```typescript
interface ConnectionError {
  type: "network" | "auth" | "database" | "server" | "configuration";
  code: string;
  message: string;
  details?: any;
  suggestions?: string[];
}
```

## Error Handling

### Error Categories and Responses

1. **Network Errors**

   - **Cause**: Cannot reach backend API
   - **Response**: Display connection error with retry button
   - **User Action**: Check network, verify API URL

2. **Authentication Errors**

   - **Cause**: Invalid or expired tokens
   - **Response**: Redirect to login or refresh token
   - **User Action**: Re-authenticate

3. **Database Errors**

   - **Cause**: Supabase connection issues
   - **Response**: Display database error with admin contact info
   - **User Action**: Contact system administrator

4. **Configuration Errors**
   - **Cause**: Missing environment variables or misconfiguration
   - **Response**: Display configuration error with setup guidance
   - **User Action**: Check environment configuration

### Error Recovery Strategies

1. **Automatic Retry**: Network errors with exponential backoff
2. **Token Refresh**: Authentication errors with automatic token refresh
3. **Graceful Degradation**: Show read-only mode when write operations fail
4. **User Guidance**: Provide specific instructions for each error type

## Testing Strategy

### Unit Tests

1. **API Client Tests**

   - Test error handling without fallback data
   - Test authentication token synchronization
   - Test health check functionality

2. **Connection Status Manager Tests**

   - Test status detection logic
   - Test retry mechanisms
   - Test error categorization

3. **Component Tests**
   - Test POS page error states
   - Test loading states
   - Test user interaction flows

### Integration Tests

1. **API Integration Tests**

   - Test with real backend API
   - Test database connectivity
   - Test authentication flow

2. **Error Scenario Tests**
   - Test with API unavailable
   - Test with database disconnected
   - Test with invalid authentication

### End-to-End Tests

1. **Happy Path Tests**

   - Complete POS terminal CRUD operations
   - Authentication and authorization flow

2. **Error Recovery Tests**
   - Network interruption recovery
   - Authentication token expiry handling
   - Database connection recovery

## Implementation Phases

### Phase 1: Remove Fallback Behavior

- Remove automatic fallback data from API client
- Implement proper error propagation
- Update POS page to handle API errors

### Phase 2: Enhanced Error Handling

- Implement connection status manager
- Add detailed health check endpoints
- Improve error categorization and user feedback

### Phase 3: Monitoring and Recovery

- Add automatic retry mechanisms
- Implement connection monitoring
- Add performance metrics and logging

### Phase 4: Testing and Validation

- Comprehensive test coverage
- Error scenario validation
- Performance optimization

## Configuration Requirements

### Frontend Environment Variables

```
NEXT_PUBLIC_API_URL=https://my-shop-app-backend.onrender.com
NEXT_PUBLIC_SUPABASE_URL=https://hfhycostuzgjzfihicmm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
```

### Backend Environment Variables

```
NODE_ENV=production
PORT=5000
SUPABASE_URL=https://hfhycostuzgjzfihicmm.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
SUPABASE_ANON_KEY=<anon_key>
DATABASE_URL=<postgres_connection_string>
JWT_SECRET=<jwt_secret>
ALLOWED_ORIGINS=https://my-shop-pos-app.onrender.com
```

## Security Considerations

1. **Authentication**: Ensure Supabase tokens are properly validated
2. **Authorization**: Verify admin role for POS terminal management
3. **Error Information**: Avoid exposing sensitive configuration details in error messages
4. **Rate Limiting**: Implement appropriate rate limits for health check endpoints

## Performance Considerations

1. **Caching**: Cache connection status to avoid excessive health checks
2. **Timeouts**: Implement appropriate timeouts for API calls
3. **Retry Logic**: Use exponential backoff to avoid overwhelming the server
4. **Loading States**: Provide immediate feedback during API operations
