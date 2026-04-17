/**
 * TopDealsDuJourPage.tsx — /top-deals-du-jour
 *
 * SEO growth page: score-sorted top deals, dominant product hero,
 * per-product CTA with tracking, mobile-first.
 *
 * Data priority:
 *   1. /data/output/top-deals.json  — pipeline artifact (updated daily by CI)
 *   2. generated-alerts.json        — committed seed data (always available)
 */
import React, { useEffect, useMemo, useState } from 'react';
import { SEOHead } from '../components/ui/SEOHead';
import { PrimaryConversionBlock } from '../components/conversion/PrimaryConversionBlock';
import { DominantProductCard } from '../components/conversion/DominantProductCard';
import { AlertOptInPop } from '../components/conversion/AlertOptInPop';
import AlertesPrixBanner from '../components/business/AlertesPrixBanner';
import { sortByScore, type ConversionProduct } from '../engine/conversionEngine';
import { logEvent } from '../engine/analytics';
import alertsData from '../data/alerts/generated-alerts.json';

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
    id: d.slug ?? `deal-${idx}`,
    name: d.name,
    price: d.bestPrice,
    score: d.score,
    priceDrop: d.bestPrice && d.delta ? d.delta / (d.bestPrice + d.delta) : undefined,
    trending: d.boost ?? (d.delta != null && d.delta > 0.5),
    retailer: d.bestRetailer,
    territory: d.territory,
    url: d.slug ? `/produit/${d.slug}` : '/comparateur',
    category: undefined,
  };
}

// ── Seed deals from committed generated-alerts.json ───────────────────────────
function seedDealsFromAlerts(): ConversionProduct[] {
  const raw = (alertsData as { alerts?: unknown[] }).alerts ?? [];
  return raw.map((a: unknown, idx: number) => {
    const alert = a as Record<string, unknown>;
    const bestPrice = Number(alert.bestPrice ?? alert.price ?? 0);
    const delta = Number(alert.delta ?? alert.spread ?? 0);
    return {
      id: String(alert.slug ?? alert.id ?? `seed-${idx}`),
      name: String(alert.productName ?? alert.product ?? ''),
      price: bestPrice,
      score: Number(alert.alertScore ?? alert.score ?? 50),
      priceDrop: bestPrice && delta ? delta / (bestPrice + delta) : undefined,
      trending: delta > 0.5,
      retailer: String(alert.bestRetailer ?? alert.enseigne ?? ''),
      territory: String(alert.territory ?? 'gp'),
      url: alert.slug ? `/produit/${String(alert.slug)}` : '/comparateur',
    };
  });
}

const SEED_DEALS = sortByScore(seedDealsFromAlerts());

// ── Page ──────────────────────────────────────────────────────────────────────

export function TopDealsDuJourPage() {
  const [products, setProducts] = useState<ConversionProduct[]>(SEED_DEALS);

  useEffect(() => {
    logEvent('view_page', { page: 'top-deals-du-jour' });

    // Try to upgrade to fresh pipeline data (optional — seed covers the fallback)
    fetch('/data/output/top-deals.json')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((raw: RawDeal[]) => {
        if (Array.isArray(raw) && raw.length > 0) {
          setProducts(sortByScore(raw.slice(0, 20).map(adaptDeal)));
        }
      })
      .catch(() => {
        /* keep seed data */
      })
      .finally(() => {
        /* pipeline upgrade complete */
      });
  }, []);

  const sorted = useMemo(() => sortByScore(products), [products]);

  return (
    <>
      <SEOHead
        title="Top deals du jour — Meilleurs prix Guadeloupe, Martinique, DOM-COM"
        description="Comparez les meilleurs prix du jour dans les supermarchés des DOM-COM. Huile, riz, lait, pâtes — économisez sur vos courses dès maintenant."
        canonical="/top-deals-du-jour"
      />

      <AlertOptInPop />

      <main className="min-h-screen bg-gray-950 text-white px-4 py-6 max-w-2xl mx-auto">
        {/* Hero H1 + dominant product — always shows seed data immediately */}
        <div className="mb-6">
          <PrimaryConversionBlock products={sorted} />
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

        {/* WhatsApp subscription banner — monetization CTA */}
        <div className="mt-8">
          <AlertesPrixBanner territory="GP" />
        </div>

        {/* SEO content */}
        <section className="mt-8 text-sm text-gray-500 space-y-2 border-t border-gray-800 pt-4">
          <h2 className="text-base font-medium text-gray-400">
            Comparateur de prix alimentaires — DOM-COM
          </h2>
          <p>
            A Ki Pri Sa Yé compare quotidiennement les prix dans les enseignes de Guadeloupe,
            Martinique, Guyane, La Réunion et Mayotte. Chaque produit est scoré selon la baisse de
            prix, la popularité et la disponibilité locale.
          </p>
          <p>Les données sont mises à jour automatiquement. Aucun compte requis.</p>
        </section>

        <p className="text-xs text-gray-700 text-center mt-6">
          Données locales · RGPD conforme · Mise à jour quotidienne
        </p>
      </main>
    </>
  );
}

export default TopDealsDuJourPage;
