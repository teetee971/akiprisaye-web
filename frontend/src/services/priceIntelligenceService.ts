import { searchProductPrices } from './priceSearch/priceSearch.service';
import { decidePriceAction } from './priceDecisionEngine';
import type { ShoppingItem } from '../store/useShoppingListStore';

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
  }
  return sorted[mid] ?? 0;
}

export async function refreshItemPrices(item: ShoppingItem): Promise<ShoppingItem> {
  const result = await searchProductPrices({
    barcode: item.barcode,
    territory: item.territory,
  });

  const observations = result.observations
    .filter((obs) => !obs.territory || obs.territory === item.territory)
    .map((obs) => ({
      price: obs.price,
      observedAt: obs.observedAt ?? result.metadata.queriedAt,
      source: obs.source,
    }));

  const mergedHistory = [...(item.priceHistory ?? []), ...observations]
    .filter((obs) => Number.isFinite(obs.price) && obs.price > 0)
    .sort((a, b) => new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime());

  const dedupedHistory = mergedHistory.filter((obs, index, array) => {
    if (index === 0) return true;
    const prev = array[index - 1];
    return !(prev && prev.price === obs.price && prev.observedAt === obs.observedAt);
  });

  const prices = dedupedHistory.map((entry) => entry.price);
  const min = prices.length > 0 ? Math.min(...prices) : undefined;
  const med = prices.length > 0 ? median(prices) : undefined;

  const last = dedupedHistory[dedupedHistory.length - 1];
  const decision = decidePriceAction({ history: dedupedHistory, lastPrice: last?.price ?? item.lastPrice });

  return {
    ...item,
    lastPrice: last?.price ?? item.lastPrice,
    lastPriceDate: last?.observedAt ?? item.lastPriceDate,
    priceHistory: dedupedHistory,
    priceTrend: decision.trend,
    recommendation: decision.recommendation,
    quantity: item.quantity ?? (med && min ? `médiane ${med.toFixed(2)}€ (min ${min.toFixed(2)}€)` : item.quantity),
  };
}
