/**
 * PopulairesPage.tsx — Most popular/viewed products page
 *
 * SEO target: "produits populaires guadeloupe", "courses martinique"
 *
 * Features:
 *   - Products ranked by view count (from local tracking)
 *   - Territory filter
 */

import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SEOHead } from '../components/ui/SEOHead';
import { Skeleton } from '../components/ui/Skeleton';
import { formatEur } from '../utils/currency';
import { getTerritoryName, SITE_URL } from '../utils/seoHelpers';
import { liveApiFetchJson } from '../services/liveApiClient';

// ── Popular product type ──────────────────────────────────────────────────────
interface PopularProduct {
  id: string;
  name: string;
  brand?: string;
  category: string;
  price: number;
  viewCount: number;
  rank: number;
  isLocal: boolean;
}

// ── Popular product card ──────────────────────────────────────────────────────
interface ProductCardProps {
  product: PopularProduct;
  territory: string;
}

function ProductCard({ product, territory }: ProductCardProps) {
  const rankColors = {
    1: 'bg-amber-400 text-black',
    2: 'bg-zinc-300 text-black',
    3: 'bg-amber-600 text-white',
  };

  const rankColor = rankColors[product.rank as 1 | 2 | 3] ?? 'bg-white/10 text-zinc-400';

  return (
    <Link
      to={`/produit/${product.id}?territory=${territory}`}
      className="group flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-all hover:border-emerald-400/30 hover:bg-white/[0.05]"
    >
      {/* Rank */}
      <div
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-bold ${rankColor}`}
      >
        {product.rank <= 3
          ? product.rank === 1
            ? '🥇'
            : product.rank === 2
              ? '🥈'
              : '🥉'
          : product.rank}
      </div>

      {/* Product info */}
      <div className="flex-1 min-w-0">
        {product.brand && (
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-0.5">
            {product.brand}
          </div>
        )}
        <h3 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors truncate">
          {product.name}
        </h3>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-zinc-500">{product.category}</span>
          {product.isLocal && (
            <span className="rounded-full bg-emerald-400/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
              Vu récemment
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="text-right flex-shrink-0">
        {product.price > 0 && (
          <div className="text-lg font-bold text-emerald-400">{formatEur(product.price)}</div>
        )}
        <div className="text-xs text-zinc-500">👁️ {product.viewCount.toLocaleString('fr-FR')}</div>
      </div>
    </Link>
  );
}

// ── Territory selector ────────────────────────────────────────────────────────
interface TerritorySelectorProps {
  value: string;
  onChange: (territory: string) => void;
}

function TerritorySelector({ value, onChange }: TerritorySelectorProps) {
  const territories = ['GP', 'MQ', 'GF', 'RE', 'YT'];

  return (
    <div className="flex flex-wrap gap-2">
      {territories.map((code) => (
        <button
          key={code}
          onClick={() => onChange(code)}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all
            ${
              value === code
                ? 'border-emerald-400/50 bg-emerald-400/20 text-emerald-300'
                : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:text-white'
            }`}
        >
          {getTerritoryName(code)}
        </button>
      ))}
    </div>
  );
}

// ── Category filter ───────────────────────────────────────────────────────────
interface CategoryFilterProps {
  categories: string[];
  selected: string | null;
  onChange: (category: string | null) => void;
}

function CategoryFilter({ categories, selected, onChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange(null)}
        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all
          ${
            selected === null
              ? 'border-blue-400/50 bg-blue-400/20 text-blue-300'
              : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:text-white'
          }`}
      >
        Tous
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all
            ${
              selected === cat
                ? 'border-blue-400/50 bg-blue-400/20 text-blue-300'
                : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:text-white'
            }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PopulairesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const territory = searchParams.get('territory') ?? 'GP';

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<PopularProduct[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    let cancelled = false;
    const loadProducts = async () => {
      try {
        const payload = await liveApiFetchJson<{ products?: PopularProduct[] }>(
          `/popular-products?territory=${encodeURIComponent(territory)}`,
          { incidentReason: 'popular_products_api_unavailable', timeoutMs: 10000 }
        );
        if (cancelled) return;
        const list = Array.isArray(payload?.products) ? payload.products : [];
        setProducts(
          list
            .sort((a, b) => b.viewCount - a.viewCount)
            .map((product, idx) => ({ ...product, rank: idx + 1 }))
        );
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadProducts();
    return () => {
      cancelled = true;
    };
  }, [territory]);

  const handleTerritoryChange = (newTerritory: string) => {
    setSearchParams({ territory: newTerritory });
  };

  const territoryName = getTerritoryName(territory);

  // Get unique categories
  const categories = [...new Set(products.map((p) => p.category))].filter((c) => c !== 'Autre');

  // Filter products by category
  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category === selectedCategory)
    : products;

  // SEO structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Produits populaires en ${territoryName}`,
    description: `Top des produits les plus consultés en ${territoryName}`,
    url: `${SITE_URL}/populaires?territory=${territory}`,
    numberOfItems: products.length,
    itemListElement: products.slice(0, 10).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: p.name,
      url: `${SITE_URL}/produit/${p.id}?territory=${territory}`,
    })),
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8">
      <SEOHead
        title={`Produits populaires ${territoryName} — Top courses`}
        description={`Découvrez les produits les plus consultés en ${territoryName}. Top ${products.length} des courses préférées avec comparatif de prix.`}
        canonical={`${SITE_URL}/populaires?territory=${territory}`}
        jsonLd={jsonLd}
      />

      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <header className="mb-6">
          <nav className="text-xs text-zinc-500 mb-4">
            <Link to="/" className="hover:text-emerald-400 transition-colors">
              Accueil
            </Link>
            <span className="mx-2">›</span>
            <span className="text-zinc-300">Produits populaires</span>
          </nav>

          <h1 className="text-2xl font-bold text-white sm:text-3xl mb-2">
            🔥 Produits populaires en {territoryName}
          </h1>
          <p className="text-sm text-zinc-400">
            Les produits les plus consultés par les consommateurs
          </p>
        </header>

        {/* Territory selector */}
        <div className="mb-4">
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
            Territoire
          </div>
          <TerritorySelector value={territory} onChange={handleTerritoryChange} />
        </div>

        {/* Category filter */}
        {!loading && categories.length > 0 && (
          <div className="mb-6">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
              Filtrer par catégorie
            </div>
            <CategoryFilter
              categories={categories}
              selected={selectedCategory}
              onChange={setSelectedCategory}
            />
          </div>
        )}

        {/* Products list */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <p className="text-zinc-400">Aucun produit trouvé.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} territory={territory} />
            ))}
          </div>
        )}

        {/* SEO content */}
        <section className="mt-8 rounded-xl border border-white/5 bg-white/[0.01] p-4">
          <h2 className="text-sm font-bold text-zinc-400 mb-2">
            🛒 Les courses préférées en {territoryName}
          </h2>
          <div className="text-xs text-zinc-500 leading-relaxed space-y-2">
            <p>
              Ce classement reflète les produits les plus consultés par les utilisateurs de notre
              comparateur en {territoryName}. Il vous permet de découvrir les produits phares et de
              comparer facilement leurs prix dans les différentes enseignes.
            </p>
            <p>
              Les données sont mises à jour en temps réel et intègrent également vos consultations
              personnelles (marquées "Vu récemment").
            </p>
          </div>
        </section>

        {/* Related links */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/top-economies"
            className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-400 hover:border-emerald-400/30 hover:text-emerald-400 transition-all"
          >
            💰 Top économies
          </Link>
          <Link
            to="/tendances"
            className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-400 hover:border-emerald-400/30 hover:text-emerald-400 transition-all"
          >
            📈 Tendances
          </Link>
          <Link
            to="/comparateur"
            className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-400 hover:border-emerald-400/30 hover:text-emerald-400 transition-all"
          >
            🔍 Comparateur
          </Link>
        </div>
      </div>
    </div>
  );
}
