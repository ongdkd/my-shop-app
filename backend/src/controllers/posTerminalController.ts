// controllers/posTerminalController.ts
import { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class POSTerminalController {
  // ======================================
  // GET /api/v1/pos-terminals
  // Supports: ?active=true, ?fields, ?limit
  // ======================================
  static async getAllTerminals(req: Request, res: Response) {
    try {
      const { active, limit = "100", fields } = req.query;
      const limitNum = Math.min(parseInt(limit as string, 10) || 100, 200);

      const selectFields =
        typeof fields === "string"
          ? fields
          : "id,terminal_name,is_active,configuration";

      let query = supabase.from("pos_terminals").select(selectFields);

      if (active === "true") {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query.limit(limitNum);

      if (error) throw error;
      return res.json({ data });
    } catch (error: any) {
      console.error("Error fetching POS terminals:", error.message);
      return res.status(500).json({ error: "Failed to fetch POS terminals" });
    }
  }

  // ======================================
  // GET /api/v1/pos-terminals/:id
  // ======================================
  static async getTerminalById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from("pos_terminals")
        .select("id,terminal_name,is_active,configuration")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (!data) {
        return res.status(404).json({ error: "Terminal not found" });
      }

      return res.json({ data });
    } catch (error: any) {
      console.error("Error fetching terminal by ID:", error.message);
      return res.status(500).json({ error: "Failed to fetch terminal" });
    }
  }

  // ======================================
  // GET /api/v1/pos-terminals/:id/configuration
  // ======================================
  static async getTerminalConfiguration(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from("pos_terminals")
        .select("configuration")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (!data) {
        return res.status(404).json({ error: "Configuration not found" });
      }

      return res.json({ configuration: data.configuration });
    } catch (error: any) {
      console.error("Error fetching terminal configuration:", error.message);
      return res.status(500).json({ error: "Failed to fetch configuration" });
    }
  }

  // ======================================
  // GET /api/v1/pos-terminals/:id/stats
  // Example: count orders & total sales for a terminal
  // ======================================
  static async getTerminalStats(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from("orders")
        .select("total_amount", { count: "exact" })
        .eq("terminal_id", id);

      if (error) throw error;

      const totalOrders = data?.length || 0;
      const totalRevenue =
        data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      return res.json({ totalOrders, totalRevenue });
    } catch (error: any) {
      console.error("Error fetching terminal stats:", error.message);
      return res.status(500).json({ error: "Failed to fetch terminal stats" });
    }
  }

  // ======================================
  // GET /api/v1/pos-terminals/:id/products
  // ======================================
  static async getTerminalProducts(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from("terminal_products")
        .select("product_id, products(*)") // assumes relation products(id,...)
        .eq("terminal_id", id);

      if (error) throw error;
      return res.json({ data });
    } catch (error: any) {
      console.error("Error fetching terminal products:", error.message);
      return res.status(500).json({ error: "Failed to fetch terminal products" });
    }
  }

  // ======================================
  // POST /api/v1/pos-terminals
  // ======================================
  static async createTerminal(req: Request, res: Response) {
    try {
      const terminal = req.body;

      const { data, error } = await supabase
        .from("pos_terminals")
        .insert(terminal)
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json({ data });
    } catch (error: any) {
      console.error("Error creating terminal:", error.message);
      return res.status(500).json({ error: "Failed to create terminal" });
    }
  }

  // ======================================
  // PUT /api/v1/pos-terminals/:id
  // ======================================
  static async updateTerminal(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const { data, error } = await supabase
        .from("pos_terminals")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return res.json({ data });
    } catch (error: any) {
      console.error("Error updating terminal:", error.message);
      return res.status(500).json({ error: "Failed to update terminal" });
    }
  }

  // ======================================
  // PUT /api/v1/pos-terminals/:id/configuration
  // ======================================
  static async updateTerminalConfiguration(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { configuration } = req.body;

      const { data, error } = await supabase
        .from("pos_terminals")
        .update({ configuration })
        .eq("id", id)
        .select("configuration")
        .single();

      if (error) throw error;
      return res.json({ configuration: data.configuration });
    } catch (error: any) {
      console.error("Error updating terminal configuration:", error.message);
      return res.status(500).json({ error: "Failed to update configuration" });
    }
  }

  // ======================================
  // DELETE /api/v1/pos-terminals/:id
  // Soft delete (set is_active = false)
  // ======================================
  static async deleteTerminal(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from("pos_terminals")
        .update({ is_active: false })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return res.json({ message: "Terminal deactivated", data });
    } catch (error: any) {
      console.error("Error deleting terminal:", error.message);
      return res.status(500).json({ error: "Failed to delete terminal" });
    }
  }

  // ======================================
  // POST /api/v1/pos-terminals/:id/products
  // Bulk assign products to terminal
  // Body: { product_ids: [...] }
  // ======================================
  static async assignProductsToTerminal(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { product_ids } = req.body;

      if (!Array.isArray(product_ids) || product_ids.length === 0) {
        return res.status(400).json({ error: "product_ids must be a non-empty array" });
      }

      const rows = product_ids.map((pid: string) => ({
        terminal_id: id,
        product_id: pid,
      }));

      const { data, error } = await supabase
        .from("terminal_products")
        .insert(rows);

      if (error) throw error;
      return res.status(201).json({ data });
    } catch (error: any) {
      console.error("Error assigning products:", error.message);
      return res.status(500).json({ error: "Failed to assign products" });
    }
  }

  // ======================================
  // DELETE /api/v1/pos-terminals/:id/products
  // Bulk remove products from terminal
  // Body: { product_ids: [...] }
  // ======================================
  static async removeProductsFromTerminal(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { product_ids } = req.body;

      if (!Array.isArray(product_ids) || product_ids.length === 0) {
        return res.status(400).json({ error: "product_ids must be a non-empty array" });
      }

      const { error } = await supabase
        .from("terminal_products")
        .delete()
        .eq("terminal_id", id)
        .in("product_id", product_ids);

      if (error) throw error;
      return res.json({ message: "Products removed successfully" });
    } catch (error: any) {
      console.error("Error removing products:", error.message);
      return res.status(500).json({ error: "Failed to remove products" });
    }
  }
}
