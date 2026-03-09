/**
 * PanierVitalWidget — "Combien de minutes de SMIC pour votre panier ?"
 *
 * Computes, from live observatoire data, how many minutes of minimum wage
 * (SMIC net) are needed to purchase a basic 6-item basket in each territory
 * vs metropolitan France.
 *
 * Methodology:
 *   - SMIC mensuel net France = 1 383 € (INSEE 2025)
 *   - Heures légales mensuel = 35h × 52 semaines / 12 = 151,67h
 *   - Taux horaire SMIC net ≈ 9,12 €/h → 0,152 €/min
 *   - Panier vital (6 produits) : Lait 1L, Riz 1kg, Eau 1,5L,
 *     Pâtes 500g, Sucre 1kg, Huile tournesol 1L
 *   - Prix moyen calculé depuis les snapshots observatoire 2026-03
 *
 * Sources : INSEE SMIC 2025, IEDOM Rapport annuel 2023,
 *           Observatoire citoyen A KI PRI SA YÉ 2026-03
 */

import { useEffect, useState } from 'react';
import { TERRITORIES as TERRITORY_META } from '../../services/territoryNormalizationService';
import { TERRITORIES as TERRITORY_DEFS } from '../../constants/territories';
import type { TerritoryCode } from '../../constants/territories';
import { getTerritoryAsset } from '../../config/imageAssets';

interface BasketEntry {
  territory: string;
  flag: string;
  code: TerritoryCode;
  basketPrice: number;      // €
  minutesOfWork: number;    // at SMIC net hourly rate
  vsHexagone: number;       // extra minutes vs hexagone baseline
  deltaPercent: number;     // % more expensive than hexagone (unrounded for threshold logic)
  highlight?: boolean;      // highlight most expensive
}

// SMIC net hourly rate (INSEE 2025): 1383€ / 151.67h = 9.12€/h
const SMIC_HOURLY_NET = 9.12; // €/h
const SMIC_PER_MINUTE = SMIC_HOURLY_NET / 60; // €/min ≈ 0.152

// TerritoryCode for metropolitan France reference (canonical)
const HEX_CODE: TerritoryCode = 'fr';

// Basket products (EAN match keys)
const BASKET_PRODUCTS = [
  'Lait demi-écrémé UHT 1L',
  'Riz long blanc 1kg',
  'Eau minérale 1.5L',
  'Pâtes spaghetti 500g',
  'Sucre blanc 1kg',
  'Huile de tournesol 1L',
];

// Codes to display — derived from canonical TERRITORY_META (has dataFileStem)
// and cross-referenced with TERRITORY_DEFS for proper country flag emojis.
const PANIER_TERRITORY_CODES: TerritoryCode[] = ['fr', 'gp', 'mq', 'gf', 're', 'yt'];

interface PanierTerritory {
  code: TerritoryCode;
  label: string;
  flag: string;
  stem: string; // observatoire JSON filename stem (from TERRITORY_META.dataFileStem)
}

const PANIER_TERRITORIES: PanierTerritory[] = PANIER_TERRITORY_CODES.flatMap((code) => {
  const meta = TERRITORY_META.find((t) => t.code === code);
  const def = TERRITORY_DEFS[code];
  if (!meta || !def) return [];
  return [{ code, label: meta.labelFull, flag: def.flag, stem: meta.dataFileStem }];
});

const SNAPSHOT_DATE = '2026-03';

interface ObsEntry {
  produit: string;
  prix: number;
}
interface Snapshot {
  territoire: string;
  donnees: ObsEntry[];
}

function avgPrice(donnees: ObsEntry[], product: string): number | null {
  const matches = donnees.filter((d) => d.produit === product);
  if (!matches.length) return null;
  return matches.reduce((s, d) => s + d.prix, 0) / matches.length;
}

function computeBasket(donnees: ObsEntry[]): number | null {
  let total = 0;
  let found = 0;
  for (const p of BASKET_PRODUCTS) {
    const avg = avgPrice(donnees, p);
    if (avg !== null) {
      total += avg;
      found++;
    }
  }
  // Require at least 5 out of 6 products
  if (found < 5) return null;
  // Estimate missing product from ratio
  if (found < 6) {
    total = (total / found) * 6;
  }
  return Math.round(total * 100) / 100;
}

function PanierVitalCard({ entry, isHex, barWidth }: {
  entry: BasketEntry;
  isHex: boolean;
  barWidth: number;
}) {
  const asset = getTerritoryAsset(entry.code);
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <article
      className={`panier-vital-card${isHex ? ' panier-vital-card--reference' : ''}${entry.highlight ? ' panier-vital-card--alert' : ''}`}
      role="listitem"
      aria-label={`${entry.territory} : ${entry.minutesOfWork} minutes`}
    >
      {/* Photo header */}
      <div className="pvc-photo">
        {!imgFailed && (
          <img
            src={asset.url}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            onError={() => setImgFailed(true)}
            className="pvc-photo-img"
          />
        )}
        <div className="pvc-photo-overlay" aria-hidden="true" />
        <div className="pvc-header">
          <span className="pvc-flag" aria-hidden="true">{entry.flag}</span>
          <span className="pvc-territory">{entry.territory}</span>
          {isHex && <span className="pvc-badge pvc-badge--ref">Référence</span>}
          {entry.highlight && <span className="pvc-badge pvc-badge--alert">Le + cher</span>}
        </div>
      </div>

      {/* Card body */}
      <div className="pvc-body">
        <div className="pvc-price">
          <span className="pvc-price-value">{entry.basketPrice.toFixed(2)}&nbsp;€</span>
          <span className="pvc-price-label">le panier</span>
        </div>

        <div className="pvc-bar-wrapper" aria-hidden="true">
          <div
            className={`pvc-bar${isHex ? ' pvc-bar--reference' : ''}${entry.highlight ? ' pvc-bar--alert' : ''}`}
            style={{ width: `${barWidth}%` }}
          />
        </div>

        <div className="pvc-minutes">
          <span className="pvc-minutes-value">{entry.minutesOfWork}</span>
          <span className="pvc-minutes-label">min de SMIC</span>
        </div>

        {!isHex && entry.vsHexagone > 0 && (
          <div className="pvc-extra">
            +{entry.vsHexagone}&nbsp;min de travail supplémentaires
            {entry.deltaPercent > 30 && (
              <span className="pvc-bqp-alert" title="Dépasse le plafond BQP +30%">
                ⚠️ dépasse BQP
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export default function PanierVitalWidget() {
  const [entries, setEntries] = useState<BasketEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const results: BasketEntry[] = [];
      let hexBasket: number | null = null;

      for (const t of PANIER_TERRITORIES) {
        try {
          const url = `${import.meta.env.BASE_URL}data/observatoire/${t.stem}_${SNAPSHOT_DATE}.json`;
          const resp = await fetch(url);
          if (!resp.ok) continue;
          const snap: Snapshot = await resp.json();
          const basket = computeBasket(snap.donnees);
          if (basket === null) continue;

          if (t.code === HEX_CODE) {
            hexBasket = basket;
          }

          results.push({
            territory: t.label,
            flag: t.flag,
            code: t.code,
            basketPrice: basket,
            minutesOfWork: Math.round(basket / SMIC_PER_MINUTE),
            vsHexagone: 0,
            deltaPercent: 0,
          });
        } catch {
          // skip territory on fetch error
        }
      }

      if (hexBasket !== null) {
        const hexMins = Math.round(hexBasket / SMIC_PER_MINUTE);
        for (const e of results) {
          e.vsHexagone = e.minutesOfWork - hexMins;
          // Keep unrounded so BQP threshold check (> 30) is not skewed by rounding
          e.deltaPercent = ((e.basketPrice - hexBasket) / hexBasket) * 100;
        }
      }

      // Sort: hexagone first, then by price ascending
      results.sort((a, b) => {
        if (a.code === HEX_CODE) return -1;
        if (b.code === HEX_CODE) return 1;
        return a.basketPrice - b.basketPrice;
      });

      // Flag the most expensive
      const dom = results.filter((e) => e.code !== HEX_CODE);
      if (dom.length) {
        const max = Math.max(...dom.map((e) => e.basketPrice));
        for (const e of results) {
          if (e.basketPrice === max) e.highlight = true;
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
      <section className="panier-vital-section section-reveal" aria-labelledby="panier-vital-heading">
        <div className="panier-vital-header">
          <h2 id="panier-vital-heading" className="section-title slide-up">
            ⏱️ Indice panier vital
          </h2>
        </div>
        <div className="panier-vital-skeleton" aria-busy="true" />
      </section>
    );
  }

  if (!entries.length) return null;

  const hexEntry = entries.find((e) => e.code === HEX_CODE);

  return (
    <section className="panier-vital-section section-reveal" aria-labelledby="panier-vital-heading">
      <div className="panier-vital-header">
        <h2 id="panier-vital-heading" className="section-title slide-up">
          ⏱️ Indice panier vital
        </h2>
        <p className="panier-vital-subtitle slide-up">
          Combien de <strong>minutes de SMIC net</strong> pour remplir un panier de 6 produits essentiels (lait, riz, eau, pâtes, sucre, huile)&nbsp;?
        </p>
        <p className="panier-vital-detail fade-in">
          Un indicateur citoyen d'accès à l'alimentation — plus il est élevé, plus la vie est chère vs les revenus locaux
        </p>
        {hexEntry && (
          <p className="panier-vital-ref fade-in">
            Référence Hexagone&nbsp;: <strong>{hexEntry.basketPrice.toFixed(2)}&nbsp;€</strong>
            &nbsp;→&nbsp;<strong>{hexEntry.minutesOfWork}&nbsp;min</strong> de travail au SMIC net
          </p>
        )}
      </div>

      <div className="panier-vital-grid" role="list">
        {entries.map((entry) => {
          const isHex = entry.code === HEX_CODE;
          const barWidth = hexEntry
            ? Math.min(100, Math.round((entry.minutesOfWork / (hexEntry.minutesOfWork * 1.8)) * 100))
            : 50;
          return (
            <PanierVitalCard key={entry.code} entry={entry} isHex={isHex} barWidth={barWidth} />
          );
        })}
      </div>

      <p className="panier-vital-source">
        Sources&nbsp;: Observatoire citoyen A KI PRI SA YÉ (mars 2026) — SMIC net&nbsp;1&nbsp;383&nbsp;€/mois
        (INSEE 2025) — Panier&nbsp;: lait, riz, eau, pâtes, sucre, huile
      </p>
    </section>
  );
}
