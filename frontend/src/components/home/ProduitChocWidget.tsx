/**
 * ProduitChocWidget — "Chocs de Prix : les 5 écarts les plus scandaleux"
 *
 * Calcule en temps réel, depuis les snapshots observatoire du mois courant,
 * les 5 produits affichant les plus grands écarts de prix entre territoires.
 *
 * Méthodologie :
 *   Pour chaque produit présent dans ≥ 3 territoires DOM+Hexagone :
 *     choc_ratio = (prix_max − prix_min) / prix_min × 100
 *   Classement décroissant → top 5
 *
 * Innovation : premier outil public à exposer un palmarès en temps réel
 * des inégalités tarifaires produit-par-produit entre territoires français.
 *
 * Sources : Observatoire citoyen A KI PRI SA YÉ — Snapshots mars 2026
 */

import { useEffect, useState } from 'react';

interface ChocEntry {
  rank: number;
  product: string;
  icon: string;
  category: string;
  minPrice: number;
  maxPrice: number;
  minTerritory: string;
  maxTerritory: string;
  minFlag: string;
  maxFlag: string;
  chocRatio: number;   // (max - min) / min × 100
  vsHex: number | null; // (max - hex) / hex × 100, null if hex not available
}

interface ObsEntry {
  produit: string;
  categorie: string;
  prix: number;
}
interface Snapshot {
  donnees: ObsEntry[];
}

const SNAPSHOT_DATE = '2026-03';

const TERRITORIES = [
  { stem: 'hexagone',                   flag: '🇫🇷', label: 'Hexagone' },
  { stem: 'guadeloupe',                 flag: '🇬🇵', label: 'Guadeloupe' },
  { stem: 'martinique',                 flag: '🇲🇶', label: 'Martinique' },
  { stem: 'guyane',                     flag: '🇬🇫', label: 'Guyane' },
  { stem: 'la_réunion',                 flag: '🇷🇪', label: 'La Réunion' },
  { stem: 'mayotte',                    flag: '🇾🇹', label: 'Mayotte' },
  { stem: 'saint_barthelemy',           flag: '🇧🇱', label: 'St-Barthélemy' },
  { stem: 'saint_martin',               flag: '🇲🇫', label: 'Saint-Martin' },
  { stem: 'saint_pierre_et_miquelon',   flag: '🇵🇲', label: 'St-Pierre-et-Miq.' },
];

const PRODUCT_ICONS: Record<string, string> = {
  'Lait demi-écrémé UHT 1L': '🥛',
  'Riz long blanc 1kg': '🍚',
  'Eau minérale 1.5L': '💧',
  'Pâtes spaghetti 500g': '🍝',
  'Sucre blanc 1kg': '🍬',
  'Huile de tournesol 1L': '🫙',
  'Tomates rondes 1kg': '🍅',
  'Poulet entier 1kg': '🍗',
  'Yaourt nature 4x125g': '🥛',
  'Lessive liquide 1.5L': '🧺',
  'Liquide vaisselle 500ml': '🧴',
  'Gel douche 250ml': '🚿',
  'Crème hydratante visage 50ml': '💆',
  'Paracétamol 500mg x16': '💊',
  'Café moulu 250g': '☕',
};

const PRODUCT_CONTEXT: Record<string, string> = {
  'Eau minérale 1.5L': 'Produit 100 % importé. Transport et stockage réfrigéré pèsent fortement sur le coût final. À Saint-Barthélemy, l\'eau provient quasi exclusivement de conteneurs maritimes.',
  'Pâtes spaghetti 500g': 'Malgré un prix d\'achat identique en entrepôt, les marges de distribution et l\'octroi de mer (≈15 %) expliquent l\'écart. Produit classique du panier de base.',
  'Tomates rondes 1kg': 'Fruits et légumes frais soumis aux aléas du fret et aux ruptures de chaîne du froid. Absence de production locale suffisante dans plusieurs territoires.',
  'Huile de tournesol 1L': 'Produit de grande consommation importé d\'Europe. L\'octroi de mer et les marges intermédiaires doublent quasi le prix dans les territoires les plus éloignés.',
  'Liquide vaisselle 500ml': 'Produit d\'entretien dont le coût de transport (volume/poids) est amplifié. Les monopoles d\'import de produits ménagers maintiennent des marges élevées.',
  'Lait demi-écrémé UHT 1L': 'Produit laitier quasi exclusivement importé. Les BQP négociés couvrent le lait mais n\'empêchent pas des surcoûts significatifs hors liste négociée.',
  'Riz long blanc 1kg': 'Aliment de base dont le prix suit les cours mondiaux, mais auquel s\'ajoutent fret, manutention portuaire et marge de distribution locale.',
  'Sucre blanc 1kg': 'Paradoxalement cher malgré la production locale de canne à sucre (Martinique, Réunion). La transformation et l\'export-reimport valorisent le produit loin du consommateur.',
  'Café moulu 250g': 'Importé majoritairement de métropole ou d\'Amérique du Sud. Double traversée maritime pour certains territoires = coûts cumulés.',
  'Paracétamol 500mg x16': 'Médicament de base soumis aux circuits de distribution pharmaceutique insulaires. Prix réglementé en métropole mais plus variable outre-mer.',
};

function chocColor(ratio: number): string {
  if (ratio >= 150) return '#ef4444';
  if (ratio >= 100) return '#f97316';
  if (ratio >= 60)  return '#f59e0b';
  return '#22c55e';
}

function chocLabel(ratio: number): string {
  if (ratio >= 150) return '🚨 EXTRÊME';
  if (ratio >= 100) return '⚠️ CRITIQUE';
  if (ratio >= 60)  return '⛔ ÉLEVÉ';
  return '📊 MODÉRÉ';
}

export default function ProduitChocWidget() {
  const [entries, setEntries] = useState<ChocEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Step 1: Fetch all snapshots in parallel
      const snapshotMap: Record<string, Snapshot | null> = {};
      await Promise.all(
        TERRITORIES.map(async (t) => {
          const url = `${import.meta.env.BASE_URL}data/observatoire/${t.stem}_${SNAPSHOT_DATE}.json`;
          try {
            const resp = await fetch(url);
            if (!resp.ok) throw new Error('not ok');
            snapshotMap[t.stem] = await resp.json() as Snapshot;
          } catch {
            snapshotMap[t.stem] = null;
          }
        }),
      );

      if (cancelled) return;

      // Step 2: Build per-product, per-territory avg price map
      type AvgMap = Record<string, { total: number; count: number; category: string }>;
      const productTerritory: Record<string, AvgMap> = {};

      for (const t of TERRITORIES) {
        const snap = snapshotMap[t.stem];
        if (!snap) continue;
        for (const e of snap.donnees) {
          if (!productTerritory[e.produit]) productTerritory[e.produit] = {};
          if (!productTerritory[e.produit][t.stem]) {
            productTerritory[e.produit][t.stem] = { total: 0, count: 0, category: e.categorie };
          }
          productTerritory[e.produit][t.stem].total += e.prix;
          productTerritory[e.produit][t.stem].count++;
        }
      }

      // Step 3: Compute choc ratio per product
      const chocs: ChocEntry[] = [];
      for (const [product, terrMap] of Object.entries(productTerritory)) {
        const availableStems = Object.keys(terrMap);
        if (availableStems.length < 3) continue; // need at least 3 territories

        const avgs: Record<string, number> = {};
        let category = '';
        for (const [stem, agg] of Object.entries(terrMap)) {
          avgs[stem] = agg.total / agg.count;
          category = agg.category;
        }

        const values = Object.entries(avgs);
        let minStem = values[0][0];
        let maxStem = values[0][0];
        for (const [stem, avg] of values) {
          if (avg < avgs[minStem]) minStem = stem;
          if (avg > avgs[maxStem]) maxStem = stem;
        }

        const minPrice = avgs[minStem];
        const maxPrice = avgs[maxStem];
        if (minStem === maxStem) continue;

        const chocRatio = ((maxPrice - minPrice) / minPrice) * 100;

        const hexAvg = avgs['hexagone'] ?? null;
        const vsHex = hexAvg !== null ? ((maxPrice - hexAvg) / hexAvg) * 100 : null;

        const minTerrEntry = TERRITORIES.find((t) => t.stem === minStem)!;
        const maxTerrEntry = TERRITORIES.find((t) => t.stem === maxStem)!;

        chocs.push({
          rank: 0,
          product,
          icon: PRODUCT_ICONS[product] ?? '🛒',
          category,
          minPrice: Math.round(minPrice * 100) / 100,
          maxPrice: Math.round(maxPrice * 100) / 100,
          minTerritory: minTerrEntry?.label ?? minStem,
          maxTerritory: maxTerrEntry?.label ?? maxStem,
          minFlag: minTerrEntry?.flag ?? '🏳',
          maxFlag: maxTerrEntry?.flag ?? '🏳',
          chocRatio: Math.round(chocRatio * 10) / 10,
          vsHex: vsHex !== null ? Math.round(vsHex * 10) / 10 : null,
        });
      }

      // Step 4: Sort by chocRatio desc, take top 5, assign ranks
      chocs.sort((a, b) => b.chocRatio - a.chocRatio);
      const top5 = chocs.slice(0, 5).map((e, i) => ({ ...e, rank: i + 1 }));

      if (!cancelled) {
        setEntries(top5);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <section className="choc-section section-reveal" aria-labelledby="choc-heading">
        <div className="choc-header">
          <h2 id="choc-heading" className="section-title slide-up">🔥 Chocs de Prix DOM</h2>
        </div>
        <div className="choc-skeleton" aria-busy="true" />
      </section>
    );
  }

  if (!entries.length) return null;

  return (
    <section className="choc-section section-reveal" aria-labelledby="choc-heading">
      {/* Section banner image */}
      <div className="section-context-banner">
        <img
          src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fm=webp&fit=crop&w=900&q=75"
          alt="Étiquettes de prix dans un supermarché — écarts de prix DOM vs métropole"
          className="section-context-banner-img"
          loading="lazy"
          width="900"
          height="160"
        />
        <div className="section-context-banner-overlay" aria-hidden="true" />
        <div className="section-context-banner-caption">
          <span className="section-context-banner-title" aria-hidden="true">🔥 Chocs de Prix DOM</span>
          <span className="section-context-banner-badge">Temps réel — mars 2026</span>
        </div>
      </div>
      <h2 id="choc-heading" className="section-title slide-up" style={{ textAlign: 'center', marginBottom: '0.5rem' }}>🔥 Chocs de Prix DOM</h2>

      <div className="choc-header">
        <p className="choc-subtitle slide-up">
          Les <strong>5 produits</strong> avec les plus grands écarts de prix entre territoires
          — calculés en temps réel depuis les relevés citoyens
        </p>
      </div>

      <ol className="choc-list" aria-label="Palmarès chocs de prix">
        {entries.map((entry) => {
          const color = chocColor(entry.chocRatio);
          const label = chocLabel(entry.chocRatio);
          const barWidth = Math.min(100, (entry.chocRatio / 220) * 100);

          return (
            <li
              key={entry.product}
              className="choc-card fade-in"
              aria-label={`${entry.product} : écart de ${entry.chocRatio.toFixed(0)} %`}
            >
              <div className="choc-rank" style={{ color }} aria-hidden="true">
                #{entry.rank}
              </div>

              <div className="choc-content">
                <div className="choc-product-row">
                  <span className="choc-icon" aria-hidden="true">{entry.icon}</span>
                  <span className="choc-product-name">{entry.product}</span>
                  <span className="choc-severity-badge" style={{ color, borderColor: color }}>
                    {label}
                  </span>
                </div>

                <div className="choc-bar-wrap" aria-hidden="true">
                  <div
                    className="choc-bar"
                    style={{ width: `${barWidth}%`, background: color }}
                  />
                </div>

                <div className="choc-compare-row">
                  <div className="choc-cheapest">
                    <span className="choc-flag" aria-hidden="true">{entry.minFlag}</span>
                    <span className="choc-territory-name">{entry.minTerritory}</span>
                    <span className="choc-price choc-price--low">{entry.minPrice.toFixed(2)}&nbsp;€</span>
                  </div>

                  <div className="choc-ratio-pill" style={{ background: `${color}18`, color }}>
                    ×{(entry.maxPrice / entry.minPrice).toFixed(1)}
                  </div>

                  <div className="choc-most-expensive">
                    <span className="choc-price choc-price--high">{entry.maxPrice.toFixed(2)}&nbsp;€</span>
                    <span className="choc-territory-name">{entry.maxTerritory}</span>
                    <span className="choc-flag" aria-hidden="true">{entry.maxFlag}</span>
                  </div>
                </div>

                {entry.vsHex !== null && entry.vsHex > 0 && (
                  <div className="choc-vs-hex">
                    +{entry.vsHex.toFixed(0)}&nbsp;% vs Hexagone dans le territoire le + cher
                  </div>
                )}

                {PRODUCT_CONTEXT[entry.product] && (
                  <p className="choc-product-context">
                    💬 {PRODUCT_CONTEXT[entry.product]}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <p className="choc-source">
        Sources : Observatoire citoyen A KI PRI SA YÉ — Snapshots mars 2026 — 9 territoires comparés
      </p>
    </section>
  );
}
