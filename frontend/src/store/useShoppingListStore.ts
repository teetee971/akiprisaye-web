import { emitUpgradePrompt } from '../billing/upgradePrompt';
import { computeAlerts, computeConfidenceScore, computeTrend, normalizePrice, type PriceHistoryPoint } from '../domain/shoppingList/premium';

const STORAGE_KEY = 'akiprisaye_shopping_list_v1';

const PLAN_STORAGE_KEY = 'akiprisaye_user_plan_v1';

export type UserPlan = 'free' | 'premium';

export function getUserPlan(): UserPlan {
  try {
    const raw = window.localStorage.getItem(PLAN_STORAGE_KEY);
    return raw === 'premium' ? 'premium' : 'free';
  } catch {
    return 'free';
  }
}

export function setUserPlan(plan: UserPlan) {
  window.localStorage.setItem(PLAN_STORAGE_KEY, plan);
  window.dispatchEvent(new CustomEvent('akiprisaye:user-plan-updated', { detail: { plan } }));
}


const DEFAULT_TRIAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export type UserAccessState = {
  userPlan: UserPlan;
  premiumTrialEndsAt?: number;
};

export function getUserAccessState(): UserAccessState {
  try {
    const plan = getUserPlan();
    const raw = window.localStorage.getItem('akiprisaye_premium_trial_ends_at');
    const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
    return {
      userPlan: plan,
      premiumTrialEndsAt: Number.isFinite(parsed) && parsed > 0 ? parsed : undefined,
    };
  } catch {
    return { userPlan: 'free' };
  }
}

export function startPremiumTrial(durationMs = DEFAULT_TRIAL_DURATION_MS): number {
  const endsAt = Date.now() + Math.max(1, durationMs);
  window.localStorage.setItem('akiprisaye_premium_trial_ends_at', String(endsAt));
  window.dispatchEvent(new CustomEvent('akiprisaye:user-plan-updated', { detail: { plan: getUserPlan(), premiumTrialEndsAt: endsAt } }));
  return endsAt;
}

export function isPremiumAccessActive(state: UserAccessState = getUserAccessState()): boolean {
  if (state.userPlan === 'premium') return true;
  return Boolean(state.premiumTrialEndsAt && state.premiumTrialEndsAt > Date.now());
}

export interface ShoppingListStoreItem {
  id: string;
  name: string;
  quantity: number;
  price?: number;
  territory?: string;
  history?: number[];
  source?: string;
  lastObservedAt?: string;
<<<<<<< HEAD

=======
>>>>>>> origin/main
  imageUrl?: string;
  imageThumbUrl?: string;
  unit?: 'unit' | 'kg' | 'l';
  quantityValue?: number;
  quantityUnit?: 'kg' | 'g' | 'l' | 'ml' | 'unit';
  normalized?: {
    pricePerUnit?: number;
    normalizedLabel?: string;
  };
  premium?: {
    score?: number;
    trend7?: 'up' | 'down' | 'flat';
    trend30?: 'up' | 'down' | 'flat';
    alerts?: string[];
  };
}

function inferPriceHistory(item: ShoppingListStoreItem): PriceHistoryPoint[] {
  if (!Array.isArray(item.history) || item.history.length === 0) return [];
  const endAt = item.lastObservedAt ? new Date(item.lastObservedAt).getTime() : Date.now();
  return item.history
    .filter((price) => Number.isFinite(price))
    .map((price, index, array) => ({
      price,
      observedAt: new Date(endAt - ((array.length - 1 - index) * 24 * 60 * 60 * 1000)).toISOString(),
    }));
}

function enrichWithPremium(item: ShoppingListStoreItem): ShoppingListStoreItem {
  const priceHistory = inferPriceHistory(item);
  const normalized = normalizePrice({
    price: item.price,
    unit: item.unit,
    quantityValue: item.quantityValue,
    quantityUnit: item.quantityUnit,
  });

  return {
    ...item,
    normalized,
    premium: {
      score: computeConfidenceScore({ source: item.source, lastObservedAt: item.lastObservedAt, priceHistory }),
      trend7: computeTrend(priceHistory, 7).trend,
      trend30: computeTrend(priceHistory, 30).trend,
      alerts: computeAlerts({ price: item.price, priceHistory }),
    },
  };
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
          ? enrichWithPremium({
              ...current,
              quantity: current.quantity + item.quantity,
              price: item.price ?? current.price,
              imageUrl: item.imageUrl ?? current.imageUrl,
              imageThumbUrl: item.imageThumbUrl ?? current.imageThumbUrl,
              unit: item.unit ?? current.unit,
              quantityValue: item.quantityValue ?? current.quantityValue,
              quantityUnit: item.quantityUnit ?? current.quantityUnit,
              source: item.source ?? current.source,
              lastObservedAt: item.lastObservedAt ?? current.lastObservedAt,
              history: item.price ? [...(current.history ?? []), item.price] : current.history,
            })
          : current,
      )
    : [...items, enrichWithPremium(item)];

  writeStorage(next);
  return { ok: true as const, items: next };
}

export function removeShoppingListItem(id: string) {
  const next = readStorage().filter((item) => item.id !== id);
  writeStorage(next);
  return next;
}

export function updateShoppingListItem(id: string, patch: Partial<ShoppingListStoreItem>) {
  const next = readStorage().map((item) => (item.id === id ? enrichWithPremium({ ...item, ...patch }) : item));
  writeStorage(next);
  return next;
}

export function getShoppingListCount() {
  return readStorage().reduce((sum, item) => sum + item.quantity, 0);
}
