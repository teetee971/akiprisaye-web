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


function canUseStaticApiEndpoints(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname.toLowerCase();
  // Disable static API endpoints on known GitHub Pages host(s) only
  if (host === 'prix200.github.io') return false;
  return true;
}

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

  if (!canUseStaticApiEndpoints()) return null;

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
  if (!canUseStaticApiEndpoints()) return;

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

  const shareLinks = [
    {
      name: 'WhatsApp',
      icon: <MessageCircle size={24} />,
      color: 'bg-[#25D366]',
      link: `https://wa.me/?text=${encodeURIComponent(shareTitle + " " + shareUrl)}`
    },
    {
      name: 'Facebook',
      icon: <Facebook size={24} />,
      color: 'bg-[#1877F2]',
      link: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    },
    {
      name: 'Telegram',
      icon: <Send size={24} />,
      color: 'bg-[#0088cc]',
      link: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`
    },
    {
      name: 'TikTok',
      icon: <Video size={24} />, // Icône vidéo pour TikTok
      color: 'bg-[#000000] border border-slate-700',
      link: tiktokProfile
    }
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4">
      <div className="max-w-md mx-auto space-y-8 pt-12 pb-24">
        
        {/* Header Hero */}
        <div className="text-center space-y-4">
          <div className="inline-block p-1 rounded-2xl bg-gradient-to-tr from-blue-500 to-emerald-500 mb-2">
            <div className="bg-[#0f172a] rounded-xl px-4 py-1">
              <span className="text-xs font-bold text-blue-400">VERSION 4.6.4</span>
            </div>
          </div>
          <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent">
            AkiPrisaye
          </h1>
          <p className="text-slate-400 text-lg font-medium">
            Économisez sur vos courses <br/>en Guadeloupe. 🏝️
          </p>
        </div>

        {/* Section Partage & Réseaux */}
        <div className="bg-slate-800/40 backdrop-blur-xl p-6 rounded-[2.5rem] border border-slate-700/50 shadow-2xl">
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Share2 size={18} className="text-blue-500" /> Propager l'appli
            </h2>
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
          </div>
          
          <div className="grid grid-cols-4 gap-4 mb-6">
            {shareLinks.map((social) => (
              <a
                key={social.name}
                href={social.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`${social.color} aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 shadow-lg active:scale-90 transition-all`}
              >
                {social.icon}
                <span className="text-[10px] font-bold uppercase">{social.name}</span>
              </a>
            ))}
          </div>

          <button
            onClick={copyToClipboard}
            className="w-full bg-slate-900/50 hover:bg-slate-900 text-slate-300 py-4 rounded-2xl flex items-center justify-center gap-3 border border-slate-700/50 transition-all active:bg-blue-600 active:text-white"
          >
            {copied ? (
              <>
                <Check size={20} className="text-emerald-400" />
                <span className="font-bold uppercase text-xs tracking-widest">Lien copié !</span>
              </>
            ) : (
              <>
                <Copy size={20} />
                <span className="font-bold uppercase text-xs tracking-widest">Copier le lien direct</span>
              </>
            )}
          </button>
        </div>

        {/* Info supplémentaire */}
        <div className="text-center">
          <p className="text-slate-500 text-xs font-medium">
            Rejoignez la communauté des chasseurs de prix. 🏷️
          </p>
        </div>

      </div>
    </div>
  );
};

export default Home;
