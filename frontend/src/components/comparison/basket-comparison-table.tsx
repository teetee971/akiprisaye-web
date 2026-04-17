/**
 * Basket Comparison Table Component
 *
 * Displays a detailed product-by-product price comparison across stores
 * Products in rows, stores in columns with visual indicators
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { BasketStoreComparison } from '../../services/basketComparisonService';

interface BasketComparisonTableProps {
  comparisons: BasketStoreComparison[];
  className?: string;
}

export function BasketComparisonTable({ comparisons, className = '' }: BasketComparisonTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  if (comparisons.length === 0) {
    return null;
  }

  // Get all unique products across all stores
  const allProducts = new Map<string, { id: string; name: string }>();
  comparisons.forEach((comp) => {
    comp.items.forEach((item) => {
      if (!allProducts.has(item.id)) {
        allProducts.set(item.id, { id: item.id, name: item.name });
      }
    });
  });

  const productList = Array.from(allProducts.values());

  // Toggle row expansion on mobile
  const toggleRow = (productId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedRows(newExpanded);
  };

  // Find min/max prices for each product
  const getProductPriceRange = (productId: string) => {
    const prices = comparisons
      .map((comp) => {
        const item = comp.items.find((i) => i.id === productId);
        return item?.price;
      })
      .filter((p): p is number => p !== undefined && p > 0);

    if (prices.length === 0) return { min: 0, max: 0 };

    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  };

  return (
    <div className={className}>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-800/50 border-b border-slate-700">
              <th className="p-3 text-left text-sm font-semibold text-gray-300 sticky left-0 bg-slate-800/50 z-10">
                Produit
              </th>
              {comparisons.map((comp, idx) => (
                <th
                  key={comp.storeId}
                  className="p-3 text-center text-sm font-semibold text-gray-300 min-w-[120px]"
                >
                  <div className="flex flex-col items-center gap-1">
                    {idx === 0 && <span className="text-xs text-green-400">🏆</span>}
                    <span>{comp.storeName}</span>
                    <span className="text-xs font-normal text-gray-500">{comp.chain}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {productList.map((product) => {
              const priceRange = getProductPriceRange(product.id);

              return (
                <tr
                  key={product.id}
                  className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors"
                >
                  <td className="p-3 text-sm text-white sticky left-0 bg-slate-900/95 z-10">
                    {product.name}
                  </td>
                  {comparisons.map((comp) => {
                    const item = comp.items.find((i) => i.id === product.id);
                    const price = item?.price;
                    const isAvailable = item?.available;

                    if (!isAvailable || !price) {
                      return (
                        <td key={comp.storeId} className="p-3 text-center">
                          <span className="text-xs text-gray-500">Non disponible</span>
                        </td>
                      );
                    }

                    const isLowest =
                      Math.abs(price - priceRange.min) < 0.01 && priceRange.min < priceRange.max;
                    const isHighest =
                      Math.abs(price - priceRange.max) < 0.01 && priceRange.min < priceRange.max;

                    return (
                      <td key={comp.storeId} className="p-3 text-center">
                        <div
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded ${
                            isLowest
                              ? 'bg-green-900/30 border border-green-700 text-green-300'
                              : isHighest
                                ? 'bg-red-900/30 border border-red-700 text-red-300'
                                : 'text-white'
                          }`}
                        >
                          {isLowest && '🟢'}
                          {isHighest && '🔴'}
                          <span className="font-semibold">{price.toFixed(2)} €</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {/* Total Row */}
            <tr className="bg-slate-800/70 border-t-2 border-slate-600 font-bold">
              <td className="p-4 text-white sticky left-0 bg-slate-800/70 z-10">TOTAL</td>
              {comparisons.map((comp, idx) => {
                const isLowest = idx === 0;

                return (
                  <td key={comp.storeId} className="p-4 text-center">
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-lg ${
                        isLowest
                          ? 'bg-green-900/40 border border-green-600 text-green-300'
                          : 'text-white'
                      }`}
                    >
                      {isLowest && '🏆'}
                      <span>{comp.totalPrice.toFixed(2)} €</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {comp.availableItems}/{comp.totalItems} articles
                    </div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Mobile Accordion View */}
      <div className="md:hidden space-y-3">
        {productList.map((product) => {
          const priceRange = getProductPriceRange(product.id);
          const isExpanded = expandedRows.has(product.id);

          // Find stores with this product
          const availableStores = comparisons.filter(
            (comp) => comp.items.find((i) => i.id === product.id)?.available
          );

          if (availableStores.length === 0) return null;

          return (
            <div
              key={product.id}
              className="bg-slate-800/50 rounded-lg overflow-hidden border border-slate-700"
            >
              <button
                onClick={() => toggleRow(product.id)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/70 transition-colors"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{product.name}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {availableStores.length} magasin{availableStores.length > 1 ? 's' : ''}
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="text-gray-400" size={20} />
                ) : (
                  <ChevronDown className="text-gray-400" size={20} />
                )}
              </button>

              {isExpanded && (
                <div className="border-t border-slate-700 p-3 space-y-2">
                  {availableStores.map((comp) => {
                    const item = comp.items.find((i) => i.id === product.id);
                    const price = item?.price || 0;
                    const isLowest =
                      Math.abs(price - priceRange.min) < 0.01 && priceRange.min < priceRange.max;
                    const isHighest =
                      Math.abs(price - priceRange.max) < 0.01 && priceRange.min < priceRange.max;

                    return (
                      <div
                        key={comp.storeId}
                        className="flex items-center justify-between p-2 rounded bg-slate-900/50"
                      >
                        <div>
                          <div className="text-sm text-white">{comp.storeName}</div>
                          <div className="text-xs text-gray-500">{comp.chain}</div>
                        </div>
                        <div
                          className={`px-2 py-1 rounded font-semibold ${
                            isLowest
                              ? 'bg-green-900/30 border border-green-700 text-green-300'
                              : isHighest
                                ? 'bg-red-900/30 border border-red-700 text-red-300'
                                : 'text-white'
                          }`}
                        >
                          {isLowest && '🟢 '}
                          {isHighest && '🔴 '}
                          {price.toFixed(2)} €
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Mobile Total Summary */}
        <div className="bg-slate-800/70 rounded-lg p-4 border-2 border-slate-600">
          <h3 className="text-sm font-semibold text-white mb-3 uppercase">Totaux par magasin</h3>
          <div className="space-y-2">
            {comparisons.map((comp, idx) => {
              const isLowest = idx === 0;

              return (
                <div
                  key={comp.storeId}
                  className={`flex items-center justify-between p-3 rounded ${
                    isLowest ? 'bg-green-900/30 border border-green-700' : 'bg-slate-900/50'
                  }`}
                >
                  <div>
                    <div className="text-sm font-medium text-white flex items-center gap-2">
                      {isLowest && '🏆'}
                      {comp.storeName}
                    </div>
                    <div className="text-xs text-gray-400">
                      {comp.availableItems}/{comp.totalItems} articles
                    </div>
                  </div>
                  <div
                    className={`text-lg font-bold ${isLowest ? 'text-green-300' : 'text-white'}`}
                  >
                    {comp.totalPrice.toFixed(2)} €
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
