// @ts-nocheck -- Multiple module/type issues in this file; TODO: fix Territory type and module imports
import { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import type { PriceObservation, TerritoryCode } from '../types/priceObservation';
import {
  buildTerritoryTimeSeries,
  calculateTerritoryComparison
} from '../services/territoryComparisonService';

const TERRITORIES: TerritoryCode[] = ['FR', 'GP', 'MQ', 'GF', 'RE'];

const COLORS: Record<TerritoryCode, string> = {
  FR: '#60a5fa',
  GP: '#f97316',
  MQ: '#22d3ee',
  GF: '#a78bfa',
  RE: '#4ade80'
};

const PRODUCT_LABELS: Record<string, string> = {
  'milk-1l': 'Lait UHT 1L',
  'rice-1kg': 'Riz blanc 1kg'
};

function formatEuro(value?: number) {
  if (typeof value !== 'number') return '—';
  return `${value.toFixed(2)} €`;
}

export default function ComparateurTerritoires() {
  const [observations, setObservations] = useState<PriceObservation[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('milk-1l');
  const [selectedTerritories, setSelectedTerritories] = useState<TerritoryCode[]>(TERRITORIES);

  useEffect(() => {
    let cancelled = false;
    fetch(`${import.meta.env.BASE_URL}data/prices-territories.json`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json: PriceObservation[] | null) => {
        if (!cancelled && Array.isArray(json)) {
          setObservations(json);
        }
      })
      .catch(() => {
        console.warn('Données territoriales indisponibles');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const isAllowedTerritory = (territory: PriceObservation['territory']): territory is TerritoryCode =>
      TERRITORIES.includes(territory as TerritoryCode);

    return observations.filter(
      (obs) =>
        obs.productId === selectedProduct &&
        isAllowedTerritory(obs.territory) &&
        selectedTerritories.includes(obs.territory)
    );
  }, [observations, selectedProduct, selectedTerritories]);

  const timeSeries = useMemo(() => buildTerritoryTimeSeries(filtered), [filtered]);
  const comparison = useMemo(() => calculateTerritoryComparison(filtered, 'FR'), [filtered]);

  const products = useMemo(
    () => Array.from(new Set(observations.map((obs) => obs.productId))),
    [observations]
  );

  const toggleTerritory = (code: TerritoryCode) => {
    setSelectedTerritories((prev) =>
      prev.includes(code) ? prev.filter((t) => t !== code) : [...prev, code].sort()
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-8 space-y-6">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-blue-300">Observatoire public</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Comparateur multi-territoires</h1>
          <p className="text-slate-300 max-w-2xl">
            Comparez les prix moyens par territoire (FR, GP, MQ, GF, RE) sur les mêmes produits et périodes.
            Données publiques, aucune API externe, visualisation Recharts mobile-first.
          </p>
        </header>

        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Produit</label>
              <select
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
              >
                {products.map((id) => (
                  <option key={id} value={id}>
                    {PRODUCT_LABELS[id] ?? id}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Territoires</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TERRITORIES.map((code) => {
                  const active = selectedTerritories.includes(code);
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => toggleTerritory(code)}
                      className={`rounded-xl border px-3 py-2 text-sm transition-colors ${
                        active
                          ? 'border-blue-500 bg-blue-500/10 text-blue-100'
                          : 'border-slate-800 bg-slate-950 text-slate-200 hover:border-blue-500/40'
                      }`}
                    >
                      {code === 'FR' ? 'FR (référence)' : code}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-xl font-semibold text-white">Courbes comparatives</h2>
              <p className="text-sm text-slate-400">
                Prix moyens journaliers par territoire. FR sert de référence pour les écarts.
              </p>
            </div>
            <span className="text-xs text-slate-400">Recharts • Mobile-first</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeries} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <YAxis
                  stroke="#94a3b8"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => Number(value).toFixed(2)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '12px',
                    color: '#e2e8f0'
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)} €`, 'Prix moyen']}
                />
                <Legend />
                {TERRITORIES.filter((code) => selectedTerritories.includes(code)).map((code) => (
                  <Line
                    key={code}
                    type="monotone"
                    dataKey={code}
                    stroke={COLORS[code]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h2 className="text-xl font-semibold text-white">Tableau comparatif</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-slate-300">
                <tr className="border-b border-slate-800">
                  <th className="text-left py-2 pr-4">Territoire</th>
                  <th className="text-right py-2 pr-4">Prix moyen</th>
                  <th className="text-right py-2 pr-4">Écart absolu</th>
                  <th className="text-right py-2 pr-4">Écart relatif</th>
                  <th className="text-right py-2">Rang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {comparison.map((row) => (
                  <tr key={row.territory}>
                    <td className="py-2 pr-4 text-slate-100">
                      {row.territory === 'FR' ? 'FR (référence)' : row.territory}
                    </td>
                    <td className="py-2 pr-4 text-right text-slate-100">{formatEuro(row.averagePrice)}</td>
                    <td className="py-2 pr-4 text-right text-slate-100">{formatEuro(row.absoluteGap)}</td>
                    <td className="py-2 pr-4 text-right text-slate-100">{row.relativeGap.toFixed(2)}%</td>
                    <td className="py-2 text-right text-slate-100">{row.rank}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {comparison.length === 0 && (
            <p className="text-sm text-slate-400">Aucune donnée disponible pour cette sélection.</p>
          )}
        </section>
      </div>
    </div>
  );
}
