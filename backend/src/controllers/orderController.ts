import { Response, NextFunction } from 'express';
import { OrderService } from '../services/orderService';
import { 
  AuthenticatedRequest, 
  SuccessResponse, 
  OrderQueryParams,
  CreateOrderRequest,
  HttpStatusCode 
} from '../types';

export class OrderController {
  /**
   * Get all orders with filtering and pagination
   * GET /api/v1/orders
   */
  static async getOrders(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryParams: OrderQueryParams = {
        page: parseInt(req.query['page'] as string) || 1,
        limit: Math.min(parseInt(req.query['limit'] as string) || 20, 100), // Max 100 items per page
        pos_terminal_id: req.query['pos_terminal_id'] as string,
        start_date: req.query['start_date'] as string,
        end_date: req.query['end_date'] as string,
        order_status: req.query['order_status'] as any,
        payment_method: req.query['payment_method'] as any,
      };

      const result = await OrderService.getOrders(queryParams);

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
   * Get a single order by ID with all details
   * GET /api/v1/orders/:id
   */
  static async getOrderById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await OrderService.getOrderById(id);

      if (!result.success) {
        const statusCode = result.error?.code === 'ORDER_NOT_FOUND' 
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
   * Create a new order with order items
   * POST /api/v1/orders
   */
  static async createOrder(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderData: CreateOrderRequest = req.body;

      // Validate that order has items
      if (!orderData.order_items || orderData.order_items.length === 0) {
        res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'INVALID_ORDER',
            message: 'Order must contain at least one item',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await OrderService.createOrder(orderData);

      if (!result.success) {
        let statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;
        
        if (result.error?.code === 'VALIDATION_ERROR') {
          statusCode = HttpStatusCode.BAD_REQUEST;
        } else if (result.error?.code === 'PRODUCT_NOT_FOUND') {
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
        data: result.data,
        timestamp: new Date().toISOString(),
      };

      res.status(HttpStatusCode.CREATED).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get orders by POS terminal
   * GET /api/v1/orders/terminal/:terminalId
   */
  static async getOrdersByTerminal(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { terminalId } = req.params;
      const queryParams: OrderQueryParams = {
        page: parseInt(req.query['page'] as string) || 1,
        limit: Math.min(parseInt(req.query['limit'] as string) || 20, 100),
        start_date: req.query['start_date'] as string,
        end_date: req.query['end_date'] as string,
        order_status: req.query['order_status'] as any,
        payment_method: req.query['payment_method'] as any,
      };

      const result = await OrderService.getOrdersByTerminal(terminalId, queryParams);

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
   * Get orders by date range
   * GET /api/v1/orders/date-range
   */
  static async getOrdersByDateRange(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const startDate = req.query['start_date'] as string;
      const endDate = req.query['end_date'] as string;

      if (!startDate || !endDate) {
        res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'MISSING_DATE_RANGE',
            message: 'Both start_date and end_date are required',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const queryParams: OrderQueryParams = {
        page: parseInt(req.query['page'] as string) || 1,
        limit: Math.min(parseInt(req.query['limit'] as string) || 20, 100),
        pos_terminal_id: req.query['pos_terminal_id'] as string,
        order_status: req.query['order_status'] as any,
        payment_method: req.query['payment_method'] as any,
      };

      const result = await OrderService.getOrdersByDateRange(startDate, endDate, queryParams);

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
   * Get sales summary for reporting
   * GET /api/v1/orders/reports/summary
   */
  static async getSalesSummary(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const startDate = req.query['start_date'] as string;
      const endDate = req.query['end_date'] as string;

      if (!startDate || !endDate) {
        res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'MISSING_DATE_RANGE',
            message: 'Both start_date and end_date are required for sales summary',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await OrderService.getSalesSummary(startDate, endDate);

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
}