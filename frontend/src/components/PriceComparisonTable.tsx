import React, { useState } from 'react';
import type { PriceObservation } from '../types/PriceObservation';
import PriceSourceBadge from './PriceSourceBadge';
import PriceHistoryMiniChart from './PriceHistoryMiniChart';
import { safeLocalStorage } from '../utils/safeLocalStorage';

type PriceComparisonTableProps = {
  observations: PriceObservation[];
  groupedByStore: Record<string, PriceObservation[]>;
};

export default function PriceComparisonTable({
  observations,
  groupedByStore,
}: PriceComparisonTableProps) {
  const getTimestamp = (value: string) => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
  };

  // Ordre chronologique
  const sorted = [...observations].sort(
    (a, b) => getTimestamp(a.observedAt) - getTimestamp(b.observedAt)
  );

  // Meilleur prix par territoire
  const bestPriceByTerritory = sorted.reduce<Record<string, number>>((acc, obs) => {
    if (!acc[obs.territory] || obs.price < acc[obs.territory]) {
      acc[obs.territory] = obs.price;
    }
    return acc;
  }, {});

  const STORAGE_KEY = 'comparateur:watched-prices:v1';

  const buildWatchKey = (observation: PriceObservation, storeLabel: string) =>
    `${observation.productId}:${storeLabel}:${observation.territory}`;

  const readWatchedPrices = (): Record<string, { price: number; observedAt: string }> => {
    if (typeof window === 'undefined') return {};
    try {
      const raw = safeLocalStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Record<string, { price: number; observedAt: string }>) : {};
    } catch {
      return {};
    }
  };

  const [watchedPrices, setWatchedPrices] = useState<
    Record<string, { price: number; observedAt: string }>
  >(() => readWatchedPrices());

  const persistWatchedPrices = (payload: Record<string, { price: number; observedAt: string }>) => {
    if (typeof window === 'undefined') return;
    safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  };

  const toggleWatch = (key: string, observation: PriceObservation) => {
    setWatchedPrices((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = {
          price: observation.price,
          observedAt: observation.observedAt,
        };
      }
      persistWatchedPrices(next);
      return next;
    });
  };

  if (observations.length === 0) {
    return (
      <div className="text-center py-8 text-white/60">
        Aucune observation disponible pour ce produit.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px]" aria-label="Tableau de comparaison des prix observés">
        <caption className="sr-only">Comparaison des prix observés entre enseignes</caption>

        <thead>
          <tr className="border-b border-white/[0.22]">
            <th className="text-left py-3 px-4 text-white/90 font-semibold">Enseigne</th>
            <th className="text-right py-3 px-4 text-white/90 font-semibold">Prix</th>
            <th className="text-center py-3 px-4 text-white/90 font-semibold">Date</th>
            <th className="text-center py-3 px-4 text-white/90 font-semibold">Source</th>
            <th className="text-center py-3 px-4 text-white/90 font-semibold">Territoire</th>
            <th className="text-center py-3 px-4 text-white/90 font-semibold">Historique</th>
          </tr>
        </thead>

        <tbody>
          {sorted.map((obs, index) => {
            const storeLabel = obs.storeLabel ?? 'Enseigne inconnue';
            const storeHistory = groupedByStore[storeLabel] || [];
            const currency = obs.currency ?? 'EUR';
            const watchKey = buildWatchKey(obs, storeLabel);
            const isBestPrice = obs.price === bestPriceByTerritory[obs.territory];

            return (
              <tr
                key={`${obs.productId}-${storeLabel}-${obs.observedAt}-${index}`}
                className="border-b border-white/[0.12] hover:bg-white/[0.05]"
              >
                <td className="py-3 px-4 text-white/90">{storeLabel}</td>

                <td className="py-3 px-4 text-right">
                  <span
                    className={`text-lg font-semibold ${
                      isBestPrice ? 'text-green-400' : 'text-blue-400'
                    }`}
                  >
                    {obs.price.toFixed(2)} {currency}
                  </span>
                </td>

                <td className="py-3 px-4 text-center text-sm text-white/70">
                  {new Date(obs.observedAt).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>

                <td className="py-3 px-4 text-center">
                  <PriceSourceBadge observation={obs} />
                </td>

                <td className="py-3 px-4 text-center">
                  <span className="px-2 py-1 text-xs rounded bg-white/[0.1] text-white/80">
                    {obs.territory}
                  </span>
                </td>

                <td className="py-3 px-4 text-center">
                  <div className="flex justify-center gap-2">
                    <PriceHistoryMiniChart observations={storeHistory} />
                    <button
                      type="button"
                      onClick={() => toggleWatch(watchKey, obs)}
                      className="text-xs text-white/70 hover:text-white"
                      aria-pressed={!!watchedPrices[watchKey]}
                    >
                      {watchedPrices[watchKey] ? '★' : '☆'}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
