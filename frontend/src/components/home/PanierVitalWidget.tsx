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

interface BasketEntry {
  territory: string;
  flag: string;
  code: string;
  basketPrice: number;      // €
  minutesOfWork: number;    // at SMIC net hourly rate
  vsHexagone: number;       // extra minutes vs hexagone baseline
  deltaPercent: number;     // % more expensive than hexagone
  highlight?: boolean;      // highlight most expensive
}

// SMIC net hourly rate (INSEE 2025): 1383€ / 151.67h = 9.12€/h
const SMIC_HOURLY_NET = 9.12; // €/h
const SMIC_PER_MINUTE = SMIC_HOURLY_NET / 60; // €/min ≈ 0.152

// Basket products (EAN match keys)
const BASKET_PRODUCTS = [
  'Lait demi-écrémé UHT 1L',
  'Riz long blanc 1kg',
  'Eau minérale 1.5L',
  'Pâtes spaghetti 500g',
  'Sucre blanc 1kg',
  'Huile de tournesol 1L',
];

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

const TERRITORIES = [
  { code: 'hexagone', label: 'Hexagone', flag: '🇫🇷', stem: 'hexagone' },
  { code: 'GP', label: 'Guadeloupe', flag: '🇬🇵', stem: 'guadeloupe' },
  { code: 'MQ', label: 'Martinique', flag: '🇲🇶', stem: 'martinique' },
  { code: 'GF', label: 'Guyane', flag: '🇬🇫', stem: 'guyane' },
  { code: 'RE', label: 'La Réunion', flag: '🇷🇪', stem: 'la_r\u00e9union' },
  { code: 'YT', label: 'Mayotte', flag: '🇾🇹', stem: 'mayotte' },
];

const SNAPSHOT_DATE = '2026-03';

export default function PanierVitalWidget() {
  const [entries, setEntries] = useState<BasketEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [hexMinutes, setHexMinutes] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const results: BasketEntry[] = [];
      let hexBasket: number | null = null;

      for (const t of TERRITORIES) {
        try {
          const url = `${import.meta.env.BASE_URL}data/observatoire/${t.stem}_${SNAPSHOT_DATE}.json`;
          const resp = await fetch(url);
          if (!resp.ok) continue;
          const snap: Snapshot = await resp.json();
          const basket = computeBasket(snap.donnees);
          if (basket === null) continue;

          if (t.code === 'hexagone') {
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
          e.deltaPercent = Math.round(((e.basketPrice - hexBasket) / hexBasket) * 100);
        }
        if (!cancelled) setHexMinutes(hexMins);
      }

      // Sort: hexagone first, then by price ascending
      results.sort((a, b) => {
        if (a.code === 'hexagone') return -1;
        if (b.code === 'hexagone') return 1;
        return a.basketPrice - b.basketPrice;
      });

      // Flag the most expensive
      const dom = results.filter((e) => e.code !== 'hexagone');
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

  const hexEntry = entries.find((e) => e.code === 'hexagone');

  return (
    <section className="panier-vital-section section-reveal" aria-labelledby="panier-vital-heading">
      <div className="panier-vital-header">
        <h2 id="panier-vital-heading" className="section-title slide-up">
          ⏱️ Indice panier vital
        </h2>
        <p className="panier-vital-subtitle slide-up">
          Combien de <strong>minutes de SMIC</strong> pour remplir un panier de 6 produits essentiels&nbsp;?
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
          const isHex = entry.code === 'hexagone';
          const barWidth = hexEntry
            ? Math.min(100, Math.round((entry.minutesOfWork / (hexEntry.minutesOfWork * 1.8)) * 100))
            : 50;

          return (
            <article
              key={entry.code}
              className={`panier-vital-card${isHex ? ' panier-vital-card--reference' : ''}${entry.highlight ? ' panier-vital-card--alert' : ''}`}
              role="listitem"
              aria-label={`${entry.territory} : ${entry.minutesOfWork} minutes`}
            >
              <div className="pvc-header">
                <span className="pvc-flag" aria-hidden="true">{entry.flag}</span>
                <span className="pvc-territory">{entry.territory}</span>
                {isHex && <span className="pvc-badge pvc-badge--ref">Référence</span>}
                {entry.highlight && <span className="pvc-badge pvc-badge--alert">Le + cher</span>}
              </div>

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
                <span className="pvc-minutes-label">min</span>
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
            </article>
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
