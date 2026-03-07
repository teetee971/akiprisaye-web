/**
 * CategoryOvercostChart — horizontal bar chart showing real DOM surcoût
 * (overcharge) vs Hexagone by product category for March 2026.
 *
 * All percentages are averages computed from observatoire JSON snapshots
 * (guadeloupe, martinique, la_réunion, guyane, mayotte × 2026-03).
 */

import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

// Real values computed from observatoire/*/2026-03.json snapshots.
// Surcoût = (avg_DOM - avg_Hexagone) / avg_Hexagone * 100
const OVERCOST_DATA = [
  { category: 'Boissons',              pct: 100.8, icon: '🥤', hexAvg: 0.40, domAvg: 0.81 },
  { category: 'Fruits & légumes',      pct: 42.5,  icon: '🥦', hexAvg: 2.33, domAvg: 3.32 },
  { category: 'Épicerie',              pct: 39.5,  icon: '🛒', hexAvg: 1.64, domAvg: 2.29 },
  { category: 'Produits laitiers',     pct: 31.6,  icon: '🥛', hexAvg: 1.27, domAvg: 1.68 },
  { category: 'Entretien / Nettoyage', pct: 31.4,  icon: '🧹', hexAvg: 1.40, domAvg: 1.84 },
  { category: 'Pharmacie',             pct: 30.6,  icon: '💊', hexAvg: 1.96, domAvg: 2.56 },
  { category: 'Lessive',               pct: 25.0,  icon: '🧺', hexAvg: 3.41, domAvg: 4.26 },
  { category: 'Hygiène',               pct: 23.8,  icon: '🧴', hexAvg: 1.95, domAvg: 2.42 },
  { category: 'Cosmétiques',           pct: 22.7,  icon: '💄', hexAvg: 4.76, domAvg: 5.84 },
];

// Colour ramp: red for very high, amber for medium, green for low
function barColor(pct: number): string {
  if (pct >= 80) return '#ef4444';
  if (pct >= 50) return '#f97316';
  if (pct >= 30) return '#f59e0b';
  return '#22c55e';
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: (typeof OVERCOST_DATA)[0] }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">
        {d.icon} {d.category}
      </div>
      <div style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.35rem 0' }}>
        Hexagone&nbsp;
        <strong style={{ color: '#e2e8f0' }}>{d.hexAvg.toFixed(2)} €</strong>
        {'  →  '}
        DOM&nbsp;
        <strong style={{ color: '#e2e8f0' }}>{d.domAvg.toFixed(2)} €</strong>
      </div>
      <div className="chart-tooltip-price" style={{ color: barColor(d.pct) }}>
        +{d.pct.toFixed(1)} % plus cher
      </div>
    </div>
  );
}

export default function CategoryOvercostChart() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 479px)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 479px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const yAxisWidth = isMobile ? 80 : 138;
  const chartMargin = isMobile
    ? { top: 4, right: 36, left: 82, bottom: 4 }
    : { top: 4, right: 56, left: 140, bottom: 4 };
  const chartHeight = isMobile ? 270 : 310;

  return (
    <section className="price-chart-section section-reveal" aria-label="Surcoût par catégorie DOM vs Hexagone">
      <div className="price-chart-header">
        <h2 className="section-title slide-up">
          💰 Pourquoi tout coûte plus cher ?
        </h2>
        <p className="price-chart-sub">
          Surcoût moyen des DOM (Guadeloupe, Martinique, Guyane, La Réunion, Mayotte)
          par rapport à l'Hexagone —{' '}
          <span className="price-chart-source">données observatoire mars 2026</span>
        </p>
      </div>

      <div className="price-chart-wrap" style={{ maxWidth: 760 }}>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            layout="vertical"
            data={OVERCOST_DATA}
            margin={chartMargin}
          >
            <XAxis
              type="number"
              tickFormatter={(v: number) => `+${v}%`}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              domain={[0, 115]}
            />
            <YAxis
              type="category"
              dataKey="category"
              tick={{ fill: '#cbd5e1', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={yAxisWidth}
              tickFormatter={(v: string, i: number) => {
                const icon = OVERCOST_DATA[i]?.icon ?? '';
                const label = isMobile && v.length > 9 ? v.slice(0, 8) + '…' : v;
                return `${icon} ${label}`;
              }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="pct" radius={[0, 6, 6, 0]} isAnimationActive>
              {OVERCOST_DATA.map((d) => (
                <Cell key={d.category} fill={barColor(d.pct)} fillOpacity={0.85} />
              ))}
              <LabelList
                dataKey="pct"
                position="right"
                formatter={(v: string | number | boolean | null | undefined) =>
                  typeof v === 'number' ? `+${v.toFixed(0)}%` : String(v ?? '')
                }
                style={{ fill: '#e2e8f0', fontSize: 11, fontWeight: 700 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <p
          style={{
            textAlign: 'center',
            fontSize: '0.72rem',
            color: '#475569',
            marginTop: '0.75rem',
          }}
        >
          Source : Observatoire citoyen A KI PRI SA YÉ — relevés vérifiés, mars 2026
        </p>
      </div>
    </section>
  );
}
