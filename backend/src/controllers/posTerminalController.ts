import { Request, Response, NextFunction } from 'express';
import { POSTerminalService } from '../services/posTerminalService';
import { 
  SuccessResponse, 
  CreatePOSTerminalRequest,
  UpdatePOSTerminalRequest,
  HttpStatusCode 
} from '../types';

export class POSTerminalController {
  /**
   * Get all POS terminals
   * GET /api/v1/pos-terminals
   */
  static async getAllTerminals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const activeOnly = req.query['active'] === 'true';
      
      const result = activeOnly 
        ? await POSTerminalService.getActiveTerminals()
        : await POSTerminalService.getAllTerminals();

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
   * Get a single POS terminal by ID
   * GET /api/v1/pos-terminals/:id
   */
  static async getTerminalById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await POSTerminalService.getTerminalById(id);

      if (!result.success) {
        const statusCode = result.error?.code === 'TERMINAL_NOT_FOUND' 
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
   * Create a new POS terminal
   * POST /api/v1/pos-terminals
   */
  static async createTerminal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const terminalData: CreatePOSTerminalRequest = req.body;
      const result = await POSTerminalService.createTerminal(terminalData);

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

      res.status(HttpStatusCode.CREATED).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a POS terminal
   * PUT /api/v1/pos-terminals/:id
   */
  static async updateTerminal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const terminalData: UpdatePOSTerminalRequest = req.body;
      
      const result = await POSTerminalService.updateTerminal(id, terminalData);

      if (!result.success) {
        const statusCode = result.error?.code === 'TERMINAL_NOT_FOUND' 
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
   * Delete a POS terminal (soft delete)
   * DELETE /api/v1/pos-terminals/:id
   */
  static async deleteTerminal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await POSTerminalService.deleteTerminal(id);

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
   * Get terminal configuration
   * GET /api/v1/pos-terminals/:id/configuration
   */
  static async getTerminalConfiguration(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await POSTerminalService.getTerminalConfiguration(id);

      if (!result.success) {
        const statusCode = result.error?.code === 'TERMINAL_NOT_FOUND' 
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
   * Update terminal configuration
   * PUT /api/v1/pos-terminals/:id/configuration
   */
  static async updateTerminalConfiguration(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const configuration = req.body;

      // Validate that configuration is an object
      if (!configuration || typeof configuration !== 'object') {
        res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'INVALID_CONFIGURATION',
            message: 'Configuration must be a valid object',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await POSTerminalService.updateTerminalConfiguration(id, configuration);

      if (!result.success) {
        const statusCode = result.error?.code === 'TERMINAL_NOT_FOUND' 
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
   * Get terminal statistics
   * GET /api/v1/pos-terminals/:id/stats
   */
  static async getTerminalStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const days = parseInt(req.query['days'] as string) || 30;

      // Validate days parameter
      if (days < 1 || days > 365) {
        res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'INVALID_DAYS_PARAMETER',
            message: 'Days parameter must be between 1 and 365',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await POSTerminalService.getTerminalStats(id, days);

      if (!result.success) {
        const statusCode = result.error?.code === 'TERMINAL_NOT_FOUND' 
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
   * Get products assigned to a terminal
   * GET /api/v1/pos-terminals/:id/products
   */
  static async getTerminalProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await POSTerminalService.getTerminalProducts(id);

      if (!result.success) {
        const statusCode = result.error?.code === 'TERMINAL_NOT_FOUND' 
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
   * Assign products to a terminal (bulk operation)
   * POST /api/v1/pos-terminals/:id/products
   */
  static async assignProductsToTerminal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { productIds } = req.body;

      // Validate request body
      if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST_BODY',
            message: 'productIds must be a non-empty array of product IDs',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Validate that all productIds are strings (UUIDs)
      const invalidIds = productIds.filter(id => typeof id !== 'string' || !id.trim());
      if (invalidIds.length > 0) {
        res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'INVALID_PRODUCT_IDS',
            message: 'All product IDs must be valid strings',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await POSTerminalService.assignProductsToTerminal(id, productIds);

      if (!result.success) {
        let statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;
        
        if (result.error?.code === 'TERMINAL_NOT_FOUND') {
          statusCode = HttpStatusCode.NOT_FOUND;
        } else if (result.error?.code === 'PRODUCTS_NOT_FOUND' || result.error?.code === 'INVALID_INPUT') {
          statusCode = HttpStatusCode.BAD_REQUEST;
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
        data: { message: 'Products assigned successfully' },
        timestamp: new Date().toISOString(),
      };

      res.status(HttpStatusCode.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove products from a terminal (bulk operation)
   * DELETE /api/v1/pos-terminals/:id/products
   */
  static async removeProductsFromTerminal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { productIds } = req.body;

      // Validate request body
      if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST_BODY',
            message: 'productIds must be a non-empty array of product IDs',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Validate that all productIds are strings (UUIDs)
      const invalidIds = productIds.filter(id => typeof id !== 'string' || !id.trim());
      if (invalidIds.length > 0) {
        res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'INVALID_PRODUCT_IDS',
            message: 'All product IDs must be valid strings',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await POSTerminalService.removeProductsFromTerminal(id, productIds);

      if (!result.success) {
        let statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;
        
        if (result.error?.code === 'TERMINAL_NOT_FOUND') {
          statusCode = HttpStatusCode.NOT_FOUND;
        } else if (result.error?.code === 'INVALID_INPUT') {
          statusCode = HttpStatusCode.BAD_REQUEST;
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
        data: { message: 'Products removed successfully' },
        timestamp: new Date().toISOString(),
      };

      res.status(HttpStatusCode.OK).json(response);
    } catch (error) {
      next(error);
    }
  }
}