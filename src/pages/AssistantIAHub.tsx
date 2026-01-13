import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { MessageCircle, TrendingUp, ShoppingCart } from 'lucide-react';
import { GlassCard } from '../components/ui/glass-card';
import IaConseiller from './IaConseiller';

type IASection = 'conseiller' | 'suivi' | 'rayon';

export default function AssistantIAHub() {
  const [activeSection, setActiveSection] = useState<IASection>('conseiller');
  
  return (
    <>
      <Helmet>
        <title>Assistant IA - A KI PRI SA YÉ</title>
        <meta name="description" content="Assistant intelligent pour optimiser vos achats et votre budget" />
      </Helmet>
      
      <div className="min-h-screen bg-slate-950 p-4 pt-24">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              🤖 Assistant IA
            </h1>
            <p className="text-gray-400 text-lg">
              Votre conseiller intelligent pour économiser sur vos courses
            </p>
          </div>
          
          {/* Section Selector */}
          <GlassCard className="mb-6 p-3">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setActiveSection('conseiller')}
                className={`flex flex-col items-center gap-2 px-4 py-4 rounded-xl font-semibold transition-all ${
                  activeSection === 'conseiller' 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' 
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700 hover:text-gray-300'
                }`}
                aria-label="Sélectionner la section conseiller"
                aria-pressed={activeSection === 'conseiller'}
              >
                <MessageCircle className="w-6 h-6" />
                <span className="text-sm">Conseiller</span>
              </button>
              <button
                onClick={() => setActiveSection('suivi')}
                className={`flex flex-col items-center gap-2 px-4 py-4 rounded-xl font-semibold transition-all ${
                  activeSection === 'suivi' 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' 
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700 hover:text-gray-300'
                }`}
                aria-label="Sélectionner la section suivi"
                aria-pressed={activeSection === 'suivi'}
              >
                <TrendingUp className="w-6 h-6" />
                <span className="text-sm">Suivi</span>
              </button>
              <button
                onClick={() => setActiveSection('rayon')}
                className={`flex flex-col items-center gap-2 px-4 py-4 rounded-xl font-semibold transition-all ${
                  activeSection === 'rayon' 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' 
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700 hover:text-gray-300'
                }`}
                aria-label="Sélectionner la section rayon IA"
                aria-pressed={activeSection === 'rayon'}
              >
                <ShoppingCart className="w-6 h-6" />
                <span className="text-sm">Rayon IA</span>
              </button>
            </div>
          </GlassCard>
          
          {/* Dynamic Content */}
          <div>
            {activeSection === 'conseiller' && <IaConseiller />}
            
            {activeSection === 'suivi' && (
              <GlassCard>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                  <TrendingUp className="w-7 h-7 text-purple-400" />
                  Suivi Intelligent
                </h2>
                <p className="text-gray-400 mb-6">
                  Suivez l'évolution de vos dépenses et recevez des alertes personnalisées
                </p>
                
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                    <div className="text-3xl mb-3">📊</div>
                    <h3 className="font-semibold text-lg mb-2 text-white">
                      Analyse des dépenses
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Visualisez vos habitudes d'achat et identifiez les opportunités d'économies
                    </p>
                  </div>
                  
                  <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                    <div className="text-3xl mb-3">🔔</div>
                    <h3 className="font-semibold text-lg mb-2 text-white">
                      Alertes prix
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Soyez notifié quand vos produits favoris sont en promotion
                    </p>
                  </div>
                </div>
                
                <div className="bg-slate-900/50 rounded-xl p-8 text-center">
                  <p className="text-gray-500">
                    Module en cours d'intégration
                  </p>
                </div>
              </GlassCard>
            )}
            
            {activeSection === 'rayon' && (
              <GlassCard>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                  <ShoppingCart className="w-7 h-7 text-purple-400" />
                  Rayon IA
                </h2>
                <p className="text-gray-400 mb-6">
                  Découvrez les meilleures offres du moment dans chaque rayon
                </p>
                
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                    <div className="text-3xl mb-3">🥖</div>
                    <h3 className="font-semibold text-lg mb-2 text-white">
                      Épicerie
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Produits de base et essentiels
                    </p>
                  </div>
                  
                  <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                    <div className="text-3xl mb-3">🥩</div>
                    <h3 className="font-semibold text-lg mb-2 text-white">
                      Viande & Poisson
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Produits frais et surgelés
                    </p>
                  </div>
                  
                  <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                    <div className="text-3xl mb-3">🥬</div>
                    <h3 className="font-semibold text-lg mb-2 text-white">
                      Fruits & Légumes
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Produits de saison locaux
                    </p>
                  </div>
                </div>
                
                <div className="bg-slate-900/50 rounded-xl p-8 text-center">
                  <p className="text-gray-500">
                    Module en cours d'intégration
                  </p>
                </div>
              </GlassCard>
            )}
          </div>
          
          {/* Features Section */}
          <div className="mt-8">
            <GlassCard className="bg-purple-900/20 border-purple-700/30">
              <h3 className="text-lg font-semibold text-purple-300 mb-4 flex items-center gap-2">
                <span>✨</span>
                <span>Fonctionnalités de l'IA</span>
              </h3>
              <ul className="space-y-3 text-gray-300 text-sm">
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>Analyse personnalisée de vos habitudes d'achat</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>Recommandations basées sur votre historique et votre territoire</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>Alertes intelligentes sur les promotions pertinentes</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>Optimisation automatique de votre liste de courses</span>
                </li>
              </ul>
            </GlassCard>
          </div>
        </div>
      </div>
    </>
  );
}
