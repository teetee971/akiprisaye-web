import React from 'react';

export interface RecommendedProduct {
  id: string;
  name: string;
  category?: string;
  price?: number;
  delta?: number;
  retailer?: string;
  predictiveScore?: number;
}

interface RecommendedForYouSectionProps {
  products?: RecommendedProduct[];
}

export function RecommendedForYouSection({ products = [] }: RecommendedForYouSectionProps) {
  if (products.length === 0) {
    return (
      <section className="rounded-xl bg-gray-900 border border-gray-700 p-4">
        <h2 className="text-lg font-semibold text-white mb-2">⭐ Recommandé pour vous</h2>
        <p className="text-gray-400 text-sm">Naviguez sur des produits pour recevoir des recommandations personnalisées.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl bg-gray-900 border border-gray-700 p-4">
      <h2 className="text-lg font-semibold text-white mb-3">⭐ Recommandé pour vous</h2>
      <ul className="space-y-2">
        {products.slice(0, 5).map((p) => (
          <li key={p.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{p.name}</p>
              {p.category && <p className="text-xs text-gray-400">{p.category}</p>}
            </div>
            <div className="flex items-center gap-2 ml-3 shrink-0">
              {p.price != null && (
                <span className="text-sm font-semibold text-green-400">{p.price.toFixed(2)} €</span>
              )}
              {p.delta != null && p.delta > 0 && (
                <span className="text-xs bg-red-900 text-red-300 rounded px-1">-{Math.round(p.delta * 100)}%</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default RecommendedForYouSection;
