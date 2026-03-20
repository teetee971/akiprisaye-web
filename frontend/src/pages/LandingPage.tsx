/**
 * LandingPage.tsx — High-conversion landing page.
 *
 * Route: /landing
 *
 * Objective: ONE action — click the CTA.
 *
 * Structure:
 *   1. Hero         — value proposition + single primary CTA
 *   2. Proof        — savings %, enseigne count, speed
 *   3. Demo         — 1 product × 3 retailer prices with affiliate links
 *   4. Subscription — WhatsApp / Telegram weekly digest (4,99 €/mois)
 *   5. Final CTA    — reinforcement conversion block
 *
 * Mobile-first: large touch targets, no overflow, minimal text.
 */

import { useEffect, useState } from 'react';
import { SEOHead }   from '../components/ui/SEOHead';
import { PrimaryCTA } from '../components/PrimaryCTA';
import { formatEur } from '../utils/currency';
import { SITE_URL } from '../utils/seoHelpers';
import { buildRetailerUrl } from '../utils/retailerLinks';
import { trackRetailerClick } from '../utils/priceClickTracker';
import { getCROStats, trackPageView } from '../utils/conversionTracker';
import AlertesPrixBanner from '../components/business/AlertesPrixBanner';

// ── Demo data ─────────────────────────────────────────────────────────────────

const DEMO_PRODUCT = {
  name:      'Coca-Cola 1,5 L',
  barcode:   '5000112637922',
  territory: 'GP',
  prices: [
    { retailer: 'Carrefour',  price: 2.85 },
    { retailer: 'E.Leclerc', price: 2.49 },
    { retailer: 'Super U',   price: 2.69 },
  ],
};

const DEMO_SORTED = [...DEMO_PRODUCT.prices].sort((a, b) => a.price - b.price);
const DEMO_SAVINGS = +(DEMO_SORTED[DEMO_SORTED.length - 1].price - DEMO_SORTED[0].price).toFixed(2);

// ── Proof stats ───────────────────────────────────────────────────────────────

const PROOF_ITEMS = [
  { value: '−20%',  label: 'sur certains produits' },
  { value: '6',     label: 'enseignes comparées' },
  { value: '10 s',  label: 'pour trouver le meilleur prix' },
];

// ── Page component ────────────────────────────────────────────────────────────

export default function LandingPage() {
  // Live CTR from localStorage (RGPD-safe, no external call)
  const [ctrPct, setCtrPct] = useState<number | null>(null);

  useEffect(() => {
    trackPageView('/landing');
    try {
      const stats = getCROStats();
      if (stats.totalClicks > 0 || stats.conversionRate > 0) {
        setCtrPct(Math.round(stats.conversionRate * 100));
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <SEOHead
        title="Trouvez le produit le moins cher en Guadeloupe et Martinique en 10 secondes"
        description="Comparez les prix entre Carrefour, E.Leclerc et Super U — trouvez l'offre la moins chère en 10 secondes. Gratuit, sans inscription."
        canonical={`${SITE_URL}/landing`}
      />

      {/* ── 1. HERO ─────────────────────────────────────────────────────────── */}
      <section className="flex flex-col items-center gap-6 px-4 pb-12 pt-16 text-center sm:pt-24">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          Trouvez le produit le moins cher{' '}
          <span className="text-emerald-400">en 10 secondes</span>
        </h1>

        <p className="max-w-md text-base text-zinc-400 sm:text-lg">
          Guadeloupe · Martinique · Guyane — Carrefour, E.Leclerc, Super U et
          plus encore, comparés en temps réel.
        </p>

        <PrimaryCTA
          variant="best-price"
          to="/comparateur"
          productName="landing-hero"
          className="w-full max-w-xs py-4 text-base"
        />

        {/* Live CTR badge — only shown when data is available */}
        {ctrPct !== null && ctrPct > 0 && (
          <p className="text-xs text-zinc-500">
            Taux de clic actuel :{' '}
            <span
              className={`font-bold ${ctrPct >= 10 ? 'text-emerald-400' : 'text-amber-400'}`}
            >
              {ctrPct} %
            </span>
            {ctrPct < 10 && (
              <span className="ml-1 text-zinc-600">(objectif : 10 %)</span>
            )}
          </p>
        )}
      </section>

      {/* ── 2. PROOF ────────────────────────────────────────────────────────── */}
      <section className="border-y border-white/10 bg-white/[0.02] px-4 py-8">
        <div className="mx-auto grid max-w-2xl grid-cols-3 gap-4 text-center">
          {PROOF_ITEMS.map(({ value, label }) => (
            <div key={label} className="flex flex-col gap-1">
              <span className="text-2xl font-extrabold text-emerald-400 sm:text-3xl">
                {value}
              </span>
              <span className="text-xs leading-tight text-zinc-500 sm:text-sm">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. DEMO ─────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-md px-4 py-10">
        <h2 className="mb-1 text-center text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
          Exemple en direct
        </h2>
        <p className="mb-6 text-center text-sm text-zinc-400">
          {DEMO_PRODUCT.name} — Guadeloupe
        </p>

        <div className="flex flex-col gap-3">
          {DEMO_SORTED.map((item, i) => {
            const isBest = i === 0;
            const affiliateUrl = buildRetailerUrl(item.retailer, DEMO_PRODUCT.barcode);

            const rowContent = (
              <>
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold
                      ${isBest ? 'bg-emerald-400/25 text-emerald-300' : 'bg-white/10 text-zinc-400'}`}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-white">{item.retailer}</span>
                      {isBest && (
                        <span className="rounded-md border border-emerald-400/50 bg-emerald-400/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                          Meilleur prix
                        </span>
                      )}
                    </div>
                    {!isBest && (
                      <div className="mt-0.5 text-xs text-rose-400">
                        +{formatEur(+(item.price - DEMO_SORTED[0].price).toFixed(2))} de plus
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold tabular-nums ${isBest ? 'text-emerald-400' : 'text-white'}`}>
                    {formatEur(item.price)}
                  </span>
                  {affiliateUrl && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                      →
                    </span>
                  )}
                </div>
              </>
            );

            const rowClass = `flex items-center justify-between rounded-xl border px-4 py-4 transition-all
              ${isBest
                ? 'border-emerald-400/40 bg-emerald-400/[0.08] ring-1 ring-emerald-400/20'
                : 'border-white/8 bg-white/[0.02]'}
              ${affiliateUrl ? 'cursor-pointer hover:brightness-110' : ''}`;

            if (affiliateUrl) {
              return (
                <a
                  key={item.retailer}
                  href={affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    trackRetailerClick(
                      DEMO_PRODUCT.barcode,
                      item.retailer,
                      DEMO_PRODUCT.territory,
                      item.price,
                    )
                  }
                  className={rowClass}
                  aria-label={`Voir ${DEMO_PRODUCT.name} chez ${item.retailer} à ${formatEur(item.price)}`}
                >
                  {rowContent}
                </a>
              );
            }

            return (
              <div key={item.retailer} className={rowClass}>
                {rowContent}
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-center text-xs text-zinc-600">
          Économisez jusqu'à{' '}
          <span className="font-bold text-emerald-400">{formatEur(DEMO_SAVINGS)}</span>{' '}
          sur ce seul produit.
        </p>
      </section>

      {/* ── 4. SUBSCRIPTION BANNER ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-md px-4 pb-10">
        <AlertesPrixBanner territory="GP" />
      </section>

      {/* ── 5. FINAL CTA BLOCK ──────────────────────────────────────────────── */}
      <section className="border-t border-white/10 bg-emerald-950/20 px-4 py-12 text-center">
        <h2 className="mb-2 text-2xl font-extrabold text-white sm:text-3xl">
          Commencez gratuitement
        </h2>
        <p className="mb-8 text-sm text-zinc-400">
          Aucune inscription requise. Résultats en 10 secondes.
        </p>
        <PrimaryCTA
          variant="compare"
          to="/comparateur"
          productName="landing-cta-block"
          className="py-4 text-base"
        />
      </section>
    </div>
  );
}
