/**
 * Cheapest Products Section Component
 *
 * Displays the cheapest products observed at a store with territory comparison.
 * PROMPT 2: Produits les moins chers du magasin
 */

import React from 'react';
import type { CheapestProduct } from '../../services/storeCheapestProductsService';
import {
  getPriceComparisonIcon,
  getPriceComparisonColor,
  formatObservationDate,
} from '../../services/storeCheapestProductsService';
import { useTiPanier } from '../../hooks/useTiPanier';

interface CheapestProductsSectionProps {
  products: CheapestProduct[];
  storeName: string;
}

export default function CheapestProductsSection({
  products,
  storeName,
}: CheapestProductsSectionProps) {
  const { addItem } = useTiPanier('comparison');
  if (products.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 text-center">
        <div className="text-5xl mb-4">📊</div>
        <p className="text-gray-300 mb-2">Aucune donnée de prix disponible</p>
        <p className="text-gray-400 text-sm">
          Les données de prix observés pour cette enseigne seront affichées ici.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">
            💰 Produits les moins chers observés ici
          </h3>
          <p className="text-sm text-gray-400">
            Top {products.length} des prix observés dans cette enseigne
          </p>
        </div>

        {/* Legend */}
        <div className="text-sm text-gray-400 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-green-400">↓</span>
            <span>Moins cher que la moyenne</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-400">=</span>
            <span>Prix moyen du territoire</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber-400">↑</span>
            <span>Plus cher que la moyenne</span>
          </div>
        </div>
      </div>

      {/* Products List */}
      <div className="space-y-3">
        {products.map((product, index) => (
          <div
            key={product.id}
            className="bg-slate-800 rounded-lg p-4 hover:bg-slate-700 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-gray-500 font-mono text-sm">#{index + 1}</span>
                  {product.isCheapestInTerritory && (
                    <span className="px-2 py-0.5 bg-green-900/30 text-green-300 text-xs rounded border border-green-700">
                      ⭐ Parmi les moins chers du territoire
                    </span>
                  )}
                </div>

                <h4 className="text-white font-medium truncate">
                  {product.brand} {product.name}
                </h4>

                <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                  <span>{product.size}</span>
                  <span>•</span>
                  <span className="capitalize">{product.category}</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                  <span>📅 Observé {formatObservationDate(product.observationDate)}</span>
                </div>

                {/* PROMPT 3: Add to Basket Button */}
                <button
                  onClick={() => {
                    addItem({
                      id: product.id,
                      quantity: 1,
                      meta: {
                        name: `${product.brand} ${product.name}`,
                        price: product.price,
                        size: product.size,
                        category: product.category,
                      },
                    });
                  }}
                  className="mt-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                >
                  <span>🛒</span>
                  <span>Ajouter au panier</span>
                </button>
              </div>

              {/* Price & Comparison */}
              <div className="text-right flex-shrink-0">
                <div className="text-2xl font-bold text-white mb-1">
                  {product.price.toFixed(2)} €
                </div>

                {product.territoryAverage !== undefined && (
                  <div className="space-y-1">
                    <div
                      className={`text-sm font-medium ${getPriceComparisonColor(product.priceComparison)}`}
                    >
                      {getPriceComparisonIcon(product.priceComparison)} vs moyenne
                    </div>

                    <div className="text-xs text-gray-400">
                      Moy: {product.territoryAverage.toFixed(2)} €
                    </div>

                    {product.savingsPercent !== undefined && product.savingsPercent > 0 && (
                      <div className="text-xs text-green-400 font-medium">
                        -{product.savingsPercent}%
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pedagogical Message */}
      <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-xl flex-shrink-0">💡</span>
          <div>
            <p className="text-blue-200 text-sm font-medium mb-1">Méthodologie claire</p>
            <p className="text-blue-100/80 text-xs">
              Ces prix sont issus d'observations déclarées et comparés à la moyenne du territoire
              calculée sur toutes les enseignes référencées. Les données peuvent varier selon la
              disponibilité et la date d'observation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
