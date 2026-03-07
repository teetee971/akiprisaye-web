/**
 * PriceEvolutionChart — Recharts line chart showing real 5-month price trends
 * (Nov 2025 – Mar 2026) for key staple products across DOM-TOM territories.
 *
 * All values are averages computed from the observatoire JSON snapshots.
 */

import { useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

// Territory colour palette (consistent with TerritoryPriceChart)
const TERRITORY_COLORS: Record<string, string> = {
  Hexagone: '#64748b',
  Guadeloupe: '#14b8a6',
  Martinique: '#f97316',
  Guyane: '#22c55e',
  'La Réunion': '#a855f7',
};

const TERRITORY_FLAGS: Record<string, string> = {
  Hexagone: '🇫🇷',
  Guadeloupe: '🇬🇵',
  Martinique: '🇲🇶',
  Guyane: '🇬🇫',
  'La Réunion': '🇷🇪',
};

// Real averages computed from observatoire snapshots (Nov 2025 – Mar 2026).
// Territories lacking data for a given month have null (not plotted).
const PRODUCTS = [
  {
    id: 'lait',
    label: 'Lait UHT 1L',
    unit: '€/L',
    domain: [1.0, 1.8] as [number, number],
    series: [
      {
        name: 'Hexagone',
        data: [
          { month: 'Nov 25', value: 1.105 },
          { month: 'Déc 25', value: 1.116 },
          { month: 'Jan 26', value: 1.137 },
          { month: 'Fév 26', value: 1.149 },
          { month: 'Mar 26', value: 1.159 },
        ],
      },
      {
        name: 'Guadeloupe',
        data: [
          { month: 'Nov 25', value: 1.34 },
          { month: 'Déc 25', value: 1.365 },
          { month: 'Jan 26', value: 1.373 },
          { month: 'Fév 26', value: 1.391 },
          { month: 'Mar 26', value: 1.401 },
        ],
      },
      {
        name: 'Martinique',
        data: [
          { month: 'Nov 25', value: null },
          { month: 'Déc 25', value: null },
          { month: 'Jan 26', value: 1.417 },
          { month: 'Fév 26', value: 1.443 },
          { month: 'Mar 26', value: 1.453 },
        ],
      },
      {
        name: 'La Réunion',
        data: [
          { month: 'Nov 25', value: null },
          { month: 'Déc 25', value: null },
          { month: 'Jan 26', value: 1.445 },
          { month: 'Fév 26', value: 1.44 },
          { month: 'Mar 26', value: 1.45 },
        ],
      },
      {
        name: 'Guyane',
        data: [
          { month: 'Nov 25', value: null },
          { month: 'Déc 25', value: null },
          { month: 'Jan 26', value: 1.624 },
          { month: 'Fév 26', value: 1.667 },
          { month: 'Mar 26', value: 1.677 },
        ],
      },
    ],
  },
  {
    id: 'riz',
    label: 'Riz blanc 1kg',
    unit: '€/kg',
    domain: [1.5, 2.5] as [number, number],
    series: [
      {
        name: 'Hexagone',
        data: [
          { month: 'Nov 25', value: 1.613 },
          { month: 'Déc 25', value: 1.643 },
          { month: 'Jan 26', value: 1.684 },
          { month: 'Fév 26', value: 1.706 },
          { month: 'Mar 26', value: 1.716 },
        ],
      },
      {
        name: 'Guadeloupe',
        data: [
          { month: 'Nov 25', value: 1.94 },
          { month: 'Déc 25', value: 1.985 },
          { month: 'Jan 26', value: 1.963 },
          { month: 'Fév 26', value: 2.025 },
          { month: 'Mar 26', value: 2.035 },
        ],
      },
      {
        name: 'Martinique',
        data: [
          { month: 'Nov 25', value: null },
          { month: 'Déc 25', value: null },
          { month: 'Jan 26', value: 2.03 },
          { month: 'Fév 26', value: 2.07 },
          { month: 'Mar 26', value: 2.08 },
        ],
      },
      {
        name: 'La Réunion',
        data: [
          { month: 'Nov 25', value: null },
          { month: 'Déc 25', value: null },
          { month: 'Jan 26', value: 2.045 },
          { month: 'Fév 26', value: 1.95 },
          { month: 'Mar 26', value: 1.96 },
        ],
      },
      {
        name: 'Guyane',
        data: [
          { month: 'Nov 25', value: null },
          { month: 'Déc 25', value: null },
          { month: 'Jan 26', value: 2.252 },
          { month: 'Fév 26', value: 2.335 },
          { month: 'Mar 26', value: 2.345 },
        ],
      },
    ],
  },
];

// Flatten per-territory series into a month-keyed array for Recharts
function buildChartData(productIndex: number) {
  const product = PRODUCTS[productIndex];
  const months = product.series[0].data.map((d) => d.month);
  return months.map((month, i) => {
    const row: Record<string, number | string | null> = { month };
    for (const s of product.series) {
      row[s.name] = s.data[i].value;
    }
    return row;
  });
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number | null; color: string }>;
  label?: string;
  unit: string;
}

function CustomTooltip({ active, payload, label, unit }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const filtered = payload.filter((p) => p.value !== null);
  return (
    <div className="evo-tooltip">
      <p className="evo-tooltip-month">{label}</p>
      {filtered.map((p) => (
        <p key={p.name} className="evo-tooltip-row" style={{ color: p.color }}>
          {TERRITORY_FLAGS[p.name] ?? ''} {p.name}:{' '}
          <strong>
            {p.value?.toFixed(3)} {unit}
          </strong>
        </p>
      ))}
    </div>
  );
}

export default function PriceEvolutionChart() {
  const [activeProduct, setActiveProduct] = useState(0);
  const product = PRODUCTS[activeProduct];
  const chartData = buildChartData(activeProduct);

  return (
    <section
      className="price-evo-section section-reveal"
      aria-labelledby="price-evo-heading"
    >
      <div className="price-evo-header">
        <h2 id="price-evo-heading" className="section-title slide-up">
          📈 Évolution des prix — nov. 2025 → mars 2026
        </h2>
        <p className="price-evo-sub slide-up">
          Tendances mensuelles réelles issues de l'Observatoire citoyen.{' '}
          <span className="price-chart-source">Source : relevés terrain A KI PRI SA YÉ</span>
        </p>
        <div className="price-chart-tabs" role="tablist" aria-label="Choisir un produit">
          {PRODUCTS.map((p, i) => (
            <button
              key={p.id}
              role="tab"
              aria-selected={i === activeProduct}
              className={`price-chart-tab${i === activeProduct ? ' price-chart-tab--active' : ''}`}
              onClick={() => setActiveProduct(i)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="price-evo-wrap" role="tabpanel">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={chartData}
            margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(148,163,184,0.15)"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={product.domain}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickFormatter={(v: number) => `${v.toFixed(2)} €`}
              axisLine={false}
              tickLine={false}
              width={62}
            />
            <Tooltip
              content={<CustomTooltip unit={product.unit} />}
              cursor={{ stroke: 'rgba(148,163,184,0.25)', strokeWidth: 1 }}
            />
            <Legend
              formatter={(value: string) =>
                `${TERRITORY_FLAGS[value] ?? ''} ${value}`
              }
              wrapperStyle={{ fontSize: 12, color: '#94a3b8' }}
            />
            {product.series.map((s) => (
              <Line
                key={s.name}
                type="monotone"
                dataKey={s.name}
                stroke={TERRITORY_COLORS[s.name]}
                strokeWidth={s.name === 'Hexagone' ? 2 : 2.5}
                dot={{ r: 3, fill: TERRITORY_COLORS[s.name] }}
                activeDot={{ r: 5 }}
                connectNulls={false}
                strokeDasharray={s.name === 'Hexagone' ? '5 4' : undefined}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>

        <p className="price-evo-note">
          Les lignes en tirets représentent l'Hexagone (référence). Les données antérieures à
          janvier 2026 ne sont disponibles que pour Guadeloupe et Hexagone.
        </p>
      </div>
    </section>
  );
}
