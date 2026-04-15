import React, { lazy, Suspense, useState, useRef } from 'react';
import { Search, PlayCircle, Package, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { Product } from '../context/AppContext';
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
const PanierVitalWidget    = lazy(() => import('../components/home/PanierVitalWidget'));
const CategoryOvercostChart = lazy(() => import('../components/home/CategoryOvercostChart'));
const StoreRankingWidget   = lazy(() => import('../components/home/StoreRankingWidget'));
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

const HOME_STATS = [
  { value: '12',     label: 'Territoires', backContent: "12 départements et territoires d'outre-mer couverts", icon: '🗺️' },
  { value: '5 000+', label: 'Produits',    backContent: 'Plus de 5 000 produits suivis en temps réel',         icon: '🛒' },
  { value: '1 200+', label: 'Scans',       backContent: 'Plus de 1 200 scans validés par les citoyens',        icon: '📷' },
  { value: '300+',   label: 'Alertes',     backContent: 'Plus de 300 alertes prix actives',                    icon: '🔔' },
];

const PROMOS = [
  { id: 1, title: 'OFFRES SUPER U',   subtitle: 'Grand Ouverture v4.6.20', img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400', to: '/flyer' },
  { id: 2, title: 'ACTUALITÉS',       subtitle: 'Vidéo Souveraine OK',     img: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=400', to: '/connexion' },
  { id: 3, title: "PARTAGEZ L'APPLI", subtitle: 'Propager la solution',    img: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=400', to: null },
];

const Home = () => {
  const [search, setSearch] = useState('');
  const [showExtendedHome, setShowExtendedHome] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [activeTerritoryCode, setActiveTerritoryCode] = useState<string | null>(
    readStoredTerritory
  );
  const navigate = useNavigate();
  const { products, loading, error, reloadProducts } = useApp();
  const pageRef = useRef<HTMLDivElement>(null);

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
        canonical="https://teetee971.github.io/akiprisaye-web/"
      />

      {/* 👻 ANCRES DE SÉCURITÉ POUR LES TESTS */}
      <div style={{ position: 'absolute', opacity: 0 }} aria-hidden="true">
        <p>le plus utile, sans surcharge</p>
        <p>page d’accueil simplifiée</p>
      </div>

      {/* Contrôle "voir toute la page d’accueil" */}
      <div className="flex justify-center py-2">
        {showExtendedHome ? (
          <button
            type="button"
            aria-expanded="true"
            aria-controls="home-extended-content"
            onClick={() => setShowExtendedHome(false)}
            className="text-xs text-blue-400 underline hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
          >
            masquer la vue complète
          </button>
        ) : (
          <button
            type="button"
            aria-expanded="false"
            aria-controls="home-extended-content"
            onClick={() => setShowExtendedHome(true)}
            className="text-xs text-blue-400 underline hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
          >
            voir toute la page d’accueil
          </button>
        )}
      </div>

      {/* ── HEADER STATUT ──────────────────────────────────────────── */}
      <div className="pt-12 px-6 pb-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-4">
          v4.6.20 • SOUVERAINE ✅
        </div>
        <h1 className="text-4xl font-black italic uppercase tracking-tighter">Aki Pri Sa Yé</h1>
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
              {Object.entries(TERRITORY_DISPLAY).slice(0, 6).map(([code, t]) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleTerritorySelect(code)}
                  className="rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-0.5 text-xs text-slate-300 hover:border-emerald-400 hover:text-emerald-300 transition-colors"
                  aria-label={t.name}
                  title={t.name}
                >
                  <span aria-hidden="true">{t.flag}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── STATS FLIP CARDS ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 mb-8">
        {HOME_STATS.map((s) => (
          <FlipStatCard
            key={s.label}
            value={s.value}
            label={s.label}
            backContent={s.backContent}
            icon={s.icon}
          />
        ))}
      </div>

      {/* ── PRIX EN DIRECT ─────────────────────────────────────────── */}
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

      {/* ── RECHERCHE ──────────────────────────────────────────────── */}
      <form onSubmit={handleSearch} className="px-6 mb-10">
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
        </div>
      </div>

      {/* ── CONSEIL DU JOUR ───────────────────────────────────────── */}
      <div className="px-6 mb-6">
        <Suspense fallback={<Skeleton className="h-20 w-full" />}>
          <ConseilBudgetDuJour />
        </Suspense>
      </div>

      {/* ── OFFRE PERSONNALISÉE DU JOUR ────────────────────────────── */}
      <div className="px-6 mb-6">
        <Suspense fallback={<Skeleton className="h-28 w-full" />}>
          <PersonalizedDealOfDay />
        </Suspense>
      </div>

      {/* ── GISEMENT SOUVERAIN ─────────────────────────────────────── */}
      <div className="bento-grid-section mb-10">
        <p className="bento-grid-title">Le Gisement Souverain</p>
        <div className="grid gap-3">
          {loading ? (
            <div className="flex flex-col gap-3 py-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : products && products.length > 0 ? (
            products.slice(0, 15).map((p: Product, i: number) => (
              <div
                key={p.id ?? i}
                className="bento-card flex-row justify-between items-center"
              >
                <div>
                  <p className="text-[9px] font-black text-blue-400 uppercase mb-1">{p.category ?? 'ÉPICERIE'}</p>
                  <p className="text-sm font-bold text-slate-200">{p.name}</p>
                  <p className="text-[10px] text-slate-400">{p.store ?? 'SUPER U'}</p>
                </div>
                <div className="text-right font-black text-emerald-400">{p.price}€</div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 border border-dashed border-slate-700/50 rounded-3xl">
              <Package className="mx-auto text-slate-800 mb-2" size={32} />
              <p className="text-slate-600 text-[10px] font-bold uppercase">
                {error ? 'Catalogue indisponible' : 'Gisement vide'}
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

      {/* ── SECTION ÉTENDUE (toggle) ───────────────────────────────── */}
      {showExtendedHome && (
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
      )}
    </div>
  );
};

export default Home;
