/**
 * Price History Chart Component
 * Interactive chart displaying price evolution over time
 */

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Info } from 'lucide-react';
import type { PriceHistoryPoint } from '../types/priceHistory';

interface PriceHistoryChartProps {
  data: PriceHistoryPoint[];
  showTrendLine?: boolean;
  showAverage?: boolean;
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
  if (showAverage) {
    const avgPrice = data.reduce((sum, p) => sum + p.price, 0) / data.length;
    chartData.forEach(entry => {
      entry.average = avgPrice;
    });
  }

  // Get unique store names for colors
  const stores = Array.from(storeData.keys());
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          Évolution des Prix
        </h3>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {data.length} observations
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
                formatter={(value: number, name: string) => [
                  `${value.toFixed(2)}€`,
                  name === 'average' ? 'Prix moyen' : name
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
                <Line
                  type="monotone"
                  dataKey="average"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="average"
                />
              )}
            </LineChart>
          </ResponsiveContainer>

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
