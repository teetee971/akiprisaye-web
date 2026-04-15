import { lazy, Suspense, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { BarChart3, Search, Award, Database, TrendingUp, BarChart2, Store, Globe, Download, FileText, ShoppingCart, ChevronUp, ChevronDown, Minus, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { GlassCard } from '../components/ui/glass-card';
import { HeroImage } from '../components/ui/HeroImage';
import { TERRITORIES, type TerritoryCode } from '../constants/territories';
import { getPalmaresForTerritory, OBSERVATOIRE_PALMARES } from '../data/observatoirePalmares';

const Observatoire = lazy(() => import('./Observatoire'));

// Real Unsplash photo: data analytics dashboard
const HERO_IMG = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fm=webp&fit=crop&w=1600&q=80';

type ObservatoireTab = 'dashboard' | 'diagnostic' | 'palmares' | 'donnees';

// ── CSV export helper ────────────────────────────────────────────────────────

function exportObservatoireCSV(territory: TerritoryCode) {
  const palmares = OBSERVATOIRE_PALMARES.find((p) => p.territory === territory);
  if (!palmares) return;

  const escapeField = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const BOM = '\uFEFF';

  const header = ['Territoire', 'Mise à jour', 'Catégorie', 'Enseigne', 'Score', 'Tendance', 'Note'];
  const rows: string[][] = [];

  for (const entry of palmares.lowestPrices) {
    rows.push([territory.toUpperCase(), palmares.updatedAt, 'Prix les plus bas', entry.name, String(entry.score), entry.change, entry.note]);
  }
  for (const entry of palmares.bestValue) {
    rows.push([territory.toUpperCase(), palmares.updatedAt, 'Meilleur rapport qualité-prix', entry.name, String(entry.score), entry.change, entry.note]);
  }
  for (const entry of palmares.widestSelection) {
    rows.push([territory.toUpperCase(), palmares.updatedAt, 'Plus grande sélection', entry.name, String(entry.score), entry.change, entry.note]);
  }

  const csv = [header, ...rows].map((r) => r.map(escapeField).join(',')).join('\r\n');
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `observatoire-${territory}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ObservatoireHub() {
  const [activeTab, setActiveTab] = useState<ObservatoireTab>('dashboard');
  const [selectedTerritory, setSelectedTerritory] = useState<TerritoryCode>('gp');
  const palmares = getPalmaresForTerritory(selectedTerritory);
  const palmaresUpdatedAt = palmares?.updatedAt ?? '—';

  const handleExportCSV = useCallback(() => {
    exportObservatoireCSV(selectedTerritory);
    toast.success('Rapport CSV téléchargé');
  }, [selectedTerritory]);

  const renderChangeBadge = (change: 'up' | 'down' | 'stable') => {
    if (change === 'up') {
      return <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-200 inline-flex items-center gap-1"><ChevronUp className="w-3 h-3" aria-hidden="true" /></span>;
    }
    if (change === 'down') {
      return <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-xs text-rose-200 inline-flex items-center gap-1"><ChevronDown className="w-3 h-3" aria-hidden="true" /></span>;
    }
    return <span className="rounded-full bg-slate-700/60 px-2 py-0.5 text-xs text-slate-200 inline-flex items-center gap-1"><Minus className="w-3 h-3" aria-hidden="true" /></span>;
  };
  
  return (
    <>
      <Helmet>
        <title>Observatoire des Prix — DOM-TOM · A KI PRI SA YÉ</title>
        <meta name="description" content="Données citoyennes transparentes, relevés terrain vérifiés et comparaisons territoriales en temps réel dans les DOM-TOM." />
        <link rel="canonical" href="https://teetee971.github.io/akiprisaye-web/observatoire" />
        <link rel="alternate" hrefLang="fr" href="https://teetee971.github.io/akiprisaye-web/observatoire" />
        <link rel="alternate" hrefLang="x-default" href="https://teetee971.github.io/akiprisaye-web/observatoire" />
      </Helmet>
      
      <div className="min-h-screen bg-slate-950 p-3 sm:p-4 pt-10 sm:pt-12">
        <div className="max-w-7xl mx-auto">

          {/* Hero banner */}
          <div className="mb-5 sm:mb-8">
            <HeroImage
              src={HERO_IMG}
              alt="Rayons de supermarché — comparaison des prix DOM-TOM"
              gradient="from-slate-900 to-emerald-950"
              height="h-32 sm:h-48"
            >
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white drop-shadow">
                🔬 Observatoire des Prix — DOM-TOM
              </h1>
              <p className="text-slate-200 drop-shadow text-sm sm:text-base mt-1 max-w-2xl">
                Données citoyennes transparentes · Relevés terrain vérifiés · Comparaisons territoriales en temps réel
              </p>
            </HeroImage>
          </div>

          {/* Stats band — 4 key indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-5 sm:mb-7">
            <GlassCard className="flex items-center gap-3 p-3 sm:p-4">
              <div className="p-2 rounded-lg bg-red-500/20 flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-red-400" aria-hidden="true" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-red-400">50k+</div>
                <div className="text-white text-xs sm:text-sm font-medium leading-tight">Prix relevés</div>
                <div className="text-gray-500 text-xs hidden sm:block">par des citoyens</div>
              </div>
            </GlassCard>
            <GlassCard className="flex items-center gap-3 p-3 sm:p-4">
              <div className="p-2 rounded-lg bg-orange-500/20 flex-shrink-0">
                <ShoppingCart className="w-5 h-5 text-orange-400" aria-hidden="true" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-orange-400">1 200</div>
                <div className="text-white text-xs sm:text-sm font-medium leading-tight">Produits suivis</div>
                <div className="text-gray-500 text-xs hidden sm:block">chaque mois</div>
              </div>
            </GlassCard>
            <GlassCard className="flex items-center gap-3 p-3 sm:p-4">
              <div className="p-2 rounded-lg bg-green-500/20 flex-shrink-0">
                <Store className="w-5 h-5 text-green-400" aria-hidden="true" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-green-400">150</div>
                <div className="text-white text-xs sm:text-sm font-medium leading-tight">Magasins analysés</div>
                <div className="text-gray-500 text-xs hidden sm:block">dans les DOM-TOM</div>
              </div>
            </GlassCard>
            <GlassCard className="flex items-center gap-3 p-3 sm:p-4">
              <div className="p-2 rounded-lg bg-blue-500/20 flex-shrink-0">
                <Globe className="w-5 h-5 text-blue-400" aria-hidden="true" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-blue-400">9</div>
                <div className="text-white text-xs sm:text-sm font-medium leading-tight">Territoires couverts</div>
                <div className="text-gray-500 text-xs hidden sm:block">en temps réel</div>
              </div>
            </GlassCard>
          </div>

          {/* Tabs */}
          <GlassCard className="mb-4 sm:mb-6 p-1.5 sm:p-2">
            <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
              {(
                [
                  { id: 'dashboard' as ObservatoireTab,  emoji: '📊', label: 'Dashboard',  Icon: BarChart3 },
                  { id: 'diagnostic' as ObservatoireTab, emoji: '🔍', label: 'Diagnostic', Icon: Search },
                  { id: 'palmares' as ObservatoireTab,   emoji: '🏆', label: 'Palmarès',   Icon: Award },
                  { id: 'donnees' as ObservatoireTab,    emoji: '📂', label: 'Données',    Icon: Database },
                ] as const
              ).map(({ id, emoji, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex flex-col items-center gap-1 sm:gap-1.5 px-2 py-2.5 sm:px-4 sm:py-3 rounded-xl font-semibold transition-all ${
                    activeTab === id
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 scale-[1.02]'
                      : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700 hover:text-gray-200'
                  }`}
                  aria-label={`Sélectionner l'onglet ${label}`}
                  aria-pressed={activeTab === id}
                >
                  <span className="text-base sm:text-lg leading-none">{emoji}</span>
                  <span className="text-xs sm:text-sm">{label}</span>
                </button>
              ))}
            </div>
          </GlassCard>
          
          {/* Dynamic Content */}
          <div>
            {activeTab === 'dashboard' && (
              <Suspense fallback={<div className="h-96 rounded-2xl border border-white/10 bg-slate-900/50" aria-hidden="true" />}>
                <Observatoire />
              </Suspense>
            )}
            
            {activeTab === 'diagnostic' && (
              <GlassCard>
                <h2 className="text-2xl font-semibold text-white mb-2 flex items-center gap-3">
                  <Search className="w-7 h-7 text-red-400" />
                  Diagnostic Territorial
                </h2>
                <p className="text-gray-400 mb-6 text-sm">
                  Analysez en profondeur les écarts de prix dans votre territoire
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
                  {/* Card A — Analyse par catégorie */}
                  <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
                    <div className="bg-blue-900/40 border-b border-blue-700/30 px-4 py-2.5 flex items-center gap-2">
                      <BarChart2 className="w-5 h-5 text-blue-400 flex-shrink-0" aria-hidden="true" />
                      <h3 className="font-semibold text-sm text-blue-200">Analyse par catégorie</h3>
                    </div>
                    <div className="p-4">
                      <p className="text-gray-300 text-sm mb-2">
                        Épicerie <span className="text-orange-400 font-semibold">+39%</span>, Boissons <span className="text-red-400 font-semibold">+101%</span>… découvrez le détail par rayon.
                      </p>
                      <p className="text-gray-500 text-xs mb-3">Données mars 2026 · 1 200 produits analysés</p>
                      <Link
                        to="/observatoire"
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Voir l'analyse →
                      </Link>
                    </div>
                  </div>

                  {/* Card B — Analyse par enseigne */}
                  <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
                    <div className="bg-green-900/40 border-b border-green-700/30 px-4 py-2.5 flex items-center gap-2">
                      <Store className="w-5 h-5 text-green-400 flex-shrink-0" aria-hidden="true" />
                      <h3 className="font-semibold text-sm text-green-200">Analyse par enseigne</h3>
                    </div>
                    <div className="p-4">
                      <p className="text-gray-300 text-sm mb-2">
                        Leader Price le moins cher en Guadeloupe, E.Leclerc <span className="text-red-400 font-semibold">+97%</span> vs métropole.
                      </p>
                      <p className="text-gray-500 text-xs mb-3">Classement sur 150 magasins · 9 territoires</p>
                      <Link
                        to="/comparaison-enseignes"
                        className="inline-flex items-center gap-1 text-xs font-medium text-green-400 hover:text-green-300 transition-colors"
                      >
                        Voir le classement →
                      </Link>
                    </div>
                  </div>

                  {/* Card C — Évolution temporelle */}
                  <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
                    <div className="bg-orange-900/40 border-b border-orange-700/30 px-4 py-2.5 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-orange-400 flex-shrink-0" aria-hidden="true" />
                      <h3 className="font-semibold text-sm text-orange-200">Évolution temporelle</h3>
                    </div>
                    <div className="p-4">
                      <p className="text-gray-300 text-sm mb-2">
                        Suivi mensuel jan→mar 2026 : <span className="text-orange-400 font-semibold">+7,4%</span> de hausse alimentaire en Guadeloupe.
                      </p>
                      <p className="text-gray-500 text-xs mb-3">Baromètre actualisé chaque mois</p>
                      <Link
                        to="/observatoire"
                        className="inline-flex items-center gap-1 text-xs font-medium text-orange-400 hover:text-orange-300 transition-colors"
                      >
                        Voir le baromètre →
                      </Link>
                    </div>
                  </div>

                  {/* Card D — Comparaison territoriale */}
                  <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
                    <div className="bg-purple-900/40 border-b border-purple-700/30 px-4 py-2.5 flex items-center gap-2">
                      <Globe className="w-5 h-5 text-purple-400 flex-shrink-0" aria-hidden="true" />
                      <h3 className="font-semibold text-sm text-purple-200">Comparaison territoriale</h3>
                    </div>
                    <div className="p-4">
                      <p className="text-gray-300 text-sm mb-2">
                        Saint-Barthélemy <span className="text-red-400 font-semibold">+99%</span>, Guyane <span className="text-orange-400 font-semibold">+59%</span>, Guadeloupe <span className="text-yellow-400 font-semibold">+39%</span> vs Hexagone.
                      </p>
                      <p className="text-gray-500 text-xs mb-3">9 territoires · comparaison avec la métropole</p>
                      <Link
                        to="/comparateur-citoyen"
                        className="inline-flex items-center gap-1 text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        Comparer les territoires →
                      </Link>
                    </div>
                  </div>
                </div>
                
                {/* Quick-action buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                  {[
                    { Icon: BarChart2,    label: 'Comparaison enseignes',     to: '/comparaison-enseignes' },
                    { Icon: ShoppingCart, label: 'Paniers types DOM / Métropole', to: '/paniers-types' },
                    { Icon: ShoppingCart, label: 'Comparaison panier',          to: '/comparaison-panier' },
                    { Icon: Globe,        label: 'Comparateur citoyen',  to: '/comparateur-citoyen' },
                    { Icon: Star,         label: 'Évaluation magasins',  to: '/evaluation-magasins' },
                  ].map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="flex flex-col items-center gap-2 p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-emerald-500/50 transition-all text-center"
                    >
                      <item.Icon className="w-6 h-6 text-slate-300" aria-hidden="true" />
                      <span className="text-xs font-medium text-gray-300">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </GlassCard>
            )}
            
            {activeTab === 'palmares' && (
              <GlassCard>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                  <Award className="w-7 h-7 text-red-400" />
                  Palmarès des Enseignes
                </h2>
                <p className="text-gray-400 mb-6">
                  Classement des enseignes selon différents critères
                </p>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <div className="text-sm text-gray-400">
                    Mise à jour palmarès : {palmaresUpdatedAt}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 uppercase tracking-wide">Territoire</span>
                    <select
                      value={selectedTerritory}
                      onChange={(event) => setSelectedTerritory(event.target.value as TerritoryCode)}
                      className="bg-slate-900 text-white border border-slate-700 rounded-lg px-3 py-2 text-sm"
                    >
                      {OBSERVATOIRE_PALMARES.map((entry) => (
                        <option key={entry.territory} value={entry.territory}>
                          {TERRITORIES[entry.territory]?.name ?? entry.territory.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg text-white flex items-center gap-2">
                        <span>🥇</span>
                        <span>Prix les plus bas</span>
                      </h3>
                    </div>
                    <p className="text-gray-400 text-sm mb-4">
                      Enseignes offrant les meilleurs prix sur le panier moyen
                    </p>
                    <div className="space-y-2">
                      {palmares?.lowestPrices.map((entry, index) => (
                        <div key={entry.name} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                          <div className="text-2xl w-8 text-center">{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</div>
                          <div className="flex-1">
                            <div className="font-medium text-white">{entry.name}</div>
                            <div className="text-xs text-gray-500">Score : {entry.score}/100 • {entry.note}</div>
                          </div>
                          {renderChangeBadge(entry.change)}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg text-white flex items-center gap-2">
                        <span>⭐</span>
                        <span>Meilleur rapport qualité/prix</span>
                      </h3>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Enseignes offrant le meilleur équilibre prix/qualité
                    </p>
                    <div className="mt-4 space-y-2">
                      {palmares?.bestValue.map((entry, index) => (
                        <div key={entry.name} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                          <div className="text-2xl w-8 text-center">{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</div>
                          <div className="flex-1">
                            <div className="font-medium text-white">{entry.name}</div>
                            <div className="text-xs text-gray-500">Score : {entry.score}/100 • {entry.note}</div>
                          </div>
                          {renderChangeBadge(entry.change)}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg text-white flex items-center gap-2">
                        <span>📦</span>
                        <span>Plus large choix</span>
                      </h3>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Enseignes avec le plus grand nombre de références
                    </p>
                    <div className="mt-4 space-y-2">
                      {palmares?.widestSelection.map((entry, index) => (
                        <div key={entry.name} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                          <div className="text-2xl w-8 text-center">{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</div>
                          <div className="flex-1">
                            <div className="font-medium text-white">{entry.name}</div>
                            <div className="text-xs text-gray-500">Score : {entry.score}/100 • {entry.note}</div>
                          </div>
                          {renderChangeBadge(entry.change)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </GlassCard>
            )}
            
            {activeTab === 'donnees' && (
              <GlassCard>
                <h2 className="text-2xl font-semibold text-white mb-2 flex items-center gap-3">
                  <Database className="w-7 h-7 text-red-400" />
                  Données Publiques
                </h2>
                <p className="text-gray-400 mb-4 text-sm">
                  Accédez aux données brutes et transparentes de l'observatoire
                </p>

                {/* Snapshot stats */}
                <div className="flex flex-wrap gap-4 mb-5 p-4 bg-slate-900/60 rounded-xl border border-slate-700/40">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-400 flex-shrink-0" aria-hidden="true" />
                    <span className="text-sm text-gray-300"><span className="font-bold text-white">15</span> snapshots disponibles</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-green-400 flex-shrink-0" aria-hidden="true" />
                    <span className="text-sm text-gray-300"><span className="font-bold text-white">9 territoires</span> × 3 mois = mars 2026</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
                  <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                    <Download className="w-7 h-7 text-blue-400 mb-2" aria-hidden="true" />
                    <h3 className="font-semibold text-base mb-1 text-white">Export de données</h3>
                    <p className="text-gray-400 text-sm mb-3">Téléchargez le palmarès du territoire sélectionné au format CSV</p>
                    <button
                      type="button"
                      onClick={handleExportCSV}
                      className="inline-block px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Télécharger CSV
                    </button>
                  </div>
                  <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                    <BarChart2 className="w-7 h-7 text-emerald-400 mb-2" aria-hidden="true" />
                    <h3 className="font-semibold text-base mb-1 text-white">API ouverte</h3>
                    <p className="text-gray-400 text-sm mb-3">Intégrez nos données dans vos applications</p>
                    <Link
                      to="/roadmap"
                      className="inline-block px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Documentation
                    </Link>
                  </div>
                </div>

                {/* Contribute card */}
                <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-xl p-4 mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-emerald-300 mb-1 flex items-center gap-2 text-sm">
                      <ShoppingCart className="w-4 h-4" aria-hidden="true" />
                      Contribuer aux données
                    </h3>
                    <p className="text-gray-400 text-xs">
                      Partagez vos relevés de prix depuis votre territoire pour enrichir l'observatoire citoyen.
                    </p>
                  </div>
                  <Link
                    to="/contribuer-prix"
                    className="flex-shrink-0 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors text-center"
                  >
                    Contribuer
                  </Link>
                </div>
                
                <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-6">
                  <h3 className="font-semibold text-blue-300 mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5" aria-hidden="true" />
                    <span>Licence des données</span>
                  </h3>
                  <p className="text-gray-300 text-sm mb-3">
                    Nos données sont publiées sous licence ouverte Etalab 2.0
                  </p>
                  <ul className="space-y-2 text-gray-400 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400">✓</span>
                      <span>Réutilisation libre y compris commerciale</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400">✓</span>
                      <span>Mention de la source obligatoire</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400">✓</span>
                      <span>Garantie de l'intégrité des données</span>
                    </li>
                  </ul>
                </div>
              </GlassCard>
            )}
          </div>
          
          {/* Key Metrics — below tabs */}
          <div className="mt-6 sm:mt-8">
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-3">
              Indicateurs clés
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 sm:gap-3">
              <GlassCard className="text-center py-4 px-2">
                <div className="text-2xl sm:text-3xl font-bold text-red-400 mb-0.5">50 000+</div>
                <div className="text-white text-xs sm:text-sm font-medium">prix relevés</div>
                <div className="text-gray-500 text-xs mt-0.5">par des citoyens vérifiés</div>
              </GlassCard>
              <GlassCard className="text-center py-4 px-2">
                <div className="text-2xl sm:text-3xl font-bold text-orange-400 mb-0.5">1 200</div>
                <div className="text-white text-xs sm:text-sm font-medium">produits</div>
                <div className="text-gray-500 text-xs mt-0.5">suivis chaque mois</div>
              </GlassCard>
              <GlassCard className="text-center py-4 px-2">
                <div className="text-2xl sm:text-3xl font-bold text-green-400 mb-0.5">150</div>
                <div className="text-white text-xs sm:text-sm font-medium">magasins</div>
                <div className="text-gray-500 text-xs mt-0.5">dans les DOM-TOM</div>
              </GlassCard>
              <GlassCard className="text-center py-4 px-2">
                <div className="text-2xl sm:text-3xl font-bold text-blue-400 mb-0.5">9</div>
                <div className="text-white text-xs sm:text-sm font-medium">territoires</div>
                <div className="text-gray-500 text-xs mt-0.5">couverts en temps réel</div>
              </GlassCard>
              <GlassCard className="text-center py-4 px-2 col-span-2 md:col-span-1">
                <div className="text-2xl sm:text-3xl font-bold text-emerald-400 mb-0.5">95 %</div>
                <div className="text-white text-xs sm:text-sm font-medium">données vérifiées</div>
                <div className="text-gray-500 text-xs mt-0.5">par ticket de caisse</div>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
