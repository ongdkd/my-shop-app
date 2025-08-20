import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';

// Comprehensive input sanitization utilities

export class InputSanitizer {
  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  static sanitizeHtml(input: string): string {
    if (typeof input !== 'string') return '';
    
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [], // No HTML tags allowed
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
    });
  }

  /**
   * Sanitize and validate email addresses
   */
  static sanitizeEmail(email: string): string {
    if (typeof email !== 'string') return '';
    
    const sanitized = validator.normalizeEmail(email.trim()) || '';
    return validator.isEmail(sanitized) ? sanitized : '';
  }

  /**
   * Sanitize strings for database storage
   */
  static sanitizeString(input: string, maxLength: number = 255): string {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .slice(0, maxLength)
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .replace(/[<>]/g, ''); // Remove potential HTML brackets
  }

  /**
   * Sanitize numeric inputs
   */
  static sanitizeNumber(input: any, options: { min?: number; max?: number; isInteger?: boolean } = {}): number | null {
    const num = Number(input);
    
    if (isNaN(num) || !isFinite(num)) {
      return null;
    }
    
    if (options.isInteger && !Number.isInteger(num)) {
      return null;
    }
    
    if (options.min !== undefined && num < options.min) {
      return null;
    }
    
    if (options.max !== undefined && num > options.max) {
      return null;
    }
    
    return num;
  }

  /**
   * Sanitize boolean inputs
   */
  static sanitizeBoolean(input: any): boolean | null {
    if (typeof input === 'boolean') return input;
    if (typeof input === 'string') {
      const lower = input.toLowerCase().trim();
      if (lower === 'true' || lower === '1' || lower === 'yes') return true;
      if (lower === 'false' || lower === '0' || lower === 'no') return false;
    }
    if (typeof input === 'number') {
      return input !== 0;
    }
    return null;
  }

  /**
   * Sanitize URL inputs
   */
  static sanitizeUrl(input: string): string {
    if (typeof input !== 'string') return '';
    
    const trimmed = input.trim();
    
    // Check if it's a valid URL
    if (!validator.isURL(trimmed, {
      protocols: ['http', 'https'],
      require_protocol: true,
      require_valid_protocol: true,
    })) {
      return '';
    }
    
    return trimmed;
  }

  /**
   * Sanitize barcode inputs
   */
  static sanitizeBarcode(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/[^0-9A-Za-z-]/g, '') // Only allow alphanumeric and hyphens
      .slice(0, 50); // Limit length
  }

  /**
   * Sanitize UUID inputs
   */
  static sanitizeUuid(input: string): string {
    if (typeof input !== 'string') return '';
    
    const trimmed = input.trim();
    return validator.isUUID(trimmed) ? trimmed : '';
  }

  /**
   * Sanitize phone numbers
   */
  static sanitizePhone(input: string): string {
    if (typeof input !== 'string') return '';
    
    const cleaned = input.replace(/[^\d+]/g, '');
    return validator.isMobilePhone(cleaned) ? cleaned : '';
  }

  /**
   * Sanitize JSON objects recursively
   */
  static sanitizeObject(obj: any, schema?: SanitizationSchema): any {
    if (obj === null || obj === undefined) return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item, schema));
    }
    
    if (typeof obj === 'object') {
      const sanitized: any = {};
      
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key];
          const fieldSchema = schema?.[key];
          
          if (fieldSchema) {
            sanitized[key] = this.sanitizeField(value, fieldSchema);
          } else {
            // Default sanitization for unknown fields
            if (typeof value === 'string') {
              sanitized[key] = this.sanitizeString(value);
            } else {
              sanitized[key] = this.sanitizeObject(value);
            }
          }
        }
      }
      
      return sanitized;
    }
    
    return obj;
  }

  /**
   * Sanitize individual field based on schema
   */
  private static sanitizeField(value: any, schema: FieldSchema): any {
    switch (schema.type) {
      case 'string':
        return this.sanitizeString(value, schema.maxLength);
      case 'email':
        return this.sanitizeEmail(value);
      case 'url':
        return this.sanitizeUrl(value);
      case 'number':
        return this.sanitizeNumber(value, {
          min: schema.min,
          max: schema.max,
          isInteger: schema.isInteger,
        });
      case 'boolean':
        return this.sanitizeBoolean(value);
      case 'uuid':
        return this.sanitizeUuid(value);
      case 'barcode':
        return this.sanitizeBarcode(value);
      case 'phone':
        return this.sanitizePhone(value);
      case 'html':
        return this.sanitizeHtml(value);
      case 'object':
        return this.sanitizeObject(value, schema.properties);
      case 'array':
        if (Array.isArray(value)) {
          return value.map(item => 
            schema.items ? this.sanitizeField(item, schema.items) : item
          );
        }
        return [];
      default:
        return value;
    }
  }

  /**
   * Remove potentially dangerous characters from file names
   */
  static sanitizeFileName(fileName: string): string {
    if (typeof fileName !== 'string') return '';
    
    return fileName
      .trim()
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars with underscore
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .slice(0, 255); // Limit length
  }

  /**
   * Sanitize SQL-like inputs (basic protection)
   */
  static sanitizeSqlInput(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/[';-]/g, '') // Remove common SQL injection patterns
      .replace(/\b(DROP|DELETE|INSERT|UPDATE|SELECT|UNION|ALTER|CREATE)\b/gi, '') // Remove SQL keywords
      .slice(0, 1000); // Limit length
  }
}

// Schema types for sanitization
export interface FieldSchema {
  type: 'string' | 'email' | 'url' | 'number' | 'boolean' | 'uuid' | 'barcode' | 'phone' | 'html' | 'object' | 'array';
  maxLength?: number;
  min?: number;
  max?: number;
  isInteger?: boolean;
  properties?: SanitizationSchema;
  items?: FieldSchema;
}

export interface SanitizationSchema {
  [key: string]: FieldSchema;
}

// Predefined schemas for common data types
export const PRODUCT_SANITIZATION_SCHEMA: SanitizationSchema = {
  barcode: { type: 'barcode' },
  name: { type: 'string', maxLength: 255 },
  price: { type: 'number', min: 0 },
  image_url: { type: 'url' },
  category: { type: 'string', maxLength: 100 },
  stock_quantity: { type: 'number', min: 0, isInteger: true },
  is_active: { type: 'boolean' },
};

export const ORDER_SANITIZATION_SCHEMA: SanitizationSchema = {
  pos_terminal_id: { type: 'uuid' },
  customer_id: { type: 'uuid' },
  payment_method: { type: 'string', maxLength: 20 },
  order_items: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        product_id: { type: 'uuid' },
        quantity: { type: 'number', min: 1, isInteger: true },
        unit_price: { type: 'number', min: 0 },
      },
    },
  },
};

export const POS_TERMINAL_SANITIZATION_SCHEMA: SanitizationSchema = {
  terminal_name: { type: 'string', maxLength: 100 },
  location: { type: 'string', maxLength: 255 },
  is_active: { type: 'boolean' },
  configuration: { type: 'object' },
};

export const USER_SANITIZATION_SCHEMA: SanitizationSchema = {
  email: { type: 'email' },
  role: { type: 'string', maxLength: 20 },
};