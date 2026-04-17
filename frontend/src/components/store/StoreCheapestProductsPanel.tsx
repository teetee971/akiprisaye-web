/**
 * Store Cheapest Products Detail Panel
 *
 * Displays detailed view of the cheapest products observed at a store.
 * Shows product list, prices, observation dates, and store information.
 *
 * Constraints:
 * - Descriptive data only - no commercial incentives
 * - No buy buttons or external links
 * - Mandatory transparency disclaimer
 * - Based on observed data only
 */

import React from 'react';
import { X } from 'lucide-react';
import type { CheapestByStore } from '../../services/storeCheapestProductsService';
import { formatObservationDate } from '../../services/storeCheapestProductsService';

interface StoreCheapestProductsPanelProps {
  data: CheapestByStore;
  onClose: () => void;
}

export default function StoreCheapestProductsPanel({
  data,
  onClose,
}: StoreCheapestProductsPanelProps) {
  const { store, cheapestProducts, lastObservation } = data;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-slate-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border-b border-slate-700 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">🏪</span>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {store.chain} – {store.territory}
                  </h2>
                  <p className="text-blue-200 text-sm mt-1">
                    {cheapestProducts.length} produits les moins chers observés
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2"
              aria-label="Fermer"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Address Section */}
        <div className="bg-slate-800/50 border-b border-slate-700 p-4">
          <div className="flex items-center gap-2 text-gray-300 mb-2">
            <span className="text-gray-500">📍</span>
            <span>
              {store.address}, {store.postalCode} {store.city}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>📅</span>
            <span>Dernière observation : {formatObservationDate(lastObservation)}</span>
          </div>
        </div>

        {/* Products List - Scrollable */}
        <div className="overflow-y-auto max-h-[50vh] p-6">
          {cheapestProducts.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">📊</div>
              <p className="text-gray-300 mb-2">Aucun produit observé</p>
              <p className="text-gray-400 text-sm">
                Les données d'observation pour cette enseigne seront affichées ici.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-slate-700">
                    <th className="pb-3 text-sm font-semibold text-gray-400">Produit</th>
                    <th className="pb-3 text-sm font-semibold text-gray-400">Catégorie</th>
                    <th className="pb-3 text-sm font-semibold text-gray-400 text-right">Prix</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {cheapestProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3">
                        <div>
                          <div className="text-white font-medium">
                            {product.brand} {product.name}
                          </div>
                          <div className="text-sm text-gray-400">{product.size}</div>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="text-sm text-gray-300 capitalize">{product.category}</div>
                      </td>
                      <td className="py-3 text-right">
                        <div className="text-lg font-bold text-green-400">
                          {product.price.toFixed(2)} €
                        </div>
                        {product.savingsPercent && product.savingsPercent > 0 && (
                          <div className="text-xs text-green-300">
                            -{product.savingsPercent}% vs moyenne
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Mandatory Transparency Disclaimer */}
        <div className="bg-blue-900/20 border-t border-blue-700/50 p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">ℹ️</span>
            <div className="text-sm">
              <p className="text-blue-200 font-medium mb-1">Transparence des données</p>
              <p className="text-blue-100/80">
                Données issues d'observations comparatives citoyennes. Les prix peuvent varier selon
                la date et le point de vente.
              </p>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="bg-slate-800/50 border-t border-slate-700 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
