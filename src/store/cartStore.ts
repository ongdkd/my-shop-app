// app/store/cartStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient, handleApiError } from "@/lib/api";
import type { Product, CartItem } from "../types";

type CartStore = {
  cart: CartItem[];
  currentPosId: string | null;
  userName: string;
  userPhone: string;
  setUserName: (name: string) => void;
  setUserPhone: (phone: string) => void;
  addToCart: (product: Product) => Promise<void>;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  clearCartIfDifferentPos: (newPosId: string) => void;
  setCurrentPos: (posId: string) => void;
  setPaymentType: (id: string, paymentType: "full" | "deposit") => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
};

export const useCartStore = create(
  persist<CartStore>(
    (set, get) => ({
      cart: [],
      currentPosId: null,
      userName: "",
      userPhone: "",
      setUserName: (name) => set({ userName: name }),
      setUserPhone: (phone) => set({ userPhone: phone }),

      addToCart: async (product) => {
        const state = get();
        const existing = state.cart.find((item) => item.id === product.id);

        try {
          // Get real-time stock information from API
          const apiProduct = await apiClient.getProductById(product.id);
          const currentStock = apiProduct.stock_quantity || 0;
          const productStock = currentStock === 0 ? Infinity : currentStock;

          if (existing) {
            if (existing.quantity + 1 > productStock) {
              alert("Not enough stock available!");
              return;
            }
            set({
              cart: state.cart.map((item) =>
                item.id === product.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
            });
          } else {
            if (1 > productStock) {
              alert("Out of stock!");
              return;
            }
            set({
              cart: [
                ...state.cart,
                {
                  ...product,
                  quantity: 1,
                  paymentType: "full",
                  posId: state.currentPosId || undefined,
                },
              ],
            });
          }
        } catch (error) {
          console.error("Error checking stock:", error);
          // Fallback to local stock check if API fails
          const productStock = product.stock === "" ? Infinity : Number(product.stock);

          if (existing) {
            if (existing.quantity + 1 > productStock) {
              alert("Not enough stock available!");
              return;
            }
            set({
              cart: state.cart.map((item) =>
                item.id === product.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
            });
          } else {
            if (1 > productStock) {
              alert("Out of stock!");
              return;
            }
            set({
              cart: [
                ...state.cart,
                {
                  ...product,
                  quantity: 1,
                  paymentType: "full",
                  posId: state.currentPosId || undefined,
                },
              ],
            });
          }
        }
      },

      removeFromCart: (id) =>
        set((state) => ({
          cart: state.cart.filter((item) => item.id !== id),
        })),

      updateQuantity: (id, quantity) =>
        set((state) => ({
          cart:
            quantity <= 0
              ? state.cart.filter((item) => item.id !== id)
              : state.cart.map((item) =>
                  item.id === id ? { ...item, quantity } : item
                ),
        })),

      clearCart: () => set({ cart: [] }),

      clearCartIfDifferentPos: (newPosId) => {
        const { currentPosId } = get();
        if (currentPosId && currentPosId !== newPosId) {
          set({ cart: [], currentPosId: newPosId });
        } else if (!currentPosId) {
          set({ currentPosId: newPosId });
        }
      },

      setCurrentPos: (posId) => set({ currentPosId: posId }),

      setPaymentType: (id, paymentType) =>
        set((state) => ({
          cart: state.cart.map((item) =>
            item.id === id ? { ...item, paymentType } : item
          ),
        })),

      getTotalPrice: () => {
        return get().cart.reduce((sum, item) => {
          const price =
            item.paymentType === "deposit"
              ? item.deposit * item.quantity
              : item.price * item.quantity;
          return sum + price;
        }, 0);
      },

      getTotalItems: () => {
        const { cart } = get();
        return cart.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: "pos-cart-storage",
    }
  )
);
