/**
 * ChocsPrixPage — Tableau de bord des chocs de prix
 *
 * Dashboard multi-territoire pour détecter les hausses anormales de prix
 * sur les 7 derniers jours. Utilise le hook useDailyPriceShock étendu.
 *
 * Suggestion #18 — « Détecteur de chocs de prix »
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, TrendingUp, RefreshCw, Filter, ExternalLink, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { SEOHead } from '../components/ui/SEOHead';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PriceShock {
  productName: string;
  priceIncrease: number;
  percentageIncrease: number;
  territory: string;
  isConfirmed: boolean;
  currentPrice: number;
  previousPrice: number;
  category?: string;
}

// ── Territory list ────────────────────────────────────────────────────────────

const DOM_TOM_TERRITORIES = [
  { code: 'GP', label: 'Guadeloupe', flag: '🏝️' },
  { code: 'MQ', label: 'Martinique', flag: '🌋' },
  { code: 'RE', label: 'La Réunion', flag: '🏔️' },
  { code: 'GF', label: 'Guyane', flag: '🌿' },
  { code: 'YT', label: 'Mayotte', flag: '🌊' },
  { code: 'PM', label: 'Saint-Pierre-et-Miquelon', flag: '🌨️' },
  { code: 'NC', label: 'Nouvelle-Calédonie', flag: '🦎' },
  { code: 'PF', label: 'Polynésie française', flag: '🌺' },
];

// ── Price shock analysis (mirrors useDailyPriceShock logic, multi-territory) ──

async function fetchShocksForTerritory(territory: string): Promise<PriceShock[]> {
  const base = import.meta.env.BASE_URL as string;
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  try {
    const [productsRes, servicesRes] = await Promise.all([
      fetch(`${base}data/expanded-prices.json`),
      fetch(`${base}data/services-prices.json`),
    ]);
    if (!productsRes.ok || !servicesRes.ok) return [];

    const productsData: { products?: ProductEntry[] } = await productsRes.json();
    const servicesData: { services?: ServiceEntry[] } = await servicesRes.json();

    const shocks: PriceShock[] = [];

    productsData.products?.forEach((product) => {
      if (product.territory !== territory) return;
      const sorted = [...(product.priceHistory ?? [])].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      if (sorted.length < 2) return;
      const latest = sorted[0];
      const previous = sorted[1];
      if (new Date(latest.date).getTime() < sevenDaysAgo) return;
      if (latest.price <= previous.price) return;
      const increase = latest.price - previous.price;
      const percentageIncrease = (increase / previous.price) * 100;
      shocks.push({
        productName: product.name ?? 'Produit inconnu',
        priceIncrease: increase,
        percentageIncrease,
        territory,
        isConfirmed: (latest.observations ?? 1) >= 3 && (latest.stores ?? 1) >= 2,
        currentPrice: latest.price,
        previousPrice: previous.price,
        category: product.category,
      });
    });

    servicesData.services?.forEach((service) => {
      if (service.territory !== territory) return;
      const sorted = [...(service.priceHistory ?? [])].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      if (sorted.length < 2) return;
      const latest = sorted[0];
      const previous = sorted[1];
      if (new Date(latest.date).getTime() < sevenDaysAgo) return;
      if (latest.price <= previous.price) return;
      const increase = latest.price - previous.price;
      const percentageIncrease = (increase / previous.price) * 100;
      shocks.push({
        productName: service.name ?? 'Service inconnu',
        priceIncrease: increase,
        percentageIncrease,
        territory,
        isConfirmed: true,
        currentPrice: latest.price,
        previousPrice: previous.price,
        category: 'Services',
      });
    });

    return shocks.sort((a, b) => b.percentageIncrease * b.priceIncrease - a.percentageIncrease * a.priceIncrease);
  } catch {
    return [];
  }
}

// ── Sub-types ─────────────────────────────────────────────────────────────────

interface PriceEntry { date: string; price: number; observations?: number; stores?: number; }
interface ProductEntry { territory?: string; name?: string; category?: string; priceHistory?: PriceEntry[]; }
interface ServiceEntry { territory?: string; name?: string; priceHistory?: PriceEntry[]; }

// ── Helper: severity badge ────────────────────────────────────────────────────

function SeverityBadge({ pct }: { pct: number }) {
  if (pct >= 20) return <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-700/40 text-red-200 border border-red-500/40">🔴 Grave +{pct.toFixed(0)}%</span>;
  if (pct >= 10) return <span className="px-2 py-0.5 rounded text-xs font-bold bg-orange-700/40 text-orange-200 border border-orange-500/40">🟠 Élevé +{pct.toFixed(0)}%</span>;
  return <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-700/40 text-yellow-200 border border-yellow-500/40">🟡 Modéré +{pct.toFixed(0)}%</span>;
}

// ── Territory card ─────────────────────────────────────────────────────────────

function TerritoryShockCard({ territory, flag, label }: { territory: string; flag: string; label: string }) {
  const [shocks, setShocks] = useState<PriceShock[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchShocksForTerritory(territory).then((s) => {
      if (!cancelled) { setShocks(s); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [territory]);

  const visible = expanded ? shocks : shocks.slice(0, 3);

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{flag}</span>
        <h3 className="font-semibold text-white">{label}</h3>
        {!loading && (
          <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${
            shocks.length === 0 ? 'bg-green-900/40 text-green-300 border border-green-500/30'
            : shocks.length < 3 ? 'bg-yellow-900/40 text-yellow-300 border border-yellow-500/30'
            : 'bg-red-900/40 text-red-300 border border-red-500/30'
          }`}>
            {shocks.length === 0 ? '✓ Stable' : `${shocks.length} hausse${shocks.length > 1 ? 's' : ''}`}
          </span>
        )}
      </div>

      {loading && (
        <div className="text-center py-4 text-gray-400 text-sm">
          <span className="animate-pulse">Analyse en cours…</span>
        </div>
      )}

      {!loading && shocks.length === 0 && (
        <p className="text-sm text-green-400 py-2">✅ Aucune hausse significative cette semaine.</p>
      )}

      {!loading && shocks.length > 0 && (
        <div className="space-y-2">
          {visible.map((shock, i) => (
            <div key={i} className="flex items-center gap-2 text-sm bg-slate-900/40 rounded-lg px-3 py-2">
              <span className="text-red-400 font-bold shrink-0">+{shock.percentageIncrease.toFixed(1)}%</span>
              <span className="text-white truncate flex-1">{shock.productName}</span>
              {shock.category && <span className="text-gray-500 text-xs hidden sm:inline">{shock.category}</span>}
              {shock.isConfirmed && <span className="text-blue-400 text-xs shrink-0" title="Confirmé par plusieurs sources">✓</span>}
            </div>
          ))}

          {shocks.length > 3 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="w-full text-xs text-blue-400 hover:text-blue-300 flex items-center justify-center gap-1 py-1"
            >
              {expanded ? <><ChevronUp size={12} /> Voir moins</> : <><ChevronDown size={12} /> +{shocks.length - 3} de plus</>}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Summary banner ─────────────────────────────────────────────────────────────

function SummaryBanner({ allShocks, loading }: { allShocks: PriceShock[]; loading: boolean }) {
  if (loading) return null;
  const total = allShocks.length;
  const grave = allShocks.filter((s) => s.percentageIncrease >= 20).length;
  const confirmed = allShocks.filter((s) => s.isConfirmed).length;
  const maxShock = allShocks.reduce((acc, s) => (s.percentageIncrease > acc ? s.percentageIncrease : acc), 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {[
        { label: 'Hausses détectées', value: total, icon: '📈', color: 'text-orange-300' },
        { label: 'Hausses graves (≥20%)', value: grave, icon: '🔴', color: 'text-red-300' },
        { label: 'Confirmées', value: confirmed, icon: '✅', color: 'text-blue-300' },
        { label: 'Hausse max', value: `+${maxShock.toFixed(1)}%`, icon: '🚨', color: 'text-yellow-300' },
      ].map(({ label, value, icon, color }) => (
        <div key={label} className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-3 text-center">
          <div className="text-2xl mb-1">{icon}</div>
          <div className={`text-xl font-bold ${color}`}>{value}</div>
          <div className="text-xs text-gray-400">{label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Top shocks list ───────────────────────────────────────────────────────────

function TopShocksList({ shocks, filter, loading }: { shocks: PriceShock[]; filter: string; loading: boolean }) {
  const filtered = filter === 'all' ? shocks : shocks.filter((s) => s.territory === filter || s.category === filter);
  const top = filtered.slice(0, 20);

  if (loading) return <div className="text-center py-12 text-gray-400"><span className="animate-spin inline-block mr-2">⏳</span>Analyse de tous les territoires…</div>;
  if (top.length === 0) return <div className="text-center py-12 text-green-400">✅ Aucune hausse significative détectée sur les 7 derniers jours.</div>;

  return (
    <div className="space-y-3">
      {top.map((shock, i) => {
        const terr = DOM_TOM_TERRITORIES.find((t) => t.code === shock.territory);
        return (
          <div key={i} className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4 flex items-start gap-4">
            <div className="shrink-0 text-2xl font-bold text-gray-500">#{i + 1}</div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start gap-2 mb-1">
                <span className="font-semibold text-white">{shock.productName}</span>
                <SeverityBadge pct={shock.percentageIncrease} />
                {shock.isConfirmed && (
                  <span className="px-2 py-0.5 rounded text-xs bg-blue-900/30 text-blue-300 border border-blue-500/30">
                    ✓ Confirmé
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <span className="text-red-400 font-medium">+{shock.priceIncrease.toFixed(2)} €</span>
                <span className="text-gray-400">{shock.previousPrice.toFixed(2)} € → {shock.currentPrice.toFixed(2)} €</span>
                {shock.category && <span className="text-gray-500">{shock.category}</span>}
                {terr && <span className="text-gray-400">{terr.flag} {terr.label}</span>}
              </div>
            </div>
            <Link
              to={`../ia-reclamation`}
              className="shrink-0 flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              title="Signaler à la DGCCRF"
            >
              <FileText size={14} /> Signaler
            </Link>
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ChocsPrixPage() {
  const [allShocks, setAllShocks] = useState<PriceShock[]>([]);
  const [loadingAll, setLoadingAll] = useState(true);
  const [viewMode, setViewMode] = useState<'territoire' | 'liste'>('territoire');
  const [filterTerr, setFilterTerr] = useState('all');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadAll = useCallback(async () => {
    setLoadingAll(true);
    const results = await Promise.all(DOM_TOM_TERRITORIES.map((t) => fetchShocksForTerritory(t.code)));
    setAllShocks(results.flat());
    setLastUpdated(new Date());
    setLoadingAll(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  return (
    <>
      <SEOHead
        title="Chocs de Prix — Hausses anormales détectées | A KI PRI SA YÉ"
        description="Tableau de bord des hausses de prix anormales détectées cette semaine dans les territoires d'Outre-mer. Comparez et signalez."
        canonicalPath="/chocs-prix"
      />

      <div className="min-h-screen bg-slate-900 text-white pb-16">
        {/* Hero */}
        <HeroImage
          src={PAGE_HERO_IMAGES.alerts}
          alt="Chocs de prix en Outre-mer"
          className="relative"
        >
          <div className="max-w-4xl mx-auto px-4 py-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-900/40 border border-red-500/40 rounded-full text-sm text-red-300 mb-4">
              <AlertTriangle size={14} /> Alertes hausses — 7 derniers jours
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
              🔥 Chocs de Prix
            </h1>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Détection automatique des hausses anormales dans les DOM-TOM. Données citoyennes collaboratives.
            </p>
          </div>
        </HeroImage>

        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Summary banner */}
          <SummaryBanner allShocks={allShocks} loading={loadingAll} />

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {/* View toggle */}
            <div className="flex rounded-lg overflow-hidden border border-slate-600">
              <button
                onClick={() => setViewMode('territoire')}
                className={`px-3 py-1.5 text-sm transition-colors ${viewMode === 'territoire' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-slate-700'}`}
              >
                🏝️ Par territoire
              </button>
              <button
                onClick={() => setViewMode('liste')}
                className={`px-3 py-1.5 text-sm transition-colors ${viewMode === 'liste' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-slate-700'}`}
              >
                <TrendingUp size={14} className="inline mr-1" />Top 20
              </button>
            </div>

            {viewMode === 'liste' && (
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-gray-400" />
                <select
                  value={filterTerr}
                  onChange={(e) => setFilterTerr(e.target.value)}
                  className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-2 py-1"
                >
                  <option value="all">Tous les territoires</option>
                  {DOM_TOM_TERRITORIES.map((t) => (
                    <option key={t.code} value={t.code}>{t.flag} {t.label}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={loadAll}
              disabled={loadingAll}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-gray-300 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={loadingAll ? 'animate-spin' : ''} />
              Actualiser
            </button>
          </div>

          {lastUpdated && (
            <p className="text-xs text-gray-500 mb-4">
              Dernière analyse : {lastUpdated.toLocaleTimeString('fr-FR')} — données des 7 derniers jours
            </p>
          )}

          {/* Content */}
          {viewMode === 'territoire' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {DOM_TOM_TERRITORIES.map((t) => (
                <TerritoryShockCard key={t.code} territory={t.code} flag={t.flag} label={t.label} />
              ))}
            </div>
          ) : (
            <TopShocksList shocks={allShocks} filter={filterTerr} loading={loadingAll} />
          )}

          {/* CTA */}
          <div className="mt-10 bg-blue-900/20 border border-blue-500/30 rounded-xl p-6 text-center">
            <h2 className="text-lg font-bold text-white mb-2">Vous constatez une hausse abusive ?</h2>
            <p className="text-sm text-gray-300 mb-4">
              Signalez-la à la DGCCRF et contribuez à la transparence des prix citoyens.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                to="../ia-reclamation"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <FileText size={16} /> Rédiger une réclamation IA
              </Link>
              <Link
                to="../contribuer-prix"
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                ✍️ Contribuer un prix
              </Link>
              <a
                href="https://signal.conso.gouv.fr/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <ExternalLink size={14} /> SignalConso (DGCCRF)
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
