import React, { useState, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { Map as MapIcon, Navigation, Zap } from 'lucide-react';
import { GlassCard } from '../components/ui/glass-card';
const Carte = React.lazy(() => import('./Carte'));
type MapMode = 'carte' | 'itineraire' | 'optimisation';

export default function CarteItinerairesHub() {
  const [mode, setMode] = useState<MapMode>('carte');

  return (
    <>
      <Helmet>
        <title>Carte & Itinéraires - A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Trouvez les magasins près de chez vous et optimisez vos trajets"
        />
        <link rel="canonical" href="https://teetee971.github.io/akiprisaye-web/carte-itineraires" />
        <link
          rel="alternate"
          hrefLang="fr"
          href="https://teetee971.github.io/akiprisaye-web/carte-itineraires"
        />
        <link
          rel="alternate"
          hrefLang="x-default"
          href="https://teetee971.github.io/akiprisaye-web/carte-itineraires"
        />
      </Helmet>

      <div className="min-h-screen bg-slate-950 p-4 pt-14">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              🗺️ Carte & Itinéraires
            </h1>
            <p className="text-gray-400 text-lg">
              Trouvez les meilleurs magasins et optimisez vos déplacements
            </p>
          </div>

          {/* Mode Selector */}
          <GlassCard className="mb-6 p-3">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setMode('carte')}
                className={`flex flex-col items-center gap-2 px-4 py-4 rounded-xl font-semibold transition-all ${
                  mode === 'carte'
                    ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700 hover:text-gray-300'
                }`}
                aria-label="Sélectionner le mode carte"
                aria-pressed={mode === 'carte'}
              >
                <MapIcon className="w-6 h-6" />
                <span className="text-sm">Carte</span>
              </button>
              <button
                onClick={() => setMode('itineraire')}
                className={`flex flex-col items-center gap-2 px-4 py-4 rounded-xl font-semibold transition-all ${
                  mode === 'itineraire'
                    ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700 hover:text-gray-300'
                }`}
                aria-label="Sélectionner le mode itinéraire"
                aria-pressed={mode === 'itineraire'}
              >
                <Navigation className="w-6 h-6" />
                <span className="text-sm">Itinéraire</span>
              </button>
              <button
                onClick={() => setMode('optimisation')}
                className={`flex flex-col items-center gap-2 px-4 py-4 rounded-xl font-semibold transition-all ${
                  mode === 'optimisation'
                    ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700 hover:text-gray-300'
                }`}
                aria-label="Sélectionner le mode optimisation"
                aria-pressed={mode === 'optimisation'}
              >
                <Zap className="w-6 h-6" />
                <span className="text-sm">Optimisation</span>
              </button>
            </div>
          </GlassCard>

          {/* Dynamic Content */}
          <div>
            {mode === 'carte' && (
              <div className="-mt-6">
                <Carte />
              </div>
            )}

            {mode === 'itineraire' && (
              <GlassCard>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                  <Navigation className="w-7 h-7 text-green-400" />
                  Planificateur d'itinéraire
                </h2>
                <p className="text-gray-400 mb-6">Calculez le meilleur trajet pour vos courses</p>

                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                    <div className="text-3xl mb-3">📍</div>
                    <h3 className="font-semibold text-lg mb-2 text-white">Multi-destinations</h3>
                    <p className="text-gray-400 text-sm">
                      Planifiez un trajet avec plusieurs arrêts magasins
                    </p>
                  </div>

                  <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                    <div className="text-3xl mb-3">⏱️</div>
                    <h3 className="font-semibold text-lg mb-2 text-white">Temps estimé</h3>
                    <p className="text-gray-400 text-sm">
                      Calculez la durée et la distance de votre parcours
                    </p>
                  </div>
                </div>

                <div className="bg-slate-900/50 rounded-xl p-8 text-center">
                  <p className="text-gray-500">Module en cours d'intégration</p>
                </div>
              </GlassCard>
            )}

            {mode === 'optimisation' && (
              <GlassCard>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                  <Zap className="w-7 h-7 text-green-400" />
                  Optimisation de parcours
                </h2>
                <p className="text-gray-400 mb-6">
                  Trouvez le parcours le plus économique et rapide pour votre liste de courses
                </p>

                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                    <div className="text-3xl mb-3">💰</div>
                    <h3 className="font-semibold text-lg mb-2 text-white">Économie maximale</h3>
                    <p className="text-gray-400 text-sm">Privilégie les magasins les moins chers</p>
                  </div>

                  <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                    <div className="text-3xl mb-3">🚗</div>
                    <h3 className="font-semibold text-lg mb-2 text-white">Distance minimale</h3>
                    <p className="text-gray-400 text-sm">Réduit les kilomètres parcourus</p>
                  </div>

                  <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                    <div className="text-3xl mb-3">⚖️</div>
                    <h3 className="font-semibold text-lg mb-2 text-white">Équilibré</h3>
                    <p className="text-gray-400 text-sm">Balance prix et distance</p>
                  </div>
                </div>

                <div className="bg-slate-900/50 rounded-xl p-8 text-center">
                  <p className="text-gray-500">Module en cours d'intégration</p>
                </div>
              </GlassCard>
            )}
          </div>

          {/* Info Section */}
          <div className="mt-8">
            <GlassCard className="bg-green-900/20 border-green-700/30">
              <h3 className="text-lg font-semibold text-green-300 mb-4 flex items-center gap-2">
                <span>💡</span>
                <span>Astuces de navigation</span>
              </h3>
              <ul className="space-y-3 text-gray-300 text-sm">
                <li className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Activez la géolocalisation pour des résultats plus précis</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">•</span>
                  <span>
                    Planifiez vos courses aux heures creuses pour éviter les files d'attente
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">•</span>
                  <span>
                    Regroupez vos achats dans le même secteur pour économiser du carburant
                  </span>
                </li>
              </ul>
            </GlassCard>
          </div>
        </div>
      </div>
    </>
  );
}
