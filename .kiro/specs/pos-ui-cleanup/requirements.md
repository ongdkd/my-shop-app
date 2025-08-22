# POS UI Cleanup Requirements

## Introduction

This feature focuses on cleaning up the Point of Sale (POS) customer interface to provide a streamlined, customer-focused experience. The current POS interface contains admin controls and unnecessary features that should not be visible to customers using the POS terminals.

## Requirements

### Requirement 1: Data Source Verification

**User Story:** As a customer using a POS terminal, I want the product list to be loaded from the database so that I see current, accurate product information.

#### Acceptance Criteria

1. WHEN a customer accesses a POS terminal THEN the system SHALL fetch products from the Supabase database via the API
2. WHEN the database fetch fails THEN the system SHALL display a friendly "No products available" message
3. WHEN the database fetch fails THEN the system SHALL NOT display any admin controls or "Add Products" buttons
4. WHEN products are successfully loaded THEN the system SHALL display only active, non-hidden products for the specific POS terminal

### Requirement 2: Customer-Only Interface

**User Story:** As a customer using a POS terminal, I want to see only customer-relevant actions so that I'm not confused by admin controls.

#### Acceptance Criteria

1. WHEN a POS terminal has zero products THEN the system SHALL NOT display "Add Products" buttons
2. WHEN a POS terminal has zero products THEN the system SHALL NOT display any admin management controls
3. WHEN a POS terminal has zero products THEN the system SHALL display a friendly empty state message
4. WHEN a POS terminal has zero products THEN the system SHALL provide navigation back to terminal selection
5. WHEN products are displayed THEN the system SHALL NOT show any product management controls (edit, delete, etc.)

### Requirement 3: Header Actions Cleanup

**User Story:** As a customer using a POS terminal, I want to see only essential actions in the header so that the interface is clean and focused.

#### Acceptance Criteria

1. WHEN a customer views the POS header THEN the system SHALL NOT display the "Scan QR" button
2. WHEN a customer views the POS header THEN the system SHALL display the Cart button
3. WHEN a customer views the POS header THEN the system SHALL display navigation controls (back to terminals)
4. WHEN a customer views the POS header THEN the system SHALL display the logo and terminal identification
5. WHEN the cart has items THEN the system SHALL display the item count badge on the cart button

### Requirement 4: Enhanced Empty States

**User Story:** As a customer encountering an empty POS terminal, I want clear guidance on what to do next so that I understand the situation.

#### Acceptance Criteria

1. WHEN no products are available due to database error THEN the system SHALL display "Unable to load products" with retry option
2. WHEN no products are configured for the terminal THEN the system SHALL display "No products available" with contact admin message
3. WHEN search/filter returns no results THEN the system SHALL display "No products found" with clear filters option
4. WHEN displaying empty states THEN the system SHALL provide appropriate navigation options
5. WHEN displaying empty states THEN the system SHALL maintain consistent visual design with the rest of the application

### Requirement 5: Mobile Responsiveness

**User Story:** As a customer using a POS terminal on various devices, I want the interface to work well on both desktop and mobile so that I can complete my purchase regardless of device.

#### Acceptance Criteria

1. WHEN accessing POS on mobile devices THEN the system SHALL display a responsive layout
2. WHEN accessing POS on desktop THEN the system SHALL utilize available screen space effectively
3. WHEN interacting with touch devices THEN the system SHALL provide appropriate touch targets
4. WHEN viewing on small screens THEN the system SHALL prioritize essential information and actions
5. WHEN switching between orientations THEN the system SHALL maintain usability and visual hierarchy
