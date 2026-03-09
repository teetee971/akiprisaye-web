/**
 * InflationBarometerWidget — Baromètre mensuel des prix
 *
 * Calcule dynamiquement l'évolution du panier de 6 produits essentiels
 * entre janvier et mars 2026 pour chaque territoire DOM-TOM et l'Hexagone,
 * à partir des snapshots réels de l'observatoire citoyen.
 *
 * Affiche :
 *  - Prix du panier en janvier et mars 2026
 *  - Variation en % (inflation ou déflation)
 *  - Écart par rapport à l'Hexagone
 *  - Sparkline SVG 3 points (Jan / Fév / Mar)
 *  - Alerte si une variation > seuil d'alerte
 *
 * Sources : Observatoire citoyen A KI PRI SA YÉ — Snapshots jan/fév/mars 2026
 */

import { useEffect, useState } from 'react';

interface SparkPoint {
  month: string;       // e.g. "Jan 26"
  basket: number | null;
}

interface BarometerEntry {
  code: string;
  territory: string;
  flag: string;
  spark: SparkPoint[];  // 3 monthly points
  basketJan: number | null;
  basketMar: number | null;
  trendPct: number | null; // Jan→Mar %
  vsHexTrendDiff: number | null; // trendPct - hexTrend (positive = worsening vs Hexagone)
}

interface ObsEntry {
  produit: string;
  prix: number;
}
interface Snapshot {
  donnees: ObsEntry[];
}

// 6 essential basket products (matching observatoire field names)
const BASKET_PRODUCTS = [
  'Lait demi-écrémé UHT 1L',
  'Riz long blanc 1kg',
  'Eau minérale 1.5L',
  'Pâtes spaghetti 500g',
  'Sucre blanc 1kg',
  'Huile de tournesol 1L',
];

const MONTHS: Array<{ key: string; label: string }> = [
  { key: '2026-01', label: 'Jan 26' },
  { key: '2026-02', label: 'Fév 26' },
  { key: '2026-03', label: 'Mar 26' },
];

const TERRITORIES = [
  { code: 'fr',  stem: 'hexagone',   flag: '🇫🇷', label: 'Hexagone'    },
  { code: 'gp',  stem: 'guadeloupe', flag: '🇬🇵', label: 'Guadeloupe'  },
  { code: 'mq',  stem: 'martinique', flag: '🇲🇶', label: 'Martinique'  },
  { code: 'gf',  stem: 'guyane',     flag: '🇬🇫', label: 'Guyane'      },
  { code: 're',  stem: 'la_réunion', flag: '🇷🇪', label: 'La Réunion'  },
  { code: 'yt',  stem: 'mayotte',    flag: '🇾🇹', label: 'Mayotte'     },
];

/** Compute average basket price for products present in `donnees`, require ≥5 matches */
function computeBasket(donnees: ObsEntry[]): number | null {
  const sums: Record<string, { total: number; count: number }> = {};
  for (const e of donnees) {
    if (BASKET_PRODUCTS.includes(e.produit)) {
      if (!sums[e.produit]) sums[e.produit] = { total: 0, count: 0 };
      sums[e.produit].total += e.prix;
      sums[e.produit].count++;
    }
  }
  const avgs = Object.values(sums).map((s) => s.total / s.count);
  if (avgs.length < 5) return null;
  const total = avgs.reduce((a, b) => a + b, 0);
  // If one product is missing, extrapolate proportionally
  if (avgs.length < 6) return (total / avgs.length) * 6;
  return total;
}

/** SVG mini-sparkline — 3 points, 60×24 px */
function Sparkline({ points, color }: { points: (number | null)[]; color: string }) {
  const valid = points.filter((p): p is number => p !== null);
  if (valid.length < 2) return null;

  const minVal = Math.min(...valid);
  const maxVal = Math.max(...valid);
  const range = maxVal - minVal || 0.01;

  const W = 60;
  const H = 24;
  const PAD = 3;

  const coords: Array<[number, number] | null> = points.map((v, i) => {
    if (v === null) return null;
    const x = PAD + (i / (points.length - 1)) * (W - PAD * 2);
    const y = PAD + (1 - (v - minVal) / range) * (H - PAD * 2);
    return [x, y];
  });

  // Build SVG path skipping null gaps
  let d = '';
  let penDown = false;
  for (const c of coords) {
    if (c === null) { penDown = false; continue; }
    d += penDown ? `L${c[0]},${c[1]}` : `M${c[0]},${c[1]}`;
    penDown = true;
  }

  const lastCoord = coords.filter(Boolean).pop();

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      aria-hidden="true"
      className="ibw-sparkline"
    >
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {lastCoord && (
        <circle cx={lastCoord[0]} cy={lastCoord[1]} r="2.5" fill={color} />
      )}
    </svg>
  );
}

function trendColor(pct: number | null): string {
  if (pct === null) return '#64748b';
  if (pct > 3) return '#ef4444';
  if (pct > 0) return '#f97316';
  if (pct > -3) return '#22c55e';
  return '#10b981';
}

function trendArrow(pct: number | null): string {
  if (pct === null) return '—';
  if (pct > 0.5) return '↑';
  if (pct < -0.5) return '↓';
  return '→';
}

export default function InflationBarometerWidget() {
  const [entries, setEntries] = useState<BarometerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Fetch all snapshots in parallel
      const snapshots: Record<string, Record<string, Snapshot | null>> = {};

      await Promise.all(
        TERRITORIES.flatMap((t) =>
          MONTHS.map(async (m) => {
            const url = `${import.meta.env.BASE_URL}data/observatoire/${t.stem}_${m.key}.json`;
            try {
              const resp = await fetch(url);
              if (!resp.ok) throw new Error('not ok');
              const data: Snapshot = await resp.json();
              if (!snapshots[t.code]) snapshots[t.code] = {};
              snapshots[t.code][m.key] = data;
            } catch {
              if (!snapshots[t.code]) snapshots[t.code] = {};
              snapshots[t.code][m.key] = null;
            }
          }),
        ),
      );

      if (cancelled) return;

      // Compute baskets
      const results: BarometerEntry[] = TERRITORIES.map((t) => {
        const spark: SparkPoint[] = MONTHS.map((m) => {
          const snap = snapshots[t.code]?.[m.key];
          const basket = snap ? computeBasket(snap.donnees) : null;
          return { month: m.label, basket };
        });

        const basketJan = spark[0].basket;
        const basketMar = spark[2].basket;
        const trendPct =
          basketJan !== null && basketMar !== null
            ? ((basketMar - basketJan) / basketJan) * 100
            : null;

        return {
          code: t.code,
          territory: t.label,
          flag: t.flag,
          spark,
          basketJan,
          basketMar,
          trendPct,
          vsHexTrendDiff: null, // filled below
        };
      });

      // Compute delta vs Hexagone trend
      const hexEntry = results.find((e) => e.code === 'fr');
      const hexTrend = hexEntry?.trendPct ?? null;
      for (const e of results) {
        if (e.code !== 'fr' && e.trendPct !== null && hexTrend !== null) {
          e.vsHexTrendDiff = e.trendPct - hexTrend;
        }
      }

      if (!cancelled) {
        setEntries(results);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <section className="ibw-section section-reveal" aria-labelledby="ibw-heading">
        <div className="ibw-header">
          <h2 id="ibw-heading" className="section-title slide-up">🌡️ Baromètre des prix</h2>
        </div>
        <div className="ibw-skeleton" aria-busy="true" />
      </section>
    );
  }

  if (!entries.length) return null;

  const hexEntry = entries.find((e) => e.code === 'fr');
  const domEntries = entries.filter((e) => e.code !== 'fr');
  const worstEntry = domEntries.reduce<BarometerEntry | null>((worst, e) => {
    if (e.trendPct === null) return worst;
    if (worst === null || worst.trendPct === null) return e;
    return e.trendPct > worst.trendPct ? e : worst;
  }, null);

  return (
    <section className="ibw-section section-reveal" aria-labelledby="ibw-heading">
      {/* Section banner image */}
      <div className="section-context-banner">
        <img
          src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fm=webp&fit=crop&w=900&q=75"
          alt="Graphique d'inflation — évolution des prix alimentaires"
          className="section-context-banner-img"
          loading="lazy"
          width="900"
          height="160"
        />
        <div className="section-context-banner-overlay" aria-hidden="true" />
        <div className="section-context-banner-caption">
          <span className="section-context-banner-title" aria-hidden="true">🌡️ Baromètre des prix</span>
          <span className="section-context-banner-badge">Janv. → Mars 2026</span>
        </div>
      </div>
      <h2 id="ibw-heading" className="section-title slide-up">🌡️ Baromètre des prix</h2>

      <div className="ibw-header">
        <p className="ibw-subtitle slide-up">
          Évolution du panier de 6 produits essentiels — <strong>janvier à mars 2026</strong>
        </p>
        {hexEntry?.trendPct !== null && hexEntry?.trendPct !== undefined && (
          <p className="ibw-hex-ref fade-in">
            Référence Hexagone&nbsp;:{' '}
            <strong style={{ color: trendColor(hexEntry.trendPct) }}>
              {hexEntry.trendPct > 0 ? '+' : ''}{hexEntry.trendPct.toFixed(2)}&nbsp;%
            </strong>{' '}
            sur 3 mois
          </p>
        )}
      </div>

      {/* Basket composition detail */}
      <div className="ibw-basket-detail fade-in">
        <span className="ibw-basket-detail-label">🛒 Composition du panier observé</span>
        {['🥛 Lait UHT 1L', '🍚 Riz 1 kg', '💧 Eau 1,5 L', '🍝 Pâtes 500 g', '🍬 Sucre 1 kg', '🫙 Huile tournesol 1 L'].map((item) => (
          <span key={item} className="ibw-basket-item">{item}</span>
        ))}
      </div>

      {worstEntry?.trendPct !== null && worstEntry?.trendPct !== undefined && worstEntry.trendPct > 2 && (
        <div className="ibw-alert fade-in" role="alert">
          <span className="ibw-alert-icon">⚠️</span>
          <span>
            <strong>{worstEntry.flag} {worstEntry.territory}</strong> enregistre la plus forte
            hausse&nbsp;: <strong>+{worstEntry.trendPct.toFixed(1)}&nbsp;%</strong> sur 3 mois.
          </span>
        </div>
      )}

      <div className="ibw-grid" role="list">
        {entries.map((entry) => {
          const isHex = entry.code === 'fr';
          const color = trendColor(entry.trendPct);
          const arrow = trendArrow(entry.trendPct);
          const sparkValues = entry.spark.map((s) => s.basket);

          return (
            <article
              key={entry.code}
              className={`ibw-card${isHex ? ' ibw-card--reference' : ''}${
                entry.trendPct !== null && entry.trendPct > 3 ? ' ibw-card--alert' : ''
              }`}
              role="listitem"
              aria-label={`${entry.territory} : ${entry.trendPct !== null ? (entry.trendPct > 0 ? '+' : '') + entry.trendPct.toFixed(1) + '%' : 'données insuffisantes'}`}
            >
              <div className="ibw-card-header">
                <span className="ibw-flag" aria-hidden="true">{entry.flag}</span>
                <span className="ibw-territory">{entry.territory}</span>
                {isHex && <span className="ibw-badge ibw-badge--ref">Référence</span>}
              </div>

              <div className="ibw-spark-row">
                <Sparkline points={sparkValues} color={color} />
                <div className="ibw-trend" style={{ color }}>
                  <span className="ibw-arrow" aria-hidden="true">{arrow}</span>
                  <span className="ibw-pct">
                    {entry.trendPct !== null
                      ? `${entry.trendPct > 0 ? '+' : ''}${entry.trendPct.toFixed(1)}\u00a0%`
                      : '—'}
                  </span>
                </div>
              </div>

              {entry.basketJan !== null && entry.basketMar !== null && (
                <div className="ibw-prices">
                  <span className="ibw-price-old">{entry.basketJan.toFixed(2)}&nbsp;€</span>
                  <span className="ibw-price-arrow" aria-hidden="true">→</span>
                  <span className="ibw-price-new" style={{ color }}>{entry.basketMar.toFixed(2)}&nbsp;€</span>
                </div>
              )}

              {!isHex && entry.vsHexTrendDiff !== null && (
                <div className="ibw-vs-hex">
                  {entry.vsHexTrendDiff > 0 ? '+' : ''}
                  {entry.vsHexTrendDiff.toFixed(1)}&nbsp;pt vs Hexagone
                </div>
              )}
            </article>
          );
        })}
      </div>

      <p className="ibw-source">
        Sources&nbsp;: Observatoire citoyen A KI PRI SA YÉ — Snapshots jan., fév., mars 2026 —
        Panier&nbsp;: lait, riz, eau, pâtes, sucre, huile
      </p>
    </section>
  );
}
