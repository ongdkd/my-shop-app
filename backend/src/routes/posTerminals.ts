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

// =============================================
// AUTHENTICATED ROUTES - REQUIRE LOGIN
// =============================================
// All POS terminal routes require authentication

// GET /api/v1/pos-terminals - Get all POS terminals (or active only with ?active=true)
router.get(
  '/',
  authenticateToken,
  POSTerminalController.getAllTerminals
);

// GET /api/v1/pos-terminals/:id - Get POS terminal by ID
router.get(
  '/:id',
  authenticateToken,
  validateUUIDParam('id'),
  POSTerminalController.getTerminalById
);

// GET /api/v1/pos-terminals/:id/configuration - Get terminal configuration
router.get(
  '/:id/configuration',
  authenticateToken,
  validateUUIDParam('id'),
  POSTerminalController.getTerminalConfiguration
);

// GET /api/v1/pos-terminals/:id/stats - Get terminal statistics
router.get(
  '/:id/stats',
  authenticateToken,
  requirePOSAccess, // Only POS operators and admins can view stats
  validateUUIDParam('id'),
  POSTerminalController.getTerminalStats
);

// GET /api/v1/pos-terminals/:id/products - Get products assigned to terminal
router.get(
  '/:id/products',
  authenticateToken,
  validateUUIDParam('id'),
  POSTerminalController.getTerminalProducts
);

// =============================================
// ADMIN ROUTES - REQUIRE ADMIN ACCESS
// =============================================
// Terminal management requires admin privileges

// POST /api/v1/pos-terminals - Create new POS terminal
router.post(
  '/',
  sanitizeInput,
  authenticateToken,
  requireAdmin, // Only admins can create terminals
  validateCreatePOSTerminal,
  POSTerminalController.createTerminal
);

// PUT /api/v1/pos-terminals/:id - Update POS terminal
router.put(
  '/:id',
  sanitizeInput,
  authenticateToken,
  requireAdmin, // Only admins can update terminals
  validateUpdatePOSTerminal,
  POSTerminalController.updateTerminal
);

// PUT /api/v1/pos-terminals/:id/configuration - Update terminal configuration
router.put(
  '/:id/configuration',
  sanitizeInput,
  authenticateToken,
  requirePOSAccess, // POS operators can update their terminal config
  validateUUIDParam('id'),
  POSTerminalController.updateTerminalConfiguration
);

// DELETE /api/v1/pos-terminals/:id - Delete POS terminal (soft delete)
router.delete(
  '/:id',
  authenticateToken,
  requireAdmin, // Only admins can delete terminals
  validateUUIDParam('id'),
  POSTerminalController.deleteTerminal
);

// =============================================
// PRODUCT MANAGEMENT ROUTES
// =============================================

// POST /api/v1/pos-terminals/:id/products - Assign products to terminal (bulk)
router.post(
  '/:id/products',
  sanitizeInput,
  authenticateToken,
  requirePOSAccess, // POS operators and admins can assign products
  validateProductAssignment,
  POSTerminalController.assignProductsToTerminal
);

// DELETE /api/v1/pos-terminals/:id/products - Remove products from terminal (bulk)
router.delete(
  '/:id/products',
  sanitizeInput,
  authenticateToken,
  requirePOSAccess, // POS operators and admins can remove products
  validateProductAssignment,
  POSTerminalController.removeProductsFromTerminal
);

export default router;