/**
 * StoreRankingWidget — interactive store ranking per territory.
 *
 * Shows cheapest vs most expensive stores based on real average prices
 * from observatoire snapshots (2026-03). Users can switch territories
 * with tab buttons. A special "Comparaison" tab ranks all territories
 * side-by-side to reveal which is globally cheapest or most expensive.
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
// France métropolitaine: IRI/Nielsen panel scan data, mar 2026 (prix moyen panier alimentaire).
const RANKINGS: Record<string, TerritoryRanking> = {
  france: {
    flag: '🇫🇷',
    label: 'France métro.',
    stores: [
      { store: 'Lidl', avg: 1.05 },
      { store: 'Aldi', avg: 1.08 },
      { store: 'E.Leclerc', avg: 1.12 },
      { store: 'Intermarché', avg: 1.18 },
      { store: 'Carrefour', avg: 1.25 },
      { store: 'Monoprix', avg: 1.48 },
    ],
  },
  guadeloupe: {
    flag: '🇬🇵',
    label: 'Guadeloupe',
    stores: [
      { store: 'Leader Price', avg: 1.35 },
      { store: 'Cora', avg: 1.41 },
      { store: 'Hyper U', avg: 1.43 },
      { store: 'Carrefour', avg: 1.45 },
      { store: 'Jumbo Score', avg: 1.48 },
      { store: 'E.Leclerc', avg: 3.3 },
    ],
  },
  martinique: {
    flag: '🇲🇶',
    label: 'Martinique',
    stores: [
      { store: 'Hyper U', avg: 1.59 },
      { store: 'Carrefour', avg: 1.68 },
      { store: 'Jumbo Score', avg: 1.73 },
      { store: 'Leader Price', avg: 1.85 },
      { store: 'E.Leclerc', avg: 2.16 },
    ],
  },
  guyane: {
    flag: '🇬🇫',
    label: 'Guyane',
    stores: [
      { store: 'Carrefour', avg: 1.94 },
      { store: 'Hyper U', avg: 2.12 },
      { store: 'Leader Price', avg: 2.27 },
      { store: 'Score', avg: 2.52 },
    ],
  },
  reunion: {
    flag: '🇷🇪',
    label: 'La Réunion',
    stores: [
      { store: 'Carrefour', avg: 1.68 },
      { store: 'Hyper U', avg: 1.74 },
      { store: 'Jumbo Score', avg: 1.79 },
      { store: 'Leader Price', avg: 1.85 },
      { store: 'E.Leclerc', avg: 2.08 },
    ],
  },
  mayotte: {
    flag: '🇾🇹',
    label: 'Mayotte',
    stores: [
      { store: 'Score', avg: 2.0 },
      { store: 'Jumbo Score', avg: 2.27 },
      { store: 'Independant', avg: 2.79 },
    ],
  },
  saint_martin: {
    flag: '🇲🇫',
    label: 'Saint-Martin',
    stores: [
      { store: 'Leader Price', avg: 2.22 },
      { store: 'Hyper U', avg: 2.61 },
      { store: 'Casino', avg: 3.69 },
    ],
  },
};

const TERRITORY_KEYS = Object.keys(RANKINGS);
const COMPARE_KEY = '__compare__';
const ALL_KEYS = [COMPARE_KEY, ...TERRITORY_KEYS];

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

// Build a summary row for each territory (cheapest store + its price, most expensive store + price)
interface TerritoryRow {
  key: string;
  flag: string;
  label: string;
  cheapestStore: string;
  cheapestAvg: number;
  mostExpensiveStore: string;
  mostExpensiveAvg: number;
}

function buildComparisonRows(): TerritoryRow[] {
  return TERRITORY_KEYS.map((key) => {
    const t = RANKINGS[key];
    const sorted = [...t.stores].sort((a, b) => a.avg - b.avg);
    return {
      key,
      flag: t.flag,
      label: t.label,
      cheapestStore: sorted[0].store,
      cheapestAvg: sorted[0].avg,
      mostExpensiveStore: sorted[sorted.length - 1].store,
      mostExpensiveAvg: sorted[sorted.length - 1].avg,
    };
  }).sort((a, b) => a.cheapestAvg - b.cheapestAvg);
}

function CrossTerritoryView() {
  const rows = buildComparisonRows();
  const globalCheapestAvg = rows[0].cheapestAvg;
  const globalMostExpensiveAvg = rows[rows.length - 1].cheapestAvg;
  const refTerritory = rows.find((r) => r.key === 'france');
  const refAvg = refTerritory ? refTerritory.cheapestAvg : globalCheapestAvg;

  return (
    <div className="price-chart-wrap" style={{ maxWidth: 560 }}>
      <p style={{ margin: '0 0 1rem', fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5 }}>
        Prix moyen du meilleur supermarché par territoire — du moins cher au plus cher. La surcharge
        est calculée par rapport à la France métropolitaine.
      </p>
      <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {rows.map((row, idx) => {
          const color = rankColor(idx, rows.length);
          const widthPct =
            ((row.cheapestAvg - globalCheapestAvg) /
              (globalMostExpensiveAvg - globalCheapestAvg || 1)) *
              80 +
            20;
          const overcostPct =
            row.key !== 'france' ? ((row.cheapestAvg - refAvg) / refAvg) * 100 : null;
          return (
            <li
              key={row.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.9rem',
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

              {/* Bar + labels */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: 3,
                    flexWrap: 'wrap',
                    gap: '0.25rem',
                  }}
                >
                  <span style={{ fontSize: '0.88rem', color: '#e2e8f0', fontWeight: 600 }}>
                    {row.flag} {row.label}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                    meilleur : {row.cheapestStore}
                  </span>
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
                      width: '100%',
                      background: color,
                      borderRadius: 4,
                      transformOrigin: 'left center',
                      transform: `scaleX(${widthPct / 100})`,
                      transition: 'transform 0.4s ease',
                    }}
                  />
                </div>
              </div>

              {/* Price + overcost badge */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color,
                  }}
                >
                  {row.cheapestAvg.toFixed(2)} €
                </div>
                {overcostPct !== null && overcostPct > 0 && (
                  <div style={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 600 }}>
                    +{overcostPct.toFixed(0)} % vs FR
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {/* Global insight banner */}
      <div
        style={{
          marginTop: '1.25rem',
          padding: '0.9rem 1.1rem',
          borderRadius: 12,
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
        }}
      >
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#c7d2fe', lineHeight: 1.6 }}>
          🌍{' '}
          <strong>
            {rows[0].flag} {rows[0].label}
          </strong>{' '}
          est le territoire le moins cher (meilleur prix :{' '}
          <strong style={{ color: '#22c55e' }}>{rows[0].cheapestAvg.toFixed(2)} €</strong>
          ).{' '}
          <strong>
            {rows[rows.length - 1].flag} {rows[rows.length - 1].label}
          </strong>{' '}
          est le plus cher (
          <strong style={{ color: '#ef4444' }}>
            {rows[rows.length - 1].cheapestAvg.toFixed(2)} €
          </strong>
          ), soit{' '}
          <strong style={{ color: '#fbbf24' }}>
            +
            {(
              ((rows[rows.length - 1].cheapestAvg - rows[0].cheapestAvg) / rows[0].cheapestAvg) *
              100
            ).toFixed(0)}{' '}
            %
          </strong>{' '}
          de plus.
        </p>
      </div>

      <p
        style={{
          textAlign: 'center',
          fontSize: '0.72rem',
          color: '#94a3b8',
          marginTop: '0.85rem',
        }}
      >
        Source : Observatoire citoyen A KI PRI SA YÉ — relevés vérifiés, mars 2026
      </p>
    </div>
  );
}

export default function StoreRankingWidget() {
  const [activeKey, setActiveKey] = useState<string>('guadeloupe');

  const isCompare = activeKey === COMPARE_KEY;
  const ranking = isCompare ? null : RANKINGS[activeKey];
  const sorted = ranking ? [...ranking.stores].sort((a, b) => a.avg - b.avg) : [];
  const cheapest = sorted[0];
  const mostExpensive = sorted[sorted.length - 1];
  const savingsEuro = cheapest && mostExpensive ? mostExpensive.avg - cheapest.avg : 0;
  const savingsPct = cheapest ? (savingsEuro / cheapest.avg) * 100 : 0;
  // Extrapolate to a ~50-product monthly basket
  const monthlySavings = savingsEuro * 50;

  return (
    <section
      className="price-chart-section section-reveal"
      aria-label="Classement des enseignes par territoire"
    >
      {/* Section banner image */}
      <div className="section-context-banner">
        <img
          src="https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fm=webp&fit=crop&w=900&q=60"
          alt="Rayon supermarché outre-mer — comparaison des prix entre enseignes"
          className="section-context-banner-img"
          loading="lazy"
          width="900"
          height="160"
          crossOrigin="anonymous"
        />
        <div className="section-context-banner-overlay" aria-hidden="true" />
        <div className="section-context-banner-caption">
          <span className="section-context-banner-title" aria-hidden="true">
            🏪 Quelle enseigne est la moins chère ?
          </span>
          <span className="section-context-banner-badge">Relevés citoyens 2026</span>
        </div>
      </div>
      <h2
        className="section-title slide-up"
        style={{ textAlign: 'center', marginBottom: '0.5rem' }}
      >
        🏪 Quelle enseigne est la moins chère ?
      </h2>

      <div className="price-chart-header">
        <p className="price-chart-sub">
          Classement réel des enseignes par prix moyen du panier de base —{' '}
          <span className="price-chart-source">observatoire mars 2026</span>
        </p>
      </div>

      {/* Territory tabs */}
      <div className="price-chart-tabs" role="tablist" aria-label="Sélection territoire">
        {/* Comparison tab */}
        <button
          role="tab"
          id={`store-tab-${COMPARE_KEY}`}
          aria-selected={activeKey === COMPARE_KEY}
          aria-controls={`store-tabpanel-${COMPARE_KEY}`}
          tabIndex={activeKey === COMPARE_KEY ? 0 : -1}
          className={`price-chart-tab price-chart-tab--compare${activeKey === COMPARE_KEY ? ' price-chart-tab--active' : ''}`}
          onClick={() => setActiveKey(COMPARE_KEY)}
          onKeyDown={(e) => {
            const idx = ALL_KEYS.indexOf(COMPARE_KEY);
            if (e.key === 'ArrowRight') setActiveKey(ALL_KEYS[(idx + 1) % ALL_KEYS.length]);
            else if (e.key === 'ArrowLeft')
              setActiveKey(ALL_KEYS[(idx - 1 + ALL_KEYS.length) % ALL_KEYS.length]);
            else if (e.key === 'Home') setActiveKey(ALL_KEYS[0]);
            else if (e.key === 'End') setActiveKey(ALL_KEYS[ALL_KEYS.length - 1]);
          }}
        >
          🆚 Comparer tous
        </button>

        {/* Territory tabs */}
        {TERRITORY_KEYS.map((key, idx) => {
          const t = RANKINGS[key];
          const allIdx = idx + 1; // offset by the compare tab
          return (
            <button
              key={key}
              role="tab"
              id={`store-tab-${key}`}
              aria-selected={key === activeKey}
              aria-controls={`store-tabpanel-${key}`}
              tabIndex={key === activeKey ? 0 : -1}
              className={`price-chart-tab${key === activeKey ? ' price-chart-tab--active' : ''}`}
              onClick={() => setActiveKey(key)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') setActiveKey(ALL_KEYS[(allIdx + 1) % ALL_KEYS.length]);
                else if (e.key === 'ArrowLeft')
                  setActiveKey(ALL_KEYS[(allIdx - 1 + ALL_KEYS.length) % ALL_KEYS.length]);
                else if (e.key === 'Home') setActiveKey(ALL_KEYS[0]);
                else if (e.key === 'End') setActiveKey(ALL_KEYS[ALL_KEYS.length - 1]);
              }}
            >
              {t.flag} {t.label}
            </button>
          );
        })}
      </div>

      {isCompare ? (
        <div
          role="tabpanel"
          id={`store-tabpanel-${COMPARE_KEY}`}
          aria-labelledby={`store-tab-${COMPARE_KEY}`}
        >
          <CrossTerritoryView />
        </div>
      ) : (
        <div
          role="tabpanel"
          id={`store-tabpanel-${activeKey}`}
          aria-labelledby={`store-tab-${activeKey}`}
          className="price-chart-wrap"
          style={{ maxWidth: 560 }}
        >
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
                        <span style={{ fontSize: '0.65rem', color, fontWeight: 700 }}>{label}</span>
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
                          width: '100%',
                          background: color,
                          borderRadius: 4,
                          transformOrigin: 'left center',
                          transform: `scaleX(${widthPct / 100})`,
                          transition: 'transform 0.4s ease',
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
              color: '#94a3b8',
              marginTop: '0.85rem',
            }}
          >
            Source : Observatoire citoyen A KI PRI SA YÉ — relevés vérifiés, mars 2026
          </p>
        </div>
      )}
    </section>
  );
}
