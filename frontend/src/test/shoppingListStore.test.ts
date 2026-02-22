import { beforeEach, describe, expect, it } from 'vitest';
import { addShoppingListItem, getShoppingListItems } from '../store/useShoppingListStore';

describe('shopping list store', () => {
  beforeEach(() => localStorage.clear());

  it('enforces maxItems', () => {
    addShoppingListItem({ id: '1', name: 'A', quantity: 1 }, 1);
    const result = addShoppingListItem({ id: '2', name: 'B', quantity: 1 }, 1);
    expect(result.ok).toBe(false);
    expect(getShoppingListItems()).toHaveLength(1);
  });
});
