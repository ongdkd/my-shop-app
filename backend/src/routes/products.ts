import { Router } from "express";
import { authenticateToken, requirePOSAccess } from "../middleware/auth";
import {
  validateCreateProduct,
  validateUpdateProduct,
  validateProductQuery,
  validateUUIDParam,
  validateBarcodeParam,
  validateBulkStockUpdate,
  validateSearchQuery,
  sanitizeInput,
} from "../middleware/validation";
import { ProductController } from "../controllers/productController";

const router = Router();

// =============================================
// PUBLIC ROUTES (No Authentication Required)
// =============================================
// IMPORTANT: These must come BEFORE any middleware that applies authentication
// and BEFORE any wildcard routes like /:id

// GET /api/v1/products/search - Search products (for POS barcode scanning)
router.get("/search", validateSearchQuery, ProductController.searchProducts);

// GET /api/v1/products/categories - Get product categories
router.get("/categories", ProductController.getCategories);

// GET /api/v1/products/barcode/:barcode - Get product by barcode (for POS scanning)
router.get(
  "/barcode/:barcode",
  validateBarcodeParam,
  ProductController.getProductByBarcode
);

// =============================================
// PROTECTED ROUTES (Authentication Required)
// =============================================

// GET /api/v1/products - Get all products with filtering and pagination
router.get(
  "/",
  authenticateToken,
  validateProductQuery,
  ProductController.getProducts
);

// GET /api/v1/products/:id - Get product by ID
// IMPORTANT: This wildcard route must come AFTER all specific routes above
router.get(  
  "/:id",
  authenticateToken,
  validateUUIDParam("id"),
  ProductController.getProductById
);

// =============================================
// ADMIN ROUTES (POS Access Required)
// =============================================

// POST /api/v1/products - Create new product
router.post(
  "/",
  sanitizeInput,
  authenticateToken,
  requirePOSAccess,
  validateCreateProduct,
  ProductController.createProduct
);

// PUT /api/v1/products/:id - Update product
router.put(
  "/:id",
  sanitizeInput,
  authenticateToken,
  requirePOSAccess,
  validateUpdateProduct,
  ProductController.updateProduct
);

// DELETE /api/v1/products/:id - Delete product (soft delete)
router.delete(
  "/:id",
  authenticateToken,
  requirePOSAccess,
  validateUUIDParam("id"),
  ProductController.deleteProduct
);

// PATCH /api/v1/products/bulk/stock - Bulk update product stock
router.patch(
  "/bulk/stock",
  authenticateToken,
  requirePOSAccess,
  validateBulkStockUpdate,
  ProductController.bulkUpdateStock
);

export default router;
