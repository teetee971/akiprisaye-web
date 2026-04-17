/**
 * Savings Summary Component
 *
 * Displays potential savings prominently with projections
 */

import React from 'react';
import { TrendingDown, Calendar, Sparkles } from 'lucide-react';
import type { BasketStoreComparison } from '../../services/basketComparisonService';

interface SavingsSummaryProps {
  cheapestStore: BasketStoreComparison | null;
  mostExpensiveStore: BasketStoreComparison | null;
  priceDifference: number;
  percentageSavings: number;
  className?: string;
}

export function SavingsSummary({
  cheapestStore,
  mostExpensiveStore,
  priceDifference,
  percentageSavings,
  className = '',
}: SavingsSummaryProps) {
  if (!cheapestStore || !mostExpensiveStore || priceDifference <= 0) {
    return null;
  }

  // Calculate projections (assuming weekly shopping)
  const weeklySavings = priceDifference;
  const monthlySavings = weeklySavings * 4.33; // Average weeks per month
  const annualSavings = weeklySavings * 52;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Savings Card */}
      <div className="bg-gradient-to-br from-green-900/40 to-green-800/20 border-2 border-green-600 rounded-xl p-6 shadow-lg">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="text-green-400" size={24} />
              <h3 className="text-lg font-semibold text-green-300">Économie Maximale</h3>
            </div>

            <p className="text-sm text-green-100 leading-relaxed mb-4">
              En allant chez <span className="font-bold">{cheapestStore.storeName}</span> au lieu de{' '}
              <span className="font-bold">{mostExpensiveStore.storeName}</span>, vous économisez :
            </p>

            <div className="flex items-baseline gap-2">
              <div className="text-5xl font-bold text-green-300">{priceDifference.toFixed(2)}</div>
              <div className="text-2xl font-semibold text-green-400">€</div>
            </div>

            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-green-900/40 border border-green-700 rounded-full">
              <TrendingDown size={16} className="text-green-300" />
              <span className="text-sm font-semibold text-green-300">
                -{percentageSavings}% d'économie
              </span>
            </div>
          </div>

          {/* Store Comparison */}
          <div className="flex flex-col gap-2 text-right min-w-[180px]">
            <div>
              <div className="text-xs text-green-300 mb-1">🏆 Meilleur prix</div>
              <div className="text-2xl font-bold text-white">
                {cheapestStore.totalPrice.toFixed(2)} €
              </div>
              <div className="text-xs text-gray-400">{cheapestStore.storeName}</div>
            </div>

            <div className="h-px bg-green-700 my-1" />

            <div>
              <div className="text-xs text-red-300 mb-1">Plus cher</div>
              <div className="text-xl font-semibold text-gray-300">
                {mostExpensiveStore.totalPrice.toFixed(2)} €
              </div>
              <div className="text-xs text-gray-500">{mostExpensiveStore.storeName}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Projections Card */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="text-blue-400" size={20} />
          <h4 className="text-sm font-semibold text-gray-300 uppercase">Économies Projetées</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-slate-900/50 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">Par semaine</div>
            <div className="text-2xl font-bold text-white">{weeklySavings.toFixed(2)} €</div>
          </div>

          <div className="text-center p-3 bg-slate-900/50 rounded-lg border border-blue-800/50">
            <div className="text-xs text-blue-400 mb-1">Par mois (4 courses)</div>
            <div className="text-2xl font-bold text-blue-300">~{monthlySavings.toFixed(2)} €</div>
          </div>

          <div className="text-center p-3 bg-slate-900/50 rounded-lg border border-purple-800/50">
            <div className="text-xs text-purple-400 mb-1">Par an (52 semaines)</div>
            <div className="text-2xl font-bold text-purple-300">~{annualSavings.toFixed(2)} €</div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-amber-900/20 border border-amber-700/50 rounded-lg">
          <p className="text-xs text-amber-200 flex items-start gap-2">
            <span>💡</span>
            <span>
              Ces projections supposent que vous faites des courses similaires chaque semaine. Les
              économies réelles peuvent varier selon vos habitudes d'achat et les prix en magasin.
            </span>
          </p>
        </div>
      </div>

      {/* Additional Info */}
      <div className="text-center text-xs text-gray-500">
        <p>💰 Comparer régulièrement peut vous aider à optimiser votre budget alimentaire</p>
      </div>
    </div>
  );
}
