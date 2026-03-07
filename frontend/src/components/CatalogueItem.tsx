/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
import React, { useMemo } from 'react';
import { GlassCard } from './ui/glass-card';
import { CatalogueItemRaw } from '../services/catalogueService';
import { computeComparison } from '../services/comparisonService';
import { computePrediction } from '../services/predictionService';
import { useTiPanier } from '../hooks/useTiPanier';
import { recordHistory } from './HistoryList';

type Props = {
  item: CatalogueItemRaw;
  metrics: {
    latestPrice: number | null;
    lastObservationDate: string | null;
    avg7: number | null;
    avg30: number | null;
    percentFrom30: number | null;
    isSignificantDecrease: boolean;
  }
};

export default function CatalogueItem({ item, metrics }: Props) {
  const { addItem } = useTiPanier();

  const allObsWithStore = useMemo(() => {
    const observations = (item['observations'] ?? []) as Array<Record<string, unknown>>;
    return observations
      .map((o: Record<string, unknown>) => ({ ...o, store: o['store'] ?? item['store'] ?? 'Inconnu' }))
      .filter((o: Record<string, unknown>) => Boolean(o['store']));
  }, [item]);

  const comparison = useMemo(() => computeComparison(allObsWithStore as any), [allObsWithStore]);
  const prediction = useMemo(() => computePrediction(item.observations || []), [item]);

  const handleAdd = () => {
    addItem({
      id: `${item.id}:${item.store ?? ''}:${item.territory ?? ''}`,
      quantity: 1,
      meta: { name: item.name, price: metrics.latestPrice ?? '', store: item.store, territory: item.territory }
    });
    recordHistory({ id: item.id, name: item.name, price: metrics.latestPrice ?? '', store: item.store, territory: item.territory });
  };

  const percent = metrics.percentFrom30;
  const showBadge = metrics.isSignificantDecrease;

  return (
    <GlassCard className="relative">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{item.name}</h3>
          <div className="text-sm text-gray-400">{item.store} — {item.territory}</div>
        </div>

        {/* Predictive badge with tooltip/explanation */}
        {prediction.label !== 'Données insuffisantes' && (
          <span
            className="ml-3 inline-flex items-center px-2 py-1 rounded-full bg-indigo-700 text-white text-xs"
            aria-label={`Prédiction : ${prediction.label}`}
            title={prediction.explanation}
          >
            🔮 {prediction.label}
          </span>
        )}
      </div>

      <div className="mt-3">
        <div className="text-xl font-medium">
          {metrics.latestPrice !== null ? `${metrics.latestPrice.toFixed(2)} ${item.currency ?? '€'}` : '—'}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          Dernière observation : {metrics.lastObservationDate ? new Date(metrics.lastObservationDate).toLocaleDateString() : '—'}
        </div>

        <div className="mt-3">
          <div className="text-sm text-gray-300 mb-1">Comparaison par enseigne (prix le plus récent)</div>
          {comparison.list.length === 0 ? (
            <div className="text-xs text-gray-400">Pas d’observations par enseigne disponibles.</div>
          ) : (
            <ul role="table" className="space-y-1 text-sm">
              {comparison.list.map((row) => (
                <li key={row.store} role="row" className="flex justify-between items-center text-xs text-gray-200">
                  <span role="cell" className="font-medium">{row.store}</span>
                  <span role="cell">{row.price.toFixed(2)} {item.currency ?? '€'}</span>
                </li>
              ))}
            </ul>
          )}
          {comparison.best && (
            <div className="text-xs text-gray-300 mt-1" aria-live="polite">
              Meilleur prix : <strong className="text-white">{comparison.best.store} — {comparison.best.price.toFixed(2)} {item.currency ?? '€'}</strong>
            </div>
          )}
        </div>

        {percent !== null && (
          <div className="mt-2 text-sm" aria-live="polite">
            Variation depuis moyenne 30j : <strong className={percent >= 0 ? 'text-green-300' : 'text-gray-300'}>{percent >= 0 ? '−' : ''}{Math.abs(percent).toFixed(1)}%</strong>
          </div>
        )}

        <div className="mt-3 flex gap-2">
          <button onClick={handleAdd} className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded" aria-label={`Ajouter ${item.name} au ti-panier`}>
            Ajouter au ti-panier
          </button>
          <button className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded" aria-label={`Comparer ${item.name}`}>
            Comparer
          </button>
        </div>
      </div>
    </GlassCard>
  );
}
