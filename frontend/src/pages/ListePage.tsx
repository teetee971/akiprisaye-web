import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { refreshItemPrices } from '../services/priceIntelligenceService';
import { useShoppingListStore } from '../store/useShoppingListStore';

function trendLabel(trend?: string) {
  switch (trend) {
    case 'down':
      return '↓ Baisse';
    case 'up':
      return '↑ Hausse';
    case 'stable':
      return '→ Stable';
    default:
      return '? Données insuffisantes';
  }
}

function recommendationLabel(reco?: string) {
  switch (reco) {
    case 'buy_now':
      return 'Acheter maintenant';
    case 'wait':
      return 'Attendre';
    default:
      return 'Surveiller';
  }
}

export default function ListePage() {
  const { items, clear, removeItem, updateItem } = useShoppingListStore();
  const [refreshing, setRefreshing] = useState(false);

  const totalItems = useMemo(() => items.length, [items]);

  async function refreshAllPrices() {
    setRefreshing(true);
    try {
      const updates = await Promise.all(items.map((item) => refreshItemPrices(item)));
      updates.forEach((item) => {
        updateItem(item.id, item);
      });
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Ma Liste de Courses Intelligente</h1>
            <p className="text-sm text-slate-300">{totalItems} élément{totalItems > 1 ? 's' : ''}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={refreshAllPrices}
              disabled={refreshing || items.length === 0}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {refreshing ? 'Mise à jour…' : 'Mettre à jour les prix'}
            </button>
            <button
              type="button"
              onClick={clear}
              disabled={items.length === 0}
              className="rounded-lg border border-rose-500/60 px-4 py-2 text-sm font-semibold text-rose-200 disabled:opacity-50"
            >
              Vider la liste
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-center text-slate-300">
            Votre liste est vide. Ajoutez des produits depuis le scan.
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-white">{item.name}</h2>
                    <p className="text-xs text-slate-400">{item.brand || 'Marque inconnue'}</p>
                    <p className="mt-1 text-xs text-slate-400">Code-barres: {item.barcode}</p>
                    <p className="text-xs text-slate-400">
                      Dernier prix: {item.lastPrice ? `${item.lastPrice.toFixed(2)} €` : 'N/A'}
                      {item.lastPriceDate ? ` · ${new Date(item.lastPriceDate).toLocaleDateString()}` : ''}
                    </p>
                    <p className="text-sm text-blue-200">{trendLabel(item.priceTrend)}</p>
                    <p className="text-sm text-emerald-200">{recommendationLabel(item.recommendation)}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Link
                      to={`/liste/${encodeURIComponent(item.id)}`}
                      className="rounded-lg bg-slate-700 px-3 py-2 text-xs font-semibold text-white"
                    >
                      Voir détails
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold text-slate-100"
                    >
                      Retirer
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
