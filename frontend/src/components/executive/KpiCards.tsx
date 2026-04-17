import React from 'react';

export interface KpiData {
  name: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  description?: string;
}

interface KpiCardsProps {
  kpis?: KpiData[];
  healthScore?: number;
}

function trendIcon(trend?: 'up' | 'down' | 'stable') {
  if (trend === 'up') return <span className="text-green-400 ml-1">↑</span>;
  if (trend === 'down') return <span className="text-red-400 ml-1">↓</span>;
  return <span className="text-gray-500 ml-1">→</span>;
}

export function KpiCards({ kpis = [], healthScore }: KpiCardsProps) {
  return (
    <section className="rounded-xl bg-gray-900 border border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-white">📊 KPIs Plateforme</h2>
        {healthScore != null && (
          <span
            className={`text-sm font-bold px-2 py-0.5 rounded ${
              healthScore >= 70
                ? 'bg-green-900 text-green-300'
                : healthScore >= 40
                  ? 'bg-yellow-900 text-yellow-300'
                  : 'bg-red-900 text-red-300'
            }`}
          >
            Santé {healthScore}/100
          </span>
        )}
      </div>

      {kpis.length === 0 ? (
        <p className="text-gray-400 text-sm">
          Aucun KPI disponible. Lancez le workflow Executive OS pour générer les données.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {kpis.map((kpi) => (
            <div key={kpi.name} className="bg-gray-800 rounded-lg p-3">
              <p className="text-xs text-gray-400 truncate">{kpi.name}</p>
              <p className="text-lg font-bold text-white mt-0.5">
                {kpi.value}
                {kpi.unit ? <span className="text-xs text-gray-400 ml-0.5">{kpi.unit}</span> : null}
                {trendIcon(kpi.trend)}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default KpiCards;
