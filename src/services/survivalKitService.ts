/**
 * Survival Kit Service
 * 
 * Manages survival kit items, pricing, and budget calculations
 * for cyclone preparation
 */

import type {
  SurvivalKitItem,
  SurvivalKitPrice,
  SurvivalKitBudget,
  StoreComparison,
  Territory
} from '../types/cycloneComparison';

/**
 * Get all essential survival kit items
 */
export function getEssentialItems(): SurvivalKitItem[] {
  // This would typically load from the JSON file
  // For now, returning a basic structure
  return [];
}

/**
 * Calculate budget for a household
 */
export function calculateKitBudget(
  householdSize: number,
  territory: Territory,
  prices: SurvivalKitPrice[]
): SurvivalKitBudget {
  const items = getEssentialItems();
  const budgetItems: SurvivalKitBudget['items'] = [];
  const byCategory: Record<string, number> = {};

  for (const item of items) {
    // Find best price for this item
    const itemPrices = prices.filter(p => p.item.id === item.id && p.territory === territory);
    
    if (itemPrices.length === 0) continue;

    // Sort by price ascending
    itemPrices.sort((a, b) => a.price - b.price);
    const bestPrice = itemPrices[0];

    const quantity = item.quantityPerPerson * householdSize;
    const totalCost = bestPrice.price * quantity;

    budgetItems.push({
      item,
      quantity,
      bestPrice,
      totalCost
    });

    // Aggregate by category
    const category = item.category;
    byCategory[category] = (byCategory[category] || 0) + totalCost;
  }

  const totalBudget = budgetItems.reduce((sum, item) => sum + item.totalCost, 0);

  return {
    householdSize,
    territory,
    items: budgetItems,
    totalBudget,
    byCategory
  };
}

/**
 * Get prices for a specific item in a territory
 */
export async function getItemPrices(
  item: SurvivalKitItem,
  territory: Territory
): Promise<SurvivalKitPrice[]> {
  try {
    const response = await fetch('/data/survival-kit-prices.json');
    const data = await response.json();
    
    return data.prices
      .filter((p: any) => p.itemId === item.id && p.territory === territory)
      .map((p: any) => ({
        item,
        store: p.store,
        territory: p.territory,
        price: p.price,
        availability: p.availability,
        lastUpdated: p.lastUpdated,
        source: p.source
      }));
  } catch (error) {
    console.error('Error loading item prices:', error);
    return [];
  }
}

/**
 * Compare total costs across stores
 */
export function compareStores(
  items: SurvivalKitItem[],
  stores: string[],
  territory: Territory,
  allPrices: SurvivalKitPrice[]
): StoreComparison[] {
  const comparisons: StoreComparison[] = [];

  for (const store of stores) {
    let totalCost = 0;
    let itemsAvailable = 0;

    for (const item of items) {
      const storePrice = allPrices.find(
        p => p.item.id === item.id && p.store === store && p.territory === territory
      );

      if (storePrice && storePrice.availability !== 'out_of_stock') {
        totalCost += storePrice.price * item.quantityPerPerson;
        itemsAvailable++;
      }
    }

    comparisons.push({
      storeName: store,
      totalCost,
      itemsAvailable,
      itemsTotal: items.length,
      coveragePercentage: (itemsAvailable / items.length) * 100
    });
  }

  // Sort by total cost ascending
  comparisons.sort((a, b) => a.totalCost - b.totalCost);

  return comparisons;
}

/**
 * Load survival kit data from JSON
 */
export async function loadSurvivalKitData() {
  try {
    const response = await fetch('/data/survival-kit-prices.json');
    return await response.json();
  } catch (error) {
    console.error('Error loading survival kit data:', error);
    return null;
  }
}

/**
 * Get items by category
 */
export function getItemsByCategory(
  items: SurvivalKitItem[],
  category: string
): SurvivalKitItem[] {
  return items.filter(item => item.category === category);
}

/**
 * Get items by priority
 */
export function getItemsByPriority(
  items: SurvivalKitItem[],
  priority: string
): SurvivalKitItem[] {
  return items.filter(item => item.priority === priority);
}
