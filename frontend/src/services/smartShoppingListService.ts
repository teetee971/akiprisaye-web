/**
 * Shopping List Service
 * Manages shopping lists and budget optimization
 */

import type { 
import { safeLocalStorage } from '../utils/safeLocalStorage';
  ShoppingList, 
  ShoppingListItem, 
  BudgetOptimization,
  StoreAllocation,
  Coordinates 
} from '../types/shoppingList';

export class ShoppingListService {
  private readonly STORAGE_KEY = 'shopping_lists';

  /**
   * Create a new shopping list
   */
  async createList(name: string, territory: string): Promise<ShoppingList> {
    const newList: ShoppingList = {
      id: this.generateId(),
      name,
      items: [],
      territory,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const lists = this.getLists();
    lists.push(newList);
    this.saveLists(lists);
    
    return newList;
  }

  /**
   * Get all shopping lists
   */
  getLists(): ShoppingList[] {
    const stored = safeLocalStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Get a specific list by ID
   */
  getList(listId: string): ShoppingList | null {
    const lists = this.getLists();
    return lists.find(l => l.id === listId) || null;
  }

  /**
   * Add item to shopping list
   */
  async addItem(listId: string, item: Omit<ShoppingListItem, 'id' | 'addedAt'>): Promise<void> {
    const lists = this.getLists();
    const list = lists.find(l => l.id === listId);
    
    if (!list) throw new Error('List not found');
    
    const newItem: ShoppingListItem = {
      ...item,
      id: this.generateId(),
      addedAt: new Date().toISOString()
    };
    
    list.items.push(newItem);
    list.updatedAt = new Date().toISOString();
    this.saveLists(lists);
  }

  /**
   * Remove item from shopping list
   */
  async removeItem(listId: string, itemId: string): Promise<void> {
    const lists = this.getLists();
    const list = lists.find(l => l.id === listId);
    
    if (!list) throw new Error('List not found');
    
    list.items = list.items.filter(i => i.id !== itemId);
    list.updatedAt = new Date().toISOString();
    this.saveLists(lists);
  }

  /**
   * Optimize budget for shopping list
   */
  async optimizeBudget(list: ShoppingList): Promise<BudgetOptimization> {
    // TODO: Implement real optimization algorithm
    // For now, return mock optimization
    
    const mockStores: StoreAllocation[] = [
      {
        storeId: 'store-1',
        storeName: 'Carrefour Jarry',
        items: list.items.slice(0, 2).map(item => ({
          ean: item.productEAN,
          name: item.productName,
          price: 2.50,
          quantity: item.quantity
        })),
        subtotal: 5.00
      },
      {
        storeId: 'store-2',
        storeName: 'E.Leclerc',
        items: list.items.slice(2).map(item => ({
          ean: item.productEAN,
          name: item.productName,
          price: 3.00,
          quantity: item.quantity
        })),
        subtotal: 6.00
      }
    ];
    
    const currentTotal = mockStores.reduce((sum, s) => sum + s.subtotal, 0);
    
    return {
      totalBudget: 15.00,
      currentTotal,
      savings: 15.00 - currentTotal,
      stores: mockStores,
      route: ['store-1', 'store-2'],
      estimatedTime: 45,
      estimatedDistance: 5.2
    };
  }

  /**
   * Calculate optimal route using TSP approximation
   */
  calculateOptimalRoute(
    storeIds: string[], 
    userLocation?: Coordinates
  ): string[] {
    // TODO: Implement nearest neighbor TSP algorithm
    // For now, return stores as-is
    return storeIds;
  }

  /**
   * Get similar/cheaper products
   */
  async getSimilarProducts(ean: string): Promise<any[]> {
    // TODO: Implement product similarity search
    return [];
  }

  /**
   * Export shopping list
   */
  async exportList(list: ShoppingList, format: 'pdf' | 'text'): Promise<Blob> {
    if (format === 'text') {
      let content = `Liste: ${list.name}\n`;
      content += `Créée le: ${new Date(list.createdAt).toLocaleDateString()}\n\n`;
      
      list.items.forEach((item, i) => {
        content += `${i + 1}. ${item.productName} (x${item.quantity})\n`;
        if (item.notes) content += `   Notes: ${item.notes}\n`;
      });
      
      return new Blob([content], { type: 'text/plain' });
    }
    
    // TODO: Implement PDF export with jspdf
    return new Blob(['PDF not implemented yet'], { type: 'application/pdf' });
  }

  /**
   * Delete a shopping list
   */
  async deleteList(listId: string): Promise<void> {
    const lists = this.getLists();
    const filtered = lists.filter(l => l.id !== listId);
    this.saveLists(filtered);
  }

  // Private helper methods
  private saveLists(lists: ShoppingList[]): void {
    safeLocalStorage.setItem(this.STORAGE_KEY, JSON.stringify(lists));
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const shoppingListService = new ShoppingListService();
