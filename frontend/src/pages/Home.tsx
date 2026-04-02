import { Link, useNavigate } from 'react-router-dom';
import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Camera, Play, ShieldCheck, Globe, Zap } from 'lucide-react';
import '../styles/home-v5.css';
import '../styles/animations.css';
import { SEOHead } from '../components/ui/SEOHead';
import { useScrollReveal } from '../hooks/useScrollReveal';
import {
  SkeletonSection,
  SkeletonWidget,
  SkeletonStatGrid,
} from '../components/SkeletonWidgets';

const LiveNewsFeed = lazy(() => import('../components/home/LiveNewsFeed'));
const PanierVitalWidget = lazy(() => import('../components/home/PanierVitalWidget'));
const StoreRankingWidget = lazy(() => import('../components/home/StoreRankingWidget'));
const InflationBarometerWidget = lazy(() => import('../components/home/InflationBarometerWidget'));
const ObservatorySection = lazy(() => import('./home-v5/ObservatorySection'));

const QUICK_TILES = [
  {
    title: 'Comparer vos courses',
    subtitle: 'Trouvez le prix le plus bas en quelques secondes',
    links: [
      { label: 'Comparateur principal', to: '/comparateur' },
      { label: 'Recherche produits', to: '/recherche-produits' },
      { label: 'Scanner un code-barres', to: '/scan' },
    ],
  },
  {
    title: 'Suivre les tendances',
    subtitle: 'Visualisez rapidement les mouvements de prix',
    links: [
      { label: 'Observatoire des prix', to: '/observatoire' },
      { label: 'Comparaison territoires', to: '/comparateur-territoires' },
      { label: 'Anomalies de prix', to: '/anomalies-prix' },
    ],
  },
];

const TOP_INTERESTS_INSIGHTS = [
  { key: 'comparateur', label: 'Comparateur de prix', to: '/comparateur', emoji: '🛒', views: 39 },
  { key: 'connexion', label: 'Connexion', to: '/connexion', emoji: '🔑', views: 29 },
  { key: 'comparateurs', label: 'Hub Comparateurs', to: '/comparateurs', emoji: '🔍', views: 12 },
  { key: 'scanner', label: 'Scanner / Codes-barres', to: '/scanner', emoji: '📷', views: 7 },
  { key: 'actualites', label: 'Actualités', to: '/actualites', emoji: '📰', views: 5 },
];

type TerritoryCode = 'gp' | 'mq' | 'gf' | 'fr' | 'global';
type QuickLink = { key: string; label: string; to: string; emoji: string; views: number };

const QUICK_LINKS_BY_TERRITORY: Record<TerritoryCode, QuickLink[]> = {
  gp: [
    { key: 'comparateur', label: 'Comparateur de prix', to: '/comparateur', emoji: '🛒', views: 39 },
    { key: 'connexion', label: 'Connexion', to: '/connexion', emoji: '🔑', views: 29 },
    { key: 'comparateurs', label: 'Hub Comparateurs', to: '/comparateurs', emoji: '🔍', views: 12 },
    { key: 'scanner', label: 'Scanner / Codes-barres', to: '/scanner', emoji: '📷', views: 7 },
    { key: 'actualites', label: 'Actualités', to: '/actualites', emoji: '📰', views: 5 },
  ],
  mq: [
    { key: 'comparateur', label: 'Comparateur de prix', to: '/comparateur', emoji: '🛒', views: 7 },
    { key: 'comparateurs', label: 'Hub Comparateurs', to: '/comparateurs', emoji: '🔍', views: 2 },
    { key: 'scanner', label: 'Scanner / Codes-barres', to: '/scanner', emoji: '📷', views: 2 },
  ],
  gf: [
    { key: 'comparateur', label: 'Comparateur de prix', to: '/comparateur', emoji: '🛒', views: 2 },
    { key: 'connexion', label: 'Connexion', to: '/connexion', emoji: '🔑', views: 1 },
    { key: 'actualites', label: 'Actualités', to: '/actualites', emoji: '📰', views: 1 },
  ],
  fr: [
    { key: 'comparateur', label: 'Comparateur de prix', to: '/comparateur', emoji: '🛒', views: 2 },
    { key: 'connexion', label: 'Connexion', to: '/connexion', emoji: '🔑', views: 1 },
    { key: 'comparateurs', label: 'Hub Comparateurs', to: '/comparateurs', emoji: '🔍', views: 1 },
  ],
  global: TOP_INTERESTS_INSIGHTS,
};

function detectTerritory(): TerritoryCode {
  if (typeof window === 'undefined') return 'global';
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone?.toLowerCase() || '';
  const lang = (navigator.language || '').toLowerCase();
  if (tz.includes('guadeloupe')) return 'gp';
  if (tz.includes('martinique')) return 'mq';
  if (tz.includes('cayenne')) return 'gf';
  if (lang.startsWith('fr')) return 'fr';
  return 'global';
}

async function resolveTerritoryFromServer(): Promise<TerritoryCode | null> {
  if (typeof window === 'undefined') return null;

  const fromMeta = document
    .querySelector('meta[name="akp-territory"]')
    ?.getAttribute('content')
    ?.toLowerCase()
    ?.trim();
  if (fromMeta === 'gp' || fromMeta === 'mq' || fromMeta === 'gf' || fromMeta === 'fr') {
    return fromMeta;
  }

  try {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 1200);
    const res = await fetch('/api/runtime-context', { signal: controller.signal, cache: 'no-store' });
    window.clearTimeout(timeoutId);
    if (!res.ok) return null;
    const body = await res.json();
    const code = String(body?.territory || '').toLowerCase();
    if (code === 'gp' || code === 'mq' || code === 'gf' || code === 'fr') return code;
  } catch {
    // fallback heuristic below
  }

  return null;
}

function trackQuicklinkEvent(event: 'impression' | 'click', payload: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  const body = JSON.stringify({ event, ...payload, ts: new Date().toISOString() });
  try {
    navigator.sendBeacon('/api/analytics/home-quicklinks', body);
  } catch {
    // no-op: analytics must never break UX
  }
}

function getAbVariant(): 'A' | 'B' {
  if (typeof window === 'undefined') return 'A';
  const key = 'akp_home_quicklinks_variant';
  const stored = window.localStorage.getItem(key);
  if (stored === 'A' || stored === 'B') return stored;
  const assigned = Math.random() < 0.5 ? 'A' : 'B';
  window.localStorage.setItem(key, assigned);
  return assigned;
}

export default function Home() {
  const navigate = useNavigate();
  useScrollReveal();
  const [showFullHome, setShowFullHome] = useState(false);
  const [query, setQuery] = useState('');
  const [territory, setTerritory] = useState<TerritoryCode>(() => detectTerritory());
  const [abVariant] = useState<'A' | 'B'>(() => getAbVariant());

  const territoryLinks = useMemo(
    () => QUICK_LINKS_BY_TERRITORY[territory] ?? QUICK_LINKS_BY_TERRITORY.global,
    [territory]
  );
  const orderedLinks = useMemo(
    () =>
      [...territoryLinks].sort((a, b) => {
        // A/B test simple : sur B, "Hub Comparateurs" passe avant "Connexion".
        if (abVariant === 'B') {
          if (a.key === 'comparateurs' && b.key === 'connexion') return -1;
          if (a.key === 'connexion' && b.key === 'comparateurs') return 1;
        }
        return b.views - a.views;
      }),
    [abVariant, territoryLinks]
  );

  useEffect(() => {
    let mounted = true;
    resolveTerritoryFromServer().then((resolved) => {
      if (!mounted || !resolved) return;
      setTerritory(resolved);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    trackQuicklinkEvent('impression', {
      territory,
      abVariant,
      links: orderedLinks.map((l) => l.key),
    });
  }, [territory, abVariant, orderedLinks]);

  const orderedLinksForRender = orderedLinks;

  const lastAction = typeof window !== 'undefined' ? window.localStorage.getItem('akp_last_action') : null;
  const lastActionLabel =
    lastAction === '/scanner' ? 'Reprendre le scanner' :
    lastAction === '/comparateur' ? 'Reprendre le comparateur' :
    lastAction === '/comparateurs' ? 'Reprendre le hub comparateurs' :
    null;

  const rememberAction = (to: string) => {
    if (typeof window !== 'undefined') window.localStorage.setItem('akp_last_action', to);
  };

  const onQuicklinkClick = (to: string, key: string) => {
    rememberAction(to);
    trackQuicklinkEvent('click', { territory, abVariant, key, to });
  };

  const onSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    rememberAction('/recherche-produits');
    navigate(`/recherche-produits?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 overflow-x-hidden">
      <SEOHead 
        title="AkiPrisaye — Le comparateur de prix n°1 en Guadeloupe"
        description="Scannez vos tickets, comparez les prix des supermarchés en Guadeloupe et économisez sur vos courses."
      />

      <header className="relative pt-20 pb-32 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest">
              <Zap className="w-3 h-3" /> Communauté GP
            </div>
            <h1 className="text-5xl lg:text-7xl font-black leading-tight italic uppercase">
              Ne payez plus <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">le prix fort.</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-lg leading-relaxed">
              L'application citoyenne qui scanne les tickets de caisse pour vous dire où vos courses sont les moins chères en Guadeloupe.
            </p>
            <p className="text-sm text-slate-300 font-semibold">Le plus utile, sans surcharge.</p>
            <p className="text-xs text-slate-400">Page d’accueil simplifiée.</p>
            <form onSubmit={onSearchSubmit} className="flex flex-col sm:flex-row gap-2 max-w-xl">
              <label htmlFor="hero-search" className="sr-only">Rechercher un produit</label>
              <input
                id="hero-search"
                aria-label="Rechercher un produit"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700"
                placeholder="Rechercher un produit"
              />
              <button type="submit" className="px-4 py-3 bg-emerald-500 text-slate-950 rounded-xl font-bold">Rechercher</button>
            </form>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => {
                  rememberAction('/scanner');
                  navigate('/scan');
                }}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all hover:scale-105 flex items-center gap-2"
              >
                <Camera className="w-5 h-5" /> Scanner un ticket
              </button>
              {lastAction && lastActionLabel && (
                <button
                  type="button"
                  onClick={() => navigate(lastAction)}
                  className="px-6 py-4 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-2xl border border-emerald-500/40"
                >
                  {lastActionLabel}
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowFullHome((v) => !v)}
                className="px-6 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl border border-slate-600"
              >
                {showFullHome ? 'Masquer la vue complète' : 'Voir toute la page d’accueil'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className="py-20 px-6 overflow-hidden text-center">
        <div className="max-w-5xl mx-auto space-y-10">
          <h2 className="text-3xl lg:text-4xl font-black italic uppercase flex items-center justify-center gap-3">
            <Play className="text-emerald-400 w-8 h-8 fill-emerald-400" />
            Comment ça marche ?
          </h2>
          <div className="relative aspect-video max-w-4xl mx-auto rounded-3xl overflow-hidden border-8 border-slate-900 shadow-2xl bg-black">
            <video controls muted preload="none" poster="/assets/video-poster.jpg" className="w-full h-full object-cover">
              <source src="/assets/demo-app.mp4" type="video/mp4" />
              <track kind="captions" label="Français" />
              Navigateur non supporté.
            </video>
          </div>
        </div>
      </section>

      {showFullHome ? (
        <section className="py-20 px-6 space-y-32">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-xl font-extrabold mb-4">
              Accès rapides les plus consultés ({territory.toUpperCase()})
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {orderedLinksForRender.map((item) => (
                <Link
                  key={item.key}
                  to={item.to}
                  onClick={() => onQuicklinkClick(item.to, item.key)}
                  className="rounded-xl border border-slate-700 bg-slate-900/70 p-3 hover:border-blue-400 transition"
                >
                  <div className="text-lg">{item.emoji}</div>
                  <div className="font-bold text-sm mt-1">{item.label}</div>
                  <div className="text-xs text-slate-400">{item.views} vues</div>
                </Link>
              ))}
            </div>
          </div>
          <h3 className="text-2xl font-bold text-center">Ce que disent nos utilisateurs</h3>
          <Suspense fallback={<SkeletonSection />}>
            <div className="max-w-7xl mx-auto"><ObservatorySection /></div>
          </Suspense>
          <Suspense fallback={<SkeletonStatGrid />}>
            <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-8">
              <InflationBarometerWidget />
              <StoreRankingWidget />
              <LiveNewsFeed />
            </div>
          </Suspense>
        </section>
      ) : (
        <section className="py-20 px-6 space-y-32">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-xl font-extrabold mb-4">
              Accès rapides les plus consultés ({territory.toUpperCase()})
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {orderedLinksForRender.map((item) => (
                <Link
                  key={item.key}
                  to={item.to}
                  onClick={() => onQuicklinkClick(item.to, item.key)}
                  className="rounded-xl border border-slate-700 bg-slate-900/70 p-3 hover:border-blue-400 transition"
                >
                  <div className="text-lg">{item.emoji}</div>
                  <div className="font-bold text-sm mt-1">{item.label}</div>
                  <div className="text-xs text-slate-400">{item.views} vues</div>
                </Link>
              ))}
            </div>
          </div>
          <div aria-hidden className="w-full animate-pulse rounded-xl bg-slate-900/60 border border-slate-800 " style={{ minHeight: 280 }} />
          <div aria-hidden className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="h-28 rounded-xl border border-slate-800 bg-slate-900/60 animate-pulse" />
            <div className="h-28 rounded-xl border border-slate-800 bg-slate-900/60 animate-pulse" />
            <div className="h-28 rounded-xl border border-slate-800 bg-slate-900/60 animate-pulse" />
            <div className="h-28 rounded-xl border border-slate-800 bg-slate-900/60 animate-pulse" />
          </div>
        </section>
      )}
    </div>
  );
}
