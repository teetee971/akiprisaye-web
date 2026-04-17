import { useEffect, useState } from 'react';
import { computePressureIndex } from '../services/pressureIndexService';

const METROPOLE_INDEX = 100;

type Territory = {
  territory: string;
  index: number;
};

export default function DomVsMetropole() {
  const [data, setData] = useState<Territory[]>([]);

  useEffect(() => {
    let mounted = true;

    computePressureIndex().then((dom) => {
      if (!mounted) return;
      setData(dom);
    });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
      <h2 className="text-lg font-semibold mb-4">Comparaison coût de la vie — DOM vs Métropole</h2>

      <table className="w-full text-sm">
        <thead className="text-white/60">
          <tr>
            <th className="text-left py-2">Territoire</th>
            <th className="text-right py-2">Indice</th>
            <th className="text-right py-2">Écart</th>
          </tr>
        </thead>

        <tbody>
          <tr className="border-t border-white/10">
            <td className="py-2 font-medium">Métropole</td>
            <td className="py-2 text-right font-mono">100</td>
            <td className="py-2 text-right text-green-400">—</td>
          </tr>

          {data.map((t) => {
            const delta = t.index - METROPOLE_INDEX;

            return (
              <tr key={t.territory} className="border-t border-white/5">
                <td className="py-2 capitalize">{label(t.territory)}</td>

                <td className="py-2 text-right font-mono">{t.index.toFixed(0)}</td>

                <td className="py-2 text-right font-mono" style={{ color: deltaColor(delta) }}>
                  +{delta.toFixed(0)} %
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function label(t: string) {
  return (
    {
      guadeloupe: 'Guadeloupe',
      martinique: 'Martinique',
      guyane: 'Guyane',
      reunion: 'La Réunion',
    }[t] ?? t
  );
}

function deltaColor(delta: number) {
  if (delta < 5) return '#22c55e';
  if (delta < 15) return '#eab308';
  if (delta < 25) return '#f97316';
  return '#ef4444';
}
