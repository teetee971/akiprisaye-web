/**
 * SEOMoinsChersPage.tsx — Cheapest products intent page
 *
 * Route: /moins-cher/:territory  (e.g. /moins-cher/guadeloupe)
 * Route: /moins-cher/:territory/:category  (e.g. /moins-cher/guadeloupe/boissons)
 *
 * Targets long-tail queries like:
 *   "produits moins chers guadeloupe"
 *   "où faire ses courses moins cher martinique"
 *   "top offres guadeloupe aujourd'hui"
 *
 * Features:
 *   - Schema.org ItemList JSON-LD
 *   - Top 10 best prices of the day
 *   - Category filter tabs
 *   - Smart badges (🔥 Meilleur prix, 🔻 -X% vs moyenne)
 *   - Aggressive CTAs: ACHETER AU MEILLEUR PRIX
 *   - Internal linking: comparator, category pages, price pages
 */

import { useMemo, useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SEOHead } from '../components/ui/SEOHead';
import { formatEur } from '../utils/currency';
import { buildRetailerUrl } from '../utils/retailerLinks';
import { trackRetailerClick } from '../utils/priceClickTracker';
import {
  getTerritoryName,
  TERRITORY_NAMES,
  TERRITORY_SLUG_MAP,
  buildMoinsChersJsonLd,
  SITE_URL,
} from '../utils/seoHelpers';

// ── Territory code resolver ────────────────────────────────────────────────────
function resolveTerritoryCode(slug: string): string {
  return TERRITORY_SLUG_MAP[slug] ?? 'GP';
}

// ── Category tabs ─────────────────────────────────────────────────────────────

/** Estimated price premium vs hexagone per territory (ratio: 1.0 = same price) */
const TERRITORY_PRICE_COEFF: Record<string, number> = {
  GP: 1.4,
  MQ: 1.42,
  GF: 1.38,
  RE: 1.35,
  YT: 1.5,
  BL: 1.6,
  MF: 1.55,
  PM: 1.45,
};

const CATEGORIES = [
  { slug: 'all', name: 'Tout', icon: '🛒' },
  { slug: 'boissons', name: 'Boissons', icon: '🥤' },
  { slug: 'epicerie', name: 'Épicerie', icon: '🥫' },
  { slug: 'produits-laitiers', name: 'Produits Laitiers', icon: '🥛' },
  { slug: 'viande', name: 'Viande', icon: '🥩' },
  { slug: 'hygiene', name: 'Hygiène', icon: '🧴' },
  { slug: 'fruits-legumes', name: 'Fruits & Légumes', icon: '🥗' },
  { slug: 'bebe', name: 'Bébé', icon: '👶' },
];

// ── Best deal types ───────────────────────────────────────────────────────────
interface BestDeal {
  id: string;
  name: string;
  price: number;
  avgPrice: number;
  retailer: string;
  category: string;
  savings: number;
  pct: number;
  isFlash: boolean;
}

/** Category slug mapping from catalogue categories to page slugs */
const CAT_SLUG_MAP: Record<string, string> = {
  BOISSONS: 'boissons',
  ÉPICERIE: 'epicerie',
  'ULTRA FRAIS': 'produits-laitiers',
  CHARCUTERIE: 'viande',
  BOUCHERIE: 'viande',
  POISSONNERIE: 'viande',
  HYGIÈNE: 'hygiene',
  'FRUITS ET LÉGUMES': 'fruits-legumes',
  BÉBÉ: 'bebe',
};

/**
 * Build best deals from real catalogue data.
 * For each product, "price" is its real price, "avgPrice" is the category average.
 * Sorted by savings percentage descending.
 */
async function getRealDeals(territory: string, categoryFilter: string): Promise<BestDeal[]> {
  const { getCatalogue, nameToSlug } = await import('../services/realDataService');
  const catalogue = await getCatalogue();
  if (catalogue.length === 0) return [];

  // Compute per-category averages
  const catTotals: Record<string, { sum: number; count: number }> = {};
  for (const p of catalogue) {
    const c = p.category;
    if (!catTotals[c]) catTotals[c] = { sum: 0, count: 0 };
    catTotals[c].sum += p.price;
    catTotals[c].count += 1;
  }
  const catAvg: Record<string, number> = {};
  for (const [c, { sum, count }] of Object.entries(catTotals)) {
    catAvg[c] = sum / count;
  }

  const deals = catalogue
    .map((p) => {
      const avg = catAvg[p.category] ?? p.price;
      const savings = +(avg - p.price).toFixed(2);
      const pct = avg > 0 ? Math.round((savings / avg) * 100) : 0;
      const catPageSlug = CAT_SLUG_MAP[p.category] ?? 'epicerie';
      return {
        id: nameToSlug(p.name),
        name: p.name,
        price: p.price,
        avgPrice: +avg.toFixed(2),
        retailer: p.store,
        category: catPageSlug,
        savings,
        pct,
        isFlash: pct > 20,
      };
    })
    .filter((d) => d.savings > 0 && d.pct > 0);

  const filtered =
    categoryFilter && categoryFilter !== 'all'
      ? deals.filter((d) => d.category === categoryFilter)
      : deals;

  return filtered.sort((a, b) => b.pct - a.pct).slice(0, 12);
}

// ── Deal card ─────────────────────────────────────────────────────────────────
function DealCard({ deal, territory }: { deal: BestDeal; territory: string }) {
  const url = buildRetailerUrl(deal.retailer, '');

  const handleClick = () => {
    trackRetailerClick(deal.id, deal.retailer, territory, deal.price);
  };

  return (
    <div className="group flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 transition-all hover:border-white/15 hover:bg-white/[0.04]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-semibold text-white">{deal.name}</span>
          {deal.isFlash && (
            <span className="rounded-md border border-rose-400/30 bg-rose-400/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-rose-300">
              🔥 Flash
            </span>
          )}
          {deal.pct >= 15 && (
            <span className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-emerald-300">
              🔻 -{deal.pct}%
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
          <span>{deal.retailer}</span>
          <span aria-hidden className="text-zinc-700">
            ·
          </span>
          <span className="line-through">{formatEur(deal.avgPrice)}</span>
        </div>
      </div>

      <div className="ml-4 flex flex-shrink-0 items-center gap-3">
        <div className="text-right">
          <div className="text-lg font-extrabold tabular-nums text-emerald-400">
            {formatEur(deal.price)}
          </div>
          <div className="mt-0.5 rounded bg-emerald-400/10 px-1.5 py-0.5 text-xs font-bold text-emerald-300">
            −{formatEur(deal.savings)}
          </div>
        </div>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            className="flex-shrink-0 rounded-xl border border-emerald-400/50 bg-emerald-400/20 px-3 py-2 text-xs font-extrabold uppercase text-emerald-300 transition-all hover:bg-emerald-400/30 active:scale-95"
          >
            VOIR →
          </a>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SEOMoinsChersPage() {
  const { territory: tSlug = 'guadeloupe', category: catSlug } = useParams<{
    territory: string;
    category?: string;
  }>();

  const territory = resolveTerritoryCode(tSlug);
  const territoryName = getTerritoryName(territory);

  const [activeCategory, setActiveCategory] = useState(catSlug ?? 'all');
  const [allDeals, setAllDeals] = useState<BestDeal[]>([]);

  useEffect(() => {
    let cancelled = false;
    getRealDeals(territory, activeCategory).then((data) => {
      if (!cancelled) setAllDeals(data);
    });
    return () => {
      cancelled = true;
    };
  }, [territory, activeCategory]);

  const deals = allDeals;

  const jsonLd = buildMoinsChersJsonLd(
    territory,
    deals.slice(0, 10).map((d) => ({ name: d.name, price: d.price, retailer: d.retailer }))
  );

  const seoTitle = `Produits les moins chers en ${territoryName} — Top offres du jour`;
  const seoDescription = `Découvrez les ${deals.length} meilleures offres du jour en ${territoryName}. Économisez jusqu'à ${deals[0]?.pct ?? 20}% sur vos courses avec notre comparateur.`;
  const canonical = catSlug
    ? `${SITE_URL}/moins-cher/${tSlug}/${catSlug}`
    : `${SITE_URL}/moins-cher/${tSlug}`;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8">
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
            <li className="text-zinc-300">Moins chers · {territoryName}</li>
          </ol>
        </nav>

        {/* H1 */}
        <h1 className="text-xl font-bold text-white sm:text-2xl">
          💰 Produits les moins chers en {territoryName} — Aujourd'hui
        </h1>

        {/* ── Stats banner ─────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-950/40 to-zinc-900/60 p-4">
          <div className="flex flex-wrap items-center gap-4 sm:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-500">
                🔥 Meilleures offres du jour
              </div>
              <div className="mt-1 text-2xl font-extrabold text-white">
                {deals.length} produits en promotion
              </div>
              <div className="mt-1 text-sm text-zinc-400">
                Jusqu'à <span className="font-bold text-emerald-400">-{deals[0]?.pct ?? 20}%</span>{' '}
                de réduction
              </div>
            </div>
            <Link
              to="/comparateur"
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/60 bg-emerald-400/25 px-5 py-2.5 text-sm font-extrabold uppercase tracking-wide text-emerald-200 shadow-lg shadow-emerald-900/30 transition-all hover:bg-emerald-400/35 active:scale-95"
            >
              COMPARER TOUS LES PRIX →
            </Link>
          </div>
        </div>

        {/* ── Category tabs ─────────────────────────────────────────────────── */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => setActiveCategory(cat.slug)}
              className={`flex-shrink-0 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all
                ${
                  activeCategory === cat.slug
                    ? 'border-emerald-400/40 bg-emerald-400/15 text-emerald-300'
                    : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:text-white'
                }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* ── Deals list ────────────────────────────────────────────────────── */}
        <div className="space-y-2">
          {deals.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">
              Aucun produit trouvé dans cette catégorie.
            </p>
          ) : (
            deals.map((deal) => <DealCard key={deal.id} deal={deal} territory={territory} />)
          )}
        </div>

        {/* ── SEO content ──────────────────────────────────────────────────── */}
        <section className="rounded-xl border border-white/5 bg-white/[0.01] p-4">
          <h2 className="mb-2 text-sm font-bold text-zinc-300">
            Où faire ses courses moins cher en {territoryName} ?
          </h2>
          <div className="space-y-2 text-xs leading-relaxed text-zinc-500">
            <p>
              En {territoryName}, les prix alimentaires sont en moyenne{' '}
              <strong className="text-zinc-400">
                {Math.round((TERRITORY_PRICE_COEFF[territory] ?? 1.15) * 100 - 100)}% plus élevés
              </strong>{' '}
              qu'en France métropolitaine. Notre comparateur analyse quotidiennement les prix dans
              toutes les enseignes locales (Carrefour, E.Leclerc, Super U, Leader Price,
              Intermarché) pour vous aider à trouver les meilleures offres.
            </p>
            <p>
              En comparant avant vos courses, vous pouvez économiser jusqu'à{' '}
              <strong className="text-emerald-400">
                {deals[0] ? formatEur(deals[0].savings) : '2 €'}
              </strong>{' '}
              par produit et réaliser des économies substantielles sur votre budget alimentaire
              mensuel.
            </p>
          </div>
        </section>

        {/* ── Internal links: other territories ───────────────────────────── */}
        <section className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
            Produits moins chers dans d'autres territoires
          </h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(TERRITORY_SLUG_MAP)
              .filter(([, code]) => code !== territory)
              .map(([tSlugOther, code]) => (
                <Link
                  key={code}
                  to={`/moins-cher/${tSlugOther}`}
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-400 hover:border-emerald-400/30 hover:text-emerald-300 transition-all"
                >
                  {TERRITORY_NAMES[code]}
                </Link>
              ))}
          </div>
        </section>

        {/* ── Internal links: related pages ───────────────────────────────── */}
        <section className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">
            Voir aussi
          </h2>
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/comparateur?territory=${territory}`}
              className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-400 hover:border-emerald-400/30 hover:text-emerald-300 transition-all"
            >
              🔍 Comparateur de prix {territoryName}
            </Link>
            <Link
              to={`/inflation/alimentaire-${tSlug}-2026`}
              className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-400 hover:border-white/20 hover:text-white transition-all"
            >
              📈 Inflation alimentaire {territoryName} 2026
            </Link>
            <Link
              to="/top-economies"
              className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-400 hover:border-white/20 hover:text-white transition-all"
            >
              💡 Top économies
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
