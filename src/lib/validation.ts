// Frontend validation utilities
import React from 'react';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  email?: boolean;
  url?: boolean;
  numeric?: boolean;
  integer?: boolean;
  custom?: (value: any) => string | null;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export interface ValidationResult {
  isValid: boolean;
  errors: { [key: string]: string };
}

export class FormValidator {
  /**
   * Validate a single field
   */
  static validateField(value: any, rule: ValidationRule): string | null {
    // Required validation
    if (rule.required && (value === null || value === undefined || value === '')) {
      return 'This field is required';
    }

    // Skip other validations if value is empty and not required
    if (!rule.required && (value === null || value === undefined || value === '')) {
      return null;
    }

    const stringValue = String(value);

    // Length validations
    if (rule.minLength && stringValue.length < rule.minLength) {
      return `Must be at least ${rule.minLength} characters long`;
    }

    if (rule.maxLength && stringValue.length > rule.maxLength) {
      return `Must be no more than ${rule.maxLength} characters long`;
    }

    // Numeric validations
    if (rule.numeric || rule.integer || rule.min !== undefined || rule.max !== undefined) {
      const numValue = Number(value);
      
      if (isNaN(numValue)) {
        return 'Must be a valid number';
      }

      if (rule.integer && !Number.isInteger(numValue)) {
        return 'Must be a whole number';
      }

      if (rule.min !== undefined && numValue < rule.min) {
        return `Must be at least ${rule.min}`;
      }

      if (rule.max !== undefined && numValue > rule.max) {
        return `Must be no more than ${rule.max}`;
      }
    }

    // Email validation
    if (rule.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(stringValue)) {
        return 'Must be a valid email address';
      }
    }

    // URL validation
    if (rule.url) {
      try {
        new URL(stringValue);
      } catch {
        return 'Must be a valid URL';
      }
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(stringValue)) {
      return 'Invalid format';
    }

    // Custom validation
    if (rule.custom) {
      const customError = rule.custom(value);
      if (customError) {
        return customError;
      }
    }

    return null;
  }

  /**
   * Validate an entire object against a schema
   */
  static validate(data: any, schema: ValidationSchema): ValidationResult {
    const errors: { [key: string]: string } = {};

    for (const field in schema) {
      const rule = schema[field];
      const value = data[field];
      const error = this.validateField(value, rule);

      if (error) {
        errors[field] = error;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Sanitize input values
   */
  static sanitize(value: any, type: 'string' | 'number' | 'email' | 'url' = 'string'): any {
    if (value === null || value === undefined) {
      return value;
    }

    switch (type) {
      case 'string':
        return String(value).trim();
      case 'number':
        const num = Number(value);
        return isNaN(num) ? null : num;
      case 'email':
        return String(value).trim().toLowerCase();
      case 'url':
        return String(value).trim();
      default:
        return value;
    }
  }

  /**
   * Sanitize an entire object
   */
  static sanitizeObject(data: any, schema: { [key: string]: 'string' | 'number' | 'email' | 'url' }): any {
    const sanitized: any = {};

    for (const field in data) {
      const type = schema[field] || 'string';
      sanitized[field] = this.sanitize(data[field], type);
    }

    return sanitized;
  }
}

// Predefined validation schemas
export const PRODUCT_VALIDATION_SCHEMA: ValidationSchema = {
  barcode: {
    required: true,
    minLength: 6,
    maxLength: 50,
    pattern: /^[0-9A-Za-z-]+$/,
  },
  name: {
    required: true,
    minLength: 1,
    maxLength: 255,
  },
  price: {
    required: true,
    numeric: true,
    min: 0,
  },
  image_url: {
    url: true,
  },
  category: {
    maxLength: 100,
  },
  stock_quantity: {
    numeric: true,
    integer: true,
    min: 0,
  },
};

export const ORDER_VALIDATION_SCHEMA: ValidationSchema = {
  payment_method: {
    required: true,
    custom: (value) => {
      const validMethods = ['cash', 'card', 'digital'];
      return validMethods.includes(value) ? null : 'Invalid payment method';
    },
  },
  order_items: {
    required: true,
    custom: (value) => {
      if (!Array.isArray(value) || value.length === 0) {
        return 'Order must contain at least one item';
      }
      return null;
    },
  },
};

export const POS_TERMINAL_VALIDATION_SCHEMA: ValidationSchema = {
  terminal_name: {
    required: true,
    minLength: 1,
    maxLength: 100,
  },
  location: {
    maxLength: 255,
  },
};

export const LOGIN_VALIDATION_SCHEMA: ValidationSchema = {
  email: {
    required: true,
    email: true,
  },
  password: {
    required: true,
    minLength: 6,
  },
};

export const REGISTER_VALIDATION_SCHEMA: ValidationSchema = {
  email: {
    required: true,
    email: true,
  },
  password: {
    required: true,
    minLength: 8,
    custom: (value) => {
      const hasUpper = /[A-Z]/.test(value);
      const hasLower = /[a-z]/.test(value);
      const hasNumber = /\d/.test(value);
      const hasSpecial = /[@$!%*?&]/.test(value);

      if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
        return 'Password must contain uppercase, lowercase, number, and special character';
      }
      return null;
    },
  },
};

// Real-time validation hook for React components
export const useFormValidation = (initialData: any, schema: ValidationSchema) => {
  const [data, setData] = React.useState(initialData);
  const [errors, setErrors] = React.useState<{ [key: string]: string }>({});
  const [touched, setTouched] = React.useState<{ [key: string]: boolean }>({});

  const validateField = (field: string, value: any) => {
    const rule = schema[field];
    if (!rule) return;

    const error = FormValidator.validateField(value, rule);
    setErrors(prev => ({
      ...prev,
      [field]: error || '',
    }));
  };

  const handleChange = (field: string, value: any) => {
    setData((prev: any) => ({ ...prev, [field]: value }));
    
    if (touched[field]) {
      validateField(field, value);
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, data[field]);
  };

  const validateAll = () => {
    const result = FormValidator.validate(data, schema);
    setErrors(result.errors);
    
    // Mark all fields as touched
    const allTouched: { [key: string]: boolean } = {};
    Object.keys(schema).forEach(field => {
      allTouched[field] = true;
    });
    setTouched(allTouched);

    return result.isValid;
  };

  const reset = () => {
    setData(initialData);
    setErrors({});
    setTouched({});
  };

  return {
    data,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    reset,
    isValid: Object.keys(errors).every(key => !errors[key]),
  };
};

// Utility functions for common validations
export const ValidationUtils = {
  isValidBarcode: (barcode: string): boolean => {
    return /^[0-9A-Za-z-]{6,50}$/.test(barcode);
  },

  isValidPrice: (price: number): boolean => {
    return typeof price === 'number' && price >= 0 && isFinite(price);
  },

  isValidQuantity: (quantity: number): boolean => {
    return Number.isInteger(quantity) && quantity > 0;
  },

  isValidEmail: (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  isValidUUID: (uuid: string): boolean => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
  },

  sanitizeInput: (input: string): string => {
    return input.trim().replace(/[<>]/g, '');
  },

  formatPrice: (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  },

  formatDate: (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  },
};