import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useShoppingListStore } from '../store/useShoppingListStore';

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { items } = useShoppingListStore();
  const item = items.find((entry) => entry.id === id);

  const stats = useMemo(() => {
    const prices = (item?.priceHistory ?? []).map((entry) => entry.price);
    if (prices.length === 0) {
      return { min: 0, max: 0, avg: 0, variationPct: 0 };
    }

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = mean(prices);
    const first = prices[0] ?? 0;
    const last = prices[prices.length - 1] ?? 0;
    const variationPct = first > 0 ? ((last - first) / first) * 100 : 0;

    return { min, max, avg, variationPct };
  }, [item]);

  if (!item) {
    return (
      <div className="min-h-screen bg-slate-950 p-6 text-white">
        <div className="mx-auto max-w-3xl rounded-xl border border-slate-800 bg-slate-900 p-6">
          <p className="mb-4">Produit introuvable dans la liste.</p>
          <Link to="/liste" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold">Retour à la liste</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-4xl space-y-4">
        <Link to="/liste" className="inline-block text-sm text-blue-300">← Retour à la liste</Link>

        <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h1 className="text-2xl font-bold">{item.name}</h1>
          <p className="text-sm text-slate-300">{item.brand || 'Marque inconnue'} · {item.barcode}</p>
          <p className="mt-2 text-sm text-emerald-200">
            Recommandation: {item.recommendation === 'buy_now' ? 'Acheter maintenant' : item.recommendation === 'wait' ? 'Attendre' : 'Surveiller'}
          </p>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-2 text-lg font-semibold">Statistiques</h2>
          <p className="text-sm text-slate-300">Prix min: {stats.min ? `${stats.min.toFixed(2)} €` : 'N/A'}</p>
          <p className="text-sm text-slate-300">Prix max: {stats.max ? `${stats.max.toFixed(2)} €` : 'N/A'}</p>
          <p className="text-sm text-slate-300">Prix moyen: {stats.avg ? `${stats.avg.toFixed(2)} €` : 'N/A'}</p>
          <p className="text-sm text-slate-300">Variation: {stats.variationPct.toFixed(2)}%</p>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-3 text-lg font-semibold">Historique des prix</h2>
          {item.priceHistory && item.priceHistory.length > 0 ? (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-400">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Prix</th>
                  <th className="pb-2">Source</th>
                </tr>
              </thead>
              <tbody>
                {item.priceHistory.map((entry, index) => (
                  <tr key={`${entry.observedAt}-${index}`} className="border-t border-slate-800">
                    <td className="py-2">{new Date(entry.observedAt).toLocaleDateString()}</td>
                    <td className="py-2">{entry.price.toFixed(2)} €</td>
                    <td className="py-2">{entry.source || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-slate-400">Pas encore d'historique.</p>
          )}
        </section>
      </div>
    </div>
  );
}
