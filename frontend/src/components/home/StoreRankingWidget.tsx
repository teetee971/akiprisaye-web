/**
 * StoreRankingWidget — interactive store ranking per territory.
 *
 * Shows cheapest vs most expensive stores based on real average prices
 * from observatoire snapshots (2026-03). Users can switch territories
 * with tab buttons. Potential savings are computed from the gap between
 * the cheapest and most expensive store.
 *
 * All data sourced from observatoire JSON snapshots — no mock values.
 */

import { useState } from 'react';

interface StoreEntry {
  store: string;
  avg: number;
}

interface TerritoryRanking {
  flag: string;
  label: string;
  stores: StoreEntry[];
}

// Real averages computed from observatoire/*/2026-03.json snapshots.
// avg = mean price across all products recorded for that store in that territory.
const RANKINGS: Record<string, TerritoryRanking> = {
  guadeloupe: {
    flag: '🇬🇵',
    label: 'Guadeloupe',
    stores: [
      { store: 'Leader Price',  avg: 1.35 },
      { store: 'Cora',          avg: 1.41 },
      { store: 'Hyper U',       avg: 1.43 },
      { store: 'Carrefour',     avg: 1.45 },
      { store: 'Jumbo Score',   avg: 1.48 },
      { store: 'E.Leclerc',     avg: 3.30 },
    ],
  },
  martinique: {
    flag: '🇲🇶',
    label: 'Martinique',
    stores: [
      { store: 'Hyper U',       avg: 1.59 },
      { store: 'Carrefour',     avg: 1.68 },
      { store: 'Jumbo Score',   avg: 1.73 },
      { store: 'Leader Price',  avg: 1.85 },
      { store: 'E.Leclerc',     avg: 2.16 },
    ],
  },
  guyane: {
    flag: '🇬🇫',
    label: 'Guyane',
    stores: [
      { store: 'Carrefour',  avg: 1.94 },
      { store: 'Hyper U',    avg: 2.12 },
      { store: 'Leader Price', avg: 2.27 },
      { store: 'Score',      avg: 2.52 },
    ],
  },
  reunion: {
    flag: '🇷🇪',
    label: 'La Réunion',
    stores: [
      { store: 'Carrefour',    avg: 1.68 },
      { store: 'Hyper U',      avg: 1.74 },
      { store: 'Jumbo Score',  avg: 1.79 },
      { store: 'Leader Price', avg: 1.85 },
      { store: 'E.Leclerc',    avg: 2.08 },
    ],
  },
  mayotte: {
    flag: '🇾🇹',
    label: 'Mayotte',
    stores: [
      { store: 'Score',        avg: 2.00 },
      { store: 'Jumbo Score',  avg: 2.27 },
      { store: 'Independant',  avg: 2.79 },
    ],
  },
  saint_martin: {
    flag: '🇸🇽',
    label: 'Saint-Martin',
    stores: [
      { store: 'Leader Price', avg: 2.22 },
      { store: 'Hyper U',      avg: 2.61 },
      { store: 'Casino',       avg: 3.69 },
    ],
  },
};

const TERRITORY_KEYS = Object.keys(RANKINGS);

// Map a rank (0 = cheapest) to a pill color
function rankColor(rank: number, total: number): string {
  if (rank === 0) return '#22c55e';
  if (rank === total - 1) return '#ef4444';
  return '#64748b';
}

function rankLabel(rank: number, total: number): string {
  if (rank === 0) return '💚 Meilleur prix';
  if (rank === total - 1) return '🔴 Plus cher';
  return '';
}

export default function StoreRankingWidget() {
  const [activeKey, setActiveKey] = useState<string>('guadeloupe');
  const ranking = RANKINGS[activeKey];
  const sorted = [...ranking.stores].sort((a, b) => a.avg - b.avg);
  const cheapest = sorted[0];
  const mostExpensive = sorted[sorted.length - 1];
  const savingsEuro = mostExpensive.avg - cheapest.avg;
  const savingsPct = (savingsEuro / mostExpensive.avg) * 100;
  // Extrapolate to a ~50-product monthly basket
  const monthlySavings = savingsEuro * 50;

  return (
    <section
      className="price-chart-section section-reveal"
      aria-label="Classement des enseignes par territoire"
    >
      <div className="price-chart-header">
        <h2 className="section-title slide-up">🏪 Quelle enseigne est la moins chère ?</h2>
        <p className="price-chart-sub">
          Classement réel des enseignes par prix moyen du panier de base —{' '}
          <span className="price-chart-source">observatoire mars 2026</span>
        </p>
      </div>

      {/* Territory tabs */}
      <div className="price-chart-tabs" role="tablist" aria-label="Sélection territoire">
        {TERRITORY_KEYS.map((key) => {
          const t = RANKINGS[key];
          return (
            <button
              key={key}
              role="tab"
              aria-selected={key === activeKey}
              className={`price-chart-tab${key === activeKey ? ' price-chart-tab--active' : ''}`}
              onClick={() => setActiveKey(key)}
            >
              {t.flag} {t.label}
            </button>
          );
        })}
      </div>

      <div className="price-chart-wrap" style={{ maxWidth: 560 }}>
        {/* Store list */}
        <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {sorted.map((entry, idx) => {
            const widthPct =
              ((entry.avg - cheapest.avg) / (mostExpensive.avg - cheapest.avg || 1)) * 80 + 20;
            const color = rankColor(idx, sorted.length);
            const label = rankLabel(idx, sorted.length);
            return (
              <li
                key={entry.store}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '0.75rem',
                }}
              >
                {/* Rank number */}
                <span
                  style={{
                    minWidth: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#fff',
                    flexShrink: 0,
                  }}
                >
                  {idx + 1}
                </span>

                {/* Bar + label */}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      marginBottom: 3,
                    }}
                  >
                    <span style={{ fontSize: '0.88rem', color: '#e2e8f0', fontWeight: 600 }}>
                      {entry.store}
                    </span>
                    {label && (
                      <span style={{ fontSize: '0.65rem', color, fontWeight: 700 }}>
                        {label}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      height: 6,
                      background: 'rgba(255,255,255,0.07)',
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${widthPct}%`,
                        background: color,
                        borderRadius: 4,
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>

                {/* Price */}
                <span
                  style={{
                    minWidth: 48,
                    textAlign: 'right',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color,
                  }}
                >
                  {entry.avg.toFixed(2)} €
                </span>
              </li>
            );
          })}
        </ol>

        {/* Savings banner */}
        {savingsEuro > 0.05 && (
          <div
            style={{
              marginTop: '1.25rem',
              padding: '0.9rem 1.1rem',
              borderRadius: 12,
              background: 'rgba(34, 197, 94, 0.08)',
              border: '1px solid rgba(34, 197, 94, 0.25)',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '0.88rem',
                color: '#86efac',
                lineHeight: 1.55,
              }}
            >
              💡{' '}
              <strong>
                En choisissant {cheapest.store} plutôt que {mostExpensive.store}
              </strong>
              , vous économisez en moyenne{' '}
              <strong style={{ color: '#4ade80' }}>
                {savingsPct.toFixed(0)} % ({savingsEuro.toFixed(2)} € / produit)
              </strong>
              , soit jusqu'à{' '}
              <strong style={{ color: '#4ade80' }}>~{monthlySavings.toFixed(0)} €/mois</strong>{' '}
              sur un panier de 50 articles.
            </p>
          </div>
        )}

        <p
          style={{
            textAlign: 'center',
            fontSize: '0.72rem',
            color: '#475569',
            marginTop: '0.85rem',
          }}
        >
          Source : Observatoire citoyen A KI PRI SA YÉ — relevés vérifiés, mars 2026
        </p>
      </div>
    </section>
  );
}
