import React, { lazy, Suspense, useState, useRef, useEffect } from 'react';
import { Search, PlayCircle, Package, RefreshCw, ChevronRight, Share2, MessageCircle, Facebook, Twitter, Link2, Check } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { Product } from '../context/AppContext';
import { useCatalogueProductImage } from '../hooks/useCatalogueProductImage';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { SEOHead } from '../components/ui/SEOHead';
import FlipStatCard from '../components/ui/FlipStatCard';
import PriceLiveTicker from '../components/home/PriceLiveTicker';
import { Skeleton } from '../components/ui/Skeleton';
import '../styles/home-v5.css';
import '../styles/home-bento.css';

/** Minimal territory map for the persistent pill — mirrors TERRITORIES */
const TERRITORY_DISPLAY: Record<string, { flag: string; name: string }> = {
  gp: { flag: '🇬🇵', name: 'Guadeloupe' },
  mq: { flag: '🇲🇶', name: 'Martinique' },
  gf: { flag: '🇬🇫', name: 'Guyane' },
  re: { flag: '🇷🇪', name: 'La Réunion' },
  yt: { flag: '🇾🇹', name: 'Mayotte' },
  nc: { flag: '🇳🇨', name: 'Nouvelle-Calédonie' },
  pf: { flag: '🇵🇫', name: 'Polynésie française' },
  bl: { flag: '🇧🇱', name: 'Saint-Barthélemy' },
  mf: { flag: '🇲🇫', name: 'Saint-Martin' },
  pm: { flag: '🇵🇲', name: 'Saint-Pierre-et-Miquelon' },
  wf: { flag: '🇼🇫', name: 'Wallis-et-Futuna' },
  fr: { flag: '🇫🇷', name: 'France métro.' },
};

function readStoredTerritory(): string | null {
  try {
    const raw = localStorage.getItem('akiprisaye-territory');
    return raw ? raw.toLowerCase() : null;
  } catch {
    return null;
  }
}

// Lazy-loaded sections & widgets — kept out of the initial JS bundle
const HowItWorksSection    = lazy(() => import('./home-v5/HowItWorksSection'));
const ObservatorySection   = lazy(() => import('./home-v5/ObservatorySection'));
const MiniFaqSection       = lazy(() => import('./home-v5/MiniFaqSection'));
const TerritoryPriceChart  = lazy(() => import('../components/home/TerritoryPriceChart'));
const PriceEvolutionChart  = lazy(() => import('../components/home/PriceEvolutionChart'));
const LiveNewsFeed         = lazy(() => import('../components/home/LiveNewsFeed'));
const NewsTeaser           = lazy(() => import('../components/home/NewsTeaser'));
const PanierVitalWidget    = lazy(() => import('../components/home/PanierVitalWidget'));
const CategoryOvercostChart = lazy(() => import('../components/home/CategoryOvercostChart'));
const StoreRankingWidget   = lazy(() => import('../components/home/StoreRankingWidget'));
const PalmaresWidget       = lazy(() => import('../components/home/PalmaresWidget'));
const InflationBarometerWidget = lazy(() => import('../components/home/InflationBarometerWidget'));
const ProduitChocWidget    = lazy(() => import('../components/home/ProduitChocWidget'));
const IndiceEquiteWidget   = lazy(() => import('../components/home/IndiceEquiteWidget'));
const AppDemoShowcase      = lazy(() => import('../components/home/AppDemoShowcase'));
const VideoVieChere        = lazy(() => import('../components/home/VideoVieChere'));
const PriceExplainerBanner = lazy(() => import('../components/home/PriceExplainerBanner'));
const LettreHebdoWidget    = lazy(() => import('../components/home/LettreHebdoWidget'));
const LettreJourWidget     = lazy(() => import('../components/home/LettreJourWidget'));
// "Effet Waouh" widgets — built, now integrated
const ConseilBudgetDuJour      = lazy(() => import('../components/home/ConseilBudgetDuJour'));
const PersonalizedDealOfDay    = lazy(() => import('../components/home/PersonalizedDealOfDay'));
const DailyShockCard           = lazy(() => import('../components/home/DailyShockCard').then((m) => ({ default: m.DailyShockCard })));
const AnonymousSocialComparison = lazy(() => import('../components/home/AnonymousSocialComparison'));
const MonthlySavingsDashboard  = lazy(() => import('../components/home/MonthlySavingsDashboard').then((m) => ({ default: m.MonthlySavingsDashboard })));
const TerritorySignal          = lazy(() => import('../components/home/TerritorySignal').then((m) => ({ default: m.TerritorySignal })));
const SmartShoppingList        = lazy(() => import('../components/home/SmartShoppingList').then((m) => ({ default: m.SmartShoppingList })));
const ShareVictory             = lazy(() => import('../components/home/ShareVictory'));
const ProofStats               = lazy(() => import('../components/home/ProofStats'));

const DEFAULT_HOME_STATS = [
  { value: '12',     label: 'Territoires', backContent: "12 départements et territoires d'outre-mer couverts", icon: '🗺️' },
  { value: '5 000+', label: 'Produits',    backContent: 'Plus de 5 000 produits suivis en temps réel',         icon: '🛒' },
  { value: '1 200+', label: 'Scans',       backContent: 'Plus de 1 200 scans validés par les citoyens',        icon: '📷' },
  { value: '300+',   label: 'Alertes',     backContent: 'Plus de 300 alertes prix actives',                    icon: '🔔' },
];

// Local placeholder images (no external dependency)
const PROMO_IMG_SCAN  = `${import.meta.env.BASE_URL}media/images/hero-recherche.webp`;
const PROMO_IMG_TOP   = `${import.meta.env.BASE_URL}media/images/hero-actualites.webp`;
const PROMO_IMG_SHARE = `${import.meta.env.BASE_URL}media/images/section-professional-3d.webp`;

const PROMOS = [
  { id: 1, title: '📷 SCANNER',              subtitle: 'Scannez un code-barres',         img: PROMO_IMG_SCAN,  to: '/scanner' },
  { id: 2, title: '🏆 TOP ÉCONOMIES',         subtitle: 'Meilleures offres du moment',    img: PROMO_IMG_TOP,   to: '/top-economies' },
  { id: 3, title: '🤝 CONTRIBUER UN PRIX',    subtitle: 'Renforcez l\'observatoire',      img: PROMO_IMG_SHARE, to: '/contribuer' },
];

const CATEGORY_EMOJIS: Record<string, string> = {
  'ÉPICERIE':           '🛒',
  'BOUCHERIE':          '🥩',
  'BOULANGERIE':        '🍞',
  'BOISSONS':           '🥤',
  'CHARCUTERIE':        '🍖',
  'CONFISERIE':         '🍬',
  'CRÈMERIE':           '🧀',
  'FRUITS ET LÉGUMES':  '🥦',
  'HYGIÈNE':            '🧴',
  'PLATS CUISINÉS':     '🍽️',
  'POISSONNERIE':       '🐟',
  'SURGELÉS':           '🧊',
  'ULTRA FRAIS':        '🥗',
  'BAZAR':              '🏬',
};

const TAG_STYLES: Record<string, string> = {
  'PROMO':        'bg-rose-500/20 text-rose-300',
  'LOCAL':        'bg-green-500/20 text-green-300',
  'ESSENTIEL':    'bg-blue-500/20 text-blue-300',
  'SOUVERAIN':    'bg-yellow-500/20 text-yellow-300',
  'FRAÎCHE':      'bg-teal-500/20 text-teal-300',
  'GROS VOLUME':  'bg-purple-500/20 text-purple-300',
  'PRESTIGE':     'bg-amber-500/20 text-amber-300',
  'SIGNATURE':    'bg-indigo-500/20 text-indigo-300',
};

// ─── CatalogueTile ─────────────────────────────────────────────────────────
// Extracted as its own component so hooks (useCatalogueProductImage) can run
// per product without violating the Rules of Hooks.

interface CatalogueTileProps {
  product: Product;
  categoryEmojis: Record<string, string>;
  tagStyles: Record<string, string>;
}

function CatalogueTile({ product: p, categoryEmojis, tagStyles }: CatalogueTileProps) {
  const navigate = useNavigate();
  const tags: string[] = (p as any).tags ?? [];
  const searchPath = `/recherche?q=${encodeURIComponent(p.name)}`;
  const { imageUrl, emoji, loading: imgLoading } = useCatalogueProductImage(p.name, p.category);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${import.meta.env.BASE_URL || '/'}recherche?q=${encodeURIComponent(p.name)}`
    : searchPath;
  const shareText = `${p.name} — ${p.price}€ chez ${p.store ?? ''} 🛒 A KI PRI SA YÉ`;

  // Close share menu on outside click
  useEffect(() => {
    if (!showShare) return;
    const handler = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShowShare(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showShare]);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try { await navigator.clipboard.writeText(shareUrl); } catch { /* ignore */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setShowShare(false);
  };

  const openShare = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
    setShowShare(false);
  };

  return (
    <div
      className="bento-card flex-row items-center gap-3 no-underline cursor-pointer hover:opacity-90 transition-opacity relative"
      onClick={() => navigate(searchPath)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(searchPath); }}
      aria-label={`Voir les prix de ${p.name}`}
    >
      {/* Thumbnail */}
      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center overflow-hidden">
        {imgLoading ? (
          <span className="text-2xl leading-none animate-pulse" role="img" aria-hidden="true">
            {categoryEmojis[p.category ?? ''] ?? '🛒'}
          </span>
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={p.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) parent.textContent = categoryEmojis[p.category ?? ''] ?? '🛒';
            }}
          />
        ) : (
          <span className="text-2xl leading-none" role="img" aria-hidden="true">
            {categoryEmojis[p.category ?? ''] ?? '🛒'}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-black text-blue-400 uppercase mb-0.5">{p.category ?? 'ÉPICERIE'}</p>
        <p className="text-sm font-bold text-slate-200 truncate">{p.name}</p>
        <p className="text-[10px] text-slate-400">{p.store ?? 'SUPER U'}</p>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full ${tagStyles[tag] ?? 'bg-slate-600/40 text-slate-300'}`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Price + share */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="font-black text-emerald-400">{p.price}€</span>

        {/* Share button */}
        <div className="relative" role="presentation" ref={shareRef} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowShare((v) => !v); }}
            className="p-1.5 rounded-full bg-slate-700/60 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
            aria-label={`Partager ${p.name}`}
            aria-expanded={showShare}
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          {showShare && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowShare(false)} aria-hidden="true" />
              <div
                role="menu"
                className="absolute right-0 bottom-full mb-1 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-20 overflow-hidden text-sm"
              >
                <button type="button" role="menuitem" onClick={(e) => openShare(`https://wa.me/?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`, e)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700 text-left text-slate-200">
                  <MessageCircle className="w-4 h-4 text-green-400 flex-shrink-0" /> WhatsApp
                </button>
                <button type="button" role="menuitem" onClick={(e) => openShare(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, e)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700 text-left text-slate-200">
                  <Facebook className="w-4 h-4 text-blue-400 flex-shrink-0" /> Facebook
                </button>
                <button type="button" role="menuitem" onClick={(e) => openShare(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, e)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700 text-left text-slate-200">
                  <Twitter className="w-4 h-4 text-sky-400 flex-shrink-0" /> X / Twitter
                </button>
                <button type="button" role="menuitem" onClick={handleCopy} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700 text-left border-t border-slate-700 text-slate-200">
                  {copied ? <Check className="w-4 h-4 text-green-400 flex-shrink-0" /> : <Link2 className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                  {copied ? 'Lien copié !' : 'Copier le lien'}
                </button>
              </div>
            </>
          )}
        </div>

        <ChevronRight size={14} className="text-slate-500" />
      </div>
    </div>
  );
}

const Home = () => {
  const [search, setSearch] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [activeTerritoryCode, setActiveTerritoryCode] = useState<string | null>(
    readStoredTerritory
  );
  const [homeStats, setHomeStats] = useState(DEFAULT_HOME_STATS);
  const navigate = useNavigate();
  const { products, loading, error, reloadProducts } = useApp();
  const pageRef = useRef<HTMLDivElement>(null);

  // Load dynamic stats from JSON (updated by scraping pipeline)
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/site-stats.json`)
      .then((r) => r.ok ? r.json() as Promise<{ territories?: string; products?: string; scans?: string; alerts?: string }> : Promise.reject())
      .then((data) => {
        setHomeStats([
          { value: data.territories ?? '12',     label: 'Territoires', backContent: "12 départements et territoires d'outre-mer couverts", icon: '🗺️' },
          { value: data.products  ?? '5 000+',   label: 'Produits',    backContent: 'Produits suivis en temps réel',                      icon: '🛒' },
          { value: data.scans     ?? '1 200+',   label: 'Scans',       backContent: 'Scans validés par les citoyens',                     icon: '📷' },
          { value: data.alerts    ?? '300+',     label: 'Alertes',     backContent: 'Alertes prix actives',                               icon: '🔔' },
        ]);
      })
      .catch(() => { /* keep DEFAULT_HOME_STATS */ });
  }, []);

  useScrollReveal(pageRef);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedQuery = search.trim();
    if (!normalizedQuery) {
      navigate('/recherche-produits');
      return;
    }
    navigate(`/recherche-produits?q=${encodeURIComponent(normalizedQuery)}`);
  };

  const handleToggleFaq = (index: number) => {
    setExpandedFaq((prev) => (prev === index ? null : index));
  };

  const handleTerritorySelect = (code: string) => {
    try {
      localStorage.setItem('akiprisaye-territory', code);
    } catch { /* */ }
    setActiveTerritoryCode(code);
    navigate(`/recherche-produits?territoire=${code.toUpperCase()}`);
  };

  return (
    <div ref={pageRef} id="root" className="min-h-screen bg-slate-950 text-white pb-32">
      {/* SEO */}
      <SEOHead
        title="A KI PRI SA YÉ — Comparez les prix DOM-TOM"
        description="Observatoire citoyen des prix dans les DOM-COM. Comparez, analysez et anticipez la vie chère en Guadeloupe, Martinique, Guyane, La Réunion et Mayotte."
        canonical="https://akiprisaye-web.pages.dev/"
      />

      {/* ── HEADER STATUT ──────────────────────────────────────────── */}
      <div className="pt-12 px-6 pb-2 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-widest mb-4">
          🟢 Données mises à jour aujourd’hui
        </div>
        <h1 className="text-4xl font-black italic uppercase tracking-tighter">Aki Pri Sa Yé</h1>
        <p className="mt-2 text-sm text-slate-400 max-w-sm mx-auto leading-snug">
          Comparez les prix des supermarchés en Guadeloupe, Martinique, Guyane, La Réunion et Mayotte.
        </p>
      </div>

      {/* ── TERRITOIRE ACTIF ───────────────────────────────────────── */}
      <div className="px-6 pb-4" aria-label="Territoire sélectionné">
        {activeTerritoryCode && TERRITORY_DISPLAY[activeTerritoryCode] ? (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Territoire :
            </span>
            <button
              type="button"
              onClick={() => navigate(`/recherche-produits?territoire=${activeTerritoryCode.toUpperCase()}`)}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-colors"
            >
              <span aria-hidden="true">{TERRITORY_DISPLAY[activeTerritoryCode].flag}</span>
              {TERRITORY_DISPLAY[activeTerritoryCode].name}
            </button>
            <button
              type="button"
              onClick={() => {
                try { localStorage.removeItem('akiprisaye-territory'); } catch { /* */ }
                setActiveTerritoryCode(null);
              }}
              className="text-[10px] text-slate-600 hover:text-slate-400 underline"
              aria-label="Changer de territoire"
            >
              changer
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Territoire :
            </span>
            <div className="flex gap-1.5 flex-wrap">
              {(Object.entries(TERRITORY_DISPLAY).slice(0, 6) as [string, { flag: string; name: string }][]).map(([code, t]) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleTerritorySelect(code)}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-0.5 text-xs text-slate-300 hover:border-emerald-400 hover:text-emerald-300 transition-colors"
                  aria-label={`${code.toUpperCase()} — ${t.name}`}
                  title={t.name}
                >
                  <span aria-hidden="true">{t.flag}</span>
                  <span className="font-semibold">{code.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── RECHERCHE ──────────────────────────────────────────────── */}
      <form onSubmit={handleSearch} className="px-6 mb-4">
        <div className="relative">
          <Search className="absolute left-4 top-4 text-slate-500" size={20} />
          <input
            type="text"
            aria-label="rechercher un produit"
            placeholder="Rechercher un produit..."
            className="w-full bg-slate-800/40 border border-slate-700/50 p-4 pl-12 rounded-2xl outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="sr-only">rechercher</button>
        </div>
      </form>

      {/* ── CTA PRINCIPAUX ─────────────────────────────────────────── */}
      <div className="px-6 mb-8 flex gap-3">
        <button
          type="button"
          onClick={() => navigate('/comparateur')}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-sm font-bold py-3 px-4 transition-all"
        >
          <Search size={16} />
          Comparer les prix
        </button>
        <button
          type="button"
          onClick={() => navigate('/scanner')}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-sm font-bold py-3 px-4 transition-all"
        >
          <PlayCircle size={16} />
          Scanner un code-barres
        </button>
      </div>
      {/* ── ACTUALITÉS (TEASER) ────────────────────────────────────── */}
      <Suspense fallback={<div className="px-6 mb-6 h-24" />}>
        <NewsTeaser />
      </Suspense>

      {/* ── STATS FLIP CARDS ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 mb-8">
        {homeStats.map((s) => (
          <FlipStatCard
            key={s.label}
            value={s.value}
            label={s.label}
            backContent={s.backContent}
            icon={s.icon}
          />
        ))}
      </div>

      {/* ── PRIX (RELEVÉS CITOYENS) ─────────────────────────────────────────── */}
      <div className="px-6 mb-8">
        <PriceLiveTicker />
      </div>

      {/* ── CARROUSEL PROMOS ───────────────────────────────────────── */}
      <div className="mb-10">
        <div className="flex gap-4 overflow-x-auto px-6 pb-4 snap-x">
          {PROMOS.map((promo, idx) => (
            <button
              key={promo.id}
              type="button"
              onClick={() => promo.to && navigate(promo.to)}
              aria-label={promo.title}
              className="relative flex-none w-72 aspect-video rounded-3xl overflow-hidden border border-slate-700/50 snap-center cursor-pointer active:scale-95 transition-transform text-left"
            >
              <img
                src={promo.img}
                className="absolute inset-0 w-full h-full object-cover opacity-50"
                alt=""
                width={288}
                height={162}
                fetchPriority={idx === 0 ? 'high' : undefined}
                loading={idx === 0 ? undefined : 'lazy'}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-5">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{promo.title}</p>
                <p className="text-sm font-bold">{promo.subtitle}</p>
              </div>
              <PlayCircle className="absolute top-4 right-4 text-white/30" size={24} />
            </button>
          ))}
        </div>
      </div>


      {/* ── OBSERVATOIRE EN DIRECT ─────────────────────────────────── */}
      <div className="bento-grid-section mb-4" aria-label="Observatoire des prix">
        <p className="bento-grid-title">Observatoire en direct</p>
        <div className="bento-grid" style={{ gridAutoRows: 'auto' }}>
          <Suspense fallback={<Skeleton className="h-48 w-full" />}>
            <ProduitChocWidget />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-48 w-full" />}>
            <InflationBarometerWidget />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-48 w-full" />}>
            <PanierVitalWidget />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-48 w-full" />}>
            <StoreRankingWidget />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-48 w-full" />}>
            <PalmaresWidget />
          </Suspense>
        </div>
      </div>

      {/* ── CONSEIL DU JOUR ───────────────────────────────────────── */}
      <div className="px-6 mb-6">
        <Suspense fallback={<Skeleton className="h-20 w-full" />}>
          <ConseilBudgetDuJour />
        </Suspense>
      </div>


      {/* ── CATALOGUE DES PRIX DU MOMENT ─────────────────────────────────────── */}
      <div className="bento-grid-section mb-10">
        <p className="bento-grid-title">Catalogue des prix du moment</p>
        <div className="grid gap-3">
          {loading ? (
            <div className="flex flex-col gap-3 py-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : products && products.length > 0 ? (
            products.slice(0, 15).map((p: Product, i: number) => (
              <CatalogueTile
                key={p.id ?? i}
                product={p}
                categoryEmojis={CATEGORY_EMOJIS}
                tagStyles={TAG_STYLES}
              />
            ))
          ) : (
            <div className="text-center py-10 border border-dashed border-slate-700/50 rounded-3xl">
              <Package className="mx-auto text-slate-800 mb-2" size={32} />
              <p className="text-slate-600 text-[10px] font-bold uppercase">
                {error ? 'Catalogue indisponible' : 'Aucun prix pour le moment'}
              </p>
              {error && (
                <button
                  type="button"
                  onClick={() => void reloadProducts()}
                  className="mt-3 text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2 mx-auto"
                >
                  <RefreshCw size={12} /> Réessayer
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── SECTION ÉTENDUE (toujours visible) ────────────────────── */}
      <div id="home-extended-content" className="space-y-12 px-4 pb-8">
          <Suspense
            fallback={
              <div className="space-y-6 py-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            }
          >
            {/* Social proof — données citoyennes agrégées */}
            <section aria-label="Données de la communauté">
              <Suspense fallback={<Skeleton className="h-16 w-full" />}>
                <ProofStats />
              </Suspense>
            </section>

            {/* Comparaison communautaire anonyme */}
            <Suspense fallback={<Skeleton className="h-32 w-full" />}>
              <AnonymousSocialComparison />
            </Suspense>

            {/* Observatoire citoyen */}
            <ObservatorySection />

            {/* Hausses de la semaine */}
            <Suspense fallback={<Skeleton className="h-48 w-full" />}>
              <DailyShockCard />
            </Suspense>

            {/* Comment ça marche */}
            <HowItWorksSection />

            {/* Pourquoi les prix sont plus élevés */}
            <PriceExplainerBanner />

            {/* Indice équité */}
            <IndiceEquiteWidget />

            {/* Tableau de bord économies mensuelles */}
            <Suspense fallback={<Skeleton className="h-48 w-full" />}>
              <MonthlySavingsDashboard />
            </Suspense>

            {/* Liste de courses intelligente */}
            <Suspense fallback={<Skeleton className="h-48 w-full" />}>
              <SmartShoppingList />
            </Suspense>

            {/* Surcoût par catégorie */}
            <CategoryOvercostChart />

            {/* Carte des prix par territoire */}
            <TerritoryPriceChart />

            {/* Signaux territoire — alertes communautaires */}
            <Suspense fallback={<Skeleton className="h-48 w-full" />}>
              <TerritorySignal />
            </Suspense>

            {/* Évolution des prix */}
            <PriceEvolutionChart />

            {/* Actualités en direct */}
            <LiveNewsFeed />

            {/* Lettre hebdomadaire IA */}
            <LettreHebdoWidget />

            {/* Lettre journalière IA */}
            <LettreJourWidget />

            {/* Vidéo vie chère */}
            <VideoVieChere />

            {/* Démo application */}
            <AppDemoShowcase />

            {/* Partager ses victoires */}
            <Suspense fallback={<Skeleton className="h-32 w-full" />}>
              <ShareVictory />
            </Suspense>

            {/* FAQ */}
            <MiniFaqSection expandedFaq={expandedFaq} onToggleFaq={handleToggleFaq} />
          </Suspense>
      </div>
    </div>
  );
};

export default Home;
