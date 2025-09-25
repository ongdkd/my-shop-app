# Requirements Document

## Introduction

This feature addresses critical frontend issues in the POS system where the POS pages are not properly fetching data from the database and admin panel navigation is incorrectly routing users to the POS client instead of the product management interface.

## Requirements

### Requirement 1: Dynamic POS Terminal Data Fetching

**User Story:** As a user accessing a POS terminal, I want the system to fetch the correct terminal details and products from the database using the terminal ID, so that I see the actual terminal name and assigned products.

#### Acceptance Criteria

1. WHEN a user navigates to /pos/[posId] THEN the system SHALL fetch terminal details using the posId parameter from the backend API
2. WHEN the terminal data is retrieved THEN the system SHALL display the actual terminal name from the database instead of hardcoded values
3. WHEN the terminal data is retrieved THEN the system SHALL display only products that are assigned to that specific terminal
4. IF the terminal ID is invalid or not found THEN the system SHALL display an appropriate error message
5. WHEN the terminal has no assigned products THEN the system SHALL display a "No products available" message with guidance

### Requirement 2: Admin Panel POS Terminal Navigation

**User Story:** As an admin user, I want the "Open POS Terminal" button to navigate to the product management interface, so that I can assign and edit products for that terminal.

#### Acceptance Criteria

1. WHEN an admin clicks "Open POS Terminal" in the admin dashboard THEN the system SHALL navigate to the terminal's product management page
2. WHEN navigating to the product management page THEN the system SHALL use the terminal's UUID for routing
3. WHEN on the product management page THEN the admin SHALL be able to view, assign, and edit products for that specific terminal
4. WHEN the admin wants to access the actual POS client THEN there SHALL be a separate "Launch POS" or similar button that opens the POS interface

### Requirement 3: Proper API Integration

**User Story:** As a developer, I want the frontend to properly integrate with the existing backend API endpoints, so that terminal and product data is fetched correctly.

#### Acceptance Criteria

1. WHEN fetching terminal data THEN the system SHALL use the /api/v1/pos-terminals/{id} endpoint
2. WHEN fetching terminal products THEN the system SHALL use the appropriate API endpoint to get products assigned to the terminal
3. WHEN API calls fail THEN the system SHALL handle errors gracefully and display user-friendly error messages
4. WHEN loading data THEN the system SHALL display appropriate loading states