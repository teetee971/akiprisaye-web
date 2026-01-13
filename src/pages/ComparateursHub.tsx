import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { DollarSign, Weight, TrendingDown, Map, BarChart3 } from 'lucide-react';
import { GlassCard } from '../components/ui/glass-card';
import Comparateur from './Comparateur';
import HistoriquePrix from './HistoriquePrix';

type ComparateurTab = 'prix' | 'kilo' | 'shrinkflation' | 'metropole' | 'historique';

export default function ComparateursHub() {
  const [activeTab, setActiveTab] = useState<ComparateurTab>('prix');
  
  const tabs = [
    { id: 'prix', label: 'Prix standards', icon: DollarSign, description: 'Comparer les prix entre enseignes' },
    { id: 'kilo', label: 'Prix au kilo', icon: Weight, description: 'Comparer les prix au poids' },
    { id: 'shrinkflation', label: 'Shrinkflation', icon: TrendingDown, description: 'Détecter la réduction des quantités' },
    { id: 'metropole', label: 'vs Métropole', icon: Map, description: 'Comparer avec les prix métropole' },
    { id: 'historique', label: 'Historique', icon: BarChart3, description: 'Évolution des prix dans le temps' },
  ] as const;
  
  return (
    <>
      <Helmet>
        <title>Comparateurs de prix - A KI PRI SA YÉ</title>
        <meta name="description" content="Comparez les prix entre enseignes, au kilo, avec la métropole et suivez l'historique" />
      </Helmet>
      
      <div className="min-h-screen bg-slate-950 p-4 pt-24">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              📊 Comparateurs de prix
            </h1>
            <p className="text-gray-400 text-lg">
              Tous vos outils de comparaison en un seul endroit
            </p>
          </div>
          
          {/* Tabs - Mobile Responsive */}
          <GlassCard className="mb-6 p-3">
            <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as ComparateurTab)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                        : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700 hover:text-gray-300'
                    }`}
                    aria-label={`Sélectionner le mode ${tab.label}`}
                    aria-pressed={activeTab === tab.id}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm whitespace-nowrap">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </GlassCard>
          
          {/* Tab Description */}
          <div className="mb-6">
            <GlassCard className="p-4">
              <p className="text-gray-300 text-sm">
                {tabs.find(t => t.id === activeTab)?.description}
              </p>
            </GlassCard>
          </div>
          
          {/* Dynamic Content */}
          <div>
            {activeTab === 'prix' && <Comparateur />}
            {activeTab === 'kilo' && (
              <GlassCard>
                <h2 className="text-xl font-semibold text-white mb-4">
                  ⚖️ Comparateur Prix au Kilo
                </h2>
                <p className="text-gray-400 mb-6">
                  Comparez les prix au kilo ou au litre pour identifier les meilleures offres
                </p>
                <div className="bg-slate-900/50 rounded-xl p-8 text-center">
                  <p className="text-gray-500">
                    Module en cours d'intégration
                  </p>
                </div>
              </GlassCard>
            )}
            {activeTab === 'shrinkflation' && (
              <GlassCard>
                <h2 className="text-xl font-semibold text-white mb-4">
                  📉 Détecteur de Shrinkflation
                </h2>
                <p className="text-gray-400 mb-6">
                  Identifiez les produits dont la quantité a diminué sans baisse de prix proportionnelle
                </p>
                <div className="bg-slate-900/50 rounded-xl p-8 text-center">
                  <p className="text-gray-500">
                    Module en cours d'intégration
                  </p>
                </div>
              </GlassCard>
            )}
            {activeTab === 'metropole' && (
              <GlassCard>
                <h2 className="text-xl font-semibold text-white mb-4">
                  🗺️ Équivalence Métropole
                </h2>
                <p className="text-gray-400 mb-6">
                  Comparez les prix DOM-COM avec ceux de la métropole
                </p>
                <div className="bg-slate-900/50 rounded-xl p-8 text-center">
                  <p className="text-gray-500">
                    Module en cours d'intégration
                  </p>
                </div>
              </GlassCard>
            )}
            {activeTab === 'historique' && <HistoriquePrix />}
          </div>
          
          {/* Statistics Section */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <GlassCard className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">250+</div>
              <div className="text-gray-400 text-sm">Produits référencés</div>
            </GlassCard>
            <GlassCard className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">15%</div>
              <div className="text-gray-400 text-sm">Économies moyennes</div>
            </GlassCard>
            <GlassCard className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">5</div>
              <div className="text-gray-400 text-sm">Territoires couverts</div>
            </GlassCard>
          </div>
        </div>
      </div>
    </>
  );
}
