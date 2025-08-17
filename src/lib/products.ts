// app/lib/products.ts
import { Product, PosProductMapping } from "@/types";

const PRODUCTS_STORAGE_KEY = "products-data";
const POS_MAPPINGS_STORAGE_KEY = "pos-product-mappings";

// Default products
const defaultProducts: Product[] = [
  {
    id: "1",
    name: "Product A",
    price: 100,
    deposit: 50,
    description: "",
    stock: "",
    image: "https://i.postimg.cc/1XwH0hRB/image.png",
  },
  {
    id: "2",
    name: "Product B",
    price: 150,
    deposit: 75,
    description: "",
    stock: 50,
    image: "",
  },
  {
    id: "3",
    name: "Product C",
    price: 200,
    deposit: 100,
    description: "",
    stock: 99,
    image: "/images/place-holder.png",
  },
  {
    id: "4",
    name: "Product D",
    price: 250,
    deposit: 125,
    description: "",
    stock: 99,
    image: "/images/place-holder.png",
  },
  {
    id: "5",
    name: "Product E",
    price: 100,
    deposit: 50,
    description: "",
    stock: 99,
    image: "/images/place-holder.png",
  },
  {
    id: "6",
    name: "Product F",
    price: 150,
    deposit: 75,
    description: "",
    stock: 0,
    image: "/images/place-holder.png",
  },
  {
    id: "7",
    name: "Product G",
    price: 200,
    deposit: 100,
    description: "",
    stock: 0,
    image: "/images/place-holder.png",
  },
  {
    id: "8",
    name: "Product H",
    price: 250,
    deposit: 125,
    description: "",
    stock: 10,
    image: "/images/place-holder.png",
  },
];

// Default POS mappings
const defaultPosMappings: PosProductMapping[] = [
  { posId: "pos1", productIds: ["1", "2", "3", "4"] },
  { posId: "pos2", productIds: ["5", "6", "7", "8"] },
  { posId: "pos3", productIds: [] },
];

// Load products from localStorage or use defaults
const loadProducts = (): Product[] => {
  if (typeof window === "undefined") return defaultProducts;

  try {
    const stored = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error loading products from localStorage:", error);
  }

  return defaultProducts;
};

// Load POS mappings from localStorage or use defaults
const loadPosMappings = (): PosProductMapping[] => {
  if (typeof window === "undefined") return defaultPosMappings;

  try {
    const stored = localStorage.getItem(POS_MAPPINGS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error loading POS mappings from localStorage:", error);
  }

  return defaultPosMappings;
};

// Save products to localStorage
const saveProducts = (products: Product[]): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
  } catch (error) {
    console.error("Error saving products to localStorage:", error);
  }
};

// Save POS mappings to localStorage
const savePosMappings = (mappings: PosProductMapping[]): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(POS_MAPPINGS_STORAGE_KEY, JSON.stringify(mappings));
  } catch (error) {
    console.error("Error saving POS mappings to localStorage:", error);
  }
};

export const getProductsByPosId = async (
  posId: string
): Promise<Product[] | null> => {
  const products = loadProducts();
  const mappings = loadPosMappings();

  const mapping = mappings.find((m) => m.posId === posId);
  if (!mapping) return [];

  const posProducts = products.filter((product) =>
    mapping.productIds.includes(product.id)
  );

  // Filter out hidden products for customer-facing POS
  return posProducts.filter((product) => !product.hidden);
};

export const getProducts = async (
  includeHidden: boolean = true
): Promise<Product[]> => {
  const allProducts = loadProducts();

  if (includeHidden) {
    return allProducts;
  }

  // Filter out hidden products
  return allProducts.filter((product) => !product.hidden);
};

export const getPosMappings = (): PosProductMapping[] => {
  return loadPosMappings();
};

export const addProduct = async (product: Product): Promise<void> => {
  const products = loadProducts();
  products.push(product);
  saveProducts(products);
};

export const updateProduct = async (
  productId: string,
  updatedProduct: Partial<Product>
): Promise<void> => {
  const products = loadProducts();
  const productIndex = products.findIndex((p) => p.id === productId);

  if (productIndex !== -1) {
    products[productIndex] = {
      ...products[productIndex],
      ...updatedProduct,
    };
    saveProducts(products);
  }
};

export const deleteProduct = async (productId: string): Promise<void> => {
  const products = loadProducts();
  const filteredProducts = products.filter((p) => p.id !== productId);
  saveProducts(filteredProducts);

  // Also remove from all POS mappings
  const mappings = loadPosMappings();
  const updatedMappings = mappings.map((mapping) => ({
    ...mapping,
    productIds: mapping.productIds.filter((id) => id !== productId),
  }));
  savePosMappings(updatedMappings);
};

export const updatePosMappings = (mappings: PosProductMapping[]): void => {
  savePosMappings(mappings);
};
