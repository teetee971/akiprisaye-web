/**
 * Shopping List Type Definitions
 * For smart shopping list with budget optimization
 */

export interface ShoppingListItem {
  id: string;
  productEAN: string;
  productName: string;
  quantity: number;
  category: string;
  priority: 'high' | 'medium' | 'low';
  notes?: string;
  addedAt: string;
}

export interface BudgetOptimization {
  totalBudget: number;
  currentTotal: number;
  savings: number;
  stores: StoreAllocation[];
  route: string[]; // Store IDs in optimal order
  estimatedTime: number; // minutes
  estimatedDistance: number; // km
}

export interface StoreAllocation {
  storeId: string;
  storeName: string;
  items: {
    ean: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  subtotal: number;
}

export interface ShoppingList {
  id: string;
  name: string;
  items: ShoppingListItem[];
  territory: string;
  createdAt: string;
  updatedAt: string;
  optimization?: BudgetOptimization;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}
