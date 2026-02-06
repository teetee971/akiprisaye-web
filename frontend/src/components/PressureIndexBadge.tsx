import { useEffect, useState } from 'react';
import {
  computePressureIndex,
  TerritoryPressureIndex,
} from '../services/pressureIndexService';

export default function PressureIndexBadge() {
  const [data, setData] = useState<TerritoryPressureIndex[] | null>(null);

  useEffect(() => {
    let mounted = true;
    computePressureIndex()
      .then(res => mounted && setData(res))
      .catch(() => mounted && setData([]));
    return () => {
      mounted = false;
    };
  }, []);

  if (!data) return <div className="animate-pulse">Calcul de l’indice…</div>;

  return (
    <section className="grid md:grid-cols-4 gap-4">
      {data.map(t => (
        <Card key={t.territory} item={t} />
      ))}
    </section>
  );
}

function Card({ item }: { item: TerritoryPressureIndex }) {
  const color =
    item.level === 'FAIBLE'
      ? 'bg-green-900/40'
      : item.level === 'MODÉRÉE'
      ? 'bg-yellow-900/40'
      : item.level === 'ÉLEVÉE'
      ? 'bg-orange-900/40'
      : 'bg-red-900/50';

  return (
    <div className={`rounded-xl p-5 border border-white/10 ${color}`}>
      <div className="text-xs uppercase opacity-70">
        {item.territory}
      </div>

      <div className="text-3xl font-bold">
        {item.index.toFixed(0)}
      </div>

      <div className="text-sm mt-1">
        Pression <strong>{item.level}</strong>
      </div>

      <div className="text-xs opacity-60 mt-2">
        Prix moyen : {item.averagePrice.toFixed(2)} €
      </div>
    </div>
  );
}