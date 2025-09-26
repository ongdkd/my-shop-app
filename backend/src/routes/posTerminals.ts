import { Router } from 'express';
import { authenticateToken, requirePOSAccess, requireAdmin } from '../middleware/auth';
import {
  validateCreatePOSTerminal,
  validateUpdatePOSTerminal,
  validateUUIDParam,
  validateProductAssignment,
  sanitizeInput,
} from '../middleware/validation';
import { POSTerminalController } from '../controllers/posTerminalController';

const router = Router();

/**
 * ================================
 * POS TERMINAL ROUTES
 * ================================
 * All routes require authentication since terminals
 * are core business infrastructure.
 */

// -------------------------------------------------
// GET /api/v1/pos-terminals
// Fetch all POS terminals
// Query params: ?active=true, ?fields, ?limit
// Used in: Admin dashboard, POS selection
// -------------------------------------------------
router.get(
  '/',
  authenticateToken,
  POSTerminalController.getAllTerminals
);

// -------------------------------------------------
// GET /api/v1/pos-terminals/:id
// Fetch single POS terminal by ID
// Params: id (UUID)
// Used in: Admin POS edit page
// -------------------------------------------------
router.get(
  '/:id',
  authenticateToken,
  validateUUIDParam('id'),
  POSTerminalController.getTerminalById
);

// -------------------------------------------------
// GET /api/v1/pos-terminals/:id/configuration
// Fetch only the configuration object for a POS terminal
// Used in: POS client setup (theme, printer, etc.)
// -------------------------------------------------
router.get(
  '/:id/configuration',
  authenticateToken,
  validateUUIDParam('id'),
  POSTerminalController.getTerminalConfiguration
);

// -------------------------------------------------
// GET /api/v1/pos-terminals/:id/stats
// Fetch sales stats (total orders, revenue) for a terminal
// Access: POS operators + Admins
// -------------------------------------------------
router.get(
  '/:id/stats',
  authenticateToken,
  requirePOSAccess,
  validateUUIDParam('id'),
  POSTerminalController.getTerminalStats
);

// -------------------------------------------------
// GET /api/v1/pos-terminals/:id/products
// Fetch products currently assigned to a terminal
// Used in: POS product management
// -------------------------------------------------
router.get(
  '/:id/products',
  authenticateToken,
  validateUUIDParam('id'),
  POSTerminalController.getTerminalProducts
);

/**
 * ================================
 * ADMIN ROUTES
 * ================================
 * Only Admins can create, update, or delete terminals.
 */

// -------------------------------------------------
// POST /api/v1/pos-terminals
// Create a new POS terminal
// Body: { terminal_name, location, configuration, is_active }
// -------------------------------------------------
router.post(
  '/',
  sanitizeInput,
  authenticateToken,
  requireAdmin,
  validateCreatePOSTerminal,
  POSTerminalController.createTerminal
);

// -------------------------------------------------
// PUT /api/v1/pos-terminals/:id
// Update an existing POS terminal
// Params: id (UUID)
// Body: { terminal_name, location, configuration, is_active }
// -------------------------------------------------
router.put(
  '/:id',
  sanitizeInput,
  authenticateToken,
  requireAdmin,
  validateUpdatePOSTerminal,
  POSTerminalController.updateTerminal
);

// -------------------------------------------------
// PUT /api/v1/pos-terminals/:id/configuration
// Update only the configuration object for a terminal
// Access: POS operators can update their own config
// -------------------------------------------------
router.put(
  '/:id/configuration',
  sanitizeInput,
  authenticateToken,
  requirePOSAccess,
  validateUUIDParam('id'),
  POSTerminalController.updateTerminalConfiguration
);

// -------------------------------------------------
// DELETE /api/v1/pos-terminals/:id
// Soft delete (set is_active = false) a terminal
// Params: id (UUID)
// -------------------------------------------------
router.delete(
  '/:id',
  authenticateToken,
  requireAdmin,
  validateUUIDParam('id'),
  POSTerminalController.deleteTerminal
);

/**
 * ================================
 * PRODUCT MANAGEMENT ROUTES
 * ================================
 * Manage product assignments per terminal.
 * Both POS operators and Admins can use these.
 */

// -------------------------------------------------
// POST /api/v1/pos-terminals/:id/products
// Bulk assign products to a terminal
// Body: { product_ids: [UUID, UUID, ...] }
// -------------------------------------------------
router.post(
  '/:id/products',
  sanitizeInput,
  authenticateToken,
  requirePOSAccess,
  validateProductAssignment,
  POSTerminalController.assignProductsToTerminal
);

// -------------------------------------------------
// DELETE /api/v1/pos-terminals/:id/products
// Bulk remove products from a terminal
// Body: { product_ids: [UUID, UUID, ...] }
// -------------------------------------------------
router.delete(
  '/:id/products',
  sanitizeInput,
  authenticateToken,
  requirePOSAccess,
  validateProductAssignment,
  POSTerminalController.removeProductsFromTerminal
);

export default router;
