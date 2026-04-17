/**
 * IndiceEquiteWidget — "Indice d'Équité Tarifaire par territoire"
 *
 * Calcule, depuis les snapshots observatoire du mois courant, un indice composite
 * d'équité tarifaire pour chaque territoire DOM-TOM vs l'Hexagone.
 *
 * Méthodologie :
 *   Pour chaque territoire disponible :
 *     surcoût_moyen = moyenne des (prix_dom[p] − prix_hex[p]) / prix_hex[p] × 100
 *     pour tous les produits communs au territoire et à l'Hexagone
 *
 *   Score d'équité (0–200+) :
 *     0 = même niveau de prix que l'Hexagone (équité parfaite)
 *     30 = seuil BQP légal (Budget Qualité Prix, décret Lutte contre la vie chère)
 *     100+ = surcoût supérieur au double du seuil BQP
 *
 * Innovation : premier indice composite, multi-produit, temps réel de l'iniquité
 * tarifaire entre les territoires ultramarins et la métropole. Intègre la
 * référence réglementaire BQP (+30 %) pour contextualiser chaque score.
 *
 * Sources :
 *   Observatoire citoyen A KI PRI SA YÉ — Snapshots mars 2026
 *   Décret n°2012-848 relatif au « Bouclier Qualité Prix » (BQP)
 */

import { useEffect, useState } from 'react';
import { getTerritoryAsset } from '../../config/imageAssets';

interface EquiteEntry {
  stem: string;
  flag: string;
  label: string;
  overcostPct: number; // mean (dom - hex) / hex * 100 across all shared products
  productCount: number; // number of products used in the average
  equiteScore: number; // overcostPct, capped display at 120 for bar width
  bqpBreach: boolean; // overcostPct > 30
  status: 'equitable' | 'tension' | 'iniquite' | 'critique';
}

interface ObsEntry {
  produit: string;
  prix: number;
}
interface Snapshot {
  donnees: ObsEntry[];
}

const SNAPSHOT_DATE = '2026-03';

const DOM_TERRITORIES = [
  { stem: 'guadeloupe', flag: '🇬🇵', label: 'Guadeloupe' },
  { stem: 'martinique', flag: '🇲🇶', label: 'Martinique' },
  { stem: 'la_réunion', flag: '🇷🇪', label: 'La Réunion' },
  { stem: 'guyane', flag: '🇬🇫', label: 'Guyane' },
  { stem: 'mayotte', flag: '🇾🇹', label: 'Mayotte' },
  { stem: 'saint_barthelemy', flag: '🇧🇱', label: 'Saint-Barthélemy' },
  { stem: 'saint_martin', flag: '🇲🇫', label: 'Saint-Martin' },
  { stem: 'saint_pierre_et_miquelon', flag: '🇵🇲', label: 'St-Pierre-et-Miq.' },
];

const BQP_THRESHOLD = 30; // % — seuil réglementaire BQP

function equiteStatus(overcost: number): EquiteEntry['status'] {
  if (overcost <= BQP_THRESHOLD) return 'equitable';
  if (overcost <= 50) return 'tension';
  if (overcost <= 80) return 'iniquite';
  return 'critique';
}

function statusColor(status: EquiteEntry['status']): string {
  switch (status) {
    case 'equitable':
      return '#22c55e';
    case 'tension':
      return '#f59e0b';
    case 'iniquite':
      return '#f97316';
    case 'critique':
      return '#ef4444';
  }
}

function statusLabel(status: EquiteEntry['status']): string {
  switch (status) {
    case 'equitable':
      return '✅ Acceptable';
    case 'tension':
      return '⚠️ Sous tension';
    case 'iniquite':
      return '⛔ Inéquitable';
    case 'critique':
      return '🚨 Critique';
  }
}

/** Compute avg price per product from donnees */
function buildProductAvg(donnees: ObsEntry[]): Record<string, number> {
  const acc: Record<string, { total: number; count: number }> = {};
  for (const e of donnees) {
    if (!acc[e.produit]) acc[e.produit] = { total: 0, count: 0 };
    acc[e.produit].total += e.prix;
    acc[e.produit].count++;
  }
  const result: Record<string, number> = {};
  for (const [p, { total, count }] of Object.entries(acc)) {
    result[p] = total / count;
  }
  return result;
}

function stemToCode(stem: string): string {
  const map: Record<string, string> = {
    guadeloupe: 'gp',
    martinique: 'mq',
    guyane: 'gf',
    la_réunion: 're',
    mayotte: 'yt',
    saint_barthelemy: 'bl',
    saint_martin: 'mf',
    saint_pierre_et_miquelon: 'pm',
  };
  return map[stem] ?? stem;
}

function EquiteCard({ entry }: { entry: EquiteEntry }) {
  const color = statusColor(entry.status);
  const label = statusLabel(entry.status);
  const barWidth = Math.min(100, Math.round((entry.equiteScore / 120) * 100));
  const bqpMarkerLeft = Math.round((BQP_THRESHOLD / 120) * 100);
  const asset = getTerritoryAsset(stemToCode(entry.stem));
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <article
      className={`equite-card${entry.bqpBreach ? ' equite-card--breach' : ''}`}
      role="listitem"
      aria-label={`${entry.label} : surcoût moyen ${entry.overcostPct > 0 ? '+' : ''}${entry.overcostPct.toFixed(1)}%`}
    >
      {/* Photo header */}
      <div className="equite-card-photo">
        {!imgFailed && (
          <img
            src={asset.url}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            onError={() => setImgFailed(true)}
            className="equite-card-photo-img"
          />
        )}
        <div className="equite-card-photo-overlay" aria-hidden="true" />
        <div className="equite-card-header">
          <span className="equite-flag" aria-hidden="true">
            {entry.flag}
          </span>
          <span className="equite-territory">{entry.label}</span>
          <span
            className="equite-status-badge"
            style={{ color, borderColor: `${color}60`, background: `${color}12` }}
          >
            {label}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="equite-card-body">
        <div className="equite-bar-container" aria-hidden="true">
          <div
            className="equite-bqp-line"
            style={{ left: `${bqpMarkerLeft}%` }}
            title={`Seuil BQP +${BQP_THRESHOLD}%`}
          />
          <div
            className="equite-bar"
            style={{ transform: `scaleX(${barWidth / 100})`, background: color }}
          />
        </div>

        <div className="equite-score-row">
          <span className="equite-score" style={{ color }}>
            {entry.overcostPct > 0 ? '+' : ''}
            {entry.overcostPct.toFixed(1)}&nbsp;%
          </span>
          <span className="equite-products">{entry.productCount} produits</span>
        </div>

        {entry.bqpBreach && (
          <div className="equite-breach-note">
            +{(entry.overcostPct - BQP_THRESHOLD).toFixed(0)}&nbsp;pts au-dessus du plafond BQP
          </div>
        )}
      </div>
    </article>
  );
}

export default function IndiceEquiteWidget() {
  const [entries, setEntries] = useState<EquiteEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [hexProductCount, setHexProductCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Fetch hexagone reference first
      const hexUrl = `${import.meta.env.BASE_URL}data/observatoire/hexagone_${SNAPSHOT_DATE}.json`;
      let hexAvgs: Record<string, number> = {};
      try {
        const resp = await fetch(hexUrl);
        if (resp.ok) {
          const snap: Snapshot = await resp.json();
          hexAvgs = buildProductAvg(snap.donnees);
        }
      } catch {
        /* skip */
      }

      if (!Object.keys(hexAvgs).length || cancelled) return;

      // Fetch all DOM territories in parallel
      const results: EquiteEntry[] = [];
      await Promise.all(
        DOM_TERRITORIES.map(async (t) => {
          const url = `${import.meta.env.BASE_URL}data/observatoire/${t.stem}_${SNAPSHOT_DATE}.json`;
          try {
            const resp = await fetch(url);
            if (!resp.ok) throw new Error('not ok');
            const snap: Snapshot = await resp.json();
            const domAvgs = buildProductAvg(snap.donnees);

            const overcosts: number[] = [];
            for (const [product, hexAvg] of Object.entries(hexAvgs)) {
              const domAvg = domAvgs[product];
              if (domAvg !== undefined) {
                overcosts.push(((domAvg - hexAvg) / hexAvg) * 100);
              }
            }

            if (overcosts.length < 3) return; // not enough data
            const meanOvercost = overcosts.reduce((a, b) => a + b, 0) / overcosts.length;
            const rounded = Math.round(meanOvercost * 10) / 10;
            const status = equiteStatus(rounded);

            results.push({
              stem: t.stem,
              flag: t.flag,
              label: t.label,
              overcostPct: rounded,
              productCount: overcosts.length,
              equiteScore: rounded,
              bqpBreach: rounded > BQP_THRESHOLD,
              status,
            });
          } catch {
            /* skip territory */
          }
        })
      );

      if (cancelled) return;

      // Sort: most critical first
      results.sort((a, b) => b.overcostPct - a.overcostPct);

      setEntries(results);
      setHexProductCount(Object.keys(hexAvgs).length);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section className="equite-section section-reveal" aria-label="Indice d'Équité Tarifaire">
        <div className="equite-header">
          <h2 className="section-title slide-up">⚖️ Indice d'Équité Tarifaire</h2>
        </div>
        <div className="equite-skeleton" aria-busy="true" />
      </section>
    );
  }

  if (!entries.length) return null;

  const criticalCount = entries.filter(
    (e) => e.status === 'critique' || e.status === 'iniquite'
  ).length;

  return (
    <section className="equite-section section-reveal" aria-labelledby="equite-heading">
      {/* Section banner image */}
      <div className="section-context-banner">
        <img
          src="https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fm=webp&fit=crop&w=900&q=60"
          alt="Balance symbolisant l'équité tarifaire — droit des consommateurs outre-mer"
          className="section-context-banner-img"
          loading="lazy"
          width="900"
          height="160"
        />
        <div className="section-context-banner-overlay" aria-hidden="true" />
        <div className="section-context-banner-caption">
          <span className="section-context-banner-title" aria-hidden="true">
            ⚖️ Indice d'Équité Tarifaire
          </span>
          <span className="section-context-banner-badge">Décret BQP n°2012-848</span>
        </div>
      </div>
      <h2 id="equite-heading" className="section-title slide-up">
        ⚖️ Indice d'Équité Tarifaire
      </h2>

      <div className="equite-header">
        <p className="equite-subtitle slide-up">
          Surcoût moyen de la vie vs l'Hexagone — <strong>{hexProductCount} produits</strong>{' '}
          comparés par territoire
        </p>
        <div className="equite-bqp-legend fade-in">
          <span className="equite-bqp-marker" aria-hidden="true" />
          <span>
            Seuil BQP légal&nbsp;: <strong>+{BQP_THRESHOLD}&nbsp;%</strong> (Bouclier Qualité Prix —
            décret Lutte contre la vie chère)
          </span>
        </div>
      </div>

      {criticalCount > 0 && (
        <div className="equite-alert fade-in" role="alert">
          <span aria-hidden="true">🚨</span>
          <span>
            <strong>
              {criticalCount} territoire{criticalCount > 1 ? 's' : ''}
            </strong>{' '}
            dépassent fortement le seuil BQP réglementaire (+{BQP_THRESHOLD}&nbsp;%).
          </span>
        </div>
      )}

      <div className="equite-grid" role="list">
        {entries.map((entry) => (
          <EquiteCard key={entry.stem} entry={entry} />
        ))}
      </div>

      <p className="equite-source">
        Sources : Observatoire citoyen A KI PRI SA YÉ (mars 2026) — BQP : décret n°2012-848 — Calcul
        : surcoût moyen multi-produits vs Hexagone
      </p>

      {/* BQP legal context */}
      <div className="equite-legal-context fade-in">
        <span className="equite-legal-icon" aria-hidden="true">
          📋
        </span>
        <p className="equite-legal-text">
          Le <strong>Bouclier Qualité Prix (BQP)</strong> est un dispositif légal instauré par le{' '}
          <strong>décret n°2012-848</strong> dans le cadre de la loi de lutte contre la vie chère en
          outre-mer. Il impose un plafond de <strong>+30 %</strong> de surcoût vs métropole sur une
          liste de produits de première nécessité négociée annuellement avec la grande distribution.
          Tout dépassement constitue une inégalité tarifaire documentée sur laquelle les préfets
          peuvent intervenir. À ce jour, plusieurs territoires dépassent ce seuil pour la majorité
          des produits du panier de base.
        </p>
      </div>
    </section>
  );
}
