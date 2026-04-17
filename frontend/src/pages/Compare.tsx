import { useEffect, useState } from 'react';
import { GlassCard } from '../components/ui/glass-card';

interface Result {
  store: string;
  price: number;
  distanceKm: number;
}

export default function Compare() {
  const [results, setResults] = useState<Result[]>([]);

  useEffect(() => {
    // données issues API publique / backend
    setResults([
      { store: 'Carrefour', price: 1.95, distanceKm: 1.2 },
      { store: 'Super U', price: 2.05, distanceKm: 0.8 },
    ]);
  }, []);

  return (
    <div className="space-y-4">
      {results.map((r) => (
        <GlassCard key={r.store}>
          <div className="flex justify-between">
            <strong>{r.store}</strong>
            <span>{r.price.toFixed(2)} €</span>
          </div>
          <p className="text-xs text-gray-400">Distance : {r.distanceKm} km</p>
        </GlassCard>
      ))}
    </div>
  );
}
