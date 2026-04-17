import { beforeEach, describe, expect, it } from 'vitest';
import {
  addShoppingListItem,
  getShoppingListCount,
  getShoppingListItems,
} from '../store/useShoppingListStore';

describe('shopping list persistence', () => {
  beforeEach(() => localStorage.clear());

  it('persists items across reads (refresh-like behavior)', () => {
    addShoppingListItem({ id: 'ean-1', name: 'Produit test', quantity: 2 }, 30);

    // Simule un refresh: on relit depuis localStorage
    const itemsAfterRefresh = getShoppingListItems();
    expect(itemsAfterRefresh).toHaveLength(1);
    expect(itemsAfterRefresh[0]?.name).toBe('Produit test');
    expect(getShoppingListCount()).toBe(2);
  });
});
