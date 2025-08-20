import { supabaseAdmin } from './supabaseClient';
import {
  Product,
  ProductInsert,
  ProductUpdate,
  ProductQueryParams,
  ServiceResponse,
  PaginatedResponse,
} from '../types';

export class ProductService {
  /**
   * Get all products with optional filtering and pagination
   */
  static async getProducts(params: ProductQueryParams = {}): Promise<ServiceResponse<PaginatedResponse<Product>>> {
    try {
      if (!supabaseAdmin) {
        return {
          success: false,
          error: {
            code: 'SUPABASE_NOT_CONFIGURED',
            message: 'Database connection not available',
          },
        };
      }

      const {
        page = 1,
        limit = 20,
        category,
        search,
        is_active = true,
      } = params;

      const offset = (page - 1) * limit;

      let query = supabaseAdmin
        .from('products')
        .select('*', { count: 'exact' })
        .eq('is_active', is_active)
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      // Apply filters
      if (category) {
        query = query.eq('category', category);
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,barcode.ilike.%${search}%`);
      }

      const { data, error, count } = await query;

      if (error) {
        return {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: error.message,
            details: error,
          },
        };
      }

      const totalPages = Math.ceil((count || 0) / limit);

      return {
        success: true,
        data: {
          success: true,
          data: data || [],
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch products',
          details: error,
        },
      };
    }
  }

  /**
   * Get a single product by ID
   */
  static async getProductById(id: string): Promise<ServiceResponse<Product>> {
    try {
      if (!supabaseAdmin) {
        return {
          success: false,
          error: {
            code: 'SUPABASE_NOT_CONFIGURED',
            message: 'Database connection not available',
          },
        };
      }

      const { data, error } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: {
              code: 'PRODUCT_NOT_FOUND',
              message: 'Product not found',
            },
          };
        }

        return {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: error.message,
            details: error,
          },
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch product',
          details: error,
        },
      };
    }
  }

  /**
   * Get a product by barcode
   */
  static async getProductByBarcode(barcode: string): Promise<ServiceResponse<Product>> {
    try {
      if (!supabaseAdmin) {
        return {
          success: false,
          error: {
            code: 'SUPABASE_NOT_CONFIGURED',
            message: 'Database connection not available',
          },
        };
      }

      const { data, error } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('barcode', barcode)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: {
              code: 'PRODUCT_NOT_FOUND',
              message: 'Product not found',
            },
          };
        }

        return {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: error.message,
            details: error,
          },
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch product',
          details: error,
        },
      };
    }
  }

  /**
   * Create a new product
   */
  static async createProduct(productData: ProductInsert): Promise<ServiceResponse<Product>> {
    try {
      if (!supabaseAdmin) {
        return {
          success: false,
          error: {
            code: 'SUPABASE_NOT_CONFIGURED',
            message: 'Database connection not available',
          },
        };
      }

      const { data, error } = await supabaseAdmin
        .from('products')
        .insert(productData)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return {
            success: false,
            error: {
              code: 'DUPLICATE_BARCODE',
              message: 'A product with this barcode already exists',
            },
          };
        }

        return {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: error.message,
            details: error,
          },
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create product',
          details: error,
        },
      };
    }
  }

  /**
   * Update a product
   */
  static async updateProduct(id: string, productData: ProductUpdate): Promise<ServiceResponse<Product>> {
    try {
      if (!supabaseAdmin) {
        return {
          success: false,
          error: {
            code: 'SUPABASE_NOT_CONFIGURED',
            message: 'Database connection not available',
          },
        };
      }

      const { data, error } = await supabaseAdmin
        .from('products')
        .update(productData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: {
              code: 'PRODUCT_NOT_FOUND',
              message: 'Product not found',
            },
          };
        }

        if (error.code === '23505') {
          return {
            success: false,
            error: {
              code: 'DUPLICATE_BARCODE',
              message: 'A product with this barcode already exists',
            },
          };
        }

        return {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: error.message,
            details: error,
          },
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update product',
          details: error,
        },
      };
    }
  }

  /**
   * Delete a product (soft delete by setting is_active to false)
   */
  static async deleteProduct(id: string): Promise<ServiceResponse<void>> {
    try {
      if (!supabaseAdmin) {
        return {
          success: false,
          error: {
            code: 'SUPABASE_NOT_CONFIGURED',
            message: 'Database connection not available',
          },
        };
      }

      const { error } = await supabaseAdmin
        .from('products')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        return {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: error.message,
            details: error,
          },
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete product',
          details: error,
        },
      };
    }
  }

  /**
   * Get product categories
   */
  static async getCategories(): Promise<ServiceResponse<string[]>> {
    try {
      if (!supabaseAdmin) {
        return {
          success: false,
          error: {
            code: 'SUPABASE_NOT_CONFIGURED',
            message: 'Database connection not available',
          },
        };
      }

      const { data, error } = await supabaseAdmin
        .from('products')
        .select('category')
        .eq('is_active', true)
        .not('category', 'is', null);

      if (error) {
        return {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: error.message,
            details: error,
          },
        };
      }

      // Extract unique categories
      const categories = [...new Set(data.map(item => item.category).filter(Boolean))];

      return {
        success: true,
        data: categories,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch categories',
          details: error,
        },
      };
    }
  }
}