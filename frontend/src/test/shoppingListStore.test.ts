import { beforeEach, describe, expect, it } from 'vitest';
import {
  __resetShoppingListStoreForTests,
  shoppingListStore,
  SHOPPING_LIST_STORAGE_KEY,
} from '../store/useShoppingListStore';

describe('shoppingListStore', () => {
  beforeEach(() => {
    localStorage.clear();
    __resetShoppingListStoreForTests();
  });

  it('addItem stores an item', () => {
    shoppingListStore.addItem({
      id: '123:mq',
      barcode: '123',
      name: 'Produit test',
      territory: 'mq',
      addedAt: Date.now(),
    });

    expect(shoppingListStore.getState().items).toHaveLength(1);
    expect(shoppingListStore.getState().items[0]?.name).toBe('Produit test');
  });

  it('removeItem removes existing item', () => {
    shoppingListStore.addItem({
      id: '123:mq',
      barcode: '123',
      name: 'A',
      territory: 'mq',
      addedAt: Date.now(),
    });

    shoppingListStore.removeItem('123:mq');

    expect(shoppingListStore.getState().items).toHaveLength(0);
  });

  it('hydrate restores items from localStorage', () => {
    localStorage.setItem(
      SHOPPING_LIST_STORAGE_KEY,
      JSON.stringify([
        {
          id: 'abc:gp',
          barcode: 'abc',
          name: 'Hydrated',
          territory: 'gp',
          addedAt: 1,
        },
      ]),
    );

    shoppingListStore.hydrate();

    expect(shoppingListStore.getState().items[0]?.name).toBe('Hydrated');
  });
});
