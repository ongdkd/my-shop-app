// store/orderStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Order } from "../types";

type OrderStore = {
  orders: Order[];
  addOrder: (order: Omit<Order, "id" | "timestamp">) => string;
  getOrderById: (orderId: string) => Order | undefined;
  getOrdersByUser: (userName: string) => Order[];
  getTotalRevenue: () => number;
  getTodayOrders: () => Order[];
};

export const useOrderStore = create(
  persist<OrderStore>(
    (set, get) => ({
      orders: [],

      addOrder: (orderData) => {
        const orderId = `ORD-${Date.now()}`;
        const newOrder: Order = {
          ...orderData,
          id: orderId,
          timestamp: new Date(),
        };

        set((state) => ({
          orders: [...state.orders, newOrder],
        }));

        return orderId;
      },

      getOrderById: (orderId) => {
        return get().orders.find(order => order.id === orderId);
      },

      getOrdersByUser: (userName) => {
        return get().orders.filter(order => order.userName === userName);
      },

      getTotalRevenue: () => {
        return get().orders.reduce((total, order) => total + order.totalAmount, 0);
      },

      getTodayOrders: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return get().orders.filter(order => {
          const orderDate = new Date(order.timestamp);
          orderDate.setHours(0, 0, 0, 0);
          return orderDate.getTime() === today.getTime();
        });
      },
    }),
    {
      name: "pos-orders-storage",
    }
  )
);