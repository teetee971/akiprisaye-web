/**
 * SEOPrixLocalPage.tsx — Local product price page
 *
 * Route: /prix/:slug  (e.g. /prix/coca-cola-1-5l-guadeloupe)
 *
 * Targets long-tail queries like:
 *   "prix coca cola guadeloupe"
 *   "prix nutella martinique"
 *   "prix riz basmati guyane"
 *
 * Features:
 *   - Schema.org Product + AggregateOffer JSON-LD
 *   - BestPriceHero with Top 3 visible on load
 *   - Aggressive CTAs (ACHETER AU MEILLEUR PRIX)
 *   - Smart contextual badges (🔻 -X% vs moyenne)
 *   - Internal linking to category + comparator + territory pages
 */

import { useMemo, useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { SEOHead } from '../components/ui/SEOHead';
import { formatEur } from '../utils/currency';
import { buildRetailerUrl } from '../utils/retailerLinks';
import { trackRetailerClick } from '../utils/priceClickTracker';
import {
  getTerritoryName,
  TERRITORY_NAMES,
  TERRITORY_SLUG_MAP,
  buildPrixLocalJsonLd,
  SITE_URL,
} from '../utils/seoHelpers';
import {
  getPageAngle,
  generatePageIntro,
  generatePriceTip,
  generateFaqItems,
} from '../utils/seoContentEngine';
import InternalLinksSection from '../components/seo/InternalLinksSection';
import ConversionStickyBar from '../components/business/ConversionStickyBar';

// ── Real price types ─────────────────────────────────────────────────────────

/** Estimated price premium vs hexagone per territory (ratio: 1.0 = same price) */
const MOCK_PRICE_COEFFICIENTS: Record<string, number> = {
  GP: 1.4,
  MQ: 1.42,
  GF: 1.38,
  RE: 1.35,
  YT: 1.5,
  BL: 1.6,
  MF: 1.55,
  PM: 1.45,
};

interface RetailerPrice {
  retailer: string;
  price: number;
  badge?: string;
  isBest: boolean;
}

async function getRealPrices(productSlug: string, _territory: string): Promise<RetailerPrice[]> {
  const { getCatalogue, searchCatalogueBySlug } = await import('../services/realDataService');
  const catalogue = await getCatalogue();
  const matches = searchCatalogueBySlug(catalogue, productSlug);
  if (matches.length === 0) return [];

  const sorted = [...matches].slice(0, 10).sort((a, b) => a.price - b.price);

  return sorted.map((p, i) => ({
    retailer: p.store,
    price: p.price,
    isBest: i === 0,
    badge: i === 0 ? '🔥 Meilleur prix' : undefined,
  }));
}

// ── Slug parser ───────────────────────────────────────────────────────────────
// Extracts territory from end of slug: "coca-cola-guadeloupe" → { product: "coca-cola", territory: "GP" }
function parseSlug(slug: string): { productName: string; territory: string } {
  // Try known territory suffixes (longest first to avoid partial matches)
  const territoryEntries = Object.entries(TERRITORY_SLUG_MAP).sort(
    (a, b) => b[0].length - a[0].length
  );

  for (const [territorySlug, code] of territoryEntries) {
    if (slug.endsWith(`-${territorySlug}`)) {
      const productPart = slug.slice(0, -(territorySlug.length + 1));
      const productName = productPart
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      return { productName, territory: code };
    }
  }
  // Fallback
  return {
    productName: slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' '),
    territory: 'GP',
  };
}

// ── Smart price badge ─────────────────────────────────────────────────────────
function SmartBadge({ prices }: { prices: RetailerPrice[] }) {
  if (prices.length < 2) return null;
  const best = prices[0].price;
  const avg = prices.reduce((s, p) => s + p.price, 0) / prices.length;
  const pct = Math.round(((avg - best) / avg) * 100);
  const worst = prices[prices.length - 1].price;
  const spread = worst - best;

  if (pct >= 15) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-300">
        🔻 -{pct}% vs prix moyen
      </div>
    );
  }
  if (spread > 0.5) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-xs font-bold text-amber-300">
        ⚠️ Écart de {formatEur(spread)} entre enseignes
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-3 py-1.5 text-xs font-bold text-emerald-400">
      🔥 Meilleur prix aujourd'hui
    </div>
  );
}

// ── Top-3 price card ──────────────────────────────────────────────────────────
const RANK_MEDAL = ['🥇', '🥈', '🥉'];

function PriceCard({
  p,
  rank,
  barcode,
  territory,
}: {
  p: RetailerPrice;
  rank: number;
  barcode: string;
  territory: string;
}) {
  const url = buildRetailerUrl(p.retailer, barcode);

  const handleClick = () => {
    trackRetailerClick(barcode, p.retailer, territory, p.price);
  };

  return (
    <div
      className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-all
        ${
          p.isBest
            ? 'border-emerald-400/40 bg-emerald-400/[0.08] ring-1 ring-emerald-400/20'
            : 'border-white/8 bg-white/[0.02] hover:border-white/15'
        }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-lg" aria-label={`Rang ${rank}`}>
          {RANK_MEDAL[rank - 1] ?? rank}
        </span>
        <div>
          <div className="text-sm font-semibold text-white">{p.retailer}</div>
          {p.badge && (
            <div className="mt-0.5 text-[10px] font-bold text-emerald-400">{p.badge}</div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={`text-lg font-extrabold tabular-nums ${p.isBest ? 'text-emerald-400' : 'text-white'}`}
        >
          {formatEur(p.price)}
        </span>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            className={`rounded-xl border px-4 py-2 text-xs font-bold transition-all active:scale-95
              ${
                p.isBest
                  ? 'border-emerald-400/60 bg-emerald-400/25 text-emerald-200 shadow-lg shadow-emerald-900/30 hover:bg-emerald-400/35'
                  : 'border-white/20 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white'
              }`}
          >
            {p.isBest ? 'ACHETER →' : 'Voir →'}
          </a>
        )}
      </div>
    </div>
  );
}

// ── Related territory links ────────────────────────────────────────────────────
function TerritoryLinks({
  currentSlug,
  currentTerritory,
}: {
  currentSlug: string;
  currentTerritory: string;
}) {
  const productPart = (() => {
    const t = Object.keys(TERRITORY_SLUG_MAP).find((s) => currentSlug.endsWith(`-${s}`));
    return t ? currentSlug.slice(0, -(t.length + 1)) : currentSlug;
  })();

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {Object.entries(TERRITORY_SLUG_MAP)
        .filter(([, code]) => code !== currentTerritory)
        .map(([tSlug, code]) => (
          <Link
            key={code}
            to={`/prix/${productPart}-${tSlug}`}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-400 transition-all hover:border-emerald-400/30 hover:text-emerald-300"
          >
            {TERRITORY_NAMES[code]}
          </Link>
        ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SEOPrixLocalPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();

  const { productName, territory: parsedTerritory } = useMemo(() => parseSlug(slug), [slug]);

  // URL param overrides parsed territory
  const territory = searchParams.get('territory') ?? parsedTerritory;
  const territoryName = getTerritoryName(territory);
  const [prices, setPrices] = useState<RetailerPrice[]>([]);

  useEffect(() => {
    let cancelled = false;
    getRealPrices(slug, territory).then((data) => {
      if (!cancelled) setPrices(data);
    });
    return () => {
      cancelled = true;
    };
  }, [slug, territory]);

  const bestPrice = prices[0];
  const avgPrice =
    prices.length > 0
      ? Math.round((prices.reduce((s, p) => s + p.price, 0) / prices.length) * 100) / 100
      : 0;
  const maxSavings =
    prices.length > 1
      ? Math.round((prices[prices.length - 1].price - prices[0].price) * 100) / 100
      : 0;

  const angle = useMemo(() => getPageAngle(slug), [slug]);
  const pageIntro = useMemo(
    () => generatePageIntro(productName, territory, angle),
    [productName, territory, angle]
  );
  const priceTip = useMemo(
    () => generatePriceTip(productName, territory, angle),
    [productName, territory, angle]
  );
  const faqItems = useMemo(
    () => generateFaqItems(productName, territory, angle),
    [productName, territory, angle]
  );

  const jsonLd = buildPrixLocalJsonLd(
    productName,
    territory,
    prices.map((p) => ({ retailer: p.retailer, price: p.price }))
  );

  const seoTitle = `Prix ${productName} en ${territoryName} : où payer le moins cher ?`;
  const seoDescription = bestPrice
    ? `Comparez le prix de ${productName} en ${territoryName}. Meilleur prix aujourd'hui : ${formatEur(bestPrice.price)} chez ${bestPrice.retailer}. Économisez jusqu'à ${formatEur(maxSavings)} — ${prices.length} enseignes comparées.`
    : `Comparez le prix de ${productName} en ${territoryName} dans les supermarchés locaux.`;
  const canonical = `${SITE_URL}/prix/${slug}`;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 pb-24 sm:pb-8">
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        canonical={canonical}
        jsonLd={jsonLd}
      />

      <div className="mx-auto max-w-2xl space-y-4">
        {/* Breadcrumb */}
        <nav aria-label="Fil d'Ariane" className="text-xs text-zinc-500">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link to="/" className="hover:text-emerald-400 transition-colors">
                Accueil
              </Link>
            </li>
            <li aria-hidden className="text-zinc-700">
              ›
            </li>
            <li>
              <Link to="/comparateur" className="hover:text-emerald-400 transition-colors">
                Comparateur
              </Link>
            </li>
            <li aria-hidden className="text-zinc-700">
              ›
            </li>
            <li className="text-zinc-300">Prix {productName}</li>
          </ol>
        </nav>

        {/* H1 — question format */}
        <h1 className="text-xl font-bold text-white sm:text-2xl">
          Où acheter {productName} moins cher en {territoryName} ?
        </h1>

        {/* ── Hero: Best price + CTA — visible without scrolling ──────────── */}
        <div className="rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-950/40 to-zinc-900/60 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-500">
                🏆 Meilleur prix aujourd'hui
              </div>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-4xl font-extrabold tabular-nums text-emerald-400">
                  {bestPrice ? formatEur(bestPrice.price) : '—'}
                </span>
                <span className="mb-1 text-sm font-medium text-zinc-400">
                  {bestPrice ? `chez ${bestPrice.retailer}` : 'Chargement…'}
                </span>
              </div>
              {maxSavings > 0.01 && (
                <div className="mt-2">
                  <SmartBadge prices={prices} />
                </div>
              )}
              <div className="mt-2 text-xs text-zinc-500">
                Prix moyen en {territoryName} : {avgPrice > 0 ? formatEur(avgPrice) : '—'}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              {bestPrice && buildRetailerUrl(bestPrice.retailer, '') && (
                <a
                  href={buildRetailerUrl(bestPrice.retailer, '') ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    trackRetailerClick('', bestPrice.retailer, territory, bestPrice.price)
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/60 bg-emerald-400/25 px-6 py-3 text-sm font-extrabold uppercase tracking-wide text-emerald-200 shadow-lg shadow-emerald-900/30 transition-all hover:bg-emerald-400/35 active:scale-95"
                >
                  ACHETER AU MEILLEUR PRIX →
                </a>
              )}
              <Link
                to={`/comparateur?territory=${territory}`}
                className="text-xs text-zinc-500 hover:text-emerald-400 transition-colors text-center sm:text-right"
              >
                Voir tous les produits →
              </Link>
            </div>
          </div>
        </div>

        {/* ── Top 3 comparator (instant decision) ─────────────────────────── */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">
            Comparatif enseignes — {territoryName}
          </h2>
          <div className="flex flex-col gap-2">
            {prices.map((p, i) => (
              <PriceCard key={p.retailer} p={p} rank={i + 1} barcode="" territory={territory} />
            ))}
          </div>
        </div>

        {/* ── FAQ section ──────────────────────────────────────────────────── */}
        <section className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
          <h2 className="mb-3 text-sm font-bold text-white">Questions fréquentes</h2>
          <div className="space-y-2">
            {faqItems.map((item, idx) => (
              <details
                key={idx}
                className="group rounded-lg border border-white/5 bg-white/[0.01] px-4 py-3"
              >
                <summary className="cursor-pointer list-none text-xs font-semibold text-zinc-300 group-open:text-emerald-400">
                  {item.q}
                </summary>
                <p className="mt-2 text-xs leading-relaxed text-zinc-500">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ── Unique SEO content ───────────────────────────────────────────── */}
        <section className="rounded-xl border border-white/5 bg-white/[0.01] p-4">
          <h2 className="sr-only">Informations complémentaires</h2>
          <div className="space-y-3 text-xs leading-relaxed text-zinc-500">
            <p>{pageIntro}</p>
            <p>
              En {territoryName}, les prix sont en moyenne{' '}
              <strong className="text-zinc-300">
                {Math.round((MOCK_PRICE_COEFFICIENTS[territory] ?? 1.15) * 100 - 100)}% plus élevés
              </strong>{' '}
              qu'en France métropolitaine en raison des coûts de transport et de la vie insulaire.
            </p>
            <p className="rounded-lg border border-emerald-400/10 bg-emerald-400/5 p-3 text-emerald-300/80">
              {priceTip}
            </p>
            <p>
              Économisez jusqu'à{' '}
              <strong className="text-emerald-400">{formatEur(maxSavings)}</strong> sur{' '}
              {productName} en {territoryName} en choisissant la bonne enseigne.
            </p>
          </div>
        </section>

        {/* ── Internal linking: other territories ─────────────────────────── */}
        <section className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
            Prix {productName} dans d'autres territoires
          </h2>
          <TerritoryLinks currentSlug={slug} currentTerritory={territory} />
        </section>

        {/* ── Dense internal linking ───────────────────────────────────────── */}
        <InternalLinksSection
          productSlug={slug.replace(/-(?:guadeloupe|martinique|guyane|reunion|mayotte)$/, '')}
          productName={productName}
          territory={territory}
          category="epicerie"
        />

        {/* ── Voir aussi ───────────────────────────────────────────────────── */}
        <section className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">
            Voir aussi
          </h2>
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/moins-cher/${territoryName.toLowerCase().replace(/\s/g, '-')}`}
              className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-400 hover:border-emerald-400/30 hover:text-emerald-300 transition-all"
            >
              💰 Produits moins chers en {territoryName}
            </Link>
            <Link
              to={`/comparateur?territory=${territory}`}
              className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-400 hover:border-white/20 hover:text-white transition-all"
            >
              🔍 Comparateur de prix
            </Link>
            <Link
              to={`/inflation/alimentaire-${territoryName.toLowerCase().replace(/\s/g, '-')}-2026`}
              className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-400 hover:border-white/20 hover:text-white transition-all"
            >
              📈 Inflation {territoryName} 2026
            </Link>
          </div>
        </section>
      </div>

      {/* Sticky conversion bar — mobile only */}
      {bestPrice && (
        <ConversionStickyBar
          bestPrice={bestPrice.price}
          savings={maxSavings}
          retailer={bestPrice.retailer}
          retailerUrl={buildRetailerUrl(bestPrice.retailer, '') ?? null}
          productName={productName}
          territory={territory}
          onCTAClick={() => trackRetailerClick('', bestPrice.retailer, territory, bestPrice.price)}
        />
      )}
    </div>
  );
}
