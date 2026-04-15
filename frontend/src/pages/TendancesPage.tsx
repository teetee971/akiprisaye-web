/**
 * TendancesPage.tsx — Trending products page
 *
 * SEO target: "tendances prix guadeloupe", "hausse prix martinique"
 *
 * Features:
 *   - Products with most view growth
 *   - Price trend indicators
 *   - Territory filter
 */

import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SEOHead } from '../components/ui/SEOHead';
import { Skeleton } from '../components/ui/Skeleton';
import { formatEur } from '../utils/currency';
import {
  getTerritoryName,
  SITE_URL,
} from '../utils/seoHelpers';
import { getTrendingProducts } from '../utils/priceClickTracker';

// ── Mock trending data (to be combined with real tracking data) ───────────────
interface TrendingProduct {
  id: string;
  name: string;
  brand?: string;
  category: string;
  currentPrice: number;
  previousPrice: number;
  priceChange: number;
  viewGrowth: number;
  searchVolume: 'high' | 'medium' | 'low';
}

function getMockTrendingProducts(territory: string): TrendingProduct[] {
  const products = [
    { id: '1', name: 'Huile de Tournesol 1L', category: 'Épicerie', currentPrice: 3.49, previousPrice: 2.89, searchVolume: 'high' as const },
    { id: '2', name: 'Farine de Blé T55 1kg', category: 'Épicerie', currentPrice: 1.89, previousPrice: 1.45, searchVolume: 'high' as const },
    { id: '3', name: 'Riz Basmati 1kg', brand: 'Uncle Ben\'s', category: 'Épicerie', currentPrice: 4.29, previousPrice: 3.79, searchVolume: 'medium' as const },
    { id: '4', name: 'Poulet Entier kg', category: 'Viande', currentPrice: 7.99, previousPrice: 6.99, searchVolume: 'medium' as const },
    { id: '5', name: 'Lait UHT 1L', brand: 'Candia', category: 'Produits Laitiers', currentPrice: 1.49, previousPrice: 1.25, searchVolume: 'high' as const },
    { id: '6', name: 'Oeufs x12', category: 'Frais', currentPrice: 4.99, previousPrice: 3.99, searchVolume: 'medium' as const },
    { id: '7', name: 'Pâtes Spaghetti 500g', brand: 'Barilla', category: 'Épicerie', currentPrice: 1.79, previousPrice: 1.49, searchVolume: 'low' as const },
    { id: '8', name: 'Beurre Doux 250g', brand: 'Président', category: 'Produits Laitiers', currentPrice: 3.49, previousPrice: 2.99, searchVolume: 'low' as const },
  ].map((p) => ({
    ...p,
    priceChange: +((p.currentPrice - p.previousPrice) / p.previousPrice * 100).toFixed(1),
    viewGrowth: 20 + Math.floor(Math.random() * 80),
  }));
  
  return products.sort((a, b) => b.viewGrowth - a.viewGrowth);
}

// ── Trending card component ───────────────────────────────────────────────────
interface TrendingCardProps {
  product: TrendingProduct;
  territory: string;
}

function TrendingCard({ product, territory }: TrendingCardProps) {
  const isPriceUp = product.priceChange > 0;
  const isPriceDown = product.priceChange < 0;
  
  const searchVolumeColors = {
    high: 'bg-rose-400/20 text-rose-400 border-rose-400/30',
    medium: 'bg-amber-400/20 text-amber-400 border-amber-400/30',
    low: 'bg-blue-400/20 text-blue-400 border-blue-400/30',
  };
  
  const searchVolumeLabels = {
    high: '🔥 Très recherché',
    medium: '📈 En hausse',
    low: '📊 Stable',
  };
  
  return (
    <Link
      to={`/produit/${product.id}?territory=${territory}`}
      className="group rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-all hover:border-emerald-400/30 hover:bg-white/[0.05]"
    >
      <div className="flex items-start justify-between mb-2">
        {/* Search volume badge */}
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${searchVolumeColors[product.searchVolume]}`}>
          {searchVolumeLabels[product.searchVolume]}
        </span>
        
        {/* View growth */}
        <span className="text-xs font-bold text-emerald-400">
          +{product.viewGrowth}% vues
        </span>
      </div>
      
      <div className="mt-3">
        {product.brand && (
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-0.5">
            {product.brand}
          </div>
        )}
        <h3 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
          {product.name}
        </h3>
        <div className="text-xs text-zinc-500">{product.category}</div>
      </div>
      
      {/* Price trend */}
      <div className="mt-3 flex items-center gap-3">
        <span className="text-lg font-bold text-white">
          {formatEur(product.currentPrice)}
        </span>
        
        <div className={`flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-bold
          ${isPriceUp ? 'bg-rose-400/10 text-rose-400' : isPriceDown ? 'bg-emerald-400/10 text-emerald-400' : 'bg-white/5 text-zinc-400'}`}
        >
          {isPriceUp ? '↑' : isPriceDown ? '↓' : '→'}
          {Math.abs(product.priceChange)}%
        </div>
      </div>
      
      <div className="mt-1 text-xs text-zinc-500">
        Prix précédent : {formatEur(product.previousPrice)}
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
export default function TendancesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const territory = searchParams.get('territory') ?? 'GP';
  
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<TrendingProduct[]>([]);
  
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setProducts(getMockTrendingProducts(territory));
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [territory]);
  
  const handleTerritoryChange = (newTerritory: string) => {
    setSearchParams({ territory: newTerritory });
  };
  
  const territoryName = getTerritoryName(territory);
  const priceIncreases = products.filter((p) => p.priceChange > 0);
  const avgIncrease = priceIncreases.length > 0
    ? priceIncreases.reduce((sum, p) => sum + p.priceChange, 0) / priceIncreases.length
    : 0;
  
  // SEO structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Tendances prix courses en ${territoryName}`,
    description: `Produits les plus recherchés et évolution des prix en ${territoryName}`,
    url: `${SITE_URL}/tendances?territory=${territory}`,
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
        title={`Tendances prix courses ${territoryName} — Évolution des prix`}
        description={`Suivez les tendances de prix en ${territoryName}. Produits les plus recherchés, hausses et baisses de prix. Inflation moyenne : ${avgIncrease.toFixed(1)}% ce mois.`}
        canonical={`${SITE_URL}/tendances?territory=${territory}`}
        jsonLd={jsonLd}
      />
      
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <header className="mb-6">
          <nav className="text-xs text-zinc-500 mb-4">
            <Link to="/" className="hover:text-emerald-400 transition-colors">Accueil</Link>
            <span className="mx-2">›</span>
            <span className="text-zinc-300">Tendances</span>
          </nav>
          
          <h1 className="text-2xl font-bold text-white sm:text-3xl mb-2">
            📈 Tendances prix en {territoryName}
          </h1>
          <p className="text-sm text-zinc-400">
            Produits les plus recherchés et évolution des prix
          </p>
          
          {/* Price trend summary */}
          {!loading && priceIncreases.length > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2">
              <span className="text-amber-400">⚠️</span>
              <span className="text-sm text-amber-300">
                Inflation moyenne observée : <span className="font-bold">+{avgIncrease.toFixed(1)}%</span>
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
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <p className="text-zinc-400">
              Aucune tendance disponible pour {territoryName}.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <TrendingCard
                key={product.id}
                product={product}
                territory={territory}
              />
            ))}
          </div>
        )}
        
        {/* Price trend explanation */}
        <section className="mt-8 rounded-xl border border-white/5 bg-white/[0.01] p-4">
          <h2 className="text-sm font-bold text-zinc-400 mb-2">
            📊 Comprendre l'évolution des prix en {territoryName}
          </h2>
          <div className="text-xs text-zinc-500 leading-relaxed space-y-2">
            <p>
              Les prix dans les DOM-TOM sont particulièrement sensibles aux coûts de transport et 
              d'approvisionnement. Cette page vous permet de suivre les tendances et d'anticiper 
              vos achats.
            </p>
            <p>
              <strong className="text-zinc-400">🔥 Très recherché :</strong> Produit avec forte demande cette semaine<br />
              <strong className="text-zinc-400">📈 En hausse :</strong> Recherches en augmentation<br />
              <strong className="text-zinc-400">↑↓ Variation prix :</strong> Évolution par rapport au mois précédent
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
            to="/populaires"
            className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-400 hover:border-emerald-400/30 hover:text-emerald-400 transition-all"
          >
            🔥 Produits populaires
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
