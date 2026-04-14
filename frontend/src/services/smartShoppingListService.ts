/**
 * Shopping List Service
 * Manages shopping lists and budget optimization
 */

import { safeLocalStorage } from '../utils/safeLocalStorage';
import { liveApiFetchJson } from './liveApiClient';
import { resolveApiBaseUrl } from './apiBaseUrl';
import type { 
  ShoppingList, 
  ShoppingListItem, 
  BudgetOptimization,
  StoreAllocation,
  Coordinates 
} from '../types/shoppingList';

export class ShoppingListService {
  private readonly STORAGE_KEY = 'shopping_lists';
  private readonly API_BASE_URL = resolveApiBaseUrl();

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
    return safeLocalStorage.getJSON<ShoppingList[]>(this.STORAGE_KEY, []);
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
    try {
      return await liveApiFetchJson<BudgetOptimization>('/shopping-lists/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ list }),
        incidentReason: 'shopping_optimize_api_unavailable',
        timeoutMs: 10000,
      });
    } catch (error) {
      console.error('[ShoppingListService] optimizeBudget live endpoint failed', {
        error,
        listId: list.id,
      });
      const response = await fetch(`${this.API_BASE_URL}/shopping-lists/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ list }),
      });

      if (!response.ok) {
        throw new Error('Optimisation budget indisponible. Réessayez plus tard.');
      }

      return response.json() as Promise<BudgetOptimization>;
    }
  }

  /**
   * Calculate optimal route using TSP approximation
   */
  async calculateOptimalRoute(
    storeIds: string[],
    userLocation?: Coordinates
  ): Promise<string[]> {
    const payload = await liveApiFetchJson<{ route?: string[] }>('/shopping-lists/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeIds, userLocation }),
      incidentReason: 'shopping_route_api_unavailable',
      timeoutMs: 10000,
    });
    return Array.isArray(payload?.route) ? payload.route : storeIds;
  }

  /**
   * Get similar/cheaper products
   */
  async getSimilarProducts(ean: string): Promise<any[]> {
    const payload = await liveApiFetchJson<{ items?: any[] }>(`/products/${encodeURIComponent(ean)}/similar`, {
      incidentReason: 'similar_products_api_unavailable',
      timeoutMs: 10000,
    });
    return Array.isArray(payload?.items) ? payload.items : [];
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
    
    // PDF export via jsPDF (dynamic import to keep main bundle lean)
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    pdf.setFontSize(16);
    pdf.text(`Liste : ${list.name}`, 14, 20);
    pdf.setFontSize(11);
    pdf.text(`Créée le : ${new Date(list.createdAt).toLocaleDateString('fr-FR')}`, 14, 28);
    pdf.text(`Territoire : ${list.territory}`, 14, 35);
    pdf.setLineWidth(0.3);
    pdf.line(14, 38, 196, 38);

    let y = 44;
    pdf.setFontSize(12);
    list.items.forEach((item, i) => {
      if (y > 270) {
        pdf.addPage();
        y = 20;
      }
      const label = `${i + 1}. ${item.productName}  ×${item.quantity}`;
      pdf.text(label, 14, y);
      if (item.notes) {
        pdf.setFontSize(10);
        pdf.text(`   ${item.notes}`, 14, y + 5);
        pdf.setFontSize(12);
        y += 12;
      } else {
        y += 8;
      }
    });

    return new Blob([pdf.output('arraybuffer')], { type: 'application/pdf' });
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
    safeLocalStorage.setJSON(this.STORAGE_KEY, lists);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const shoppingListService = new ShoppingListService();
