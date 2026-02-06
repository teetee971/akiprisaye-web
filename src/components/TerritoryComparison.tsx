import { useEffect, useState } from 'react';
import {
  compareTerritories,
  TerritoryComparisonResult,
} from '../services/territoryComparisonService';

interface Props {
  territoryA: 'guadeloupe' | 'martinique' | 'guyane' | 'reunion';
  territoryB: 'guadeloupe' | 'martinique' | 'guyane' | 'reunion' | 'metropole';
}

export default function TerritoryComparison({ territoryA, territoryB }: Props) {
  const [data, setData] = useState<TerritoryComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    compareTerritories(territoryA, territoryB)
      .then(res => mounted && setData(res))
      .catch(() => mounted && setError('Comparaison indisponible'));
    return () => {
      mounted = false;
    };
  }, [territoryA, territoryB]);

  if (error) return <div className="text-red-400">{error}</div>;
  if (!data) return <div className="animate-pulse">Comparaison en cours…</div>;

  const isMoreExpensive = data.deltaValue > 0;

  return (
    <section className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
      <h3 className="text-lg font-semibold">
        Comparaison {territoryA} ↔ {territoryB}
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <Stat label={territoryA} value={`${data.averageA.toFixed(2)} €`} />
        <Stat label={territoryB} value={`${data.averageB.toFixed(2)} €`} />
      </div>

      <div
        className={`p-4 rounded-lg text-sm ${
          isMoreExpensive ? 'bg-red-900/30' : 'bg-green-900/30'
        }`}
      >
        <strong>{territoryA}</strong>{' '}
        {isMoreExpensive ? 'est plus cher' : 'est moins cher'} que{' '}
        <strong>{territoryB}</strong> de{' '}
        <strong>{Math.abs(data.deltaPercent).toFixed(1)} %</strong>
      </div>

      <div className="text-xs opacity-70">
        Territoire le moins cher :{' '}
        <strong>{data.cheaperTerritory}</strong>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-black/30 rounded-lg p-4 text-center">
      <div className="text-xs uppercase opacity-60">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}