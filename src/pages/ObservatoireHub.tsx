import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { BarChart3, Search, Award, Database } from 'lucide-react';
import { GlassCard } from '../components/ui/glass-card';
import Observatoire from './Observatoire';

type ObservatoireTab = 'dashboard' | 'diagnostic' | 'palmares' | 'donnees';

export default function ObservatoireHub() {
  const [activeTab, setActiveTab] = useState<ObservatoireTab>('dashboard');
  
  return (
    <>
      <Helmet>
        <title>Observatoire des Prix - A KI PRI SA YÉ</title>
        <meta name="description" content="Observatoire citoyen des prix dans les DOM-COM" />
      </Helmet>
      
      <div className="min-h-screen bg-slate-950 p-4 pt-24">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              📈 Observatoire des Prix
            </h1>
            <p className="text-gray-400 text-lg">
              Données transparentes et analyses approfondies des prix DOM-COM
            </p>
          </div>
          
          {/* Tabs */}
          <GlassCard className="mb-6 p-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex flex-col items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === 'dashboard' 
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' 
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700 hover:text-gray-300'
                }`}
                aria-label="Sélectionner l'onglet dashboard"
                aria-pressed={activeTab === 'dashboard'}
              >
                <BarChart3 className="w-5 h-5" />
                <span className="text-sm">Dashboard</span>
              </button>
              <button
                onClick={() => setActiveTab('diagnostic')}
                className={`flex flex-col items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === 'diagnostic' 
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' 
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700 hover:text-gray-300'
                }`}
                aria-label="Sélectionner l'onglet diagnostic"
                aria-pressed={activeTab === 'diagnostic'}
              >
                <Search className="w-5 h-5" />
                <span className="text-sm">Diagnostic</span>
              </button>
              <button
                onClick={() => setActiveTab('palmares')}
                className={`flex flex-col items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === 'palmares' 
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' 
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700 hover:text-gray-300'
                }`}
                aria-label="Sélectionner l'onglet palmarès"
                aria-pressed={activeTab === 'palmares'}
              >
                <Award className="w-5 h-5" />
                <span className="text-sm">Palmarès</span>
              </button>
              <button
                onClick={() => setActiveTab('donnees')}
                className={`flex flex-col items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === 'donnees' 
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' 
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700 hover:text-gray-300'
                }`}
                aria-label="Sélectionner l'onglet données"
                aria-pressed={activeTab === 'donnees'}
              >
                <Database className="w-5 h-5" />
                <span className="text-sm">Données</span>
              </button>
            </div>
          </GlassCard>
          
          {/* Dynamic Content */}
          <div>
            {activeTab === 'dashboard' && <Observatoire />}
            
            {activeTab === 'diagnostic' && (
              <GlassCard>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                  <Search className="w-7 h-7 text-red-400" />
                  Diagnostic Territorial
                </h2>
                <p className="text-gray-400 mb-6">
                  Analysez en profondeur les écarts de prix dans votre territoire
                </p>
                
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                    <div className="text-3xl mb-3">📊</div>
                    <h3 className="font-semibold text-lg mb-2 text-white">
                      Analyse par catégorie
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Comparez les prix par rayon et type de produit
                    </p>
                  </div>
                  
                  <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                    <div className="text-3xl mb-3">🏪</div>
                    <h3 className="font-semibold text-lg mb-2 text-white">
                      Analyse par enseigne
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Identifiez les enseignes les plus compétitives
                    </p>
                  </div>
                  
                  <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                    <div className="text-3xl mb-3">📈</div>
                    <h3 className="font-semibold text-lg mb-2 text-white">
                      Évolution temporelle
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Suivez les tendances sur plusieurs mois
                    </p>
                  </div>
                  
                  <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                    <div className="text-3xl mb-3">🌍</div>
                    <h3 className="font-semibold text-lg mb-2 text-white">
                      Comparaison territoriale
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Comparez avec d'autres territoires DOM-COM
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
            
            {activeTab === 'palmares' && (
              <GlassCard>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                  <Award className="w-7 h-7 text-red-400" />
                  Palmarès des Enseignes
                </h2>
                <p className="text-gray-400 mb-6">
                  Classement des enseignes selon différents critères
                </p>
                
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
                      {[1, 2, 3].map((rank) => (
                        <div key={rank} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                          <div className="text-2xl w-8 text-center">{rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}</div>
                          <div className="flex-1">
                            <div className="font-medium text-white">Enseigne #{rank}</div>
                            <div className="text-xs text-gray-500">Score : {100 - rank * 5}/100</div>
                          </div>
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
                  </div>
                </div>
              </GlassCard>
            )}
            
            {activeTab === 'donnees' && (
              <GlassCard>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                  <Database className="w-7 h-7 text-red-400" />
                  Données Publiques
                </h2>
                <p className="text-gray-400 mb-6">
                  Accédez aux données brutes et transparentes de l'observatoire
                </p>
                
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                    <div className="text-3xl mb-3">📥</div>
                    <h3 className="font-semibold text-lg mb-2 text-white">
                      Export de données
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Téléchargez les données au format CSV, JSON ou Excel
                    </p>
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                      Télécharger
                    </button>
                  </div>
                  
                  <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                    <div className="text-3xl mb-3">📊</div>
                    <h3 className="font-semibold text-lg mb-2 text-white">
                      API ouverte
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Intégrez nos données dans vos applications
                    </p>
                    <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors">
                      Documentation
                    </button>
                  </div>
                </div>
                
                <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-6">
                  <h3 className="font-semibold text-blue-300 mb-3 flex items-center gap-2">
                    <span>📜</span>
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
          
          {/* Key Metrics */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-white mb-4">
              Indicateurs clés
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <GlassCard className="text-center">
                <div className="text-3xl font-bold text-red-400 mb-2">45k+</div>
                <div className="text-gray-400 text-sm">Prix relevés</div>
              </GlassCard>
              <GlassCard className="text-center">
                <div className="text-3xl font-bold text-orange-400 mb-2">1.2k</div>
                <div className="text-gray-400 text-sm">Produits suivis</div>
              </GlassCard>
              <GlassCard className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">150</div>
                <div className="text-gray-400 text-sm">Magasins analysés</div>
              </GlassCard>
              <GlassCard className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">5</div>
                <div className="text-gray-400 text-sm">Territoires DOM-COM</div>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
