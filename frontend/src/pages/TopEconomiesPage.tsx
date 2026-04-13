/**
 * TopEconomiesPage.tsx — Page showing products with best savings potential
 *
 * SEO target: "économies courses guadeloupe", "meilleures promotions DOM"
 *
 * Features:
 *   - Products sorted by price difference (max savings)
 *   - Territory filter
 *   - SEO optimized meta tags
 */

import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SEOHead } from '../components/ui/SEOHead';
import { Skeleton } from '../components/ui/Skeleton';
import { formatEur } from '../utils/currency';
import {
  generateProductSlug,
  getTerritoryName,
  SITE_URL,
} from '../utils/seoHelpers';
import { getTopViewedProducts } from '../utils/priceClickTracker';

// ── Mock data for top savings (to be replaced with API) ───────────────────────
interface SavingsProduct {
  id: string;
  name: string;
  brand?: string;
  category: string;
  minPrice: number;
  maxPrice: number;
  savings: number;
  bestRetailer: string;
  storeCount: number;
}

function getMockSavingsProducts(territory: string): SavingsProduct[] {
  // In production, this would fetch from API sorted by savings potential
  const products = [
    { id: '1', name: 'Riz Uncle Ben\'s 1kg', brand: 'Uncle Ben\'s', category: 'Épicerie', minPrice: 2.45, maxPrice: 4.29, bestRetailer: 'Leader Price' },
    { id: '2', name: 'Coca-Cola 1.5L', brand: 'Coca-Cola', category: 'Boissons', minPrice: 1.89, maxPrice: 2.99, bestRetailer: 'Carrefour' },
    { id: '3', name: 'Couches Pampers T4 x60', brand: 'Pampers', category: 'Bébé', minPrice: 14.99, maxPrice: 22.50, bestRetailer: 'Super U' },
    { id: '4', name: 'Huile Tournesol 1L', category: 'Épicerie', minPrice: 2.15, maxPrice: 3.49, bestRetailer: 'E.Leclerc' },
    { id: '5', name: 'Yaourt Nature x12', brand: 'Danone', category: 'Produits Laitiers', minPrice: 3.45, maxPrice: 4.99, bestRetailer: 'Carrefour' },
    { id: '6', name: 'Lessive Skip 40 doses', brand: 'Skip', category: 'Entretien', minPrice: 8.99, maxPrice: 13.50, bestRetailer: 'E.Leclerc' },
    { id: '7', name: 'Café Carte Noire 250g', brand: 'Carte Noire', category: 'Épicerie', minPrice: 4.25, maxPrice: 6.49, bestRetailer: 'Leader Price' },
    { id: '8', name: 'Eau Cristaline 6x1.5L', brand: 'Cristaline', category: 'Boissons', minPrice: 2.19, maxPrice: 3.29, bestRetailer: 'Super U' },
  ].map((p, i) => ({
    ...p,
    savings: +(p.maxPrice - p.minPrice).toFixed(2),
    storeCount: 3 + Math.floor(Math.random() * 5),
  }));
  
  return products.sort((a, b) => b.savings - a.savings);
}

// ── Savings card component ────────────────────────────────────────────────────
interface SavingsCardProps {
  product: SavingsProduct;
  territory: string;
  rank: number;
}

function SavingsCard({ product, territory, rank }: SavingsCardProps) {
  const savingsPercent = ((product.savings / product.maxPrice) * 100).toFixed(0);
  
  return (
    <Link
      to={`/produit/${product.id}?territory=${territory}`}
      className="group relative rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-all hover:border-emerald-400/30 hover:bg-white/[0.05]"
    >
      {/* Rank badge */}
      <div className="absolute -top-2 -left-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400 text-sm font-bold text-black">
        {rank}
      </div>
      
      {/* Savings badge */}
      <div className="absolute -top-2 -right-2 rounded-full bg-rose-500 px-2 py-0.5 text-xs font-bold text-white">
        -{savingsPercent}%
      </div>
      
      <div className="mt-2">
        {product.brand && (
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-0.5">
            {product.brand}
          </div>
        )}
        <h3 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
          {product.name}
        </h3>
        <div className="text-xs text-zinc-500">{product.category}</div>
        
        {/* Price comparison */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xl font-bold text-emerald-400">
            {formatEur(product.minPrice)}
          </span>
          <span className="text-sm text-zinc-500 line-through">
            {formatEur(product.maxPrice)}
          </span>
        </div>
        
        {/* Savings highlight */}
        <div className="mt-2 rounded-lg bg-emerald-400/10 px-3 py-2">
          <div className="text-sm font-bold text-emerald-400">
            💰 Économie : {formatEur(product.savings)}
          </div>
          <div className="text-xs text-emerald-300/70">
            Meilleur prix chez {product.bestRetailer}
          </div>
        </div>
        
        <div className="mt-2 text-xs text-zinc-500">
          Comparé dans {product.storeCount} enseignes
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
            ${value === code
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

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TopEconomiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const territory = searchParams.get('territory') ?? 'GP';
  
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<SavingsProduct[]>([]);
  
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setProducts(getMockSavingsProducts(territory));
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [territory]);
  
  const handleTerritoryChange = (newTerritory: string) => {
    setSearchParams({ territory: newTerritory });
  };
  
  const territoryName = getTerritoryName(territory);
  const totalSavings = products.reduce((sum, p) => sum + p.savings, 0);
  
  // SEO structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Meilleures économies courses en ${territoryName}`,
    description: `Top des produits avec les plus grosses économies possibles en ${territoryName}`,
    url: `${SITE_URL}/top-economies?territory=${territory}`,
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
        title={`Top économies courses en ${territoryName} — Comparateur`}
        description={`Découvrez les meilleures économies sur vos courses en ${territoryName}. Jusqu'à ${formatEur(products[0]?.savings || 7)} d'économie par produit. Comparez les prix dans les supermarchés locaux.`}
        canonical={`${SITE_URL}/top-economies?territory=${territory}`}
        jsonLd={jsonLd}
      />
      
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <header className="mb-6">
          <nav className="text-xs text-zinc-500 mb-4">
            <Link to="/" className="hover:text-emerald-400 transition-colors">Accueil</Link>
            <span className="mx-2">›</span>
            <span className="text-zinc-300">Top économies</span>
          </nav>
          
          <h1 className="text-2xl font-bold text-white sm:text-3xl mb-2">
            💰 Top économies en {territoryName}
          </h1>
          <p className="text-sm text-zinc-400">
            Les produits avec les plus grosses différences de prix entre enseignes
          </p>
          
          {/* Total savings potential */}
          {!loading && products.length > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2">
              <span className="text-emerald-400">🏦</span>
              <span className="text-sm text-emerald-300">
                Économie totale possible : <span className="font-bold text-lg">{formatEur(totalSavings)}</span>
              </span>
            </div>
          )}
        </header>
        
        {/* Territory selector */}
        <div className="mb-6">
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
            Sélectionner un territoire
          </div>
          <TerritorySelector value={territory} onChange={handleTerritoryChange} />
        </div>
        
        {/* Products grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-xl" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <p className="text-zinc-400">
              Aucune donnée d'économie disponible pour {territoryName}.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product, i) => (
              <SavingsCard
                key={product.id}
                product={product}
                territory={territory}
                rank={i + 1}
              />
            ))}
          </div>
        )}
        
        {/* SEO content */}
        <section className="mt-8 rounded-xl border border-white/5 bg-white/[0.01] p-4">
          <h2 className="text-sm font-bold text-zinc-400 mb-2">
            Comment économiser sur vos courses en {territoryName} ?
          </h2>
          <div className="text-xs text-zinc-500 leading-relaxed space-y-2">
            <p>
              La vie chère en Outre-mer rend la comparaison des prix essentielle. Notre comparateur analyse 
              quotidiennement les prix dans les principales enseignes de {territoryName} pour vous aider à 
              réaliser des économies significatives.
            </p>
            <p>
              Les produits affichés sur cette page présentent les plus grandes différences de prix entre 
              magasins. En choisissant l'enseigne la moins chère pour chaque produit, vous pouvez économiser 
              jusqu'à 30% sur votre panier de courses.
            </p>
          </div>
        </section>
        
        {/* Related links */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/populaires"
            className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-400 hover:border-emerald-400/30 hover:text-emerald-400 transition-all"
          >
            🔥 Produits populaires
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
