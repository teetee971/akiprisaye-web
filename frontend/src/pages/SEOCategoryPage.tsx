/**
 * SEOCategoryPage.tsx — SEO-optimized category page
 *
 * Features:
 *   - Dynamic meta tags for category-based searches
 *   - JSON-LD ItemList schema
 *   - Category-specific product listings
 *   - Mobile-first responsive grid
 *   - Filters for territory
 *
 * Routes: /categorie/:slug
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { SEOHead } from '../components/ui/SEOHead';
import { Skeleton } from '../components/ui/Skeleton';
import { formatEur } from '../utils/currency';
import {
  generateCategoryTitle,
  generateCategoryMetaDescription,
  generateCategoryCanonical,
  buildCategoryJsonLd,
  generateProductSlug,
  getTerritoryName,
  TERRITORY_NAMES,
} from '../utils/seoHelpers';
import { getAllCategoryIcons, getFallbackIcon } from '../services/productImageFallback';
import { liveApiFetchJson } from '../services/liveApiClient';
import type { ProductCategory as ProductCategoryType } from '../types/product';

// ── Category mapping (slug → display info) ────────────────────────────────────
interface CategoryInfo {
  slug: string;
  name: string;
  icon: string;
  description: string;
  keywords: string[];
}

const CATEGORY_MAP: Record<string, CategoryInfo> = {
  boissons: {
    slug: 'boissons',
    name: 'Boissons',
    icon: '🥤',
    description: 'Eaux, sodas, jus de fruits, boissons alcoolisées',
    keywords: ['eau', 'soda', 'coca', 'jus', 'bière', 'vin', 'rhum'],
  },
  'produits-laitiers': {
    slug: 'produits-laitiers',
    name: 'Produits Laitiers',
    icon: '🥛',
    description: 'Lait, yaourts, fromages, beurre, crème',
    keywords: ['lait', 'yaourt', 'fromage', 'beurre', 'crème'],
  },
  viande: {
    slug: 'viande',
    name: 'Viande',
    icon: '🥩',
    description: 'Bœuf, porc, poulet, agneau, charcuterie',
    keywords: ['boeuf', 'poulet', 'porc', 'jambon', 'saucisse'],
  },
  poisson: {
    slug: 'poisson',
    name: 'Poisson & Fruits de mer',
    icon: '🐟',
    description: 'Poissons frais, surgelés, fruits de mer',
    keywords: ['poisson', 'thon', 'saumon', 'crevettes', 'moules'],
  },
  'fruits-legumes': {
    slug: 'fruits-legumes',
    name: 'Fruits & Légumes',
    icon: '🥗',
    description: 'Fruits frais, légumes, salades',
    keywords: ['banane', 'pomme', 'tomate', 'carotte', 'salade'],
  },
  'pain-patisserie': {
    slug: 'pain-patisserie',
    name: 'Pain & Pâtisserie',
    icon: '🥖',
    description: 'Baguettes, pains, viennoiseries, gâteaux',
    keywords: ['pain', 'baguette', 'croissant', 'gâteau'],
  },
  epicerie: {
    slug: 'epicerie',
    name: 'Épicerie',
    icon: '🛒',
    description: 'Pâtes, riz, conserves, huiles, épices',
    keywords: ['pâtes', 'riz', 'huile', 'conserve', 'sauce'],
  },
  hygiene: {
    slug: 'hygiene',
    name: 'Hygiène & Beauté',
    icon: '🧴',
    description: 'Savons, shampoings, produits de beauté',
    keywords: ['savon', 'shampoing', 'dentifrice', 'déodorant'],
  },
  entretien: {
    slug: 'entretien',
    name: 'Entretien',
    icon: '🧹',
    description: 'Lessives, produits ménagers, nettoyants',
    keywords: ['lessive', 'liquide vaisselle', 'nettoyant'],
  },
  bebe: {
    slug: 'bebe',
    name: 'Bébé',
    icon: '👶',
    description: 'Couches, lait infantile, petits pots',
    keywords: ['couches', 'lait bébé', 'petits pots', 'pampers'],
  },
  surgeles: {
    slug: 'surgeles',
    name: 'Surgelés',
    icon: '🧊',
    description: 'Produits surgelés, glaces, plats préparés',
    keywords: ['glace', 'surgelé', 'pizza', 'légumes surgelés'],
  },
};

// ── Category products ──────────────────────────────────────────────────────────
interface CategoryProduct {
  id: string;
  name: string;
  brand?: string;
  category: string;
  image?: string;
  minPrice?: number;
  maxPrice?: number;
  storeCount: number;
}

// ── Product card component ────────────────────────────────────────────────────
interface ProductCardProps {
  product: CategoryProduct;
  territory: string;
  categorySlug: string;
}

function ProductCard({ product, territory, categorySlug }: ProductCardProps) {
  const slug = generateProductSlug(product.name, territory);
  const fallback = getFallbackIcon(categorySlug as ProductCategoryType);

  return (
    <Link
      to={`/produit/${product.id}?territory=${territory}`}
      className="group block rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-all hover:border-emerald-400/30 hover:bg-white/[0.05]"
    >
      {/* Product image or fallback */}
      <div className="mb-3 flex h-20 items-center justify-center rounded-lg bg-white/5">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-16 w-16 object-contain"
            loading="lazy"
          />
        ) : (
          <span className="text-4xl">{fallback.icon}</span>
        )}
      </div>

      {/* Product info */}
      <div>
        {product.brand && (
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-0.5">
            {product.brand}
          </div>
        )}
        <h3 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
          {product.name}
        </h3>

        {/* Price range */}
        {product.minPrice != null && (
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-emerald-400">
              {formatEur(product.minPrice)}
            </span>
            {product.maxPrice != null && product.maxPrice !== product.minPrice && (
              <span className="text-xs text-zinc-500">— {formatEur(product.maxPrice)}</span>
            )}
          </div>
        )}

        {/* Store count */}
        <div className="mt-1 text-xs text-zinc-500">
          {product.storeCount} enseigne{product.storeCount > 1 ? 's' : ''}
        </div>
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

// ── Category navigation ───────────────────────────────────────────────────────
interface CategoryNavProps {
  currentSlug: string;
  territory: string;
}

function CategoryNav({ currentSlug, territory }: CategoryNavProps) {
  const categories = Object.values(CATEGORY_MAP);

  return (
    <nav className="mb-6 overflow-x-auto scrollbar-hide">
      <div className="flex gap-2 pb-2">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            to={`/categorie/${cat.slug}?territory=${territory}`}
            className={`flex-shrink-0 rounded-xl border px-3 py-2 text-sm transition-all
              ${
                currentSlug === cat.slug
                  ? 'border-emerald-400/50 bg-emerald-400/20 text-emerald-300'
                  : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:text-white'
              }`}
          >
            <span className="mr-1.5">{cat.icon}</span>
            {cat.name}
          </Link>
        ))}
      </div>
    </nav>
  );
}

// ── Breadcrumbs ───────────────────────────────────────────────────────────────
interface BreadcrumbsProps {
  categoryName: string;
  territory: string;
}

function Breadcrumbs({ categoryName, territory }: BreadcrumbsProps) {
  return (
    <nav aria-label="Fil d'Ariane" className="mb-4 text-xs text-zinc-500">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link to="/" className="hover:text-emerald-400 transition-colors">
            Accueil
          </Link>
        </li>
        <li aria-hidden="true" className="text-zinc-700">
          ›
        </li>
        <li>
          <Link to="/comparateur" className="hover:text-emerald-400 transition-colors">
            Comparateur
          </Link>
        </li>
        <li aria-hidden="true" className="text-zinc-700">
          ›
        </li>
        <li className="text-zinc-300">{categoryName}</li>
      </ol>
    </nav>
  );
}

// ── Main category page ────────────────────────────────────────────────────────
export default function SEOCategoryPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const territory = searchParams.get('territory') ?? 'GP';

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<CategoryProduct[]>([]);

  const categoryInfo = CATEGORY_MAP[slug];

  // Load products when category or territory changes
  useEffect(() => {
    setLoading(true);
    let cancelled = false;

    const loadProducts = async () => {
      if (!slug) {
        if (!cancelled) {
          setProducts([]);
          setLoading(false);
        }
        return;
      }

      try {
        const payload = await liveApiFetchJson<{ products?: CategoryProduct[] }>(
          `/categories/${encodeURIComponent(slug)}/products?territory=${encodeURIComponent(territory)}`,
          {
            incidentReason: 'category_products_api_unavailable',
            timeoutMs: 10000,
          }
        );
        if (!cancelled) {
          setProducts(Array.isArray(payload?.products) ? payload.products : []);
        }
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
  }, [slug, territory]);

  // Handle territory change
  const handleTerritoryChange = (newTerritory: string) => {
    setSearchParams({ territory: newTerritory });
  };

  // Generate SEO data
  const seoTitle = categoryInfo
    ? generateCategoryTitle(categoryInfo.name, territory)
    : 'Catégorie non trouvée';

  const seoDescription = categoryInfo
    ? generateCategoryMetaDescription(categoryInfo.name, territory, products.length)
    : undefined;

  const seoCanonical = categoryInfo ? generateCategoryCanonical(slug, territory) : undefined;

  const categoryJsonLd =
    categoryInfo && products.length > 0
      ? buildCategoryJsonLd(
          categoryInfo.name,
          slug,
          products.map((p) => ({
            name: p.name,
            slug: generateProductSlug(p.name, territory),
            price: p.minPrice,
          })),
          territory
        )
      : null;

  // Category not found
  if (!categoryInfo) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-8">
        <SEOHead
          title="Catégorie non trouvée"
          description="La catégorie demandée n'existe pas."
          noIndex
        />
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Catégorie non trouvée</h1>
          <p className="text-zinc-400 mb-6">Cette catégorie n'existe pas ou a été supprimée.</p>
          <Link
            to="/comparateur"
            className="text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            ← Retour au comparateur
          </Link>

          {/* Show available categories */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-white mb-4">Catégories disponibles</h2>
            <CategoryNav currentSlug="" territory={territory} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8">
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        canonical={seoCanonical}
        jsonLd={categoryJsonLd}
      />

      <div className="mx-auto max-w-4xl">
        {/* Breadcrumbs */}
        <Breadcrumbs categoryName={categoryInfo.name} territory={territory} />

        {/* Category header */}
        <header className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{categoryInfo.icon}</span>
            <div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                Prix {categoryInfo.name} en {getTerritoryName(territory)}
              </h1>
              <p className="text-sm text-zinc-400 mt-1">{categoryInfo.description}</p>
            </div>
          </div>
        </header>

        {/* Territory selector */}
        <div className="mb-6">
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
            Sélectionner un territoire
          </div>
          <TerritorySelector value={territory} onChange={handleTerritoryChange} />
        </div>

        {/* Category navigation */}
        <CategoryNav currentSlug={slug} territory={territory} />

        {/* Products grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <p className="text-zinc-400">
              Aucun produit trouvé dans cette catégorie pour {getTerritoryName(territory)}.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-zinc-500">
              {products.length} produit{products.length > 1 ? 's' : ''} trouvé
              {products.length > 1 ? 's' : ''}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  territory={territory}
                  categorySlug={slug}
                />
              ))}
            </div>
          </>
        )}

        {/* SEO content block */}
        <section className="mt-8 rounded-xl border border-white/5 bg-white/[0.01] p-4">
          <h2 className="text-sm font-bold text-zinc-400 mb-2">
            Comparez les prix des {categoryInfo.name.toLowerCase()} en {getTerritoryName(territory)}
          </h2>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Retrouvez les meilleurs prix pour vos achats de {categoryInfo.name.toLowerCase()} en{' '}
            {getTerritoryName(territory)}. Notre comparateur analyse les prix dans les principales
            enseignes locales (Carrefour, E.Leclerc, Super U, Leader Price…) pour vous aider à
            économiser sur vos courses. Les données sont actualisées quotidiennement.
          </p>
        </section>

        {/* Related categories */}
        <section className="mt-8">
          <h2 className="text-sm font-bold text-zinc-400 mb-3">Autres catégories</h2>
          <div className="flex flex-wrap gap-2">
            {Object.values(CATEGORY_MAP)
              .filter((cat) => cat.slug !== slug)
              .slice(0, 6)
              .map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/categorie/${cat.slug}?territory=${territory}`}
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-400 hover:border-white/20 hover:text-white transition-all"
                >
                  {cat.icon} {cat.name}
                </Link>
              ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// ── Export category data for sitemap generation ───────────────────────────────
export function getAllCategories(): CategoryInfo[] {
  return Object.values(CATEGORY_MAP);
}

export { CATEGORY_MAP };
