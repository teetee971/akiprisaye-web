/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
/**
 * Price History Chart Component
 * Interactive chart displaying price evolution over time with variation indicators
 */

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Info, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import type { PriceHistoryPoint } from '../types/priceHistory';

interface PriceHistoryChartProps {
  data: PriceHistoryPoint[];
  showTrendLine?: boolean;
  showAverage?: boolean;
}

/** Compute overall variation % between first and last average price across all stores */
function computeVariation(data: PriceHistoryPoint[]): { pct: number; trend: 'down' | 'up' | 'stable' } {
  if (data.length < 2) return { pct: 0, trend: 'stable' };
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
  const first = sorted.slice(0, Math.ceil(sorted.length * 0.1) || 1);
  const last = sorted.slice(-Math.ceil(sorted.length * 0.1) || -1);
  const avgFirst = first.reduce((s, p) => s + p.price, 0) / first.length;
  const avgLast = last.reduce((s, p) => s + p.price, 0) / last.length;
  if (!Number.isFinite(avgFirst) || avgFirst <= 0) {
    return { pct: 0, trend: 'stable' };
  }
  const pct = ((avgLast - avgFirst) / avgFirst) * 100;
  const trend = pct < -2 ? 'down' : pct > 2 ? 'up' : 'stable';
  return { pct, trend };
}

export function PriceHistoryChart({ data, showTrendLine = false, showAverage = false }: PriceHistoryChartProps) {
  // Group data by store
  const storeData = new Map<string, PriceHistoryPoint[]>();
  data.forEach(point => {
    const existing = storeData.get(point.storeName) || [];
    existing.push(point);
    storeData.set(point.storeName, existing);
  });

  // Transform data for Recharts
  const chartData = Array.from(
    data.reduce((acc, point) => {
      if (!acc.has(point.date)) {
        acc.set(point.date, { date: point.date });
      }
      const entry = acc.get(point.date)!;
      entry[point.storeName] = point.price;
      return acc;
    }, new Map<string, any>())
  ).map(([_, value]) => value);

  // Calculate average if needed
  const avgPrice = data.length > 0 ? data.reduce((sum, p) => sum + p.price, 0) / data.length : 0;
  if (showAverage) {
    chartData.forEach(entry => {
      entry.average = avgPrice;
    });
  }

  // Get unique store names for colors
  const stores = Array.from(storeData.keys());
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Compute variation badge
  const { pct, trend } = computeVariation(data);
  const variationBadge = trend === 'down'
    ? { label: `${Math.abs(pct).toFixed(1)}% en baisse`, icon: <TrendingDown className="w-4 h-4" />, className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700' }
    : trend === 'up'
    ? { label: `${Math.abs(pct).toFixed(1)}% en hausse`, icon: <TrendingUp className="w-4 h-4" />, className: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700' }
    : { label: 'Prix stable', icon: <Minus className="w-4 h-4" />, className: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600' };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          Évolution des Prix
        </h3>
        <div className="flex items-center gap-3">
          {data.length > 1 && (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${variationBadge.className}`}>
              {variationBadge.icon}
              {variationBadge.label}
            </span>
          )}
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {data.length} observations
          </div>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-slate-500 dark:text-slate-400 mb-2">
            Aucune observation de prix disponible pour cette période
          </div>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Les données seront affichées dès qu'elles seront collectées
          </p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
              <XAxis 
                dataKey="date" 
                stroke="#64748b"
                style={{ fontSize: '12px' }}
                label={{ value: 'Date', position: 'insideBottom', offset: -5, fill: '#64748b' }}
              />
              <YAxis 
                stroke="#64748b"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `${value.toFixed(2)}€`}
                label={{ value: 'Prix (€)', angle: -90, position: 'insideLeft', fill: '#64748b' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px'
                }}
                formatter={(value: number | undefined, name: string | undefined) => [
                  `${(value ?? 0).toFixed(2)}€`,
                  name === 'average' ? 'Prix moyen' : (name ?? '')
                ]}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend 
                wrapperStyle={{ fontSize: '12px' }}
                formatter={(value) => value === 'average' ? 'Prix moyen' : value}
              />
              
              {stores.map((store, i) => (
                <Line
                  key={store}
                  type="monotone"
                  dataKey={store}
                  stroke={colors[i % colors.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name={store}
                />
              ))}

              {showAverage && (
                <>
                  <ReferenceLine
                    y={avgPrice}
                    stroke="#94a3b8"
                    strokeDasharray="6 3"
                    label={{ value: `Moy. territoire ${avgPrice.toFixed(2)}€`, fill: '#94a3b8', fontSize: 11, position: 'insideTopRight' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="average"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="average"
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>

          {/* Statistiques résumées */}
          {data.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Prix min</p>
                <p className="font-bold text-green-600 dark:text-green-400">
                  {Math.min(...data.map(p => p.price)).toFixed(2)} €
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Moy. territoire</p>
                <p className="font-bold text-slate-700 dark:text-slate-300">
                  {avgPrice.toFixed(2)} €
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Prix max</p>
                <p className="font-bold text-red-500 dark:text-red-400">
                  {Math.max(...data.map(p => p.price)).toFixed(2)} €
                </p>
              </div>
            </div>
          )}

          {/* Légende et contexte */}
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="mb-1">
                  <strong>Sources:</strong> Contributions citoyennes vérifiées, données officielles et partenaires commerciaux.
                </p>
                <p>
                  <strong>Mise à jour:</strong> Les prix affichés correspondent aux dernières observations enregistrées.
                  Chaque point représente une observation réelle à une date donnée.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
