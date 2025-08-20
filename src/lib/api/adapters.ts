// Data adapters to transform between old frontend types and new API types

import { Product as OldProduct, PosTerminal as OldPosTerminal, Order as OldOrder, CartItem } from '../../types';
import { Product as ApiProduct, POSTerminal as ApiPOSTerminal, OrderWithItems as ApiOrder, CreateOrderRequest, PaymentMethod } from './types';

// =============================================
// PRODUCT ADAPTERS
// =============================================

/**
 * Convert API Product to old frontend Product format
 */
export const apiProductToOldProduct = (apiProduct: ApiProduct): OldProduct => {
  return {
    id: apiProduct.id,
    name: apiProduct.name,
    price: apiProduct.price,
    deposit: apiProduct.price * 0.5, // Default to 50% deposit
    description: apiProduct.category || '',
    stock: apiProduct.stock_quantity === 0 ? 0 : apiProduct.stock_quantity || '',
    image: apiProduct.image_url || '/images/place-holder.png',
    hidden: !apiProduct.is_active,
  };
};

/**
 * Convert old frontend Product to API CreateProductRequest format
 */
export const oldProductToApiCreateRequest = (oldProduct: Omit<OldProduct, 'id'>): {
  barcode: string;
  name: string;
  price: number;
  image_url?: string;
  category?: string;
  stock_quantity?: number;
} => {
  return {
    barcode: generateBarcode(oldProduct.name), // Generate barcode from name
    name: oldProduct.name,
    price: oldProduct.price,
    image_url: oldProduct.image !== '/images/place-holder.png' ? oldProduct.image : undefined,
    category: oldProduct.description || undefined,
    stock_quantity: typeof oldProduct.stock === 'number' ? oldProduct.stock : undefined,
  };
};

/**
 * Convert old frontend Product to API UpdateProductRequest format
 */
export const oldProductToApiUpdateRequest = (oldProduct: Partial<OldProduct>): {
  name?: string;
  price?: number;
  image_url?: string;
  category?: string;
  stock_quantity?: number;
  is_active?: boolean;
} => {
  const update: any = {};
  
  if (oldProduct.name !== undefined) update.name = oldProduct.name;
  if (oldProduct.price !== undefined) update.price = oldProduct.price;
  if (oldProduct.image !== undefined && oldProduct.image !== '/images/place-holder.png') {
    update.image_url = oldProduct.image;
  }
  if (oldProduct.description !== undefined) update.category = oldProduct.description;
  if (oldProduct.stock !== undefined && typeof oldProduct.stock === 'number') {
    update.stock_quantity = oldProduct.stock;
  }
  if (oldProduct.hidden !== undefined) update.is_active = !oldProduct.hidden;
  
  return update;
};

// =============================================
// POS TERMINAL ADAPTERS
// =============================================

/**
 * Convert API POSTerminal to old frontend PosTerminal format
 */
export const apiPosTerminalToOldPosTerminal = (apiTerminal: ApiPOSTerminal): OldPosTerminal => {
  return {
    id: apiTerminal.id,
    name: apiTerminal.terminal_name,
    themeColor: apiTerminal.configuration?.themeColor || '#3B82F6',
    isActive: apiTerminal.is_active,
  };
};

/**
 * Convert old frontend PosTerminal to API CreatePOSTerminalRequest format
 */
export const oldPosTerminalToApiCreateRequest = (oldTerminal: Omit<OldPosTerminal, 'id'>): {
  terminal_name: string;
  location?: string;
  configuration?: Record<string, any>;
} => {
  return {
    terminal_name: oldTerminal.name,
    configuration: {
      themeColor: oldTerminal.themeColor,
    },
  };
};

/**
 * Convert old frontend PosTerminal to API UpdatePOSTerminalRequest format
 */
export const oldPosTerminalToApiUpdateRequest = (oldTerminal: Partial<OldPosTerminal>): {
  terminal_name?: string;
  is_active?: boolean;
  configuration?: Record<string, any>;
} => {
  const update: any = {};
  
  if (oldTerminal.name !== undefined) update.terminal_name = oldTerminal.name;
  if (oldTerminal.isActive !== undefined) update.is_active = oldTerminal.isActive;
  if (oldTerminal.themeColor !== undefined) {
    update.configuration = { themeColor: oldTerminal.themeColor };
  }
  
  return update;
};

// =============================================
// ORDER ADAPTERS
// =============================================

/**
 * Convert cart items to API CreateOrderRequest format
 */
export const cartItemsToApiOrderRequest = (
  cartItems: CartItem[],
  posId?: string,
  paymentMethod: PaymentMethod = 'cash'
): CreateOrderRequest => {
  return {
    pos_terminal_id: posId,
    payment_method: paymentMethod,
    order_items: cartItems.map(item => ({
      product_id: item.id,
      quantity: item.quantity,
      unit_price: item.paymentType === 'deposit' ? item.deposit : item.price,
    })),
  };
};

/**
 * Convert API Order to old frontend Order format
 */
export const apiOrderToOldOrder = (apiOrder: ApiOrder): OldOrder => {
  const cartItems: CartItem[] = apiOrder.order_items.map(item => ({
    id: item.product?.id || item.product_id || '',
    name: item.product?.name || 'Unknown Product',
    price: item.product?.price || item.unit_price,
    deposit: (item.product?.price || item.unit_price) * 0.5,
    description: item.product?.category || '',
    stock: item.product?.stock_quantity || '',
    image: item.product?.image_url || '/images/place-holder.png',
    quantity: item.quantity,
    paymentType: item.unit_price < (item.product?.price || item.unit_price) ? 'deposit' : 'full',
    posId: apiOrder.pos_terminal_id,
  }));

  return {
    id: apiOrder.id,
    userName: 'Customer', // Default since we don't have customer names in the old format
    posId: apiOrder.pos_terminal_id || '',
    items: cartItems,
    totalAmount: apiOrder.total_amount,
    depositAmount: cartItems
      .filter(item => item.paymentType === 'deposit')
      .reduce((sum, item) => sum + (item.deposit * item.quantity), 0),
    timestamp: new Date(apiOrder.order_date),
    status: apiOrder.order_status === 'completed' ? 'completed' : 'pending',
  };
};

// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * Generate a simple barcode from product name
 */
const generateBarcode = (name: string): string => {
  // Simple barcode generation - in production, you'd want a proper barcode system
  const hash = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  return `${Date.now().toString().slice(-6)}${hash.toString().padStart(6, '0')}`.slice(0, 12);
};

/**
 * Convert payment method string to PaymentMethod type
 */
export const stringToPaymentMethod = (method: string): PaymentMethod => {
  switch (method.toLowerCase()) {
    case 'card':
      return 'card';
    case 'digital':
      return 'digital';
    default:
      return 'cash';
  }
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

/**
 * Format date for API requests
 */
export const formatDateForApi = (date: Date): string => {
  return date.toISOString();
};

/**
 * Parse API date string to Date object
 */
export const parseApiDate = (dateString: string): Date => {
  return new Date(dateString);
};