import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/productService';
import { 
  AuthenticatedRequest, 
  SuccessResponse, 
  ProductQueryParams,
  CreateProductRequest,
  UpdateProductRequest,
  HttpStatusCode 
} from '../types';

export class ProductController {
  /**
   * Get all products with filtering and pagination
   * GET /api/v1/products
   */
  static async getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryParams: ProductQueryParams = {
        page: parseInt(req.query['page'] as string) || 1,
        limit: Math.min(parseInt(req.query['limit'] as string) || 20, 100), // Max 100 items per page
        category: req.query['category'] as string,
        search: req.query['search'] as string,
        is_active: req.query['is_active'] !== undefined ? req.query['is_active'] === 'true' : true,
      };

      const result = await ProductService.getProducts(queryParams);

      if (!result.success) {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
          success: false,
          error: result.error,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(HttpStatusCode.OK).json(result.data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single product by ID
   * GET /api/v1/products/:id
   */
  static async getProductById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await ProductService.getProductById(id);

      if (!result.success) {
        const statusCode = result.error?.code === 'PRODUCT_NOT_FOUND' 
          ? HttpStatusCode.NOT_FOUND 
          : HttpStatusCode.INTERNAL_SERVER_ERROR;

        res.status(statusCode).json({
          success: false,
          error: result.error,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const response: SuccessResponse = {
        success: true,
        data: result.data,
        timestamp: new Date().toISOString(),
      };

      res.status(HttpStatusCode.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a product by barcode
   * GET /api/v1/products/barcode/:barcode
   */
  static async getProductByBarcode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { barcode } = req.params;
      const result = await ProductService.getProductByBarcode(barcode);

      if (!result.success) {
        const statusCode = result.error?.code === 'PRODUCT_NOT_FOUND' 
          ? HttpStatusCode.NOT_FOUND 
          : HttpStatusCode.INTERNAL_SERVER_ERROR;

        res.status(statusCode).json({
          success: false,
          error: result.error,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const response: SuccessResponse = {
        success: true,
        data: result.data,
        timestamp: new Date().toISOString(),
      };

      res.status(HttpStatusCode.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new product
   * POST /api/v1/products
   */
  static async createProduct(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const productData: CreateProductRequest = req.body;
      const result = await ProductService.createProduct(productData);

      if (!result.success) {
        const statusCode = result.error?.code === 'DUPLICATE_BARCODE' 
          ? HttpStatusCode.CONFLICT 
          : HttpStatusCode.INTERNAL_SERVER_ERROR;

        res.status(statusCode).json({
          success: false,
          error: result.error,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const response: SuccessResponse = {
        success: true,
        data: result.data,
        timestamp: new Date().toISOString(),
      };

      res.status(HttpStatusCode.CREATED).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a product
   * PUT /api/v1/products/:id
   */
  static async updateProduct(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const productData: UpdateProductRequest = req.body;
      
      const result = await ProductService.updateProduct(id, productData);

      if (!result.success) {
        let statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;
        
        if (result.error?.code === 'PRODUCT_NOT_FOUND') {
          statusCode = HttpStatusCode.NOT_FOUND;
        } else if (result.error?.code === 'DUPLICATE_BARCODE') {
          statusCode = HttpStatusCode.CONFLICT;
        }

        res.status(statusCode).json({
          success: false,
          error: result.error,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const response: SuccessResponse = {
        success: true,
        data: result.data,
        timestamp: new Date().toISOString(),
      };

      res.status(HttpStatusCode.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a product (soft delete)
   * DELETE /api/v1/products/:id
   */
  static async deleteProduct(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await ProductService.deleteProduct(id);

      if (!result.success) {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
          success: false,
          error: result.error,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Return 204 No Content for successful deletion
      res.status(HttpStatusCode.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get product categories
   * GET /api/v1/products/categories
   */
  static async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ProductService.getCategories();

      if (!result.success) {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
          success: false,
          error: result.error,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const response: SuccessResponse = {
        success: true,
        data: result.data,
        timestamp: new Date().toISOString(),
      };

      res.status(HttpStatusCode.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk update product stock
   * PATCH /api/v1/products/bulk/stock
   */
  static async bulkUpdateStock(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const updates: Array<{ id: string; stock_quantity: number }> = req.body.updates;

      if (!Array.isArray(updates) || updates.length === 0) {
        res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Updates array is required and must not be empty',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const results = await Promise.all(
        updates.map(async (update) => {
          const result = await ProductService.updateProduct(update.id, {
            stock_quantity: update.stock_quantity,
          });
          return {
            id: update.id,
            success: result.success,
            error: result.error,
          };
        })
      );

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      const response: SuccessResponse = {
        success: true,
        data: {
          total: results.length,
          successful: successCount,
          failed: failureCount,
          results: results,
        },
        timestamp: new Date().toISOString(),
      };

      res.status(HttpStatusCode.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search products by name or barcode
   * GET /api/v1/products/search
   */
  static async searchProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query['q'] as string;
      
      if (!query || query.trim().length < 2) {
        res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'INVALID_SEARCH_QUERY',
            message: 'Search query must be at least 2 characters long',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const queryParams: ProductQueryParams = {
        search: query.trim(),
        limit: Math.min(parseInt(req.query['limit'] as string) || 10, 50), // Max 50 for search
        is_active: true,
      };

      const result = await ProductService.getProducts(queryParams);

      if (!result.success) {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
          success: false,
          error: result.error,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(HttpStatusCode.OK).json(result.data);
    } catch (error) {
      next(error);
    }
  }
}