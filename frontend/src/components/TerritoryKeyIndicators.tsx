import { useEffect, useState } from 'react';
import { getTerritoryAnalytics, TerritoryAnalytics } from '../services/territoryAnalyticsService';

interface Props {
  territory: 'guadeloupe' | 'martinique' | 'guyane' | 'reunion';
}

export default function TerritoryKeyIndicators({ territory }: Props) {
  const [data, setData] = useState<TerritoryAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getTerritoryAnalytics(territory)
      .then(res => mounted && setData(res))
      .catch(() => mounted && setError('Impossible de charger les indicateurs'));
    return () => {
      mounted = false;
    };
  }, [territory]);

  if (error) return <div className="text-red-400">{error}</div>;
  if (!data) return <div className="animate-pulse">Chargement des indicateurs…</div>;

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Prix moyen" value={`${data.averagePrice.toFixed(2)} €`} />
        <Stat label="Pression vie chère" value={`${data.inflationIndex}/100`} />
      </div>

      <Block title="Produits les plus chers">
        {data.topIncreases.map((p, i) => (
          <Line key={i} label={p.productName ?? 'Produit'} value={`${p.price.toFixed(2)} €`} />
        ))}
      </Block>

      <Block title="Produits les moins chers">
        {data.topDecreases.map((p, i) => (
          <Line key={i} label={p.productName ?? 'Produit'} value={`${p.price.toFixed(2)} €`} />
        ))}
      </Block>

      <Block title="Enseignes les moins chères">
        {data.cheapestStores.map((s, i) => (
          <Line key={i} label={s.store} value={`${s.avgPrice.toFixed(2)} €`} />
        ))}
      </Block>

      <Block title="Enseignes les plus chères">
        {data.mostExpensiveStores.map((s, i) => (
          <Line key={i} label={s.store} value={`${s.avgPrice.toFixed(2)} €`} />
        ))}
      </Block>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
      <div className="text-sm opacity-70">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
      <h3 className="font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="opacity-80">{label}</span>
      <span>{value}</span>
    </div>
  );
}