import { Router } from 'express';
import { authenticateToken, requirePOSAccess } from '../middleware/auth';
import {
  validateCreateOrder,
  validateOrderQuery,
  validateUUIDParam,
  sanitizeInput,
} from '../middleware/validation';
import { OrdersController } from '../controllers/orderController';

const router = Router();

/**
 * ================================
 * ORDER ROUTES
 * ================================
 * All order-related routes require authentication,
 * since order data is considered sensitive.
 */

// -------------------------------------------------
// GET /api/v1/orders
// Fetch all orders with optional filters & pagination
// Query params: ?limit, ?page, ?fields
// Used in: Admin Dashboard (order list & stats)
// -------------------------------------------------
router.get(
  '/',
  authenticateToken,
  validateOrderQuery,
  OrdersController.getAllOrders
);

// -------------------------------------------------
// GET /api/v1/orders/date-range
// Fetch orders within a specific date range
// Query params: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// Used in: Reports & analytics
// -------------------------------------------------
router.get(
  '/date-range',
  authenticateToken,
  OrdersController.getOrdersByDateRange
);

// -------------------------------------------------
// GET /api/v1/orders/reports/summary
// Fetch aggregated sales summary (e.g. total revenue)
// Access: POS operators + Admins
// Used in: Sales dashboards
// -------------------------------------------------
router.get(
  '/reports/summary',
  authenticateToken,
  requirePOSAccess,
  OrdersController.getSalesSummary
);

// -------------------------------------------------
// GET /api/v1/orders/terminal/:terminalId
// Fetch all orders linked to a specific POS terminal
// Params: terminalId (UUID)
// Used in: POS operator dashboards
// -------------------------------------------------
router.get(
  '/terminal/:terminalId',
  authenticateToken,
  validateUUIDParam('terminalId'),
  OrdersController.getOrdersByTerminal
);

// -------------------------------------------------
// GET /api/v1/orders/:id
// Fetch a single order by ID with full details
// NOTE: This must come AFTER more specific routes
// Used in: Order detail views, receipts
// -------------------------------------------------
router.get(
  '/:id',
  authenticateToken,
  validateUUIDParam('id'),
  OrdersController.getOrderById
);

/**
 * ================================
 * POS OPERATOR ROUTES
 * ================================
 * These require POS access or Admin privileges.
 */

// -------------------------------------------------
// POST /api/v1/orders
// Create a new order along with order items
// Body: { order: {...}, items: [...] }
// Used in: POS checkout flow
// -------------------------------------------------
router.post(
  '/',
  sanitizeInput,
  authenticateToken,
  requirePOSAccess,
  validateCreateOrder,
  OrdersController.createOrder
);

export default router;
