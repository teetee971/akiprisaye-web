/**
 * SEOProductPage.tsx — SEO-optimized product page
 *
 * Features:
 *   - Dynamic meta tags (title, description, og:*, twitter:*)
 *   - JSON-LD Product schema for rich Google results
 *   - SEO-friendly H1 and content structure
 *   - Breadcrumb navigation with schema
 *   - Mobile-first responsive design
 *
 * Routes: /produit/:slug
 */

import { lazy, Suspense, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useCompare }  from '../hooks/useCompare';
import { useHistory }  from '../hooks/useHistory';
import { useSignal }   from '../hooks/useSignal';
import { Skeleton }    from '../components/ui/Skeleton';
import { SEOHead }     from '../components/ui/SEOHead';
import { formatEur }   from '../utils/currency';
import { formatDate }  from '../utils/format';
import { buildRetailerUrl } from '../utils/retailerLinks';
import { trackProductView, trackRetailerClick } from '../utils/priceClickTracker';
import { PrimaryCTA } from '../components/PrimaryCTA';
import {
  generateProductTitle,
  generateProductMetaDescription,
  generateProductCanonical,
  buildProductJsonLd,
  buildProductBreadcrumbJsonLd,
  buildFaqJsonLd,
  getTerritoryName,
  generateCategorySlug,
  SITE_URL,
  TERRITORY_NAMES,
} from '../utils/seoHelpers';
import type { PriceObservationRow } from '../types/compare';
import type { SignalResult, HistoryPoint } from '../types/api';

// ── Lazy chart + client-side signal ──────────────────────────────────────────
const LazyPriceHistory = lazy(() =>
  import('../components/insights/PriceHistory').then((m) => ({ default: m.PriceHistory })),
);
const LazySmartSignal = lazy(() =>
  import('../components/insights/SmartSignal').then((m) => ({ default: m.SmartSignal })),
);

// ── Signal visual config ──────────────────────────────────────────────────────
const SIGNAL_RING: Record<string, string> = {
  buy:     'border-emerald-400/30 bg-emerald-400/10',
  wait:    'border-amber-400/30   bg-amber-400/10',
  neutral: 'border-white/10       bg-white/[0.03]',
};
const SIGNAL_TEXT: Record<string, string> = {
  buy:     'text-emerald-300',
  wait:    'text-amber-300',
  neutral: 'text-white',
};
const SIGNAL_ICON: Record<string, string> = {
  buy:     '↓',
  wait:    '↑',
  neutral: '→',
};

// ── Smart Signal contextual badge ────────────────────────────────────────────
interface SmartSignalBadgeProps {
  savings:   number | null;
  average:   number | null;
  bestPrice: number | null;
  signal:    string | undefined;
}
function SmartSignalBadge({ savings, average, bestPrice, signal }: SmartSignalBadgeProps) {
  if (signal === 'buy' && savings != null && savings > 0.01) {
    const pct = average != null && bestPrice != null && average > 0
      ? Math.round(((average - bestPrice) / average) * 100)
      : null;
    return (
      <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-300">
        🔻 {pct != null ? `-${pct}% vs moyenne` : 'Meilleur prix'} · Bon moment pour acheter
      </div>
    );
  }
  if (signal === 'wait') {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-xs font-bold text-amber-300">
        ⚠️ Prix en hausse · Attendre recommandé
      </div>
    );
  }
  if (bestPrice != null && average != null && average > 0) {
    const pct = Math.round(((average - bestPrice) / average) * 100);
    if (pct >= 10) {
      return (
        <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-300">
          🔥 Meilleur prix aujourd'hui · -{pct}% vs moyenne
        </div>
      );
    }
  }
  return null;
}

// ── Source badge ──────────────────────────────────────────────────────────────
type SourceId = 'open_prices' | 'internal' | 'open_food_facts' | 'mock';
function SourceBadge({ source }: { source: SourceId }) {
  if (source === 'mock') {
    return (
      <span className="rounded-md border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400">
        Estimé
      </span>
    );
  }
  return null;
}

// ── Price row ─────────────────────────────────────────────────────────────────
interface PriceRowProps {
  p:             PriceObservationRow;
  rank:          number;
  isBest:        boolean;
  savingsVsBest: number | null;
  barcode:       string;
  territory:     string;
}
function PriceRow({ p, rank, isBest, savingsVsBest, barcode, territory }: PriceRowProps) {
  const retailerUrl = buildRetailerUrl(p.retailer, barcode);

  const handleRetailerClick = () => {
    trackRetailerClick(barcode, p.retailer, territory, p.price);
  };

  return (
    <div
      className={`group relative flex items-center justify-between rounded-xl border px-4 py-4 transition-all duration-150
        ${isBest
          ? 'border-emerald-400/40 bg-emerald-400/[0.08] ring-1 ring-emerald-400/20 hover:bg-emerald-400/[0.12]'
          : 'border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]'}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        {/* Rank bubble */}
        <span
          className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold
            ${isBest ? 'bg-emerald-400/25 text-emerald-300' : 'bg-white/10 text-zinc-400'}`}
        >
          {rank}
        </span>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-semibold text-white">{p.retailer}</span>
            {isBest && (
              <span className="rounded-md border border-emerald-400/50 bg-emerald-400/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                Meilleur prix
              </span>
            )}
            <SourceBadge source={p.source as SourceId} />
          </div>
          <div className="mt-0.5 text-xs text-zinc-500">{formatDate(p.observedAt)}</div>
        </div>
      </div>

      {/* Price + CTA */}
      <div className="ml-4 flex flex-shrink-0 items-center gap-3">
        <div className="text-right">
          <div className={`text-lg font-bold tabular-nums ${isBest ? 'text-emerald-400' : 'text-white'}`}>
            {formatEur(p.price)}
          </div>
          {!isBest && savingsVsBest != null && savingsVsBest > 0.005 && (
            <div className="mt-0.5 rounded bg-rose-400/10 px-1.5 py-0.5 text-xs font-semibold text-rose-400">
              +{formatEur(savingsVsBest)} de plus
            </div>
          )}
        </div>

        {/* "Voir l'offre" CTA — visible on hover, always on best price row */}
        {retailerUrl && (
          <a
            href={retailerUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleRetailerClick}
            className={`flex-shrink-0 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all duration-150 active:scale-95
              ${isBest
                ? 'border-emerald-400/50 bg-emerald-400/20 text-emerald-300 hover:bg-emerald-400/30'
                : 'border-white/15 bg-white/5 text-zinc-400 opacity-0 group-hover:opacity-100 hover:border-white/30 hover:bg-white/10 hover:text-white'}`}
          >
            {isBest ? 'VOIR L\'OFFRE →' : 'Voir →'}
          </a>
        )}
      </div>
    </div>
  );
}

// ── Best-price hero block ─────────────────────────────────────────────────────
interface BestPriceHeroProps {
  bestPrice:    number | null;
  savings:      number | null;
  retailer:     string | undefined;
  retailerUrl:  string | null;
  signalStatus: string | undefined;
  barcode:      string;
  territory:    string;
}
function BestPriceHero({
  bestPrice, savings, retailer, retailerUrl, signalStatus, barcode, territory,
}: BestPriceHeroProps) {
  if (bestPrice === null) return null;

  const handleHeroClick = () => {
    if (retailer) trackRetailerClick(barcode, retailer, territory, bestPrice);
  };

  const signalColor =
    signalStatus === 'buy'  ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' :
    signalStatus === 'wait' ? 'text-amber-400   bg-amber-400/10   border-amber-400/30'   :
                              'text-white        bg-white/5        border-white/10';

  return (
    <div className="rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-950/40 to-zinc-900/60 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        {/* Left: best price */}
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-500">
            🏆 Meilleur prix du marché
          </div>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-4xl font-extrabold tabular-nums text-emerald-400">
              {formatEur(bestPrice)}
            </span>
            {retailer && (
              <span className="mb-1 text-sm font-medium text-zinc-400">chez {retailer}</span>
            )}
          </div>
          {savings != null && savings > 0.01 && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5">
              <span className="text-xs font-semibold text-emerald-300">
                Économisez&nbsp;<span className="text-base font-extrabold">{formatEur(savings)}</span>&nbsp;maintenant
              </span>
            </div>
          )}
        </div>

        {/* Right: signal pill + CTA */}
        <div className="flex flex-col items-start gap-2 sm:items-end">
          {signalStatus && signalStatus !== 'neutral' && (
            <div className={`rounded-xl border px-4 py-2 text-sm font-bold ${signalColor}`}>
              {signalStatus === 'buy'  ? '↓ Bon moment pour acheter' : '↑ Attendre recommandé'}
            </div>
          )}
          {retailerUrl && retailer && (
            <a
              href={retailerUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleHeroClick}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/60 bg-emerald-400/25 px-5 py-2.5 text-sm font-extrabold uppercase tracking-wide text-emerald-200 shadow-lg shadow-emerald-900/30 transition-all hover:bg-emerald-400/35 active:scale-95"
            >
              ACHETER AU MEILLEUR PRIX →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ── API signal card ───────────────────────────────────────────────────────────
interface SignalCardProps { signal: SignalResult; }
function SignalCard({ signal }: SignalCardProps) {
  const ring = SIGNAL_RING[signal.status] ?? SIGNAL_RING.neutral;
  const text = SIGNAL_TEXT[signal.status] ?? SIGNAL_TEXT.neutral;
  const icon = SIGNAL_ICON[signal.status] ?? SIGNAL_ICON.neutral;
  return (
    <div className={`rounded-2xl border p-5 ${ring}`}>
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
        Signal marché
      </div>
      <div className={`mt-3 flex items-center gap-2 text-xl font-bold ${text}`}>
        <span aria-hidden="true">{icon}</span>
        {signal.label}
      </div>
      <p className={`mt-2 text-sm leading-6 opacity-90 ${text}`}>{signal.reason}</p>
    </div>
  );
}

// ── Signal section ────────────────────────────────────────────────────────────
interface SignalSectionProps {
  signal:         SignalResult | null;
  history:        HistoryPoint[];
  signalLoading:  boolean;
  historyLoading: boolean;
}
function SignalSection({ signal, history, signalLoading, historyLoading }: SignalSectionProps) {
  if (signalLoading || historyLoading) return <Skeleton className="h-48" />;
  if (signal) return <SignalCard signal={signal} />;
  return (
    <Suspense fallback={<Skeleton className="h-48" />}>
      <LazySmartSignal history={history} />
    </Suspense>
  );
}

// ── Breadcrumbs component ─────────────────────────────────────────────────────
interface BreadcrumbsProps {
  product: { name: string; category?: string };
  territory: string;
}
function Breadcrumbs({ product, territory }: BreadcrumbsProps) {
  const territoryName = getTerritoryName(territory);
  
  return (
    <nav aria-label="Fil d'Ariane" className="mb-4 text-xs text-zinc-500">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link to="/" className="hover:text-emerald-400 transition-colors">Accueil</Link>
        </li>
        <li aria-hidden="true" className="text-zinc-700">›</li>
        <li>
          <Link to="/comparateur" className="hover:text-emerald-400 transition-colors">Comparateur</Link>
        </li>
        {product.category && (
          <>
            <li aria-hidden="true" className="text-zinc-700">›</li>
            <li>
              <Link 
                to={`/categorie/${product.category.toLowerCase().replace(/\s+/g, '-')}?territory=${territory}`}
                className="hover:text-emerald-400 transition-colors"
              >
                {product.category}
              </Link>
            </li>
          </>
        )}
        <li aria-hidden="true" className="text-zinc-700">›</li>
        <li className="text-zinc-300 truncate max-w-[200px]">{product.name}</li>
      </ol>
    </nav>
  );
}

// ── SEO Content Block (invisible UX but useful for SEO) ───────────────────────
interface SEOContentBlockProps {
  product: { name: string; brand?: string; category?: string };
  territory: string;
  minPrice: number | null;
  maxPrice: number | null;
  savings: number | null;
  storeCount: number;
}
function SEOContentBlock({ product, territory, minPrice, maxPrice, savings, storeCount }: SEOContentBlockProps) {
  const territoryName = getTerritoryName(territory);
  const brand = product.brand ?? '';
  const brandLabel = brand ? `${brand} ` : '';

  return (
    <section className="mt-6 rounded-xl border border-white/5 bg-white/[0.01] p-4">
      <h2 className="sr-only">Informations complémentaires</h2>
      <div className="text-xs leading-relaxed text-zinc-500 space-y-2">
        <p>
          <strong className="text-zinc-400">Comparatif {brandLabel}{product.name} en {territoryName}</strong> —{' '}
          Retrouvez les meilleurs prix dans {storeCount} enseigne{storeCount > 1 ? 's' : ''} locales et faites des économies sur vos courses.
        </p>
        {minPrice != null && maxPrice != null && minPrice !== maxPrice && (
          <p>
            Les prix varient de <span className="text-emerald-400 font-medium">{formatEur(minPrice)}</span> à{' '}
            <span className="text-zinc-300 font-medium">{formatEur(maxPrice)}</span>.
            {savings != null && savings > 0.01 && (
              <> Économisez jusqu'à <span className="text-emerald-400 font-bold">{formatEur(savings)}</span> en comparant les enseignes.</>
            )}
          </p>
        )}
        <p>
          Où acheter {brandLabel}{product.name} moins cher en {territoryName}&nbsp;? Notre comparateur analyse quotidiennement
          les prix dans les principales enseignes (Carrefour, E.Leclerc, Super U, Leader Price…) pour vous aider à trouver la meilleure offre.
        </p>
        <p>
          Données actualisées quotidiennement à partir de relevés terrains et sources officielles pour{' '}
          {territoryName}.
        </p>
      </div>
    </section>
  );
}

// ── "Prix vérifié récemment" badge ───────────────────────────────────────────
function PriceVerifiedBadge({ latestDate }: { latestDate: string | undefined }) {
  if (!latestDate) return null;
  return (
    <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-2.5 py-1 text-[10px] font-semibold text-emerald-400">
      <span aria-hidden="true">✓</span>
      Prix vérifié récemment · {formatDate(latestDate)}
    </div>
  );
}

// ── FAQ section ───────────────────────────────────────────────────────────────
interface FaqSectionProps {
  product: { name: string; brand?: string };
  territory: string;
  bestPrice: number | null;
  savings: number | null;
  average: number | null;
  bestRetailer: string | undefined;
}
function FaqSection({ product, territory, bestPrice, savings, average, bestRetailer }: FaqSectionProps) {
  const territoryName = getTerritoryName(territory);
  const brandLabel = product.brand ? `${product.brand} ` : '';
  const productLabel = `${brandLabel}${product.name}`;

  const questions: { q: string; a: string }[] = [
    {
      q: `Où acheter ${productLabel} moins cher en ${territoryName} ?`,
      a:
        bestPrice != null && bestRetailer
          ? `Le meilleur prix du ${productLabel} en ${territoryName} est actuellement de ${bestPrice.toFixed(2)} € chez ${bestRetailer}. Notre comparateur analyse toutes les enseignes locales (Carrefour, E.Leclerc, Super U, Leader Price…) pour vous garantir la meilleure offre.`
          : `Utilisez notre comparateur pour trouver le meilleur prix du ${productLabel} parmi toutes les enseignes en ${territoryName}.`,
    },
    {
      q: `Quel est le prix moyen du ${productLabel} en ${territoryName} ?`,
      a:
        average != null
          ? `Le prix moyen du ${productLabel} en ${territoryName} est de ${average.toFixed(2)} € d'après les relevés effectués dans les principales enseignes. Les prix sont mis à jour quotidiennement.`
          : `Le prix du ${productLabel} varie selon les enseignes. Consultez notre comparateur pour avoir les prix du jour en ${territoryName}.`,
    },
    {
      q: `Comment économiser sur le ${productLabel} en ${territoryName} ?`,
      a:
        savings != null && savings > 0.01
          ? `Vous pouvez économiser jusqu'à ${savings.toFixed(2)} € sur le ${productLabel} en ${territoryName} en comparant les enseignes. Notre comparateur vous indique en temps réel quelle enseigne propose le prix le plus bas.`
          : `Comparez les prix dans toutes les enseignes grâce à notre comparateur pour trouver la meilleure offre sur le ${productLabel} en ${territoryName}.`,
    },
  ];

  return (
    <section className="mt-4 rounded-xl border border-white/5 bg-white/[0.01] p-4">
      <h2 className="mb-3 text-sm font-bold text-zinc-300">Questions fréquentes</h2>
      <div className="space-y-4">
        {questions.map(({ q, a }) => (
          <details key={q} className="group">
            <summary className="cursor-pointer list-none text-xs font-semibold text-zinc-300 hover:text-emerald-300 transition-colors">
              <span className="mr-1.5 text-emerald-500 group-open:hidden">▶</span>
              <span className="mr-1.5 hidden text-emerald-500 group-open:inline">▼</span>
              {q}
            </summary>
            <p className="mt-2 pl-4 text-xs leading-relaxed text-zinc-500">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

// ── Related products / territory links ────────────────────────────────────────
const DOM_TERRITORIES = Object.keys(TERRITORY_NAMES);

interface RelatedProductsSectionProps {
  product: { name: string; brand?: string; category?: string };
  currentTerritory: string;
  slug: string;
}
function RelatedProductsSection({ product, currentTerritory, slug }: RelatedProductsSectionProps) {
  const otherTerritories = DOM_TERRITORIES.filter((t) => t !== currentTerritory);
  const categorySlug = product.category ? generateCategorySlug(product.category) : null;

  return (
    <section className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
      {/* Territory variants — great for internal linking across DOM pages */}
      <div className="mb-4">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
          Prix {product.brand ? `${product.brand} ` : ''}{product.name} dans d'autres territoires
        </h2>
        <div className="flex flex-wrap gap-2">
          {otherTerritories.map((t) => (
            <Link
              key={t}
              to={`/produit/${slug}?territory=${t}`}
              className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-400 transition-all hover:border-emerald-400/30 hover:text-emerald-300"
            >
              {TERRITORY_NAMES[t]}
            </Link>
          ))}
        </div>
      </div>

      {/* Category link */}
      {categorySlug && (
        <div>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
            Dans la même catégorie
          </h2>
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/categorie/${categorySlug}?territory=${currentTerritory}`}
              className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-400 transition-all hover:border-emerald-400/30 hover:text-emerald-300"
            >
              Tous les {product.category} →
            </Link>
            <Link
              to={`/comparateur`}
              className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-400 transition-all hover:border-white/20 hover:text-white"
            >
              ← Comparateur
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SEOProductPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const territory = searchParams.get('territory') ?? 'GP';

  // Extract barcode or product ID from slug
  // Format expected: "product-name-territory" or just the barcode/id
  const queryId = slug.includes('-') ? slug.split('-')[0] : slug;

  const { data: compareData, loading: compareLoading } = useCompare(queryId || slug, territory, '');
  const { data: history,     loading: historyLoading  } = useHistory(queryId || slug, territory, '30d');
  const { data: signal,      loading: signalLoading   } = useSignal(queryId || slug, territory);

  // Cheapest first (already sorted server-side but re-sort for safety)
  const sorted = useMemo(
    () => [...(compareData?.observations ?? [])].sort((a, b) => a.price - b.price),
    [compareData?.observations],
  );

  const maxSavings: number | null = useMemo(
    () =>
      sorted.length > 1
        ? +(sorted[sorted.length - 1].price - sorted[0].price).toFixed(2)
        : null,
    [sorted],
  );

  // Track product view once data is loaded
  useEffect(() => {
    if (compareData?.product && !compareLoading) {
      trackProductView(
        compareData.product.barcode || queryId,
        compareData.product.name,
        territory,
      );
    }
  }, [compareData, compareLoading, queryId, territory]);

  // ── Generate SEO data ────────────────────────────────────────────────────────
  const seoTitle = compareData?.product
    ? generateProductTitle(compareData.product, territory)
    : `Prix produit en ${getTerritoryName(territory)}`;

  const seoDescription = compareData?.product
    ? generateProductMetaDescription(compareData.product, compareData.summary, territory)
    : undefined;

  const seoCanonical = compareData?.product
    ? generateProductCanonical(compareData.product, territory)
    : undefined;

  const productJsonLd = compareData?.product
    ? buildProductJsonLd(compareData.product, sorted, territory)
    : null;

  const breadcrumbJsonLd = compareData?.product
    ? buildProductBreadcrumbJsonLd(compareData.product, territory)
    : null;

  // Build FAQ JSON-LD once data is available
  const faqJsonLd = compareData?.product
    ? buildFaqJsonLd(
        compareData.product,
        territory,
        compareData.summary?.min ?? null,
        compareData.summary?.savings ?? null,
        compareData.summary?.average ?? null,
        sorted[0]?.retailer,
      )
    : null;

  // Combine all JSON-LD schemas in a single @graph for Google
  const combinedJsonLd = (() => {
    const schemas = [productJsonLd, breadcrumbJsonLd, faqJsonLd].filter(Boolean);
    if (schemas.length === 0) return null;
    if (schemas.length === 1) return schemas[0];
    return { '@context': 'https://schema.org', '@graph': schemas };
  })();

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (compareLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] px-4 py-8">
        <SEOHead
          title={`Chargement... — Comparateur de prix`}
          noIndex
        />
        <div className="mx-auto max-w-2xl space-y-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-28" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  // ── Not found ───────────────────────────────────────────────────────────────
  if (!compareData?.product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f]">
        <SEOHead
          title="Produit introuvable"
          description="Le produit demandé n'a pas été trouvé dans notre base de données."
          noIndex
        />
        <div className="text-center">
          <p className="text-zinc-400 mb-4">Produit introuvable.</p>
          <Link
            to="/comparateur"
            className="text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            ← Retour au comparateur
          </Link>
        </div>
      </div>
    );
  }

  const { product, summary } = compareData;
  const bestRetailer    = sorted[0]?.retailer;
  const bestRetailerUrl = bestRetailer
    ? buildRetailerUrl(bestRetailer, product.barcode)
    : null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 py-8 pb-24 sm:pb-8">
      {/* SEO Head with all meta tags and JSON-LD */}
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        canonical={seoCanonical}
        jsonLd={combinedJsonLd}
      />

      <div className="mx-auto max-w-2xl space-y-4">
        
        {/* Breadcrumbs */}
        <Breadcrumbs product={product} territory={territory} />

        {/* ── SEO H1 — Product question format (great for Google) ────────── */}
        <h1 className="text-xl font-bold text-white sm:text-2xl">
          Quel est le prix {product.brand ? `du ${product.brand} ` : 'de '}{product.name} en {getTerritoryName(territory)} ?
        </h1>

        {/* ── Product identity ──────────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
          {product.image ? (
            <div className="flex justify-center bg-white/5 py-6">
              <img
                src={product.image}
                alt={`${product.name}${product.brand ? ` - ${product.brand}` : ''}`}
                className="h-32 w-32 object-contain drop-shadow-lg sm:h-40 sm:w-40"
                loading="lazy"
              />
            </div>
          ) : null}
          <div className="p-4">
            {product.brand ? (
              <div className="mb-1 text-xs font-bold uppercase tracking-widest text-emerald-400">
                {product.brand}
              </div>
            ) : null}
            <h2 className="text-lg font-bold leading-snug text-white sm:text-xl">{product.name}</h2>
            {product.category ? (
              <div className="mt-1 text-xs text-zinc-500">
                <Link 
                  to={`/categorie/${product.category.toLowerCase().replace(/\s+/g, '-')}?territory=${territory}`}
                  className="hover:text-emerald-400 transition-colors"
                >
                  {product.category}
                </Link>
              </div>
            ) : null}
            <div className="mt-2">
              <PriceVerifiedBadge latestDate={sorted[0]?.observedAt} />
            </div>
            <div className="mt-1 font-mono text-[10px] text-zinc-700">{product.barcode}</div>
          </div>
        </div>

        {/* ── Best-price hero (above the fold) ─────────────────────────────── */}
        <BestPriceHero
          bestPrice={summary?.min ?? null}
          savings={maxSavings ?? summary?.savings ?? null}
          retailer={bestRetailer}
          retailerUrl={bestRetailerUrl}
          signalStatus={signal?.status ?? undefined}
          barcode={product.barcode}
          territory={territory}
        />

        {/* ── Smart Signal contextual badge ─────────────────────────────────── */}
        <SmartSignalBadge
          savings={maxSavings ?? summary?.savings ?? null}
          average={summary?.average ?? null}
          bestPrice={summary?.min ?? null}
          signal={signal?.status}
        />

        {/* ── Price comparison list ─────────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">
            Comparatif enseignes — {getTerritoryName(territory)}
          </h3>
          {sorted.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-500">
              Aucune observation disponible pour ce territoire.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {sorted.map((p, i) => (
                <PriceRow
                  key={`${p.retailer}-${i}`}
                  p={p}
                  rank={i + 1}
                  isBest={i === 0}
                  savingsVsBest={i > 0 ? +(p.price - (sorted[0]?.price ?? 0)).toFixed(2) : null}
                  barcode={product.barcode}
                  territory={territory}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Signal + chart (secondary info) ──────────────────────────────── */}
        <SignalSection
          signal={signal}
          history={history}
          signalLoading={signalLoading}
          historyLoading={historyLoading}
        />

        <Suspense fallback={<Skeleton className="h-56" />}>
          <LazyPriceHistory productId={queryId || slug} territory={territory} />
        </Suspense>

        {/* ── SEO Content Block (Google loves structured content) ──────────── */}
        <SEOContentBlock
          product={product}
          territory={territory}
          minPrice={summary?.min ?? null}
          maxPrice={summary?.max ?? null}
          savings={maxSavings}
          storeCount={sorted.length}
        />

        {/* ── FAQ — boosts rich-result eligibility + indexation ─────────────── */}
        <FaqSection
          product={product}
          territory={territory}
          bestPrice={summary?.min ?? null}
          savings={maxSavings ?? summary?.savings ?? null}
          average={summary?.average ?? null}
          bestRetailer={bestRetailer}
        />

        {/* ── Related products / territory links (internal linking) ─────────── */}
        <RelatedProductsSection
          product={product}
          currentTerritory={territory}
          slug={slug}
        />

      </div>

      {/* ── Sticky CTA bar — always visible above fold on mobile ─────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#0a0a0f]/95 px-4 pt-3 backdrop-blur-sm sm:hidden"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <PrimaryCTA
          variant="best-price"
          href={bestRetailerUrl ?? undefined}
          retailer={bestRetailer}
          productName={product.name}
          territory={territory}
          className="w-full justify-center py-3.5"
        />
      </div>
    </div>
  );
}
