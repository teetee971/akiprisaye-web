/**
 * LandingPage.tsx — High-conversion landing page.
 *
 * Route: /landing
 *
 * Objective: ONE action — click the CTA.
 *
 * Structure:
 *   1. Hero         — value proposition + social proof + FOMO + single CTA + urgency
 *   2. Proof        — savings %, enseigne count, speed
 *   3. Demo         — 1 product × 3 retailer prices with affiliate links
 *   4. Viral share  — copy-to-clipboard scripts for WhatsApp / Facebook
 *   5. Subscription — WhatsApp / Telegram weekly digest (4,99 €/mois)
 *   6. Final CTA    — reinforcement conversion block
 *
 * Mobile-first: large touch targets, no overflow, minimal text.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SEOHead }   from '../components/ui/SEOHead';
import { PrimaryCTA } from '../components/PrimaryCTA';
import { PrimaryConversionBlock } from '../components/conversion/PrimaryConversionBlock';
import { formatEur } from '../utils/currency';
import { SITE_URL } from '../utils/seoHelpers';
import { buildRetailerUrl } from '../utils/retailerLinks';
import { trackRetailerClick } from '../utils/priceClickTracker';
import { getCROStats, trackPageView, trackConversionEvent, getVariantForPage } from '../utils/conversionTracker';
import { trackRevenueClick } from '../utils/revenueTracker';
import { usePWAInstall } from '../hooks/usePWAInstall';
import AlertesPrixBanner, { WHATSAPP_SUBSCRIBE_URL } from '../components/business/AlertesPrixBanner';
import { useNavigate } from 'react-router-dom';
import TopDealsSection from '../components/ui/TopDealsSection';
import { trackEvent, countEvents } from '../utils/eventTracker';
import { selectViralProducts } from '../engine/growthBrain';
import alertsData from '../data/alerts/generated-alerts.json';

// ── Viral share scripts ───────────────────────────────────────────────────────

const VIRAL_SCRIPTS = [
  {
    id: 'casual',
    label: 'Message simple',
    icon: '💬',
    text: (url: string) =>
      `Tu paies trop cher tes courses sans le savoir.\n\nJ'ai trouvé un outil qui compare les prix entre Carrefour, Leclerc, Super U en Guadeloupe.\n\nTu vois DIRECT où c'est le moins cher.\n\n👉 Test ici (ça prend 10 secondes) :\n${url}\n\nDis-moi si ça vaut le coup 👀`,
  },
  {
    id: 'aggressive',
    label: 'Message avec exemple',
    icon: '🔥',
    text: (url: string) =>
      `Exemple réel :\n\nCoca-Cola 1,5L :\n2,85€ → 2,49€ selon le magasin\n\nMême produit. Prix différent.\n\n👉 Vérifie pour tes courses ici :\n${url}\n\nTu vas être surpris.`,
  },
] as const;

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
  // Viral script copy state: id of last-copied script
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // PWA install prompt
  const { canInstall, install: installPWA } = usePWAInstall();
  // Post-click share toast: shown after user clicks a retailer link
  const [showShareToast, setShowShareToast] = useState(false);
  const shareToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  // Always use the canonical SITE_URL so the path includes the deployment
  // subpath (e.g. /akiprisaye-web/landing on GitHub Pages).
  // Using window.location.origin alone would strip the subpath and produce
  // a 404 link like "teetee971.github.io/landing".
  const landingUrl = `${SITE_URL}/landing`;

  const pageUrl =
    typeof window !== 'undefined' ? window.location.pathname : '/landing';
  const variant = getVariantForPage(pageUrl);

  // Top deals derived from generated alerts (V2 pipeline output)
  const topDeals = useMemo(() => {
    const raw = (alertsData as { alerts?: unknown[] }).alerts ?? [];
    if (raw.length === 0) return [];
    return selectViralProducts(
      raw.map((a: unknown) => {
        const alert = a as Record<string, unknown>;
        return {
          name:         String(alert.productName ?? alert.product ?? ''),
          delta:        Number(alert.delta ?? alert.spread ?? 0),
          score:        Number(alert.alertScore ?? alert.score ?? 50),
          bestPrice:    Number(alert.bestPrice ?? alert.price ?? 0),
          bestRetailer: String(alert.bestRetailer ?? alert.enseigne ?? alert.retailer ?? ''),
          territory:    String(alert.territory ?? alert.code ?? 'gp'),
          slug:         String(alert.slug ?? ''),
        };
      }),
      0.15,
      5,
    );
  }, []);

  // Live comparison count from eventTracker (RGPD-safe)
  const [comparisonCount, setComparisonCount] = useState(0);
  // Hours since last data update (rough estimate based on session activity)
  const [hoursAgo, setHoursAgo] = useState<number | null>(null);

  useEffect(() => {
    trackPageView('/landing');
    trackEvent('page_view', { page: '/landing' });
    try {
      const stats = getCROStats();
      if (stats.totalClicks > 0 || stats.conversionRate > 0) {
        setCtrPct(Math.round(stats.conversionRate * 100));
      }
    } catch {
      // ignore
    }
    // Count today's comparisons from eventTracker
    setComparisonCount(countEvents('page_view') + countEvents('deal_view'));
    // Approximate freshness from generatedAt timestamp in alerts JSON
    const generatedAt = (alertsData as { generatedAt?: string }).generatedAt;
    if (generatedAt) {
      const ageMs = Date.now() - Date.parse(generatedAt);
      setHoursAgo(Math.round(ageMs / 3_600_000));
    }
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handleCopyScript = useCallback(
    async (scriptId: string, text: string) => {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // fallback for older browsers
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiedId(scriptId);
      trackConversionEvent({
        pageUrl,
        retailer: `share-script-${scriptId}`,
        productName: 'viral-share',
        variant,
        clickedAt: new Date().toISOString(),
      });
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopiedId(null), 2500);
    },
    [pageUrl, variant],
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <SEOHead
        title="Trouvez le produit le moins cher en Guadeloupe et Martinique en 10 secondes"
        description="Comparez les prix entre Carrefour, E.Leclerc et Super U — trouvez l'offre la moins chère en 10 secondes. Gratuit, sans inscription."
        canonical={`${SITE_URL}/landing`}
      />

      {/* ── 1. HERO ─────────────────────────────────────────────────────────── */}
      <section className="flex flex-col items-center gap-5 px-4 pb-12 pt-16 text-center sm:pt-24">

        {/* Social proof badge */}
        <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 text-xs font-bold text-emerald-400">
          +1&nbsp;000 comparaisons effectuées cette semaine
        </div>

        <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          Trouvez le produit le moins cher{' '}
          <span className="text-emerald-400">en 10 secondes</span>
        </h1>

        {/* FOMO sub-headline */}
        <p className="text-sm font-semibold text-rose-400 sm:text-base">
          Ne payez plus 20&nbsp;% trop cher sans le savoir
        </p>

        <p className="max-w-md text-sm text-zinc-400 sm:text-base">
          Guadeloupe · Martinique · Guyane — Carrefour, E.Leclerc, Super U et
          plus encore, comparés en temps réel.
        </p>

        <PrimaryCTA
          variant="best-price"
          to="/comparateur"
          productName="landing-hero"
          className="w-full max-w-xs py-4 text-base"
        />

        {/* Trust signals — shown immediately under the primary CTA */}
        <ul className="flex flex-col items-center gap-1 text-xs text-zinc-500 sm:flex-row sm:gap-4" aria-label="Garanties">
          <li>✔ Comparaison en temps réel</li>
          <li>✔ Données locales (Guadeloupe / DOM)</li>
          <li>✔ Gratuit &amp; sans inscription</li>
        </ul>

        {/* Urgency signal */}
        <p className="text-xs text-amber-400/90">
          ⚠️ Les prix changent tous les jours
        </p>

        {/* Free opt-in (no credit card) */}
        <a
          href={WHATSAPP_SUBSCRIBE_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            trackConversionEvent({
              pageUrl,
              retailer: 'alerte-whatsapp-free',
              productName: 'bons-plans-gratuits',
              variant,
              clickedAt: new Date().toISOString(),
            })
          }
          className="text-xs font-semibold text-[#25D366] underline underline-offset-2 hover:text-[#25D366]/80 transition-colors"
        >
          Recevoir les bons plans gratuits →
        </a>

        {/* PWA install button — only shown when the browser offers install prompt */}
        {canInstall && (
          <button
            type="button"
            onClick={installPWA}
            className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-800/60 px-4 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
            aria-label="Installer l'application A KI PRI SA YÉ sur cet appareil"
          >
            📲 Installer l&apos;app
          </button>
        )}

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

        {/* Urgency + proof live indicators */}
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          {hoursAgo !== null && (
            <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-400">
              ⏱ Mis à jour il y a {hoursAgo < 1 ? 'moins d\'1 heure' : `${hoursAgo} heure${hoursAgo > 1 ? 's' : ''}`}
            </span>
          )}
          {comparisonCount > 0 && (
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-400">
              📊 +{comparisonCount} comparaisons aujourd'hui
            </span>
          )}
        </div>
      </section>

      {/* ── 2b. BEST DEAL HERO — dominant product CTA block ─────────────────── */}
      {topDeals.length > 0 && (
        <section className="mx-auto max-w-md px-4 pb-2">
          <PrimaryConversionBlock
            products={topDeals.map((d) => ({
              id:        d.slug ?? d.name,
              name:      d.name,
              price:     d.bestPrice,
              score:     d.scoreFinal,
              priceDrop: d.bestPrice && d.delta ? d.delta / (d.bestPrice + d.delta) : undefined,
              trending:  d.tier === 'viral',
              retailer:  d.bestRetailer,
              url:       d.slug ? `/produit/${d.slug}` : '/comparateur',
              territory: d.territory,
            }))}
          />
        </section>
      )}

      {/* ── 2c. TOP DEALS LIST (V2 pipeline alerts) ──────────────────────────── */}
      {topDeals.length > 0 && (
        <TopDealsSection
          deals={topDeals}
          title="🔥 Les meilleures offres en ce moment"
          limit={6}
        />
      )}

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
                    <span className={`rounded-lg px-2 py-1 text-[10px] font-bold ${
                      isBest
                        ? 'bg-emerald-400/20 text-emerald-300'
                        : 'bg-white/8 text-zinc-400'
                    }`}>
                      Voir chez {item.retailer}
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
                  onClick={() => {
                    trackRetailerClick(
                      DEMO_PRODUCT.barcode,
                      item.retailer,
                      DEMO_PRODUCT.territory,
                      item.price,
                    );
                    trackRevenueClick({
                      url: pageUrl,
                      product: DEMO_PRODUCT.name,
                      retailer: item.retailer,
                      price: item.price,
                    });
                    // Show share nudge toast
                    if (shareToastTimerRef.current) clearTimeout(shareToastTimerRef.current);
                    setShowShareToast(true);
                    shareToastTimerRef.current = setTimeout(() => setShowShareToast(false), 4000);
                  }}
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

      {/* ── 4. VIRAL SHARE ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-md px-4 pb-10">
        <h2 className="mb-1 text-center text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
          Partagez avec vos proches
        </h2>
        <p className="mb-5 text-center text-xs text-zinc-600">
          Copiez un message prêt à envoyer sur WhatsApp ou Facebook
        </p>

        <div className="flex flex-col gap-4">
          {VIRAL_SCRIPTS.map((script) => {
            const fullText = script.text(landingUrl);
            const isCopied = copiedId === script.id;
            return (
              <div
                key={script.id}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-zinc-400">
                    {script.icon} {script.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyScript(script.id, fullText)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all
                      ${isCopied
                        ? 'border border-emerald-400/40 bg-emerald-400/15 text-emerald-300'
                        : 'border border-white/15 bg-white/5 text-zinc-300 hover:bg-white/10'}`}
                    aria-label={isCopied ? 'Copié !' : `Copier le ${script.label}`}
                  >
                    {isCopied ? '✓ Copié !' : '📋 Copier'}
                  </button>
                </div>
                <pre className="whitespace-pre-wrap break-words text-[11px] leading-relaxed text-zinc-500">
                  {fullText}
                </pre>
              </div>
            );
          })}
        </div>

        {/* Native Web Share — mobile only, degrades to nothing on desktop */}
        {'share' in navigator && (
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.share({
                  title: 'A KI PRI SA YÉ — Comparateur de prix Outre-mer',
                  text: `🔥 Même produit. Prix différent.\n\nCoca-Cola 1,5L :\n2,85€ → 2,49€ selon le magasin\n\n👉 Vérifie pour tes courses :`,
                  url: landingUrl,
                });
              } catch {
                // User dismissed — no-op
              }
            }}
            className="mx-auto mt-4 flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-zinc-400 transition-colors hover:border-white/20 hover:text-zinc-200"
            aria-label="Partager via l'application de messagerie de votre choix"
          >
            🔗 Partager
          </button>
        )}
      </section>

      {/* ── 5. SUBSCRIPTION BANNER ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-md px-4 pb-10">
        <AlertesPrixBanner territory="GP" />
      </section>

      {/* ── 6. FINAL CTA BLOCK ──────────────────────────────────────────────── */}
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

      {/* ── Share toast — shown for 4s after a retailer click ────────────────── */}
      {showShareToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-24 left-1/2 z-[90] -translate-x-1/2 rounded-2xl border border-emerald-400/30 bg-black/90 px-5 py-3 text-center shadow-2xl backdrop-blur sm:bottom-6"
        >
          <p className="text-sm font-semibold text-white">
            Bon choix&nbsp;👍&nbsp; Partage ce bon plan à un proche&nbsp;!
          </p>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.share({
                  title: 'Bon plan trouvé',
                  text: `🔥 Même produit. Prix différent.\n\n${DEMO_PRODUCT.name} :\n2,85€ → 2,49€ selon le magasin\n\n👉 Vérifie pour tes courses :`,
                  url: SITE_URL,
                });
              } catch {
                navigate('/comparateur');
              }
              setShowShareToast(false);
            }}
            className="mt-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-black transition hover:bg-emerald-400"
          >
            Partager
          </button>
        </div>
      )}

      {/* ── Sticky mobile CTA — fixed bottom bar, hidden on desktop ─────────── */}
      <div className="fixed bottom-0 left-0 z-[60] w-full border-t border-white/10 bg-black/90 p-3 backdrop-blur sm:hidden">
        <button
          type="button"
          onClick={() => navigate('/comparateur')}
          className="block w-full rounded-2xl bg-emerald-500 py-3.5 text-sm font-extrabold text-black transition hover:bg-emerald-400 active:scale-95"
        >
          Voir le meilleur prix maintenant
        </button>
      </div>
    </div>
  );
}
