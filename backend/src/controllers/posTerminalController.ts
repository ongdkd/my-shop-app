import { Response, NextFunction } from 'express';
import { POSTerminalService } from '../services/posTerminalService';
import { 
  AuthenticatedRequest, 
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
  static async getAllTerminals(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
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
  static async getTerminalById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
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
  static async createTerminal(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
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
  static async updateTerminal(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
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
  static async deleteTerminal(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
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
  static async getTerminalConfiguration(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
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
  static async updateTerminalConfiguration(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
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
  static async getTerminalStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
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
}