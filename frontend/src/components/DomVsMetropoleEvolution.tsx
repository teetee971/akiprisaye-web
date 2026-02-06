import { useEffect, useState } from 'react';
import { loadDomEvolution } from '../services/domEvolutionService';

const METROPOLE = 100;
const MONTHS = ['2025-11', '2025-12', '2026-01'];

export default function DomVsMetropoleEvolution() {
  const [series, setSeries] = useState<Record<string, number[]>>({});

  useEffect(() => {
    let alive = true;

    Promise.all([
      loadDomEvolution('guadeloupe', MONTHS),
      loadDomEvolution('martinique', MONTHS),
      loadDomEvolution('guyane', MONTHS),
      loadDomEvolution('reunion', MONTHS),
    ]).then(([gp, mq, gf, re]) => {
      if (!alive) return;

      setSeries({
        Guadeloupe: gp.map(p => p.index),
        Martinique: mq.map(p => p.index),
        Guyane: gf.map(p => p.index),
        Réunion: re.map(p => p.index),
      });
    });

    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="rounded-xl bg-black/30 border border-white/10 p-4">
      <h2 className="text-lg font-semibold mb-4">
        Évolution du surcoût — DOM vs Métropole
      </h2>

      <div className="space-y-3 text-sm">
        <div className="text-white/60">
          Base Métropole = 100
        </div>

        {Object.entries(series).map(([territory, values]) => {
          const delta = values.at(-1)! - METROPOLE;

          return (
            <div key={territory}>
              <div className="flex justify-between">
                <span>{territory}</span>
                <span
                  className="font-mono"
                  style={{ color: deltaColor(delta) }}
                >
                  +{delta.toFixed(1)} %
                </span>
              </div>

              <div className="flex gap-1 mt-1">
                {values.map((v, i) => (
                  <div
                    key={i}
                    className="h-2 flex-1 rounded"
                    style={{
                      backgroundColor: barColor(v),
                    }}
                    title={`${MONTHS[i]} : ${v.toFixed(1)}`}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function barColor(index: number) {
  if (index < 110) return '#22c55e';
  if (index < 120) return '#eab308';
  if (index < 130) return '#f97316';
  return '#ef4444';
}

function deltaColor(delta: number) {
  if (delta < 10) return '#22c55e';
  if (delta < 20) return '#eab308';
  if (delta < 30) return '#f97316';
  return '#ef4444';
}