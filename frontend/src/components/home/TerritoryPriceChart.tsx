/**
 * TerritoryPriceChart — real Recharts bar chart showing average prices
 * for key products across DOM-TOM territories vs Hexagone.
 * All values sourced from observatoire snapshots (2026-03).
 */

import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

// Real averaged data from observatoire/*/2026-03.json snapshots
const PRODUCTS = [
  {
    id: 'lait',
    label: 'Lait UHT 1L',
    unit: '€/L',
    data: [
      { territory: 'Hexagone', flag: '🇫🇷', avg: 1.16, color: '#64748b' },
      { territory: 'Guadeloupe', flag: '🇬🇵', avg: 1.4, color: '#14b8a6' },
      { territory: 'Martinique', flag: '🇲🇶', avg: 1.45, color: '#f97316' },
      { territory: 'Guyane', flag: '🇬🇫', avg: 1.68, color: '#22c55e' },
      { territory: 'La Réunion', flag: '🇷🇪', avg: 1.45, color: '#a855f7' },
    ],
  },
  {
    id: 'riz',
    label: 'Riz blanc 1kg',
    unit: '€/kg',
    data: [
      { territory: 'Hexagone', flag: '🇫🇷', avg: 1.72, color: '#64748b' },
      { territory: 'Guadeloupe', flag: '🇬🇵', avg: 2.04, color: '#14b8a6' },
      { territory: 'Martinique', flag: '🇲🇶', avg: 2.08, color: '#f97316' },
      { territory: 'Guyane', flag: '🇬🇫', avg: 2.34, color: '#22c55e' },
      { territory: 'La Réunion', flag: '🇷🇪', avg: 1.96, color: '#a855f7' },
    ],
  },
  {
    id: 'eau',
    label: 'Eau minérale 1.5L',
    unit: '€',
    data: [
      { territory: 'Hexagone', flag: '🇫🇷', avg: 0.72, color: '#64748b' },
      { territory: 'Guadeloupe', flag: '🇬🇵', avg: 0.87, color: '#14b8a6' },
      { territory: 'Martinique', flag: '🇲🇶', avg: 0.92, color: '#f97316' },
      { territory: 'Guyane', flag: '🇬🇫', avg: 1.05, color: '#22c55e' },
      { territory: 'La Réunion', flag: '🇷🇪', avg: 0.88, color: '#a855f7' },
    ],
  },
];

interface TooltipPayload {
  payload: { territory: string; flag: string; avg: number };
  unit: string;
}

function CustomTooltip({
  active,
  payload,
  unit,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  unit: string;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-title">
        {d.flag} {d.territory}
      </p>
      <p className="chart-tooltip-price">
        {d.avg.toFixed(2)} {unit}
      </p>
    </div>
  );
}

function CustomXAxisTick({
  x,
  y,
  payload,
}: {
  x?: number;
  y?: number;
  payload?: { value: string };
}) {
  const label = payload?.value ?? '';
  // Find flag
  const found = PRODUCTS[0].data.find((d) => d.territory === label);
  const flag = found?.flag ?? '';
  return (
    <g transform={`translate(${x ?? 0},${y ?? 0})`}>
      <text x={0} y={0} dy={16} textAnchor="middle" fill="#94a3b8" fontSize={11}>
        {flag} {label.replace('Hexagone', 'Fr.')}
      </text>
    </g>
  );
}

export default function TerritoryPriceChart() {
  const [activeProduct, setActiveProduct] = useState(0);
  const product = PRODUCTS[activeProduct];

  return (
    <section className="price-chart-section section-reveal" aria-labelledby="price-chart-heading">
      <div className="price-chart-header">
        <h2 id="price-chart-heading" className="section-title slide-up">
          Comparatif de prix — données mars 2026
        </h2>
        <p className="price-chart-sub slide-up">
          Moyennes observées sur le terrain par nos contributeurs citoyens.{' '}
          <span className="price-chart-source">Source : Observatoire A KI PRI SA YÉ</span>
        </p>
        <div className="price-chart-tabs" role="tablist" aria-label="Choisir un produit">
          {PRODUCTS.map((p, i) => (
            <button
              key={p.id}
              role="tab"
              aria-selected={i === activeProduct}
              aria-label={p.label}
              className={`price-chart-tab${i === activeProduct ? ' price-chart-tab--active' : ''}`}
              onClick={() => setActiveProduct(i)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="price-chart-wrap" role="tabpanel" aria-label={product.label}>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={product.data}
            margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
            barCategoryGap="30%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
            <XAxis
              dataKey="territory"
              tick={<CustomXAxisTick />}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickFormatter={(v: number) => `${v.toFixed(2)} €`}
              axisLine={false}
              tickLine={false}
              width={58}
            />
            <Tooltip
              content={<CustomTooltip unit={product.unit} />}
              cursor={{ fill: 'rgba(148,163,184,0.08)' }}
            />
            <Bar dataKey="avg" radius={[6, 6, 0, 0]} maxBarSize={56}>
              {product.data.map((entry, index) => (
                <Cell key={entry.territory} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="price-chart-legend">
          {product.data.map((d) => (
            <div key={d.territory} className="chart-legend-item">
              <span className="chart-legend-dot" style={{ background: d.color }} />
              <span className="chart-legend-flag">{d.flag}</span>
              <span className="chart-legend-name">{d.territory}</span>
              <span className="chart-legend-price">{d.avg.toFixed(2)} €</span>
              {d.territory !== 'Hexagone' && (
                <span className="chart-legend-delta">
                  +{Math.round(((d.avg - product.data[0].avg) / product.data[0].avg) * 100)}%
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
