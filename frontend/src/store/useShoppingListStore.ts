import { emitUpgradePrompt } from '../billing/upgradePrompt';

const STORAGE_KEY = 'akiprisaye_shopping_list_v1';

export interface ShoppingListStoreItem {
  id: string;
  name: string;
  quantity: number;
  price?: number;
  territory?: string;
  history?: number[];
  source?: string;
  lastObservedAt?: string;

  imageUrl?: string;
  imageThumbUrl?: string;

}

function readStorage(): ShoppingListStoreItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStorage(items: ShoppingListStoreItem[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('akiprisaye:shopping-list-updated'));
}

export function getShoppingListItems() {
  return readStorage();
}

export function hydrateShoppingList() {
  return readStorage();
}

export function addShoppingListItem(item: ShoppingListStoreItem, maxItems: number) {
  const items = readStorage();
  if (!items.find((current) => current.id === item.id) && items.length >= maxItems) {
    emitUpgradePrompt({ quotaName: 'maxItems', message: `Limite atteinte (${maxItems} articles).` });
    return { ok: false as const, reason: 'MAX_ITEMS' as const };
  }

  const existing = items.find((current) => current.id === item.id);
  const next = existing
    ? items.map((current) =>
        current.id === item.id

          ? {
              ...current,
              quantity: current.quantity + item.quantity,
              price: item.price ?? current.price,
              imageUrl: item.imageUrl ?? current.imageUrl,
              imageThumbUrl: item.imageThumbUrl ?? current.imageThumbUrl,
            }

          : current,
      )
    : [...items, item];

  writeStorage(next);
  return { ok: true as const, items: next };
}

export function removeShoppingListItem(id: string) {
  const next = readStorage().filter((item) => item.id !== id);
  writeStorage(next);
  return next;
}

export function updateShoppingListItem(id: string, patch: Partial<ShoppingListStoreItem>) {
  const next = readStorage().map((item) => (item.id === id ? { ...item, ...patch } : item));
  writeStorage(next);
  return next;
}


export function getShoppingListCount() {
  return readStorage().reduce((sum, item) => sum + item.quantity, 0);
}
