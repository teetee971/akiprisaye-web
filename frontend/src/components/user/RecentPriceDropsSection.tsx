import React from 'react';

export interface PriceDrop {
  id: string;
  name: string;
  currentPrice: number;
  previousPrice: number;
  retailer?: string;
  delta: number;
  territory?: string;
}

interface RecentPriceDropsSectionProps {
  drops?: PriceDrop[];
}

export function RecentPriceDropsSection({ drops = [] }: RecentPriceDropsSectionProps) {
  if (drops.length === 0) {
    return (
      <section className="rounded-xl bg-gray-900 border border-gray-700 p-4">
        <h2 className="text-lg font-semibold text-white mb-2">📉 Baisses de prix récentes</h2>
        <p className="text-gray-400 text-sm">Aucune baisse détectée pour vos produits suivis.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl bg-gray-900 border border-gray-700 p-4">
      <h2 className="text-lg font-semibold text-white mb-3">📉 Baisses de prix récentes</h2>
      <ul className="space-y-2">
        {drops.slice(0, 6).map((drop) => (
          <li key={drop.id} className="bg-gray-800 rounded-lg px-3 py-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-white truncate flex-1 min-w-0">{drop.name}</p>
              <span className="text-xs bg-red-900 text-red-300 rounded px-1.5 py-0.5 ml-2 shrink-0">
                -{Math.round(drop.delta * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm font-bold text-green-400">
                {drop.currentPrice.toFixed(2)} €
              </span>
              <span className="text-xs text-gray-500 line-through">
                {drop.previousPrice.toFixed(2)} €
              </span>
              {drop.retailer && <span className="text-xs text-gray-500">{drop.retailer}</span>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default RecentPriceDropsSection;
