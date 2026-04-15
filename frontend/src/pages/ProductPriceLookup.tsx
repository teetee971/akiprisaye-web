/**
 * ProductPriceLookup.tsx — Comparateur de prix produits DOM-TOM en temps réel
 *
 * Fonctionnalités :
 *   - Scan EAN par saisie manuelle ou camera (useEANScanner)
 *   - Récupération live des prix Open Prices sur les 5 DOM-TOM
 *   - Tableau comparatif prix min/max/moy par territoire
 *   - Badge territoire le moins cher
 *   - Fiche produit (photo, marque, nutriscore)
 *   - Historique des derniers EANs scannés
 */

import React, { useState, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  Search, Barcode, MapPin, TrendingDown, TrendingUp, Minus,
  ChevronRight, RotateCcw, ShoppingCart, Star, AlertCircle,
  Loader2, Package, Clock,
} from 'lucide-react';
import { useProductLivePrices } from '../hooks/useProductLivePrices';
import type { TerritoryPriceSummary } from '../hooks/useProductLivePrices';

// ─── Constants ────────────────────────────────────────────────────────────────

const TERRITORY_FLAGS: Record<string, string> = {
  gp: '🇬🇵', mq: '🇲🇶', gf: '🇬🇫', re: '🇷🇪', yt: '🇾🇹',
};

const TERRITORY_COLORS: Record<string, string> = {
  gp: 'from-blue-500 to-cyan-400',
  mq: 'from-red-500 to-orange-400',
  gf: 'from-green-500 to-emerald-400',
  re: 'from-yellow-500 to-amber-400',
  yt: 'from-teal-500 to-cyan-500',
};

const NUTRISCORE_COLORS: Record<string, string> = {
  a: 'bg-green-500', b: 'bg-lime-400', c: 'bg-yellow-400',
  d: 'bg-orange-500', e: 'bg-red-500',
};

// Produits de référence pour démarrer rapidement
const QUICK_EANS = [
  { ean: '3017620422003', label: 'Nutella 400g' },
  { ean: '3068320113901', label: 'Huile Lesieur 1L' },
  { ean: '3228021290012', label: 'Lait UHT 1L' },
  { ean: '3228881013011', label: 'Sucre 1kg' },
  { ean: '3274080005003', label: 'Eau Évian 1,5L' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (v: number | null, cur = 'EUR') =>
  v != null ? `${v.toFixed(2)} ${cur === 'EUR' ? '€' : cur}` : '—';

const isValidEAN = (s: string) => /^\d{8}$|^\d{13}$/.test(s.trim());

function PriceTrendIcon({ min, max }: { min: number | null; max: number | null }) {
  if (!min || !max) return <Minus size={14} className="text-slate-400" />;
  const spread = ((max - min) / min) * 100;
  if (spread > 10) return <TrendingUp size={14} className="text-red-400" />;
  if (spread < 3)  return <TrendingDown size={14} className="text-green-400" />;
  return <Minus size={14} className="text-slate-400" />;
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function ProductCard({ product, scannedAt }: {
  product: NonNullable<ReturnType<typeof useProductLivePrices>['state']['result']>['product'];
  scannedAt: string;
}) {
  if (!product) return null;
  return (
    <div className="flex gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl">
      {product.imageUrl && (
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          className="w-20 h-20 object-contain rounded-xl bg-white/10 flex-shrink-0"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-white text-base leading-tight truncate">{product.name || 'Produit inconnu'}</p>
        {product.brand && <p className="text-sm text-slate-300 mt-0.5">{product.brand}</p>}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {product.category && (
            <span className="text-xs bg-white/10 text-slate-300 px-2 py-0.5 rounded-full">
              {product.category}
            </span>
          )}
          {product.nutriscore && (
            <span className={`text-xs font-bold text-white px-2 py-0.5 rounded-full ${NUTRISCORE_COLORS[product.nutriscore] ?? 'bg-slate-500'}`}>
              Nutri-Score {product.nutriscore.toUpperCase()}
            </span>
          )}
          {product.quantity && (
            <span className="text-xs text-slate-400">{product.quantity}{product.unit}</span>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-2">
          <Clock size={11} className="inline mr-1" />
          Scanné à {new Date(scannedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

function TerritoryRow({
  summary, isCheapest,
}: {
  summary: TerritoryPriceSummary;
  isCheapest: boolean;
}) {
  const { territory, territoryName, min, max, avg, count, currency } = summary;
  const flag    = TERRITORY_FLAGS[territory] ?? '🏝️';
  const gradient = TERRITORY_COLORS[territory] ?? 'from-slate-500 to-slate-400';

  return (
    <div className={`relative flex items-center gap-3 p-3 rounded-xl border transition-all ${
      isCheapest
        ? 'border-emerald-400/60 bg-emerald-900/20'
        : count > 0
          ? 'border-white/10 bg-white/5 hover:bg-white/8'
          : 'border-white/5 bg-white/2 opacity-50'
    }`}>
      {/* Gradient pill */}
      <div className={`w-1 h-10 rounded-full bg-gradient-to-b ${gradient} flex-shrink-0`} />

      {/* Flag + territory */}
      <div className="w-32 flex-shrink-0">
        <span className="mr-1.5">{flag}</span>
        <span className={`font-medium text-sm ${count > 0 ? 'text-white' : 'text-slate-500'}`}>
          {territoryName}
        </span>
      </div>

      {/* Prices */}
      <div className="flex-1 grid grid-cols-3 gap-2 text-xs">
        <div className="text-center">
          <div className="text-slate-400 mb-0.5">Min</div>
          <div className={`font-bold ${isCheapest ? 'text-emerald-400' : 'text-white'}`}>
            {fmt(min, currency)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-slate-400 mb-0.5">Moy</div>
          <div className="font-medium text-slate-200">{fmt(avg, currency)}</div>
        </div>
        <div className="text-center">
          <div className="text-slate-400 mb-0.5">Max</div>
          <div className="text-slate-300">{fmt(max, currency)}</div>
        </div>
      </div>

      {/* Count + trend */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <PriceTrendIcon min={min} max={max} />
        <span className="text-xs text-slate-500">{count} relevé{count !== 1 ? 's' : ''}</span>
      </div>

      {/* Cheapest badge */}
      {isCheapest && (
        <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
          <Star size={9} />
          Moins cher
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProductPriceLookup() {
  const [input, setInput]     = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const inputRef              = useRef<HTMLInputElement>(null);
  const { state, scan, clear } = useProductLivePrices();

  const handleScan = useCallback(async (ean: string) => {
    const clean = ean.trim();
    if (!isValidEAN(clean)) return;
    setHistory((h) => [clean, ...h.filter((x) => x !== clean)].slice(0, 5));
    await scan(clean);
  }, [scan]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    handleScan(input);
  }, [input, handleScan]);

  const handleClear = useCallback(() => {
    clear();
    setInput('');
    inputRef.current?.focus();
  }, [clear]);

  const { result, loading, error } = state;

  return (
    <>
      <Helmet>
        <title>Prix produit en temps réel DOM-TOM | A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Comparez instantanément les prix d'un produit sur tous les territoires DOM-TOM (Guadeloupe, Martinique, Guyane, La Réunion, Mayotte)."
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white pb-16">

        {/* ── Header ── */}
        <div className="px-4 pt-8 pb-6 max-w-2xl mx-auto">
          <Link to="/" className="text-slate-400 hover:text-white text-sm flex items-center gap-1 mb-6 transition-colors">
            ← Accueil
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Barcode size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Prix en temps réel</h1>
              <p className="text-sm text-slate-400">Multi-produits · 5 territoires DOM-TOM</p>
            </div>
          </div>
        </div>

        <div className="px-4 max-w-2xl mx-auto space-y-5">

          {/* ── Search bar ── */}
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Code EAN (8 ou 13 chiffres)…"
                  maxLength={13}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:border-violet-400 focus:bg-white/15 transition-all text-base"
                />
              </div>
              <button
                type="submit"
                disabled={!isValidEAN(input) || loading}
                className="px-5 py-3 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 disabled:opacity-40 rounded-2xl font-semibold text-white transition-all flex items-center gap-2"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <ChevronRight size={18} />}
                <span className="hidden sm:inline">Rechercher</span>
              </button>
            </div>
          </form>

          {/* ── Quick-scan EANs ── */}
          {!result && !loading && (
            <div>
              <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                <ShoppingCart size={12} /> Produits courants
              </p>
              <div className="flex flex-wrap gap-2">
                {QUICK_EANS.map(({ ean, label }) => (
                  <button
                    key={ean}
                    onClick={() => { setInput(ean); handleScan(ean); }}
                    className="text-xs px-3 py-1.5 bg-white/8 hover:bg-white/15 border border-white/10 rounded-full text-slate-300 transition-all"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── History ── */}
          {!result && !loading && history.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                <Clock size={12} /> Scans récents
              </p>
              <div className="flex flex-wrap gap-2">
                {history.map((ean) => (
                  <button
                    key={ean}
                    onClick={() => { setInput(ean); handleScan(ean); }}
                    className="text-xs px-3 py-1.5 bg-violet-500/15 hover:bg-violet-500/25 border border-violet-400/20 rounded-full text-violet-300 font-mono transition-all"
                  >
                    {ean}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Loading skeleton ── */}
          {loading && (
            <div className="space-y-3 animate-pulse">
              <div className="h-24 bg-white/5 rounded-2xl" />
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-white/5 rounded-xl" />
              ))}
            </div>
          )}

          {/* ── Error ── */}
          {error && !loading && (
            <div className="flex items-start gap-3 p-4 bg-red-900/30 border border-red-500/30 rounded-2xl">
              <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-300 font-medium">Erreur de récupération</p>
                <p className="text-sm text-red-400/80 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* ── Results ── */}
          {result && !loading && (
            <div className="space-y-4">
              {/* Product card */}
              <ProductCard product={result.product} scannedAt={result.scannedAt} />

              {/* No product found */}
              {!result.product && (
                <div className="flex items-center gap-3 p-4 bg-amber-900/20 border border-amber-400/20 rounded-2xl">
                  <Package size={18} className="text-amber-400 flex-shrink-0" />
                  <div>
                    <p className="text-amber-300 font-medium text-sm">Produit non référencé</p>
                    <p className="text-xs text-amber-400/70 mt-0.5">
                      Cet EAN n'est pas dans la base Open Food Facts. Vous pouvez{' '}
                      <a
                        href="https://world.openfoodfacts.org/product/new"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        l'ajouter ici
                      </a>.
                    </p>
                  </div>
                </div>
              )}

              {/* Summary banner */}
              <div className="text-center">
                <p className="text-sm text-slate-400">
                  {result.allEntries.length > 0
                    ? `${result.allEntries.length} relevé${result.allEntries.length > 1 ? 's' : ''} trouvé${result.allEntries.length > 1 ? 's' : ''} sur ${result.byTerritory.filter((t) => t.count > 0).length} territoire${result.byTerritory.filter((t) => t.count > 0).length > 1 ? 's' : ''}`
                    : 'Aucun relevé de prix trouvé pour ce produit dans les DOM-TOM'}
                </p>
              </div>

              {/* Territory table */}
              {result.allEntries.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin size={14} className="text-violet-400" />
                    <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                      Comparaison par territoire
                    </span>
                  </div>
                  {result.byTerritory.map((summary) => (
                    <TerritoryRow
                      key={summary.territory}
                      summary={summary}
                      isCheapest={summary.territory === result.cheapestTerritory}
                    />
                  ))}
                </div>
              )}

              {/* Contribute CTA */}
              <div className="p-4 bg-violet-900/20 border border-violet-400/20 rounded-2xl flex items-start gap-3">
                <TrendingDown size={18} className="text-violet-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-violet-300 font-medium">Vous connaissez un meilleur prix ?</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Contribuez en signalant le prix observé près de chez vous.
                  </p>
                  <Link
                    to="/contribuer"
                    className="inline-flex items-center gap-1 mt-2 text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
                  >
                    Signaler un prix <ChevronRight size={12} />
                  </Link>
                </div>
              </div>

              {/* New scan button */}
              <button
                onClick={handleClear}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm text-slate-400 hover:text-white border border-white/10 hover:border-white/20 rounded-2xl transition-all"
              >
                <RotateCcw size={14} />
                Nouveau scan
              </button>
            </div>
          )}

          {/* ── Info box (no result) ── */}
          {!result && !loading && !error && (
            <div className="p-5 bg-white/5 border border-white/10 rounded-2xl text-center">
              <Barcode size={40} className="mx-auto text-slate-500 mb-3" />
              <p className="text-sm text-slate-400 leading-relaxed">
                Entrez un code EAN (code-barres) pour comparer instantanément les prix
                sur tous les territoires DOM-TOM grâce aux données{' '}
                <span className="text-violet-400 font-medium">Open Prices</span>.
              </p>
              <p className="text-xs text-slate-600 mt-3">
                Données : Open Food Facts (ODbL) + Open Prices (ODbL)
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
