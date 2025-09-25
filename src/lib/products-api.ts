// New API-based products library to replace localStorage-based products.ts
import { 
  useProducts, 
  useProductMutations, 
  useProductSearch,
  apiClient,
  apiProductToOldProduct,
  oldProductToApiCreateRequest,
  oldProductToApiUpdateRequest,
  Product as ApiProduct,
  CreateProductRequest,
  UpdateProductRequest
} from '@/lib/api';
import { Product, PosProductMapping } from '@/types';

// For backward compatibility, we'll maintain the POS mappings in localStorage for now
// In a future version, this could be moved to the database as well
const POS_MAPPINGS_STORAGE_KEY = "pos-product-mappings";

// Default POS mappings
const defaultPosMappings: PosProductMapping[] = [
  { posId: "pos1", productIds: [] },
  { posId: "pos2", productIds: [] },
  { posId: "pos3", productIds: [] },
];

// Load POS mappings from localStorage
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

// Save POS mappings to localStorage
const savePosMappings = (mappings: PosProductMapping[]): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(POS_MAPPINGS_STORAGE_KEY, JSON.stringify(mappings));
  } catch (error) {
    console.error("Error saving POS mappings to localStorage:", error);
  }
};

/**
 * Get products assigned to a specific POS terminal
 */
export const getProductsByPosId = async (posId: string): Promise<Product[]> => {
  try {
    // First try to get products from the new terminal-specific endpoint
    const apiProducts = await apiClient.getTerminalProducts(posId);
    
    // Convert API products to old format
    const terminalProducts = apiProducts.map(apiProductToOldProduct);
    
    // Filter out hidden products for customer-facing POS
    return terminalProducts.filter((product) => !product.hidden);
  } catch (terminalError) {
    // Distinguish between different types of terminal errors
    const errorMessage = terminalError instanceof Error ? terminalError.message : String(terminalError);
    
    // If terminal not found, don't fall back - this is a legitimate error
    if (errorMessage.includes('TERMINAL_NOT_FOUND') || errorMessage.includes('not found')) {
      console.error(`Terminal ${posId} not found:`, terminalError);
      throw new Error(`POS Terminal '${posId}' not found. Please check the terminal ID.`);
    }
    
    // If terminal is inactive, don't fall back - this is a legitimate error
    if (errorMessage.includes('TERMINAL_INACTIVE') || errorMessage.includes('inactive')) {
      console.error(`Terminal ${posId} is inactive:`, terminalError);
      throw new Error(`POS Terminal '${posId}' is currently inactive. Please contact your administrator.`);
    }
    
    // For network/API errors, fall back to localStorage mappings for backward compatibility
    console.warn(`Terminal products endpoint failed for ${posId}, falling back to localStorage mappings:`, terminalError);
    
    try {
      // Fallback to localStorage mappings for backward compatibility
      const response = await apiClient.getProducts({ is_active: true });
      const apiProducts = response.data;
      
      // Convert API products to old format
      const allProducts = apiProducts.map(apiProductToOldProduct);
      
      // Get POS mappings from localStorage
      const mappings = loadPosMappings();
      const mapping = mappings.find((m) => m.posId === posId);
      
      if (!mapping) {
        console.warn(`No localStorage mapping found for terminal ${posId}`);
        return [];
      }

      // Filter products by POS mapping
      const posProducts = allProducts.filter((product) =>
        mapping.productIds.includes(product.id)
      );

      // Filter out hidden products for customer-facing POS
      const filteredProducts = posProducts.filter((product) => !product.hidden);
      
      console.info(`Fallback successful: Found ${filteredProducts.length} products for terminal ${posId} via localStorage`);
      return filteredProducts;
    } catch (fallbackError) {
      console.error(`Error fetching products by POS ID (fallback also failed) for terminal ${posId}:`, fallbackError);
      
      // Distinguish between product fetch errors and terminal errors
      const fallbackErrorMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      
      if (fallbackErrorMessage.includes('Network') || fallbackErrorMessage.includes('connection')) {
        throw new Error(`Unable to connect to the server. Please check your internet connection and try again.`);
      }
      
      // For other errors, return empty array to prevent POS from crashing
      console.warn(`Returning empty product list for terminal ${posId} due to errors`);
      return [];
    }
  }
};

/**
 * Get all products with optional filtering
 */
export const getProducts = async (includeHidden: boolean = true): Promise<Product[]> => {
  try {
    // Get all products from API
    const response = await apiClient.getProducts({ is_active: includeHidden ? undefined : true });
    const apiProducts = response.data;
    
    // Convert API products to old format
    const allProducts = apiProducts.map(apiProductToOldProduct);

    if (includeHidden) {
      return allProducts;
    }

    // Filter out hidden products
    return allProducts.filter((product) => !product.hidden);
  } catch (error) {
    console.error("Error fetching products:", error);
    // Return empty array on error to prevent app crashes
    return [];
  }
};

/**
 * Get POS mappings (still using localStorage for backward compatibility)
 */
export const getPosMappings = (): PosProductMapping[] => {
  return loadPosMappings();
};

/**
 * Add a new product
 */
export const addProduct = async (product: Product): Promise<void> => {
  try {
    // Convert old product format to API format
    const createRequest = oldProductToApiCreateRequest(product);
    
    // Create product via API
    const apiProduct = await apiClient.createProduct(createRequest);
    
    // Update POS mappings to use the API-generated ID
    // This ensures the product is properly linked even if the ID changes
    const mappings = loadPosMappings();
    const updatedMappings = mappings.map(mapping => {
      // If the product was supposed to be added to this mapping, use the new API ID
      if (mapping.productIds.includes(product.id)) {
        return {
          ...mapping,
          productIds: mapping.productIds.map(id => id === product.id ? apiProduct.id : id)
        };
      }
      return mapping;
    });
    
    savePosMappings(updatedMappings);
  } catch (error) {
    console.error("Error adding product:", error);
    throw new Error("Failed to add product. Please try again.");
  }
};

/**
 * Update an existing product
 */
export const updateProduct = async (
  productId: string,
  updatedProduct: Partial<Product>
): Promise<void> => {
  try {
    // Convert old product format to API format
    const updateRequest = oldProductToApiUpdateRequest(updatedProduct);
    
    // Update product via API
    await apiClient.updateProduct(productId, updateRequest);
  } catch (error) {
    console.error("Error updating product:", error);
    throw new Error("Failed to update product. Please try again.");
  }
};

/**
 * Delete a product
 */
export const deleteProduct = async (productId: string): Promise<void> => {
  try {
    // Delete product via API
    await apiClient.deleteProduct(productId);

    // Remove from all POS mappings
    const mappings = loadPosMappings();
    const updatedMappings = mappings.map((mapping) => ({
      ...mapping,
      productIds: mapping.productIds.filter((id) => id !== productId),
    }));
    savePosMappings(updatedMappings);
  } catch (error) {
    console.error("Error deleting product:", error);
    throw new Error("Failed to delete product. Please try again.");
  }
};

/**
 * Update POS mappings
 */
export const updatePosMappings = (mappings: PosProductMapping[]): void => {
  savePosMappings(mappings);
};

/**
 * Search products by name or barcode
 */
export const searchProducts = async (query: string, limit?: number): Promise<Product[]> => {
  try {
    const response = await apiClient.searchProducts(query, limit);
    const apiProducts = response.data;
    
    // Convert API products to old format
    return apiProducts.map(apiProductToOldProduct);
  } catch (error) {
    console.error("Error searching products:", error);
    return [];
  }
};

/**
 * Get product by barcode (useful for POS scanning)
 */
export const getProductByBarcode = async (barcode: string): Promise<Product | null> => {
  try {
    const apiProduct = await apiClient.getProductByBarcode(barcode);
    return apiProductToOldProduct(apiProduct);
  } catch (error) {
    console.error("Error fetching product by barcode:", error);
    return null;
  }
};

/**
 * Get product categories
 */
export const getProductCategories = async (): Promise<string[]> => {
  try {
    return await apiClient.getProductCategories();
  } catch (error) {
    console.error("Error fetching product categories:", error);
    return [];
  }
};

/**
 * Bulk update product stock
 */
export const bulkUpdateStock = async (updates: Array<{ id: string; stock_quantity: number }>): Promise<void> => {
  try {
    await apiClient.bulkUpdateStock(updates);
  } catch (error) {
    console.error("Error bulk updating stock:", error);
    throw new Error("Failed to update stock. Please try again.");
  }
};

// React hooks for easier component integration
export { useProducts, useProductMutations, useProductSearch } from '@/lib/api';