import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { DollarSign, Weight, TrendingDown, Map, BarChart3 } from 'lucide-react';
import { GlassCard } from '../components/ui/glass-card';
import Comparateur from './Comparateur';
import HistoriquePrix from './HistoriquePrix';
import {
  metropoleComparisonData,
  pricePerKiloData,
  shrinkflationData,
} from '../data/comparateurAdvancedMocks';

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
              <GlassCard className="space-y-6">
                <h2 className="text-xl font-semibold text-white mb-4">
                  ⚖️ Comparateur Prix au Kilo
                </h2>
                <p className="text-gray-400 mb-6">
                  Comparez les prix au kilo ou au litre pour identifier les meilleures offres
                </p>
                <div className="flex flex-wrap gap-3 text-xs text-slate-300">
                  <span className="rounded-full border border-slate-700 px-3 py-1">
                    Source : {pricePerKiloData.source}
                  </span>
                  <span className="rounded-full border border-slate-700 px-3 py-1">
                    Mise à jour : {pricePerKiloData.lastUpdated}
                  </span>
                </div>
                <div className="bg-slate-900/50 rounded-xl p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    {pricePerKiloData.items.map((item) => (
                      <div key={item.id} className="rounded-xl border border-slate-800 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-white font-semibold">{item.product}</p>
                            <p className="text-xs text-slate-400">{item.brand}</p>
                          </div>
                          <span className="text-xs text-slate-400">{item.territory}</span>
                        </div>
                        <p className="mt-3 text-sm text-blue-300 font-semibold">
                          {item.price.toFixed(2)} € / {item.quantity}
                          {item.unit}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            )}
            {activeTab === 'shrinkflation' && (
              <GlassCard className="space-y-6">
                <h2 className="text-xl font-semibold text-white mb-4">
                  📉 Détecteur de Shrinkflation
                </h2>
                <p className="text-gray-400 mb-6">
                  Identifiez les produits dont la quantité a diminué sans baisse de prix proportionnelle
                </p>
                <div className="flex flex-wrap gap-3 text-xs text-slate-300">
                  <span className="rounded-full border border-slate-700 px-3 py-1">
                    Source : {shrinkflationData.source}
                  </span>
                  <span className="rounded-full border border-slate-700 px-3 py-1">
                    Mise à jour : {shrinkflationData.lastUpdated}
                  </span>
                </div>
                <div className="bg-slate-900/50 rounded-xl p-4 space-y-3">
                  {shrinkflationData.items.map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-800 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-white font-semibold">{item.product}</p>
                          <p className="text-xs text-slate-400">{item.brand}</p>
                        </div>
                        <span className="text-xs text-slate-400">{item.territory}</span>
                      </div>
                      <div className="mt-3 grid gap-2 text-sm text-slate-200 md:grid-cols-3">
                        <div>
                          <p className="text-xs text-slate-400">Avant</p>
                          <p>{item.previousSize} · {item.previousPrice.toFixed(2)} €</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Maintenant</p>
                          <p>{item.currentSize} · {item.currentPrice.toFixed(2)} €</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Détection</p>
                          <p>{item.detectedAt}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
            {activeTab === 'metropole' && (
              <GlassCard className="space-y-6">
                <h2 className="text-xl font-semibold text-white mb-4">
                  🗺️ Équivalence Métropole
                </h2>
                <p className="text-gray-400 mb-6">
                  Comparez les prix DOM-COM avec ceux de la métropole
                </p>
                <div className="flex flex-wrap gap-3 text-xs text-slate-300">
                  <span className="rounded-full border border-slate-700 px-3 py-1">
                    Source : {metropoleComparisonData.source}
                  </span>
                  <span className="rounded-full border border-slate-700 px-3 py-1">
                    Mise à jour : {metropoleComparisonData.lastUpdated}
                  </span>
                </div>
                <div className="bg-slate-900/50 rounded-xl p-4 space-y-3">
                  {metropoleComparisonData.items.map((item) => {
                    const delta = item.domPrice - item.metropolePrice;
                    const deltaLabel = delta >= 0 ? `+${delta.toFixed(2)} €` : `${delta.toFixed(2)} €`;
                    return (
                      <div key={item.id} className="rounded-xl border border-slate-800 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-white font-semibold">{item.product}</p>
                            <p className="text-xs text-slate-400">{item.territory}</p>
                          </div>
                          <span className="text-sm font-semibold text-amber-300">{deltaLabel}</span>
                        </div>
                        <div className="mt-3 grid gap-2 text-sm text-slate-200 md:grid-cols-2">
                          <div>
                            <p className="text-xs text-slate-400">Territoire</p>
                            <p>{item.domPrice.toFixed(2)} €</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Métropole</p>
                            <p>{item.metropolePrice.toFixed(2)} €</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
