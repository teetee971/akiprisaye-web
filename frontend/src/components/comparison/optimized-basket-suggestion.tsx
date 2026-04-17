/**
 * Optimized Basket Suggestion Component
 *
 * Suggests the best combination of products from different stores
 * to achieve the lowest total price (multi-store optimization)
 */

import React, { useState } from 'react';
import { Sparkles, ShoppingBag, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import type { BasketStoreComparison } from '../../services/basketComparisonService';

interface OptimizedBasketSuggestionProps {
  comparisons: BasketStoreComparison[];
  className?: string;
}

interface OptimizedItem {
  productId: string;
  productName: string;
  storeName: string;
  storeId: string;
  price: number;
  quantity: number;
}

export function OptimizedBasketSuggestion({
  comparisons,
  className = '',
}: OptimizedBasketSuggestionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (comparisons.length === 0) {
    return null;
  }

  // Calculate optimized basket (best price for each product across all stores)
  const optimizedBasket = calculateOptimizedBasket(comparisons);
  const singleStoreBestPrice = comparisons[0]?.totalPrice || 0;
  const optimizedTotal = optimizedBasket.total;
  const savings = singleStoreBestPrice - optimizedTotal;
  const savingsPercent =
    singleStoreBestPrice > 0 ? ((savings / singleStoreBestPrice) * 100).toFixed(1) : '0';

  // Group items by store
  const itemsByStore = optimizedBasket.items.reduce(
    (acc, item) => {
      if (!acc[item.storeId]) {
        acc[item.storeId] = {
          storeName: item.storeName,
          items: [],
          total: 0,
        };
      }
      acc[item.storeId].items.push(item);
      acc[item.storeId].total += item.price * item.quantity;
      return acc;
    },
    {} as Record<string, { storeName: string; items: OptimizedItem[]; total: number }>
  );

  const storesInvolved = Object.keys(itemsByStore).length;

  return (
    <div
      className={`bg-gradient-to-br from-purple-900/30 to-blue-900/20 border-2 border-purple-600/50 rounded-xl p-5 ${className}`}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between gap-4 text-left hover:opacity-90 transition-opacity"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="text-purple-400" size={24} />
          <div>
            <h3 className="text-lg font-semibold text-purple-300">🎯 Panier Optimisé</h3>
            <p className="text-sm text-gray-400">Meilleure combinaison multi-magasins</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-purple-300">{optimizedTotal.toFixed(2)} €</div>
            {savings > 0.01 && (
              <div className="text-xs text-green-400">
                -{savings.toFixed(2)} € ({savingsPercent}%)
              </div>
            )}
          </div>

          {isExpanded ? (
            <ChevronUp className="text-gray-400" size={20} />
          ) : (
            <ChevronDown className="text-gray-400" size={20} />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="mt-5 space-y-4 border-t border-purple-800/30 pt-5">
          {/* Summary */}
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="flex items-start gap-3 mb-3">
              <ShoppingBag className="text-blue-400 mt-0.5" size={20} />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-white mb-1">
                  Stratégie d'achat optimale
                </h4>
                <p className="text-sm text-gray-300">
                  En achetant {optimizedBasket.items.length} produit
                  {optimizedBasket.items.length > 1 ? 's' : ''} dans{' '}
                  <span className="font-semibold text-purple-300">
                    {storesInvolved} magasin{storesInvolved > 1 ? 's' : ''}
                  </span>
                  , vous économisez{' '}
                  <span className="font-semibold text-green-400">{savings.toFixed(2)} €</span> par
                  rapport au meilleur magasin unique.
                </p>
              </div>
            </div>

            {storesInvolved > 1 && (
              <div className="flex items-start gap-2 p-3 bg-amber-900/20 border border-amber-700/50 rounded-lg text-xs text-amber-200">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <p>
                  Cette stratégie nécessite de visiter plusieurs magasins. Pensez à considérer le
                  temps de trajet et les coûts de transport pour évaluer si l'économie en vaut la
                  peine.
                </p>
              </div>
            )}
          </div>

          {/* Breakdown by Store */}
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-3 uppercase">
              Répartition par magasin
            </h4>
            <div className="space-y-3">
              {Object.entries(itemsByStore).map(([storeId, storeData]) => (
                <div
                  key={storeId}
                  className="bg-slate-900/50 rounded-lg p-4 border border-slate-700"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h5 className="text-sm font-semibold text-white">{storeData.storeName}</h5>
                      <p className="text-xs text-gray-500">
                        {storeData.items.length} produit{storeData.items.length > 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-purple-300">
                        {storeData.total.toFixed(2)} €
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {storeData.items.map((item) => (
                      <div
                        key={item.productId}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-300">
                          {item.productName}
                          {item.quantity > 1 && (
                            <span className="text-gray-500 ml-1">×{item.quantity}</span>
                          )}
                        </span>
                        <span className="font-semibold text-white">
                          {(item.price * item.quantity).toFixed(2)} €
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comparison */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900/50 rounded-lg p-3 text-center border border-slate-700">
              <div className="text-xs text-gray-400 mb-1">Meilleur magasin unique</div>
              <div className="text-xl font-bold text-white">
                {singleStoreBestPrice.toFixed(2)} €
              </div>
              {comparisons[0] && (
                <div className="text-xs text-gray-500 mt-1">{comparisons[0].storeName}</div>
              )}
            </div>

            <div className="bg-purple-900/30 rounded-lg p-3 text-center border border-purple-700">
              <div className="text-xs text-purple-400 mb-1">Panier optimisé</div>
              <div className="text-xl font-bold text-purple-300">{optimizedTotal.toFixed(2)} €</div>
              <div className="text-xs text-green-400 mt-1">
                {savings > 0.01 ? `Économie: ${savings.toFixed(2)} €` : 'Même prix'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Calculate the optimized basket by selecting the cheapest option
 * for each product across all stores
 */
function calculateOptimizedBasket(comparisons: BasketStoreComparison[]): {
  items: OptimizedItem[];
  total: number;
} {
  const optimizedItems: OptimizedItem[] = [];
  const productMap = new Map<
    string,
    { bestPrice: number; bestStore: BasketStoreComparison; quantity: number }
  >();

  // Find all unique products and their best prices
  comparisons.forEach((comparison) => {
    comparison.items.forEach((item) => {
      if (!item.available || !item.price) return;

      const existing = productMap.get(item.id);
      if (!existing || item.price < existing.bestPrice) {
        productMap.set(item.id, {
          bestPrice: item.price,
          bestStore: comparison,
          quantity: item.quantity,
        });
      }
    });
  });

  // Build optimized items list
  let total = 0;
  productMap.forEach((data, productId) => {
    const item = data.bestStore.items.find((i) => i.id === productId);
    if (item && item.price) {
      optimizedItems.push({
        productId,
        productName: item.name,
        storeName: data.bestStore.storeName,
        storeId: data.bestStore.storeId,
        price: item.price,
        quantity: data.quantity,
      });
      total += item.price * data.quantity;
    }
  });

  return { items: optimizedItems, total };
}
