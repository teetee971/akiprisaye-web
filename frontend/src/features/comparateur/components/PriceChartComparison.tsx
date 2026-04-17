/**
 * PriceChart Component (Mission M-B)
 * Visual chart for price comparison using Recharts
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import type { TerritoryPrice } from '../types';
import { getTerritoryLabel } from '../../../utils/territoryMapper';

interface PriceChartProps {
  data: TerritoryPrice[];
  type?: 'bar'; // Only bar charts implemented for now
}

export function PriceChart({ data, type = 'bar' }: PriceChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
        <p className="text-center text-slate-400">Aucune donnée disponible pour le graphique</p>
      </div>
    );
  }

  const chartData = data
    .map((tp) => ({
      territoire: getTerritoryLabel(tp.territory),
      prix: tp.price,
      code: tp.territory,
    }))
    .sort((a, b) => a.prix - b.prix); // Sort by price

  const minPrice = Math.min(...data.map((d) => d.price));

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
      <div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Visualisation des prix par territoire
        </h3>
        <p className="text-sm text-slate-400">
          Comparaison visuelle des prix - du moins cher au plus cher
        </p>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="territoire"
            stroke="#94a3b8"
            angle={-45}
            textAnchor="end"
            height={100}
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#94a3b8"
            label={{
              value: 'Prix (€)',
              angle: -90,
              position: 'insideLeft',
              style: { fill: '#94a3b8' },
            }}
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '12px',
            }}
            formatter={(value) => {
              const numericValue = typeof value === 'number' ? value : Number(value ?? 0);
              return [`${numericValue.toFixed(2)}€`, 'Prix'];
            }}
            labelFormatter={(label) => `Territoire: ${label}`}
            labelStyle={{ color: '#f1f5f9', fontWeight: 'bold' }}
            itemStyle={{ color: '#cbd5e1' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="square" />
          <Bar dataKey="prix" name="Prix" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.prix === minPrice ? '#4ade80' : '#60a5fa'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#4ade80' }}></div>
          <span className="text-slate-300">Meilleur prix</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#60a5fa' }}></div>
          <span className="text-slate-300">Prix standard</span>
        </div>
      </div>
    </div>
  );
}
