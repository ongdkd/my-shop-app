import { Router } from 'express';
import { authenticateToken, requirePOSAccess } from '../middleware/auth';
import {
  validateCreateOrder,
  validateOrderQuery,
  validateUUIDParam,
  sanitizeInput,
} from '../middleware/validation';
import { OrderController } from '../controllers/orderController';

const router = Router();

// =============================================
// AUTHENTICATED ROUTES - REQUIRE LOGIN
// =============================================
// All order routes require authentication as they contain sensitive business data

// GET /api/v1/orders - Get all orders with filtering and pagination
router.get(
  '/',
  authenticateToken,
  validateOrderQuery,
  OrderController.getOrders
);

// GET /api/v1/orders/date-range - Get orders by date range
router.get(
  '/date-range',
  authenticateToken,
  OrderController.getOrdersByDateRange
);

// GET /api/v1/orders/reports/summary - Get sales summary for reporting
router.get(
  '/reports/summary',
  authenticateToken,
  requirePOSAccess, // Only POS operators and admins can view reports
  OrderController.getSalesSummary
);

// GET /api/v1/orders/terminal/:terminalId - Get orders by POS terminal
router.get(
  '/terminal/:terminalId',
  authenticateToken,
  validateUUIDParam('terminalId'),
  OrderController.getOrdersByTerminal
);

// GET /api/v1/orders/:id - Get single order by ID with full details
// IMPORTANT: This wildcard route must come AFTER all specific routes above
router.get(
  '/:id',
  authenticateToken,
  validateUUIDParam('id'),
  OrderController.getOrderById
);

// =============================================
// POS OPERATOR ROUTES - REQUIRE POS ACCESS
// =============================================

// POST /api/v1/orders - Create new order with order items
router.post(
  '/',
  sanitizeInput,
  authenticateToken,
  requirePOSAccess, // Only POS operators and admins can create orders
  validateCreateOrder,
  OrderController.createOrder
);

export default router;