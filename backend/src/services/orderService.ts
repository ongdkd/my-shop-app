import { supabaseAdmin } from './supabaseClient';
import {
  Order,
  OrderInsert,
  OrderWithItems,
  OrderItem,
  OrderItemInsert,
  CreateOrderRequest,
  OrderQueryParams,
  ServiceResponse,
  PaginatedResponse,
} from '../types';

export class OrderService {
  /**
   * Generate a unique order number
   */
  private static generateOrderNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = Date.now().toString().slice(-6);
    return `ORD-${dateStr}-${timeStr}`;
  }

  /**
   * Create a new order with order items
   */
  static async createOrder(orderData: CreateOrderRequest): Promise<ServiceResponse<OrderWithItems>> {
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

      // Calculate total amount
      const totalAmount = orderData.order_items.reduce(
        (sum, item) => sum + (item.quantity * item.unit_price),
        0
      );

      // Create order data
      const orderInsert: OrderInsert = {
        order_number: this.generateOrderNumber(),
        pos_terminal_id: orderData.pos_terminal_id,
        customer_id: orderData.customer_id,
        total_amount: totalAmount,
        payment_method: orderData.payment_method,
        order_status: 'completed',
      };

      // Start transaction by creating the order first
      const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert(orderInsert)
        .select()
        .single();

      if (orderError) {
        return {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: orderError.message,
            details: orderError,
          },
        };
      }

      // Create order items
      const orderItems: OrderItemInsert[] = orderData.order_items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.quantity * item.unit_price,
      }));

      const { data: items, error: itemsError } = await supabaseAdmin
        .from('order_items')
        .insert(orderItems)
        .select(`
          *,
          product:products(*)
        `);

      if (itemsError) {
        // Rollback: delete the order if items creation failed
        await supabaseAdmin.from('orders').delete().eq('id', order.id);
        
        return {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: itemsError.message,
            details: itemsError,
          },
        };
      }

      // Return complete order with items
      const orderWithItems: OrderWithItems = {
        ...order,
        order_items: items || [],
      };

      return {
        success: true,
        data: orderWithItems,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create order',
          details: error,
        },
      };
    }
  }

  /**
   * Get all orders with optional filtering and pagination
   */
  static async getOrders(params: OrderQueryParams = {}): Promise<ServiceResponse<PaginatedResponse<OrderWithItems>>> {
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
        pos_terminal_id,
        start_date,
        end_date,
        order_status,
        payment_method,
      } = params;

      const offset = (page - 1) * limit;

      let query = supabaseAdmin
        .from('orders')
        .select(`
          *,
          order_items(
            *,
            product:products(*)
          ),
          pos_terminal:pos_terminals(*),
          customer:customers(*)
        `, { count: 'exact' })
        .range(offset, offset + limit - 1)
        .order('order_date', { ascending: false });

      // Apply filters
      if (pos_terminal_id) {
        query = query.eq('pos_terminal_id', pos_terminal_id);
      }

      if (start_date) {
        query = query.gte('order_date', start_date);
      }

      if (end_date) {
        query = query.lte('order_date', end_date);
      }

      if (order_status) {
        query = query.eq('order_status', order_status);
      }

      if (payment_method) {
        query = query.eq('payment_method', payment_method);
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
          message: 'Failed to fetch orders',
          details: error,
        },
      };
    }
  }

  /**
   * Get a single order by ID with all details
   */
  static async getOrderById(id: string): Promise<ServiceResponse<OrderWithItems>> {
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
        .from('orders')
        .select(`
          *,
          order_items(
            *,
            product:products(*)
          ),
          pos_terminal:pos_terminals(*),
          customer:customers(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: {
              code: 'ORDER_NOT_FOUND',
              message: 'Order not found',
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
          message: 'Failed to fetch order',
          details: error,
        },
      };
    }
  }

  /**
   * Get orders by POS terminal
   */
  static async getOrdersByTerminal(terminalId: string, params: OrderQueryParams = {}): Promise<ServiceResponse<PaginatedResponse<OrderWithItems>>> {
    return this.getOrders({
      ...params,
      pos_terminal_id: terminalId,
    });
  }

  /**
   * Get orders by date range
   */
  static async getOrdersByDateRange(startDate: string, endDate: string, params: OrderQueryParams = {}): Promise<ServiceResponse<PaginatedResponse<OrderWithItems>>> {
    return this.getOrders({
      ...params,
      start_date: startDate,
      end_date: endDate,
    });
  }

  /**
   * Get sales summary for a date range
   */
  static async getSalesSummary(startDate: string, endDate: string): Promise<ServiceResponse<any>> {
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

      // Get orders in date range
      const { data: orders, error } = await supabaseAdmin
        .from('orders')
        .select(`
          *,
          order_items(
            *,
            product:products(name, category)
          ),
          pos_terminal:pos_terminals(terminal_name)
        `)
        .gte('order_date', startDate)
        .lte('order_date', endDate)
        .eq('order_status', 'completed');

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

      // Calculate summary statistics
      const totalOrders = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Group by payment method
      const byPaymentMethod = orders?.reduce((acc, order) => {
        const method = order.payment_method;
        if (!acc[method]) {
          acc[method] = { count: 0, total: 0 };
        }
        acc[method].count++;
        acc[method].total += order.total_amount;
        return acc;
      }, {} as Record<string, { count: number; total: number }>) || {};

      // Group by terminal
      const byTerminal = orders?.reduce((acc, order) => {
        const terminalName = order.pos_terminal?.terminal_name || 'Unknown';
        if (!acc[terminalName]) {
          acc[terminalName] = { count: 0, total: 0 };
        }
        acc[terminalName].count++;
        acc[terminalName].total += order.total_amount;
        return acc;
      }, {} as Record<string, { count: number; total: number }>) || {};

      // Top products
      const productSales = orders?.flatMap(order => 
        order.order_items?.map(item => ({
          name: item.product?.name || 'Unknown Product',
          quantity: item.quantity,
          revenue: item.line_total,
        })) || []
      ) || [];

      const topProducts = Object.values(
        productSales.reduce((acc, item) => {
          if (!acc[item.name]) {
            acc[item.name] = { name: item.name, quantity: 0, revenue: 0 };
          }
          acc[item.name].quantity += item.quantity;
          acc[item.name].revenue += item.revenue;
          return acc;
        }, {} as Record<string, { name: string; quantity: number; revenue: number }>)
      ).sort((a: { revenue: number }, b: { revenue: number }) => b.revenue - a.revenue).slice(0, 10);

      const summary = {
        period: { start_date: startDate, end_date: endDate },
        summary: {
          total_orders: totalOrders,
          total_revenue: totalRevenue,
          average_order_value: averageOrderValue,
        },
        by_payment_method: Object.entries(byPaymentMethod).map(([method, data]: [string, { count: number; total: number }]) => ({
          payment_method: method,
          order_count: data.count,
          total_amount: data.total,
        })),
        by_terminal: Object.entries(byTerminal).map(([terminal, data]: [string, { count: number; total: number }]) => ({
          terminal_name: terminal,
          order_count: data.count,
          total_amount: data.total,
        })),
        top_products: topProducts,
      };

      return {
        success: true,
        data: summary,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to generate sales summary',
          details: error,
        },
      };
    }
  }
}