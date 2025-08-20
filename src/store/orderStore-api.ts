// New API-based order store to replace localStorage-based orderStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { 
  useCreateOrder, 
  useOrders, 
  apiClient,
  cartItemsToApiOrderRequest,
  apiOrderToOldOrder,
  stringToPaymentMethod,
  handleApiError
} from "@/lib/api";
import type { Order, CartItem } from "../types";

type OrderStore = {
  orders: Order[];
  loading: boolean;
  error: string | null;
  
  // Actions
  addOrder: (order: Omit<Order, "id" | "timestamp">) => Promise<string | null>;
  getOrderById: (orderId: string) => Order | undefined;
  getOrdersByUser: (userName: string) => Order[];
  getTotalRevenue: () => number;
  getTodayOrders: () => Order[];
  refreshOrders: () => Promise<void>;
  
  // API-specific actions
  createOrderFromCart: (
    cartItems: CartItem[], 
    posId?: string, 
    paymentMethod?: string
  ) => Promise<string | null>;
};

export const useOrderStore = create(
  persist<OrderStore>(
    (set, get) => ({
      orders: [],
      loading: false,
      error: null,

      addOrder: async (orderData) => {
        set({ loading: true, error: null });
        
        try {
          // Convert old order format to API format
          const apiOrderRequest = cartItemsToApiOrderRequest(
            orderData.items,
            orderData.posId,
            stringToPaymentMethod('cash') // Default to cash for backward compatibility
          );

          // Create order via API
          const apiOrder = await apiClient.createOrder(apiOrderRequest);
          
          // Convert API order back to old format
          const newOrder = apiOrderToOldOrder(apiOrder);
          
          // Update local state
          set((state) => ({
            orders: [...state.orders, newOrder],
            loading: false,
          }));

          return newOrder.id;
        } catch (error) {
          const errorMessage = handleApiError(error);
          set({ loading: false, error: errorMessage });
          console.error("Error creating order:", error);
          return null;
        }
      },

      createOrderFromCart: async (cartItems, posId, paymentMethod = 'cash') => {
        set({ loading: true, error: null });
        
        try {
          // Convert cart items to API format
          const apiOrderRequest = cartItemsToApiOrderRequest(
            cartItems,
            posId,
            stringToPaymentMethod(paymentMethod)
          );

          // Create order via API
          const apiOrder = await apiClient.createOrder(apiOrderRequest);
          
          // Convert API order back to old format
          const newOrder = apiOrderToOldOrder(apiOrder);
          
          // Update local state
          set((state) => ({
            orders: [...state.orders, newOrder],
            loading: false,
          }));

          return newOrder.id;
        } catch (error) {
          const errorMessage = handleApiError(error);
          set({ loading: false, error: errorMessage });
          console.error("Error creating order from cart:", error);
          return null;
        }
      },

      refreshOrders: async () => {
        set({ loading: true, error: null });
        
        try {
          // Fetch orders from API
          const response = await apiClient.getOrders({ limit: 100 }); // Get recent orders
          
          // Convert API orders to old format
          const orders = response.data.map(apiOrderToOldOrder);
          
          set({ orders, loading: false });
        } catch (error) {
          const errorMessage = handleApiError(error);
          set({ loading: false, error: errorMessage });
          console.error("Error refreshing orders:", error);
        }
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
      name: "pos-orders-api-storage",
      // Only persist non-API data (orders will be fetched from API)
      partialize: (state) => ({ 
        orders: [], // Don't persist orders, fetch from API instead
        loading: false,
        error: null,
        // Include all required methods as no-ops for persistence
        addOrder: state.addOrder,
        getOrderById: state.getOrderById,
        getOrdersByUser: state.getOrdersByUser,
        getTotalRevenue: state.getTotalRevenue,
        getTodayOrders: state.getTodayOrders,
        refreshOrders: state.refreshOrders,
        createOrderFromCart: state.createOrderFromCart,
      }),
    }
  )
);

// React hooks for easier component integration
export const useOrderMutations = () => {
  const { createOrderFromCart, loading, error } = useOrderStore();
  
  return {
    createOrder: createOrderFromCart,
    loading,
    error,
  };
};

// Hook to fetch and sync orders
export const useOrderSync = () => {
  const { refreshOrders, orders, loading, error } = useOrderStore();
  
  // Note: This would need React import in a real implementation
  // For now, components should call refreshOrders manually
  
  return {
    orders,
    loading,
    error,
    refresh: refreshOrders,
  };
};