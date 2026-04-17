/**
 * StatsDashboard.tsx — Revenue and conversion stats dashboard
 *
 * Features:
 *   - Click-through rate (CTR) metrics
 *   - Estimated revenue calculation
 *   - Top products by views and clicks
 *   - Top retailers by clicks
 *   - Daily trends chart
 *
 * All data is stored locally (RGPD compliant - no external tracking)
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { SEOHead } from '../components/ui/SEOHead';
import { formatEur } from '../utils/currency';
import {
  getConversionStats,
  getDailyStats,
  getTrendingProducts,
  getTopSEOProducts,
  trackRetailerClick,
  type ConversionStats,
  type DailyStats,
} from '../utils/priceClickTracker';
import { getSEOPageStats, getSEOTopPages } from '../utils/statsTracker';
import { buildRetailerUrl, isValidRetailerUrl, knownRetailers } from '../utils/retailerLinks';

// ── Stat card component ───────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: string;
  color: 'emerald' | 'blue' | 'amber' | 'rose';
}

function StatCard({ label, value, subValue, icon, color }: StatCardProps) {
  const colors = {
    emerald: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-400',
    blue: 'border-blue-400/30 bg-blue-400/10 text-blue-400',
    amber: 'border-amber-400/30 bg-amber-400/10 text-amber-400',
    rose: 'border-rose-400/30 bg-rose-400/10 text-rose-400',
  };

  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider opacity-80">
        <span>{icon}</span>
        {label}
      </div>
      <div className="mt-2 text-3xl font-extrabold tabular-nums">{value}</div>
      {subValue && <div className="mt-1 text-xs opacity-70">{subValue}</div>}
    </div>
  );
}

// ── Simple bar chart for daily stats ──────────────────────────────────────────
interface DailyChartProps {
  data: DailyStats[];
  metric: 'views' | 'clicks' | 'estimatedRevenue';
  label: string;
  color: string;
}

function DailyChart({ data, metric, label, color }: DailyChartProps) {
  const maxValue = Math.max(...data.map((d) => d[metric]), 1);

  // Show last 14 days for mobile-friendly display
  const displayData = data.slice(-14);

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
        {label} — 14 derniers jours
      </h3>
      <div className="flex items-end gap-1 h-24">
        {displayData.map((day, i) => {
          const height = (day[metric] / maxValue) * 100;
          const isToday = i === displayData.length - 1;

          return (
            <div
              key={day.date}
              className="flex-1 flex flex-col items-center"
              title={`${day.date}: ${metric === 'estimatedRevenue' ? formatEur(day[metric]) : day[metric]}`}
            >
              <div
                className={`w-full rounded-t transition-all ${isToday ? color : 'bg-white/20'}`}
                style={{ height: `${Math.max(height, 2)}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-zinc-600">
        <span>{displayData[0]?.date.slice(5)}</span>
        <span>Aujourd'hui</span>
      </div>
    </div>
  );
}

// ── Product list item ─────────────────────────────────────────────────────────
interface ProductListItemProps {
  product: {
    barcode: string;
    name: string;
    views: number;
    clicks: number;
    ctr: number;
    estimatedRevenue: number;
  };
  rank: number;
}

function ProductListItem({ product, rank }: ProductListItemProps) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-zinc-400">
        {rank}
      </span>
      <div className="flex-1 min-w-0">
        <Link
          to={`/produit/${product.barcode}`}
          className="text-sm font-medium text-white hover:text-emerald-400 transition-colors truncate block"
        >
          {product.name}
        </Link>
        <div className="flex gap-3 text-xs text-zinc-500">
          <span>{product.views} vues</span>
          <span>{product.clicks} clics</span>
          <span className="text-emerald-400">{(product.ctr * 100).toFixed(1)}% CTR</span>
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-bold text-emerald-400">
          {formatEur(product.estimatedRevenue)}
        </div>
        <div className="text-[10px] text-zinc-500">estimé</div>
      </div>
    </div>
  );
}

// ── Retailer list item ────────────────────────────────────────────────────────
interface RetailerListItemProps {
  retailer: {
    retailer: string;
    clicks: number;
    avgPrice: number;
    estimatedRevenue: number;
  };
  rank: number;
}

function RetailerListItem({ retailer, rank }: RetailerListItemProps) {
  const url = buildRetailerUrl(retailer.retailer);
  const hasLink = isValidRetailerUrl(url);

  return (
    <div className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-zinc-400">
        {rank}
      </span>
      <div className="flex-1 min-w-0">
        {hasLink && url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-white hover:text-emerald-400 transition-colors truncate flex items-center gap-1"
            onClick={() => trackRetailerClick('', retailer.retailer, '', retailer.avgPrice)}
          >
            {retailer.retailer}
            <ExternalLink className="w-3 h-3 opacity-60 flex-shrink-0" />
          </a>
        ) : (
          <div className="text-sm font-medium text-white truncate">{retailer.retailer}</div>
        )}
        <div className="flex gap-3 text-xs text-zinc-500">
          <span>{retailer.clicks} clics</span>
          <span>Moy. {formatEur(retailer.avgPrice)}</span>
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-bold text-blue-400">
          {formatEur(retailer.estimatedRevenue)}
        </div>
        <div className="text-[10px] text-zinc-500">estimé</div>
      </div>
    </div>
  );
}

// ── Trending product item ─────────────────────────────────────────────────────
interface TrendingItemProps {
  product: {
    barcode: string;
    name: string;
    recentViews: number;
    growth: number;
  };
}

function TrendingItem({ product }: TrendingItemProps) {
  const isPositive = product.growth >= 0;

  return (
    <Link
      to={`/produit/${product.barcode}`}
      className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 hover:border-emerald-400/30 transition-all"
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">{product.name}</div>
        <div className="text-xs text-zinc-500">{product.recentViews} vues cette semaine</div>
      </div>
      <div className={`text-sm font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
        {isPositive ? '+' : ''}
        {product.growth.toFixed(0)}%
      </div>
    </Link>
  );
}

// ── Retailer config card ──────────────────────────────────────────────────────
function RetailerConfigCard({ name, clicks }: { name: string; clicks: number }) {
  const url = buildRetailerUrl(name);
  const hasLink = isValidRetailerUrl(url);
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.01] px-3 py-2">
      <div className="flex items-center gap-2">
        <span className={`text-xs ${hasLink ? 'text-emerald-400' : 'text-rose-400'}`}>
          {hasLink ? '✅' : '❌'}
        </span>
        {hasLink && url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-white hover:text-emerald-400 transition-colors flex items-center gap-1"
            onClick={() => trackRetailerClick('', name, '', 0)}
          >
            {name}
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        ) : (
          <span className="text-sm text-zinc-500">{name}</span>
        )}
      </div>
      <span className="text-xs text-zinc-500">{clicks > 0 ? `${clicks} clics` : 'Aucun clic'}</span>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function StatsDashboard() {
  const [stats, setStats] = useState<ConversionStats | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [trending, setTrending] = useState<ReturnType<typeof getTrendingProducts>>([]);
  const [seoPages, setSEOPages] = useState<ReturnType<typeof getSEOTopPages>>([]);
  const [seoProducts, setSEOProducts] = useState<ReturnType<typeof getTopSEOProducts>>([]);
  const [period, setPeriod] = useState<7 | 30>(30);

  useEffect(() => {
    setStats(getConversionStats(period));
    setDailyStats(getDailyStats(period));
    setTrending(getTrendingProducts(5));
    setSEOPages(getSEOTopPages(10));
    setSEOProducts(getTopSEOProducts(10));
  }, [period]);

  if (!stats) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="animate-pulse">
            <div className="h-8 bg-white/10 rounded w-1/3 mb-6" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-white/5 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8">
      <SEOHead
        title="Tableau de bord — Statistiques"
        description="Analysez vos statistiques de conversion et revenus estimés"
        noIndex
      />

      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">📊 Tableau de bord</h1>
            <p className="text-sm text-zinc-400 mt-1">
              Statistiques de conversion et revenus estimés
            </p>
          </div>

          {/* Period selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setPeriod(7)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${
                  period === 7
                    ? 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/50'
                    : 'bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10'
                }`}
            >
              7 jours
            </button>
            <button
              onClick={() => setPeriod(30)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${
                  period === 30
                    ? 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/50'
                    : 'bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10'
                }`}
            >
              30 jours
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <StatCard
            label="Vues produits"
            value={stats.totalViews.toLocaleString('fr-FR')}
            subValue={`${period} derniers jours`}
            icon="👁️"
            color="blue"
          />
          <StatCard
            label="Clics enseignes"
            value={stats.totalClicks.toLocaleString('fr-FR')}
            subValue="Clics vers les magasins"
            icon="🖱️"
            color="amber"
          />
          <StatCard
            label="Taux de clic"
            value={`${(stats.clickThroughRate * 100).toFixed(1)}%`}
            subValue="CTR moyen"
            icon="📈"
            color={stats.clickThroughRate >= 0.05 ? 'emerald' : 'rose'}
          />
          <StatCard
            label="Revenus estimés"
            value={formatEur(stats.estimatedRevenue)}
            subValue="Commission 2%"
            icon="💰"
            color="emerald"
          />
        </div>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-2 mb-6">
          <DailyChart
            data={dailyStats}
            metric="views"
            label="📊 Vues quotidiennes"
            color="bg-blue-400"
          />
          <DailyChart
            data={dailyStats}
            metric="clicks"
            label="🖱️ Clics quotidiens"
            color="bg-amber-400"
          />
        </div>

        {/* Trending products */}
        {trending.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-3">
              🔥 Tendances — Produits en croissance
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {trending.map((product) => (
                <TrendingItem key={product.barcode} product={product} />
              ))}
            </div>
          </div>
        )}

        {/* Top lists */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top products */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
              🏆 Top produits par vues
            </h2>
            {stats.topProducts.length === 0 ? (
              <p className="text-sm text-zinc-500 py-4 text-center">Aucune donnée disponible</p>
            ) : (
              <div>
                {stats.topProducts.map((product, i) => (
                  <ProductListItem key={product.barcode} product={product} rank={i + 1} />
                ))}
              </div>
            )}
          </div>

          {/* Top retailers */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
              🏪 Top enseignes par clics
            </h2>
            {stats.topRetailers.length === 0 ? (
              <p className="text-sm text-zinc-500 py-4 text-center">Aucune donnée disponible</p>
            ) : (
              <div>
                {stats.topRetailers.map((retailer, i) => (
                  <RetailerListItem key={retailer.retailer} retailer={retailer} rank={i + 1} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Enseignes & Liens affiliés ──────────────────────────────────── */}
        {(() => {
          const clicksByRetailer = Object.fromEntries(
            stats.topRetailers.map((r) => [r.retailer, r.clicks])
          );
          const retailers = knownRetailers();
          return (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 mt-6">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
                🏪 Enseignes &amp; Liens affiliés
              </h2>
              <div className="space-y-1.5">
                {retailers.map((name) => (
                  <RetailerConfigCard key={name} name={name} clicks={clicksByRetailer[name] ?? 0} />
                ))}
              </div>
            </div>
          );
        })()}

        {/* ── SEO Page Stats ──────────────────────────────────────────────── */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
            📊 Pages SEO — Top 10 par vues
          </h2>
          {seoPages.length === 0 ? (
            <p className="py-4 text-center text-sm text-zinc-500">Aucune donnée SEO disponible</p>
          ) : (
            <div className="space-y-1.5">
              {seoPages.map((page, i) => (
                <div
                  key={`${page.slug}-${page.pageType}`}
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.01] px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-600">{i + 1}.</span>
                    <span className="max-w-[200px] truncate text-xs text-zinc-400">
                      {page.slug}
                    </span>
                    <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-zinc-600">
                      {page.pageType}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">{page.views} vues</span>
                </div>
              ))}
              <p className="mt-2 text-[10px] text-zinc-600">
                Types uniques : {new Set(getSEOPageStats().map((p) => p.pageType)).size}
              </p>
            </div>
          )}
        </div>

        {/* ── SEO Product Stats ────────────────────────────────────────────── */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
            🔍 Produits SEO populaires
          </h2>
          {seoProducts.length === 0 ? (
            <p className="py-4 text-center text-sm text-zinc-500">Aucun produit SEO suivi</p>
          ) : (
            <div className="space-y-1.5">
              {seoProducts.map((product, i) => (
                <div
                  key={`${product.productSlug}-${product.territory}`}
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.01] px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-600">{i + 1}.</span>
                    <span className="max-w-[180px] truncate text-xs text-zinc-400">
                      {product.productSlug}
                    </span>
                    <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-zinc-600">
                      {product.territory}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">{product.views} vues</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info box */}
        <div className="mt-6 rounded-xl border border-white/5 bg-white/[0.01] p-4">
          <h3 className="text-xs font-bold text-zinc-400 mb-2">ℹ️ À propos de ces statistiques</h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Toutes les données sont stockées localement sur votre appareil (conformité RGPD). Les
            revenus sont estimés sur la base d'un taux de commission moyen de 2% des clics affiliés.
            Les statistiques sont conservées pendant 30 jours maximum.
          </p>
        </div>

        {/* Quick links */}
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
            to="/top-economies"
            className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-400 hover:border-emerald-400/30 hover:text-emerald-400 transition-all"
          >
            💰 Top économies
          </Link>
        </div>
      </div>
    </div>
  );
}
