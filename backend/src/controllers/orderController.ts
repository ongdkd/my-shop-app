// controllers/orderController.ts
import { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class OrdersController {
  // ======================================
  // GET /api/v1/orders
  // ======================================
  static async getAllOrders(req: Request, res: Response) {
    try {
      const { limit = "50", fields, page = "1" } = req.query;
      const limitNum = Math.min(parseInt(limit as string, 10) || 50, 200);
      const pageNum = Math.max(parseInt(page as string, 10), 1);

      const selectFields =
        typeof fields === "string"
          ? fields
          : "id,order_date,total_amount,terminal_id";

      const from = (pageNum - 1) * limitNum;
      const to = from + limitNum - 1;

      const { data, error } = await supabase
        .from("orders")
        .select(selectFields)
        .order("order_date", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return res.json({ data });
    } catch (error: any) {
      console.error("Error fetching orders:", error.message);
      return res.status(500).json({ error: "Failed to fetch orders" });
    }
  }

  // ======================================
  // GET /api/v1/orders/date-range
  // ======================================
  static async getOrdersByDateRange(req: Request, res: Response) {
    try {
      const { startDate, endDate, fields } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "startDate and endDate required" });
      }

      const selectFields =
        typeof fields === "string"
          ? fields
          : "id,order_date,total_amount,terminal_id";

      const { data, error } = await supabase
        .from("orders")
        .select(selectFields)
        .gte("order_date", startDate as string)
        .lte("order_date", endDate as string)
        .order("order_date", { ascending: false });

      if (error) throw error;
      return res.json({ data });
    } catch (error: any) {
      console.error("Error fetching date-range orders:", error.message);
      return res.status(500).json({ error: "Failed to fetch date-range orders" });
    }
  }

  // ======================================
  // GET /api/v1/orders/reports/summary
  // ======================================
  static async getSalesSummary(req: Request, res: Response) {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("total_amount");

      if (error) throw error;

      const totalRevenue =
        data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const totalOrders = data?.length || 0;

      return res.json({ totalRevenue, totalOrders });
    } catch (error: any) {
      console.error("Error generating sales summary:", error.message);
      return res.status(500).json({ error: "Failed to generate sales summary" });
    }
  }

  // ======================================
  // GET /api/v1/orders/terminal/:terminalId
  // ======================================
  static async getOrdersByTerminal(req: Request, res: Response) {
    try {
      const { terminalId } = req.params;
      const { limit = "50", fields } = req.query;
      const limitNum = Math.min(parseInt(limit as string, 10) || 50, 200);

      const selectFields =
        typeof fields === "string"
          ? fields
          : "id,order_date,total_amount,terminal_id";

      const { data, error } = await supabase
        .from("orders")
        .select(selectFields)
        .eq("terminal_id", terminalId)
        .order("order_date", { ascending: false })
        .limit(limitNum);

      if (error) throw error;
      return res.json({ data });
    } catch (error: any) {
      console.error("Error fetching terminal orders:", error.message);
      return res.status(500).json({ error: "Failed to fetch terminal orders" });
    }
  }

  // ======================================
  // GET /api/v1/orders/:id
  // ======================================
  static async getOrderById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)") // assumes relation exists
        .eq("id", id)
        .single();

      if (error) throw error;
      return res.json({ data });
    } catch (error: any) {
      console.error("Error fetching order by ID:", error.message);
      return res.status(500).json({ error: "Failed to fetch order details" });
    }
  }

  // ======================================
  // POST /api/v1/orders
  // ======================================
  static async createOrder(req: Request, res: Response) {
    try {
      const { order, items } = req.body;
      if (!order || !items) {
        return res.status(400).json({ error: "Order and items required" });
      }

      // Insert order
      const { data: newOrder, error: orderError } = await supabase
        .from("orders")
        .insert(order)
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert items
      const itemsWithOrderId = items.map((item: any) => ({
        ...item,
        order_id: newOrder.id,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(itemsWithOrderId);

      if (itemsError) throw itemsError;

      return res.status(201).json({ order: newOrder, items: itemsWithOrderId });
    } catch (error: any) {
      console.error("Error creating order:", error.message);
      return res.status(500).json({ error: "Failed to create order" });
    }
  }
}
