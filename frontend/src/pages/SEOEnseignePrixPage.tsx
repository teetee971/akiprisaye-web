/**
 * SEOEnseignePrixPage.tsx — Retailer price page by territory
 *
 * Route: /prix-enseigne/:retailer/:territory
 * Shows retailer profile + top 10 products with prices in a territory.
 */

import { useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SEOHead } from '../components/ui/SEOHead';
import { formatEur } from '../utils/currency';
import { buildRetailerUrl } from '../utils/retailerLinks';
import { trackRetailerClick, trackSEOProductView } from '../utils/priceClickTracker';
import { getTerritoryName, TERRITORY_SLUG_MAP, SITE_URL } from '../utils/seoHelpers';
import InternalLinksSection from '../components/seo/InternalLinksSection';
import ConversionStickyBar from '../components/business/ConversionStickyBar';

// ── Territory slug map ─────────────────────────────────────────────────────────

const TERRITORY_CODE_MAP: Record<string, string> = {
  guadeloupe: 'GP',
  martinique: 'MQ',
  guyane: 'GF',
  reunion: 'RE',
  mayotte: 'YT',
};

const PRICE_COEFF: Record<string, number> = {
  GP: 1.18,
  MQ: 1.16,
  GF: 1.22,
  RE: 1.14,
  YT: 1.25,
};

// ── Retailer profiles ──────────────────────────────────────────────────────────

const RETAILER_PROFILES: Record<
  string,
  {
    displayName: string;
    description: string;
    strengths: string[];
    pricePhilosophy: string;
    icon: string;
  }
> = {
  carrefour: {
    displayName: 'Carrefour',
    description:
      'Grande enseigne généraliste présente dans tous les DOM-TOM, Carrefour offre une large gamme de produits et des promotions régulières.',
    strengths: ['Large gamme', 'Produits bio', 'Click & Collect', 'Marque Carrefour'],
    pricePhilosophy: 'Positionnement milieu de gamme avec des promotions fréquentes.',
    icon: '🛒',
  },
  leclerc: {
    displayName: 'E.Leclerc',
    description:
      "Leader des prix bas dans les DOM, E.Leclerc est systématiquement positionné comme l'enseigne la moins chère sur les produits courants.",
    strengths: ['Meilleur prix PGC', 'Carte fidélité', 'Carburant moins cher', 'MDD compétitives'],
    pricePhilosophy: 'Engagement prix-bas permanent. Référence pour comparer.',
    icon: '🏅',
  },
  'super-u': {
    displayName: 'Super U',
    description:
      'Coopérative présente en Guadeloupe, Martinique et La Réunion, Super U mise sur la qualité de ses marques distributeur.',
    strengths: ['MDD qualité', 'Produits locaux', 'Boucherie', 'Programme fidélité'],
    pricePhilosophy: 'Rapport qualité-prix. Légèrement au-dessus de Leclerc.',
    icon: '🏪',
  },
  'leader-price': {
    displayName: 'Leader Price',
    description:
      'Enseigne de hard-discount du groupe Casino, Leader Price propose des prix très bas sur les essentiels du quotidien.',
    strengths: ['Hard-discount', 'Prix plancher', 'Produits secs', 'Hygiène'],
    pricePhilosophy: 'Discount agressif. Gamme limitée mais prix imbattables.',
    icon: '💰',
  },
  intermarche: {
    displayName: 'Intermarché',
    description:
      'Enseigne reconnue pour sa boucherie et sa poissonnerie de qualité, Intermarché est présente dans plusieurs DOM.',
    strengths: ['Boucherie premium', 'Poissonnerie', 'Produits de terroir', 'Fraîcheur'],
    pricePhilosophy: 'Positionnement premium sur les produits frais.',
    icon: '🥩',
  },
  'simply-market': {
    displayName: 'Simply Market',
    description:
      'Enseigne de supermarché de proximité du groupe Auchan, Simply Market propose un assortiment adapté aux courses du quotidien.',
    strengths: ['Proximité', 'Assortiment ciblé', 'Promotions locales'],
    pricePhilosophy: 'Prix compétitifs sur les produits phares.',
    icon: '🛍️',
  },
};

// ── Mock top products ─────────────────────────────────────────────────────────

const TOP_PRODUCTS_BASE = [
  { slug: 'coca-cola-1-5l', name: 'Coca-Cola 1,5L', category: 'boissons', basePrice: 1.89 },
  {
    slug: 'lait-entier-1l',
    name: 'Lait Entier 1L',
    category: 'produits-laitiers',
    basePrice: 1.15,
  },
  { slug: 'riz-basmati-1kg', name: 'Riz Basmati 1kg', category: 'epicerie', basePrice: 2.49 },
  { slug: 'nutella-400g', name: 'Nutella 400g', category: 'epicerie', basePrice: 3.29 },
  { slug: 'pates-panzani-500g', name: 'Pâtes Panzani 500g', category: 'epicerie', basePrice: 1.39 },
  { slug: 'eau-evian-1-5l', name: 'Eau Évian 1,5L', category: 'boissons', basePrice: 1.09 },
  {
    slug: 'beurre-president-250g',
    name: 'Beurre Président 250g',
    category: 'produits-laitiers',
    basePrice: 2.79,
  },
  { slug: 'huile-tournesol-1l', name: 'Huile Tournesol 1L', category: 'epicerie', basePrice: 2.29 },
  {
    slug: 'yaourt-nature-pack8',
    name: 'Yaourt Nature ×8',
    category: 'produits-laitiers',
    basePrice: 2.09,
  },
  { slug: 'sucre-blanc-1kg', name: 'Sucre Blanc 1kg', category: 'epicerie', basePrice: 1.29 },
];

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SEOEnseignePrixPage() {
  const { retailer = '', territory = '' } = useParams<{ retailer: string; territory: string }>();

  const territoryCode =
    TERRITORY_CODE_MAP[territory] ??
    Object.values(TERRITORY_SLUG_MAP).find(
      (_, i) => Object.keys(TERRITORY_SLUG_MAP)[i] === territory
    ) ??
    'GP';
  const territoryName = getTerritoryName(territoryCode);
  const coeff = PRICE_COEFF[territoryCode] ?? 1.15;

  const profile = RETAILER_PROFILES[retailer] ?? {
    displayName: retailer
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' '),
    description: `Découvrez les prix de ${retailer} en ${territoryName}.`,
    strengths: [],
    pricePhilosophy: '',
    icon: '🏪',
  };

  const retailerUrl = buildRetailerUrl(profile.displayName, '');

  // Add slight retailer delta to prices
  const retailerDelta = retailer.length % 5 === 0 ? 0 : (retailer.length % 5) * 0.08 - 0.15;

  const products = useMemo(
    () =>
      TOP_PRODUCTS_BASE.map((p) => ({
        ...p,
        price: Math.round((p.basePrice * coeff + retailerDelta) * 100) / 100,
      })),
    [coeff, retailerDelta]
  );

  const bestProduct = products[0];

  useEffect(() => {
    trackSEOProductView(retailer, territoryCode, 'enseigne');
  }, [retailer, territoryCode]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Store',
        name: profile.displayName,
        description: profile.description,
        areaServed: { '@type': 'AdministrativeArea', name: territoryName },
      },
      {
        '@type': 'ItemList',
        name: `Top produits ${profile.displayName} en ${territoryName}`,
        numberOfItems: products.length,
        itemListElement: products.map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: p.name,
          url: `${SITE_URL}/prix/${p.slug}-${territory}`,
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 pb-24 sm:pb-8">
      <SEOHead
        title={`Prix ${profile.displayName} en ${territoryName} — Top produits du moment`}
        description={`Découvrez les meilleurs prix chez ${profile.displayName} en ${territoryName}. Top 10 produits comparés, avis clients, philosophie tarifaire et conseils économies.`}
        canonical={`${SITE_URL}/prix-enseigne/${retailer}/${territory}`}
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
              <Link
                to="/comparateur-supermarches-dom"
                className="hover:text-emerald-400 transition-colors"
              >
                Supermarchés DOM
              </Link>
            </li>
            <li aria-hidden className="text-zinc-700">
              ›
            </li>
            <li className="text-zinc-300">
              {profile.displayName} {territoryName}
            </li>
          </ol>
        </nav>

        {/* Hero */}
        <div className="rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-950/40 to-zinc-900/60 p-5">
          <div className="flex items-start gap-4">
            <span className="text-4xl">{profile.icon}</span>
            <div className="flex-1">
              <h1 className="text-xl font-extrabold text-white sm:text-2xl">
                {profile.displayName} en {territoryName}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{profile.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.strengths.map((s) => (
                  <span
                    key={s}
                    className="rounded-md bg-emerald-400/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400"
                  >
                    ✓ {s}
                  </span>
                ))}
              </div>
              {profile.pricePhilosophy && (
                <p className="mt-3 text-xs text-zinc-600 italic">{profile.pricePhilosophy}</p>
              )}
              {retailerUrl && (
                <a
                  href={retailerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    trackRetailerClick('', profile.displayName, territoryCode, bestProduct.price)
                  }
                  className="mt-3 inline-flex items-center gap-2 rounded-xl border border-emerald-400/60 bg-emerald-400/20 px-4 py-2 text-xs font-bold text-emerald-300 transition-all hover:bg-emerald-400/30 active:scale-95"
                >
                  Visiter {profile.displayName} →
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Top products */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">
            Top produits — {profile.displayName} {territoryName}
          </h2>
          <div className="space-y-2">
            {products.map((p, i) => (
              <div
                key={p.slug}
                className={`flex items-center justify-between rounded-lg border px-3 py-2.5 ${
                  i === 0
                    ? 'border-emerald-400/20 bg-emerald-400/[0.04]'
                    : 'border-white/5 bg-white/[0.01]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-600">{i + 1}.</span>
                  <Link
                    to={`/prix/${p.slug}-${territory}`}
                    className="text-xs font-medium text-zinc-300 hover:text-emerald-400 transition-colors"
                  >
                    {p.name}
                  </Link>
                </div>
                <span
                  className={`text-sm font-bold tabular-nums ${i === 0 ? 'text-emerald-400' : 'text-white'}`}
                >
                  {formatEur(p.price)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Internal links */}
        <InternalLinksSection
          productSlug={TOP_PRODUCTS_BASE[0].slug}
          productName={TOP_PRODUCTS_BASE[0].name}
          territory={territoryCode}
          category="epicerie"
        />
      </div>

      <ConversionStickyBar
        bestPrice={bestProduct.price}
        savings={Math.round(bestProduct.price * 0.2 * 100) / 100}
        retailer={profile.displayName}
        retailerUrl={retailerUrl ?? null}
        productName={`${profile.displayName} ${territoryName}`}
        territory={territoryCode}
        onCTAClick={() =>
          trackRetailerClick('', profile.displayName, territoryCode, bestProduct.price)
        }
      />
    </div>
  );
}
