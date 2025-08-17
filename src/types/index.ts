// app/types/index.ts

export interface Product {
  id: string;
  name: string;
  price: number;
  deposit: number;
  description: string;
  stock: number | ""; // number for limited, "" for unlimited
  image: string;
  hidden?: boolean; // optional property for hiding products
}

export interface CartItem extends Product {
  quantity: number;
  paymentType: "full" | "deposit";
  posId?: string;
}

export interface PosTerminal {
  id: string;
  name: string;
  themeColor: string;
  isActive: boolean;
}

export interface PosProductMapping {
  posId: string;
  productIds: string[];
}

export interface Order {
  id: string;
  userName: string;
  posId: string;
  items: CartItem[];
  totalAmount: number;
  depositAmount: number;
  timestamp: Date;
  status: "completed" | "pending";
}
