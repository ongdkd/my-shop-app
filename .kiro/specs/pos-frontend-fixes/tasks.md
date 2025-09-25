# Implementation Plan

- [x] 1. Update API client with terminal data fetching methods

  - Add getTerminal method to fetch terminal details by ID
  - Add getTerminalProducts method to fetch products assigned to specific terminal
  - Add error handling for terminal not found scenarios
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 2. Fix POS page to fetch and display actual terminal data

  - Update /pos/[posId]/page.tsx to fetch terminal details using API
  - Replace hardcoded terminal name with actual database value
  - Add terminal validation and not found error handling
  - Display terminal-specific information in the UI
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 3. Create terminal product management page for admins

  - Create /admin/pos-terminals/[id]/products/page.tsx component
  - Implement terminal information display section
  - Add product assignment interface with search and filtering
  - Implement bulk assign/unassign functionality for products
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 4. Update admin panel navigation buttons

  - Modify admin POS page to replace single "Open POS Terminal" button
  - Add "Manage Products" button that routes to terminal product management
  - Add "Launch POS" button that opens POS client in new tab
  - Ensure proper UUID routing for both buttons
  - _Requirements: 2.1, 2.2, 2.4_

- [x] 5. Add comprehensive error handling and loading states

  - Implement loading spinners for all API calls
  - Add user-friendly error messages for API failures
  - Handle terminal not found and inactive terminal states
  - Add retry mechanisms for failed requests
  - _Requirements: 1.4, 1.5, 3.3, 3.4_

- [x] 6. Add backend API endpoints for terminal product management

  - Create GET /api/v1/pos-terminals/:id/products endpoint
  - Create POST /api/v1/pos-terminals/:id/products endpoint for bulk assignment
  - Create DELETE /api/v1/pos-terminals/:id/products endpoint for bulk removal
  - Add proper validation and error handling in backend routes
  - _Requirements: 3.1, 3.2_

- [x] 7. Update existing product fetching logic to use terminal-specific endpoints

  - Modify getProductsByPosId function to use new terminal products endpoint
  - Update error handling to distinguish between terminal and product errors
  - Ensure backward compatibility with existing POS functionality
  - _Requirements: 1.1, 1.2, 3.1_

- [x] 8. Add real-time updates and notifications


  - Implement product assignment change notifications
  - Add automatic refresh when products are modified from admin panel
  - Update POS client to reflect product changes without manual refresh
  - _Requirements: 1.5, 2.3_
