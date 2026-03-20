/**
 * SEOBrandPage.tsx — Brand price page
 *
 * Route: /marque/:slug  (e.g. /marque/coca-cola-guadeloupe)
 * Shows brand products with mock prices in a given territory.
 */

import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SEOHead } from '../components/ui/SEOHead';
import { formatEur } from '../utils/currency';
import { buildRetailerUrl } from '../utils/retailerLinks';
import { trackRetailerClick, trackSEOProductView } from '../utils/priceClickTracker';
import { getTerritoryName, TERRITORY_SLUG_MAP, SITE_URL } from '../utils/seoHelpers';
import InternalLinksSection from '../components/seo/InternalLinksSection';
import ConversionStickyBar from '../components/business/ConversionStickyBar';

// ── Territory slug names ──────────────────────────────────────────────────────

const TERRITORY_SLUG_NAMES: Record<string, string> = {
  GP: 'guadeloupe', MQ: 'martinique', GF: 'guyane', RE: 'reunion', YT: 'mayotte',
};

// ── Brand catalog ─────────────────────────────────────────────────────────────

const BRAND_PRODUCTS: Record<string, Array<{ slug: string; name: string; category: string; basePrice: number }>> = {
  'coca-cola': [
    { slug: 'coca-cola-1-5l', name: 'Coca-Cola 1,5L', category: 'boissons', basePrice: 1.89 },
    { slug: 'coca-cola-33cl-pack6', name: 'Coca-Cola 33cl ×6', category: 'boissons', basePrice: 4.20 },
    { slug: 'fanta-1-5l', name: 'Fanta 1,5L', category: 'boissons', basePrice: 1.75 },
    { slug: 'sprite-1-5l', name: 'Sprite 1,5L', category: 'boissons', basePrice: 1.75 },
    { slug: 'schweppes-1-5l', name: 'Schweppes 1,5L', category: 'boissons', basePrice: 1.80 },
  ],
  'nutella': [
    { slug: 'nutella-400g', name: 'Nutella 400g', category: 'epicerie', basePrice: 3.29 },
    { slug: 'nutella-750g', name: 'Nutella 750g', category: 'epicerie', basePrice: 5.49 },
  ],
  'nestle': [
    { slug: 'nesquik-chocolat-900g', name: 'Nesquik 900g', category: 'boissons', basePrice: 4.99 },
    { slug: 'kit-kat-4db', name: 'Kit Kat ×4', category: 'epicerie', basePrice: 1.89 },
  ],
  'president': [
    { slug: 'beurre-president-250g', name: 'Beurre Président 250g', category: 'produits-laitiers', basePrice: 2.79 },
    { slug: 'creme-fraiche-president-20cl', name: 'Crème fraîche Président 20cl', category: 'produits-laitiers', basePrice: 1.09 },
  ],
  'panzani': [
    { slug: 'pates-panzani-500g', name: 'Pâtes Panzani 500g', category: 'epicerie', basePrice: 1.39 },
    { slug: 'pates-coquillettes-500g', name: 'Coquillettes 500g', category: 'epicerie', basePrice: 1.29 },
  ],
  'evian': [
    { slug: 'eau-evian-1-5l', name: 'Eau Évian 1,5L', category: 'boissons', basePrice: 1.09 },
    { slug: 'eau-evian-50cl-pack6', name: 'Eau Évian 50cl ×6', category: 'boissons', basePrice: 3.49 },
  ],
  'ariel': [
    { slug: 'lessive-ariel-30d', name: 'Lessive Ariel 30 doses', category: 'entretien', basePrice: 12.99 },
  ],
  'pampers': [
    { slug: 'couches-pampers-t3', name: 'Couches Pampers T3 ×44', category: 'bebe', basePrice: 15.99 },
    { slug: 'couches-pampers-t4', name: 'Couches Pampers T4 ×40', category: 'bebe', basePrice: 16.99 },
  ],
};

const PRICE_COEFF: Record<string, number> = {
  GP: 1.18, MQ: 1.16, GF: 1.22, RE: 1.14, YT: 1.25,
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
  product: { slug: string; name: string; basePrice: number };
  territory: string;
}) {
  const coeff = PRICE_COEFF[territory] ?? 1.15;
  const price = Math.round(product.basePrice * coeff * 100) / 100;
  const retailer = RETAILERS[product.slug.length % RETAILERS.length];
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

  const { brandSlug, brandName, territory } = useMemo(() => parseBrandSlug(slug), [slug]);
  const territoryName = getTerritoryName(territory);
  const tSlug = TERRITORY_SLUG_NAMES[territory] ?? 'guadeloupe';

  const products = BRAND_PRODUCTS[brandSlug] ?? [
    { slug: brandSlug, name: brandName, category: 'epicerie', basePrice: 2.99 },
  ];

  const coeff = PRICE_COEFF[territory] ?? 1.15;
  const bestPrice = Math.round(products[0].basePrice * coeff * 100) / 100;

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
        savings={Math.round(bestPrice * 0.15 * 100) / 100}
        retailer={RETAILERS[0]}
        retailerUrl={buildRetailerUrl(RETAILERS[0], '') ?? null}
        productName={`${brandName} ${territoryName}`}
        territory={territory}
        onCTAClick={() => trackRetailerClick('', RETAILERS[0], territory, bestPrice)}
      />
    </div>
  );
}
