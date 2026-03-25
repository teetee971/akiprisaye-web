/**
 * SEOBrandPage.tsx — Brand price page
 *
 * Route: /marque/:slug  (e.g. /marque/coca-cola-guadeloupe)
 * Shows brand products with live prices in a given territory.
 */

import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SEOHead } from '../components/ui/SEOHead';
import { formatEur } from '../utils/currency';
import { buildRetailerUrl } from '../utils/retailerLinks';
import { trackRetailerClick, trackSEOProductView } from '../utils/priceClickTracker';
import { getTerritoryName, TERRITORY_SLUG_MAP, SITE_URL } from '../utils/seoHelpers';
import InternalLinksSection from '../components/seo/InternalLinksSection';
import ConversionStickyBar from '../components/business/ConversionStickyBar';
import { liveApiFetchJson } from '../services/liveApiClient';

// ── Territory slug names ──────────────────────────────────────────────────────

const TERRITORY_SLUG_NAMES: Record<string, string> = {
  GP: 'guadeloupe', MQ: 'martinique', GF: 'guyane', RE: 'reunion', YT: 'mayotte',
};

const RETAILERS = ['E.Leclerc', 'Carrefour', 'Super U', 'Leader Price', 'Intermarché'];

// ── Slug parser ────────────────────────────────────────────────────────────────

function parseBrandSlug(slug: string): { brandSlug: string; brandName: string; territory: string } {
  const territoryEntries = Object.entries(TERRITORY_SLUG_MAP).sort(
    (a, b) => b[0].length - a[0].length,
  );
  for (const [tSlug, code] of territoryEntries) {
    if (slug.endsWith(`-${tSlug}`)) {
      const brandPart = slug.slice(0, -(tSlug.length + 1));
      return {
        brandSlug: brandPart,
        brandName: brandPart.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        territory: code,
      };
    }
  }
  return { brandSlug: slug, brandName: slug, territory: 'GP' };
}

// ── Product price card ────────────────────────────────────────────────────────

function BrandProductCard({
  product,
  territory,
}: {
  product: { slug: string; name: string; price: number; retailer?: string };
  territory: string;
}) {
  const price = product.price;
  const retailer = product.retailer || RETAILERS[product.slug.length % RETAILERS.length];
  const url = buildRetailerUrl(retailer, '');

  const tSlug = TERRITORY_SLUG_NAMES[territory] ?? 'guadeloupe';

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
      <div className="flex items-center justify-between">
        <Link
          to={`/prix/${product.slug}-${tSlug}`}
          className="text-sm font-medium text-zinc-300 hover:text-emerald-400 transition-colors"
        >
          {product.name}
        </Link>
        <span className="text-base font-extrabold tabular-nums text-emerald-400">
          {formatEur(price)}
        </span>
      </div>
      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-[11px] text-zinc-600">chez {retailer}</span>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackRetailerClick('', retailer, territory, price)}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-bold text-zinc-400 transition-all hover:border-emerald-400/30 hover:text-emerald-300"
          >
            Voir →
          </a>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SEOBrandPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const [products, setProducts] = useState<Array<{ slug: string; name: string; category: string; price: number; retailer?: string }>>([]);

  const { brandSlug, brandName, territory } = useMemo(() => parseBrandSlug(slug), [slug]);
  const territoryName = getTerritoryName(territory);
  const tSlug = TERRITORY_SLUG_NAMES[territory] ?? 'guadeloupe';

  const cheapestProduct = products.reduce<{ price: number; retailer: string | null } | null>((best, product) => {
    if (!Number.isFinite(product.price) || product.price <= 0) return best;
    if (!best || product.price < best.price) {
      return { price: product.price, retailer: product.retailer ?? null };
    }
    return best;
  }, null);

  const bestPrice = cheapestProduct?.price ?? 0;

  useEffect(() => {
    let cancelled = false;
    const loadProducts = async () => {
      try {
        const payload = await liveApiFetchJson<{ products?: Array<{ slug: string; name: string; category: string; price: number; retailer?: string }> }>(
          `/brands/${encodeURIComponent(brandSlug)}/products?territory=${encodeURIComponent(territory)}`,
          { incidentReason: 'brand_products_api_unavailable', timeoutMs: 10000 },
        );
        if (cancelled) return;
        setProducts(Array.isArray(payload?.products) ? payload.products : []);
      } catch {
        if (!cancelled) setProducts([]);
      }
    };
    void loadProducts();
    return () => {
      cancelled = true;
    };
  }, [brandSlug, territory]);

  useMemo(() => {
    trackSEOProductView(brandSlug, territory, 'brand');
  }, [brandSlug, territory]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Brand',
        name: brandName,
      },
      {
        '@type': 'ItemList',
        name: `Produits ${brandName} en ${territoryName}`,
        numberOfItems: products.length,
        itemListElement: products.map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: p.name,
          url: `${SITE_URL}/prix/${p.slug}-${tSlug}`,
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 py-8 pb-24 sm:pb-8">
      <SEOHead
        title={`Prix ${brandName} en ${territoryName} — Tous les produits comparés`}
        description={`Comparez les prix de tous les produits ${brandName} en ${territoryName}. Meilleur prix dès ${formatEur(bestPrice)}. ${products.length} produits comparés dans ${RETAILERS.length} enseignes.`}
        canonical={`${SITE_URL}/marque/${slug}`}
        jsonLd={jsonLd}
      />

      <div className="mx-auto max-w-2xl space-y-4">

        {/* Breadcrumb */}
        <nav aria-label="Fil d'Ariane" className="text-xs text-zinc-500">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link to="/" className="hover:text-emerald-400 transition-colors">Accueil</Link></li>
            <li aria-hidden className="text-zinc-700">›</li>
            <li><Link to="/comparateur" className="hover:text-emerald-400 transition-colors">Comparateur</Link></li>
            <li aria-hidden className="text-zinc-700">›</li>
            <li className="text-zinc-300">{brandName}</li>
          </ol>
        </nav>

        {/* Hero */}
        <div className="rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-950/40 to-zinc-900/60 p-5">
          <h1 className="text-xl font-extrabold text-white sm:text-2xl">
            Prix {brandName} en {territoryName}
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Comparez tous les produits {brandName} disponibles en {territoryName}.
            Prix mis à jour quotidiennement dans {RETAILERS.length} enseignes.
          </p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xs text-zinc-500">Meilleur prix à partir de</span>
            <span className="text-2xl font-extrabold text-emerald-400">{formatEur(bestPrice)}</span>
          </div>
        </div>

        {/* Product list */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">
            Produits {brandName} — {territoryName}
          </h2>
          <div className="space-y-2">
            {products.map((p) => (
              <BrandProductCard key={p.slug} product={p} territory={territory} />
            ))}
          </div>
        </div>

        {/* Internal links */}
        <InternalLinksSection
          productSlug={products[0]?.slug ?? brandSlug}
          productName={`${brandName} ${products[0]?.name ?? ''}`}
          territory={territory}
          category={products[0]?.category ?? 'epicerie'}
        />

      </div>

      <ConversionStickyBar
        bestPrice={bestPrice}
        savings={null}
        retailer={cheapestProduct?.retailer ?? null}
        retailerUrl={cheapestProduct?.retailer ? buildRetailerUrl(cheapestProduct.retailer, '') ?? null : null}
        productName={`${brandName} ${territoryName}`}
        territory={territory}
        onCTAClick={() => {
          if (cheapestProduct?.retailer) trackRetailerClick('', cheapestProduct.retailer, territory, bestPrice);
        }}
      />
    </div>
  );
}
