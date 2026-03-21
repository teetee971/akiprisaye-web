/**
 * TopDealsDuJourPage.tsx — /top-deals-du-jour
 *
 * SEO growth page: score-sorted top deals, dominant product hero,
 * per-product CTA with tracking, mobile-first.
 *
 * Data: reads /data/output/top-deals.json (pipeline artifact) with a
 * graceful empty-state fallback when the file isn't yet generated.
 */
import React, { useEffect, useState } from 'react';
import { SEOHead } from '../components/ui/SEOHead';
import { PrimaryConversionBlock } from '../components/conversion/PrimaryConversionBlock';
import { DominantProductCard } from '../components/conversion/DominantProductCard';
import { AlertOptInPop } from '../components/conversion/AlertOptInPop';
import { sortByScore, type ConversionProduct } from '../engine/conversionEngine';
import { logEvent } from '../engine/analytics';

// ── Top-deal shape from export-top-deals.mjs ─────────────────────────────────
interface RawDeal {
  name: string;
  slug?: string;
  bestPrice?: number;
  delta?: number;
  bestRetailer?: string;
  score?: number;
  territory?: string;
  boost?: boolean;
}

function adaptDeal(d: RawDeal, idx: number): ConversionProduct {
  return {
    id:         d.slug ?? `deal-${idx}`,
    name:       d.name,
    price:      d.bestPrice,
    score:      d.score,
    priceDrop:  d.delta,
    trending:   d.boost,
    retailer:   d.bestRetailer,
    territory:  d.territory,
    url:        undefined,  // populated by retailerLinks via DominantProductCard
    category:   undefined,
  };
}

// ── Placeholder deals (shown when pipeline hasn't run yet) ────────────────────
const PLACEHOLDER_DEALS: ConversionProduct[] = [
  { id: 'huile-1l',   name: 'Huile de tournesol 1L',  price: 4.50, score: 95, priceDrop: 0.35, trending: true,  retailer: 'Carrefour' },
  { id: 'riz-1kg',    name: 'Riz long grain 1 kg',    price: 2.48, score: 88, priceDrop: 0.15, trending: false, retailer: 'E.Leclerc' },
  { id: 'lait-1l',    name: 'Lait demi-écrémé 1L',    price: 1.32, score: 82, priceDrop: 0.12, trending: true,  retailer: 'Super U'   },
  { id: 'pates-500g', name: 'Pâtes spaghetti 500g',   price: 1.15, score: 76, priceDrop: 0.08, trending: false, retailer: 'Leader Price' },
  { id: 'cafe-250g',  name: 'Café moulu 250g',        price: 3.20, score: 71, priceDrop: 0.22, trending: true,  retailer: 'Casino'    },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export function TopDealsDuJourPage() {
  const [products, setProducts] = useState<ConversionProduct[]>([]);
  const [loaded, setLoaded]     = useState(false);

  useEffect(() => {
    logEvent('view_page', { page: 'top-deals-du-jour' });

    fetch('/data/output/top-deals.json')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((raw: RawDeal[]) => {
        const adapted = Array.isArray(raw)
          ? raw.slice(0, 20).map(adaptDeal)
          : PLACEHOLDER_DEALS;
        setProducts(sortByScore(adapted));
      })
      .catch(() => setProducts(sortByScore(PLACEHOLDER_DEALS)))
      .finally(() => setLoaded(true));
  }, []);

  const sorted = sortByScore(products.length > 0 ? products : PLACEHOLDER_DEALS);

  return (
    <>
      <SEOHead
        title="Top deals du jour — Meilleurs prix Guadeloupe, Martinique, DOM-COM"
        description="Comparez les meilleurs prix du jour dans les supermarchés des DOM-COM. Huile, riz, lait, pâtes — économisez sur vos courses dès maintenant."
        canonical="/top-deals-du-jour"
      />

      <AlertOptInPop />

      <main className="min-h-screen bg-gray-950 text-white px-4 py-6 max-w-2xl mx-auto">

        {/* Hero H1 + dominant product */}
        <div className="mb-6">
          <PrimaryConversionBlock products={loaded ? sorted : PLACEHOLDER_DEALS} />
        </div>

        {/* Rest of deals list */}
        <section aria-label="Autres bons plans">
          <h2 className="text-base font-semibold text-gray-300 mb-3">
            📋 Tous les bons plans du jour
          </h2>
          <div className="space-y-3">
            {sorted.slice(1, 8).map((p) => (
              <DominantProductCard key={p.id} product={p} hero={false} />
            ))}
          </div>
        </section>

        {/* SEO content */}
        <section className="mt-8 text-sm text-gray-500 space-y-2 border-t border-gray-800 pt-4">
          <h2 className="text-base font-medium text-gray-400">
            Comparateur de prix alimentaires — DOM-COM
          </h2>
          <p>
            A Ki Pri Sa Yé compare quotidiennement les prix dans les enseignes de Guadeloupe,
            Martinique, Guyane, La Réunion et Mayotte. Chaque produit est scoré selon la
            baisse de prix, la popularité et la disponibilité locale.
          </p>
          <p>
            Les données sont mises à jour automatiquement. Aucun compte requis.
          </p>
        </section>

        <p className="text-xs text-gray-700 text-center mt-6">
          Données locales · RGPD conforme · Mise à jour quotidienne
        </p>
      </main>
    </>
  );
}

export default TopDealsDuJourPage;
