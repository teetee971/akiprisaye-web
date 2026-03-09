import { useEffect, useState } from 'react';
import { loadDomIndexesForMonth } from '../services/domMapTimelineService';
import DomMapSvg from './DomMapSvg';

const PERIODS = [
  { label: 'Novembre 2025', month: '2025-11' },
  { label: 'Décembre 2025', month: '2025-12' },
  { label: 'Janvier 2026', month: '2026-01' },
];

type ValueMap = Record<string, number>;

export default function DomMapCompare() {
  const [before, setBefore] = useState(PERIODS[0].month);
  const [after, setAfter] = useState(PERIODS[2].month);

  const [deltaValues, setDeltaValues] = useState<ValueMap>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    Promise.all([
      loadDomIndexesForMonth(before),
      loadDomIndexesForMonth(after),
    ]).then(([beforeData, afterData]) => {
      if (!alive) return;

      const beforeMap: ValueMap = {};
      const afterMap: ValueMap = {};

      beforeData.forEach((d) => (beforeMap[d.territory] = d.index));
      afterData.forEach((d) => (afterMap[d.territory] = d.index));

      const delta: ValueMap = {};

      Object.keys(afterMap).forEach((territory) => {
        const a = afterMap[territory];
        const b = beforeMap[territory];
        if (b !== undefined && b !== 0) {
          delta[territory] = Number((((a - b) / b) * 100).toFixed(1));
        }
      });

      setDeltaValues(delta);
      setLoading(false);
    });

    return () => {
      alive = false;
    };
  }, [before, after]);

  return (
    <div className="bg-black/30 border border-white/10 rounded-xl p-4 space-y-4">
      <h2 className="font-semibold">
        Comparaison Avant / Après
      </h2>

      {/* Sélecteurs */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <select
          aria-label="Période avant"
          value={before}
          onChange={(e) => setBefore(e.target.value)}
          className="bg-black/40 border border-white/10 rounded px-2 py-1"
        >
          {PERIODS.map((p) => (
            <option key={p.month} value={p.month}>
              Avant — {p.label}
            </option>
          ))}
        </select>

        <select
          aria-label="Période après"
          value={after}
          onChange={(e) => setAfter(e.target.value)}
          className="bg-black/40 border border-white/10 rounded px-2 py-1"
        >
          {PERIODS.map((p) => (
            <option key={p.month} value={p.month}>
              Après — {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* Carte delta */}
      {loading ? (
        <div className="text-sm opacity-70">Calcul en cours…</div>
      ) : (
        <DomMapSvg values={deltaValues} mode="delta" />
      )}

      {/* Légende */}
      <div className="flex gap-4 text-xs opacity-80">
        <span>🔴 Hausse</span>
        <span>🟢 Baisse</span>
        <span>⚪ Stable</span>
      </div>
    </div>
  );
}