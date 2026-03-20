/**
 * LandingPage.tsx — High-conversion landing page.
 *
 * Route: /landing
 *
 * Structure:
 *   1. Hero      — title, subtitle, primary + secondary CTA
 *   2. Proof     — savings %, enseigne count, real-time
 *   3. Demo      — 1 product with 3 retailer prices + "Meilleur prix" badge
 *   4. CTA block — final conversion push
 *
 * Mobile-first: large touch targets, no overflow, minimal text.
 */

import { Link } from 'react-router-dom';
import { SEOHead }   from '../components/ui/SEOHead';
import { PrimaryCTA } from '../components/PrimaryCTA';
import { formatEur } from '../utils/currency';
import { SITE_URL } from '../utils/seoHelpers';

// ── Demo data ─────────────────────────────────────────────────────────────────

const DEMO_PRODUCT = {
  name:      'Coca-Cola 1,5 L',
  barcode:   '5000112637922',
  territory: 'GP',
  prices: [
    { retailer: 'Carrefour',    price: 2.85 },
    { retailer: 'E.Leclerc',   price: 2.49 },
    { retailer: 'Super U',     price: 2.69 },
  ],
};

const DEMO_SORTED = [...DEMO_PRODUCT.prices].sort((a, b) => a.price - b.price);
const DEMO_SAVINGS = +(DEMO_SORTED[DEMO_SORTED.length - 1].price - DEMO_SORTED[0].price).toFixed(2);

// ── Proof stats ───────────────────────────────────────────────────────────────

const PROOF_ITEMS = [
  { value: '−20%',  label: 'sur certains produits' },
  { value: '6',     label: 'enseignes comparées' },
  { value: '< 30s', label: 'pour trouver le meilleur prix' },
];

// ── Page component ────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <SEOHead
        title="Comparez les prix en Guadeloupe et Martinique — Économisez dès maintenant"
        description="Comparez les prix entre enseignes locales et trouvez l'offre la moins chère en quelques secondes. Résultats en temps réel."
        canonical={`${SITE_URL}/landing`}
      />

      {/* ── 1. HERO ─────────────────────────────────────────────────────────── */}
      <section className="flex flex-col items-center gap-6 px-4 pb-12 pt-16 text-center sm:pt-24">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          Économisez sur vos courses,{' '}
          <span className="text-emerald-400">dès maintenant</span>
        </h1>

        <p className="max-w-xl text-base text-zinc-400 sm:text-lg">
          Comparez les prix entre enseignes locales et trouvez l'offre la moins
          chère en quelques secondes.
        </p>

        <div className="flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:justify-center">
          <PrimaryCTA
            variant="best-price"
            to="/comparateur"
            productName="landing-hero"
            className="w-full py-4 text-base sm:w-auto"
          />
          <Link
            to="/comparateur"
            className="flex w-full items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 py-4 text-sm font-bold text-zinc-300 transition-all hover:bg-white/10 sm:w-auto"
          >
            Comparer un produit
          </Link>
        </div>
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
            return (
              <div
                key={item.retailer}
                className={`flex items-center justify-between rounded-xl border px-4 py-4 transition-all
                  ${isBest
                    ? 'border-emerald-400/40 bg-emerald-400/[0.08] ring-1 ring-emerald-400/20'
                    : 'border-white/8 bg-white/[0.02]'}`}
              >
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
                <span className={`text-lg font-bold tabular-nums ${isBest ? 'text-emerald-400' : 'text-white'}`}>
                  {formatEur(item.price)}
                </span>
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

      {/* ── 4. CTA BLOCK ────────────────────────────────────────────────────── */}
      <section className="border-t border-white/10 bg-emerald-950/20 px-4 py-12 text-center">
        <h2 className="mb-2 text-2xl font-extrabold text-white sm:text-3xl">
          Commencez gratuitement
        </h2>
        <p className="mb-8 text-sm text-zinc-400">
          Aucune inscription requise. Résultats instantanés.
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
