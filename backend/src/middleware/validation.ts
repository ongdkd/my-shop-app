import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { ValidationError } from './errorHandler';

// Generic validation result handler
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const validationErrors = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined,
    }));

    throw new ValidationError('Validation failed', validationErrors);
  }
  
  next();
};

// =============================================
// PRODUCT VALIDATION RULES
// =============================================

export const validateCreateProduct = [
  body('barcode')
    .notEmpty()
    .withMessage('Barcode is required')
    .isLength({ min: 6, max: 50 })
    .withMessage('Barcode must be between 6 and 50 characters')
    .matches(/^[0-9A-Za-z-]+$/)
    .withMessage('Barcode can only contain letters, numbers, and hyphens'),
  
  body('name')
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Product name must be between 1 and 255 characters')
    .trim(),
  
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number')
    .toFloat(),
  
  body('image_url')
    .optional()
    .isURL()
    .withMessage('Image URL must be a valid URL'),
  
  body('category')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Category must be less than 100 characters')
    .trim(),
  
  body('stock_quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer')
    .toInt(),
  
  handleValidationErrors,
];

export const validateUpdateProduct = [
  param('id')
    .isUUID()
    .withMessage('Product ID must be a valid UUID'),
  
  body('barcode')
    .optional()
    .isLength({ min: 6, max: 50 })
    .withMessage('Barcode must be between 6 and 50 characters')
    .matches(/^[0-9A-Za-z-]+$/)
    .withMessage('Barcode can only contain letters, numbers, and hyphens'),
  
  body('name')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Product name must be between 1 and 255 characters')
    .trim(),
  
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number')
    .toFloat(),
  
  body('image_url')
    .optional()
    .isURL()
    .withMessage('Image URL must be a valid URL'),
  
  body('category')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Category must be less than 100 characters')
    .trim(),
  
  body('stock_quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer')
    .toInt(),
  
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean')
    .toBoolean(),
  
  handleValidationErrors,
];

// =============================================
// ORDER VALIDATION RULES
// =============================================

export const validateCreateOrder = [
  body('pos_terminal_id')
    .optional()
    .isUUID()
    .withMessage('POS terminal ID must be a valid UUID'),
  
  body('customer_id')
    .optional()
    .isUUID()
    .withMessage('Customer ID must be a valid UUID'),
  
  body('payment_method')
    .isIn(['cash', 'card', 'digital'])
    .withMessage('Payment method must be cash, card, or digital'),
  
  body('order_items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  
  body('order_items.*.product_id')
    .isUUID()
    .withMessage('Product ID must be a valid UUID'),
  
  body('order_items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer')
    .toInt(),
  
  body('order_items.*.unit_price')
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a positive number')
    .toFloat(),
  
  handleValidationErrors,
];

// =============================================
// POS TERMINAL VALIDATION RULES
// =============================================

export const validateCreatePOSTerminal = [
  body('terminal_name')
    .notEmpty()
    .withMessage('Terminal name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Terminal name must be between 1 and 100 characters')
    .trim(),
  
  body('location')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Location must be less than 255 characters')
    .trim(),
  
  body('configuration')
    .optional()
    .isObject()
    .withMessage('Configuration must be an object'),
  
  handleValidationErrors,
];

export const validateUpdatePOSTerminal = [
  param('id')
    .isUUID()
    .withMessage('Terminal ID must be a valid UUID'),
  
  body('terminal_name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Terminal name must be between 1 and 100 characters')
    .trim(),
  
  body('location')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Location must be less than 255 characters')
    .trim(),
  
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean')
    .toBoolean(),
  
  body('configuration')
    .optional()
    .isObject()
    .withMessage('Configuration must be an object'),
  
  handleValidationErrors,
];

// =============================================
// QUERY PARAMETER VALIDATION
// =============================================

export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  
  handleValidationErrors,
];

export const validateProductQuery = [
  ...validatePagination,
  
  query('category')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Category must be less than 100 characters')
    .trim(),
  
  query('search')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Search term must be less than 255 characters')
    .trim(),
  
  query('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean')
    .toBoolean(),
  
  handleValidationErrors,
];

export const validateOrderQuery = [
  ...validatePagination,
  
  query('pos_terminal_id')
    .optional()
    .isUUID()
    .withMessage('POS terminal ID must be a valid UUID'),
  
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  
  query('order_status')
    .optional()
    .isIn(['pending', 'completed', 'cancelled'])
    .withMessage('Order status must be pending, completed, or cancelled'),
  
  query('payment_method')
    .optional()
    .isIn(['cash', 'card', 'digital'])
    .withMessage('Payment method must be cash, card, or digital'),
  
  handleValidationErrors,
];

// =============================================
// PARAMETER VALIDATION
// =============================================

export const validateUUIDParam = (paramName: string = 'id') => [
  param(paramName)
    .isUUID()
    .withMessage(`${paramName} must be a valid UUID`),
  
  handleValidationErrors,
];

export const validateBarcodeParam = [
  param('barcode')
    .isLength({ min: 6, max: 50 })
    .withMessage('Barcode must be between 6 and 50 characters')
    .matches(/^[0-9A-Za-z-]+$/)
    .withMessage('Barcode can only contain letters, numbers, and hyphens'),
  
  handleValidationErrors,
];

// =============================================
// BULK OPERATIONS VALIDATION
// =============================================

export const validateBulkStockUpdate = [
  body('updates')
    .isArray({ min: 1 })
    .withMessage('Updates array is required and must contain at least one item'),
  
  body('updates.*.id')
    .isUUID()
    .withMessage('Each update must have a valid product ID'),
  
  body('updates.*.stock_quantity')
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer')
    .toInt(),
  
  handleValidationErrors,
];

// =============================================
// SEARCH VALIDATION
// =============================================

export const validateSearchQuery = [
  query('q')
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters')
    .trim(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
    .toInt(),
  
  handleValidationErrors,
];

// =============================================
// AUTHENTICATION VALIDATION
// =============================================

export const validateLogin = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Email must be a valid email address')
    .normalizeEmail()
    .trim(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  handleValidationErrors,
];

export const validateRegister = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Email must be a valid email address')
    .normalizeEmail()
    .trim(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('role')
    .optional()
    .isIn(['admin', 'pos_operator', 'customer'])
    .withMessage('Role must be admin, pos_operator, or customer'),
  
  handleValidationErrors,
];

// =============================================
// SANITIZATION UTILITIES
// =============================================

export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  // Recursively sanitize all string values in request body
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.trim().replace(/[<>]/g, '');
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitizeObject(obj[key]);
        }
      }
      return sanitized;
    }
    
    return obj;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  next();
};

// =============================================
// RATE LIMITING VALIDATION
// =============================================

export const validateRateLimit = (req: Request, res: Response, next: NextFunction): void => {
  // This would typically be handled by a rate limiting middleware like express-rate-limit
  // But we can add basic validation here
  const userAgent = req.get('User-Agent');
  const ip = req.ip;
  
  // Log suspicious activity
  if (!userAgent || userAgent.length < 10) {
    console.warn(`Suspicious request from ${ip}: Missing or short User-Agent`);
  }
  
  next();
};