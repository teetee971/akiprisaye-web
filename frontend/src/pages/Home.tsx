import { Link, useNavigate } from 'react-router-dom';
import React, { lazy, Suspense } from 'react';
import { Camera, Play, Zap } from 'lucide-react';
import '../styles/home-v5.css';
import '../styles/animations.css';
import { SEOHead } from '../components/ui/SEOHead';
import { useScrollReveal } from '../hooks/useScrollReveal';
import {
  SkeletonSection,
  SkeletonWidget,
  SkeletonStatGrid,
} from '../components/SkeletonWidgets';

// --- Lazy-loaded components ---
const LiveNewsFeed = lazy(() => import('../components/home/LiveNewsFeed'));
const PanierVitalWidget = lazy(() => import('../components/home/PanierVitalWidget'));
const StoreRankingWidget = lazy(() => import('../components/home/StoreRankingWidget'));
const InflationBarometerWidget = lazy(() => import('../components/home/InflationBarometerWidget'));

// LE CHEMIN CRITIQUE : ./ signifie "dans le même dossier"
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

export default function Home() {
  const navigate = useNavigate();
  useScrollReveal();

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
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => navigate('/scan')}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all hover:scale-105 flex items-center gap-2"
              >
                <Camera className="w-5 h-5" /> Scanner un ticket
              </button>
            </div>
          </div>
          <div className="relative hidden lg:block animate-float">
            <Suspense fallback={<SkeletonWidget />}>
              <PanierVitalWidget />
            </Suspense>
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
            <video controls muted preload="none" poster="/media/video-poster.jpg" className="w-full h-full object-cover">
              <source src="/media/demo-app.mp4" type="video/mp4" />
              <track kind="captions" label="Français" src="/assets/demo-captions.vtt" srclang="fr" default />
              Navigateur non supporté.
            </video>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 space-y-32">
        <Suspense fallback={<SkeletonSection />}>
          <div className="max-w-7xl mx-auto">
            <ObservatorySection />
          </div>
        </Suspense>

        <Suspense fallback={<SkeletonStatGrid />}>
          <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-8">
            <InflationBarometerWidget />
            <StoreRankingWidget />
            <LiveNewsFeed />
          </div>
        </Suspense>
      </section>
    </div>
  );
}
