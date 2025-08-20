import { supabaseAdmin } from './supabaseClient';
import {
  POSTerminal,
  POSTerminalInsert,
  POSTerminalUpdate,
  CreatePOSTerminalRequest,
  UpdatePOSTerminalRequest,
  ServiceResponse,
} from '../types';

export class POSTerminalService {
  /**
   * Get all POS terminals
   */
  static async getAllTerminals(): Promise<ServiceResponse<POSTerminal[]>> {
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
        .from('pos_terminals')
        .select('*')
        .order('created_at', { ascending: false });

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
        data: data || [],
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch POS terminals',
          details: error,
        },
      };
    }
  }

  /**
   * Get active POS terminals only
   */
  static async getActiveTerminals(): Promise<ServiceResponse<POSTerminal[]>> {
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
        .from('pos_terminals')
        .select('*')
        .eq('is_active', true)
        .order('terminal_name', { ascending: true });

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
        data: data || [],
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch active POS terminals',
          details: error,
        },
      };
    }
  }

  /**
   * Get a single POS terminal by ID
   */
  static async getTerminalById(id: string): Promise<ServiceResponse<POSTerminal>> {
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
        .from('pos_terminals')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: {
              code: 'TERMINAL_NOT_FOUND',
              message: 'POS terminal not found',
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
          message: 'Failed to fetch POS terminal',
          details: error,
        },
      };
    }
  }

  /**
   * Create a new POS terminal
   */
  static async createTerminal(terminalData: CreatePOSTerminalRequest): Promise<ServiceResponse<POSTerminal>> {
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

      const insertData: POSTerminalInsert = {
        terminal_name: terminalData.terminal_name,
        location: terminalData.location,
        configuration: terminalData.configuration || {},
        is_active: true,
      };

      const { data, error } = await supabaseAdmin
        .from('pos_terminals')
        .insert(insertData)
        .select()
        .single();

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
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create POS terminal',
          details: error,
        },
      };
    }
  }

  /**
   * Update a POS terminal
   */
  static async updateTerminal(id: string, terminalData: UpdatePOSTerminalRequest): Promise<ServiceResponse<POSTerminal>> {
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

      const updateData: POSTerminalUpdate = {};

      if (terminalData.terminal_name !== undefined) {
        updateData.terminal_name = terminalData.terminal_name;
      }
      if (terminalData.location !== undefined) {
        updateData.location = terminalData.location;
      }
      if (terminalData.is_active !== undefined) {
        updateData.is_active = terminalData.is_active;
      }
      if (terminalData.configuration !== undefined) {
        updateData.configuration = terminalData.configuration;
      }

      const { data, error } = await supabaseAdmin
        .from('pos_terminals')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: {
              code: 'TERMINAL_NOT_FOUND',
              message: 'POS terminal not found',
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
          message: 'Failed to update POS terminal',
          details: error,
        },
      };
    }
  }

  /**
   * Delete a POS terminal (soft delete by setting is_active to false)
   */
  static async deleteTerminal(id: string): Promise<ServiceResponse<void>> {
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
        .from('pos_terminals')
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
          message: 'Failed to delete POS terminal',
          details: error,
        },
      };
    }
  }

  /**
   * Get terminal configuration
   */
  static async getTerminalConfiguration(id: string): Promise<ServiceResponse<Record<string, any>>> {
    try {
      const result = await this.getTerminalById(id);
      
      if (!result.success) {
        return result;
      }

      return {
        success: true,
        data: result.data?.configuration || {},
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch terminal configuration',
          details: error,
        },
      };
    }
  }

  /**
   * Update terminal configuration
   */
  static async updateTerminalConfiguration(id: string, configuration: Record<string, any>): Promise<ServiceResponse<POSTerminal>> {
    return this.updateTerminal(id, { configuration });
  }

  /**
   * Get terminal statistics
   */
  static async getTerminalStats(id: string, days: number = 30): Promise<ServiceResponse<any>> {
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

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: orders, error } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('pos_terminal_id', id)
        .gte('order_date', startDate.toISOString())
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

      const totalOrders = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      const stats = {
        period_days: days,
        total_orders: totalOrders,
        total_revenue: totalRevenue,
        average_order_value: averageOrderValue,
        orders_per_day: totalOrders / days,
      };

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch terminal statistics',
          details: error,
        },
      };
    }
  }
}