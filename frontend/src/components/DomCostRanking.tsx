import { useEffect, useState } from 'react';
import { computePressureIndex } from '../services/pressureIndexService';

type TerritoryRank = {
  territory: string;
  index: number;
  level: string;
};

export default function DomCostRanking() {
  const [ranking, setRanking] = useState<TerritoryRank[]>([]);

  useEffect(() => {
    let mounted = true;

    computePressureIndex().then(data => {
      if (!mounted) return;
      const sorted = [...data].sort((a, b) => b.index - a.index);
      setRanking(sorted);
    });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
      <h2 className="text-lg font-semibold mb-3">
        Classement officiel — Vie chère (DOM)
      </h2>

      <ul className="space-y-2">
        {ranking.map((t, i) => (
          <li
            key={t.territory}
            className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-2"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold w-6 text-center">
                #{i + 1}
              </span>

              <span className="capitalize">
                {label(t.territory)}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span
                className="px-2 py-0.5 rounded text-xs font-medium"
                style={{
                  backgroundColor: color(t.index),
                  color: '#000',
                }}
              >
                {t.level}
              </span>

              <span className="font-mono text-sm">
                {t.index.toFixed(0)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function label(t: string) {
  return {
    guadeloupe: 'Guadeloupe',
    martinique: 'Martinique',
    guyane: 'Guyane',
    reunion: 'La Réunion',
  }[t] ?? t;
}

function color(index: number) {
  if (index < 95) return '#22c55e';
  if (index < 105) return '#eab308';
  if (index < 120) return '#f97316';
  return '#ef4444';
}