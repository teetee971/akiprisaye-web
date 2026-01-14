import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Cloud, AlertTriangle, MapPin, Shield, Heart, TrendingDown, Clock, Users } from 'lucide-react';
import type { Territory } from '../types/cycloneComparison';
import * as survivalKitService from '../services/survivalKitService';
import * as preparednessService from '../services/preparednessService';
import * as shelterService from '../services/shelterService';
import * as alertService from '../services/cycloneAlertService';

/**
 * Cyclone Preparation Comparator Page
 * 
 * Main tool for cyclone resilience in French overseas territories
 */
export default function CyclonePreparation() {
  const [territory, setTerritory] = useState<Territory>('GP');
  const [householdSize, setHouseholdSize] = useState(4);
  const [survivalKitData, setSurvivalKitData] = useState<any>(null);
  const [beforeChecklist, setBeforeChecklist] = useState(
    preparednessService.loadChecklist('before') || preparednessService.getChecklistByPhase('before')
  );
  const [currentAlert, setCurrentAlert] = useState<any>(null);
  const [shelters, setShelters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [territory]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load survival kit data
      const kitData = await survivalKitService.loadSurvivalKitData();
      setSurvivalKitData(kitData);

      // Load alerts
      const alerts = await alertService.getCurrentAlerts(territory);
      if (alerts.length > 0) {
        setCurrentAlert(alerts[0]);
      } else {
        // Show mock green alert
        setCurrentAlert(alertService.createMockAlert(territory, 'vert'));
      }

      // Load shelters
      const shelterList = await shelterService.getAllShelters(territory);
      setShelters(shelterList);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChecklistToggle = (itemId: string) => {
    const updated = preparednessService.toggleChecklistItem(beforeChecklist, itemId);
    setBeforeChecklist(updated);
    preparednessService.saveChecklist(updated);
  };

  const vigilanceColor = currentAlert ? alertService.getVigilanceColor(currentAlert.vigilance) : '#22c55e';

  return (
    <>
      <Helmet>
        <title>Préparation Cyclones & Catastrophes - A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Outil de résilience cyclonique: comparateur kit survie, checklist préparation, refuges, alertes temps réel. Sauver des vies dans les territoires ultramarins."
        />
      </Helmet>

      <div className="min-h-screen bg-slate-950">
        {/* Hero with Vigilance Banner */}
        <header
          className="relative bg-gradient-to-r from-orange-900 to-red-800 text-white py-12"
          style={{ backgroundColor: vigilanceColor }}
        >
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-3 mb-4">
              <Cloud className="w-12 h-12" />
              <h1 className="text-4xl font-bold">
                🌀 Préparation Cyclones & Catastrophes
              </h1>
            </div>
            
            {currentAlert && (
              <div className="mt-4 bg-white/10 backdrop-blur-md rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-6 h-6" />
                  <span className="text-xl font-semibold">
                    {alertService.getVigilanceText(currentAlert.vigilance)}
                  </span>
                </div>
                {currentAlert.cycloneName && (
                  <p className="text-lg">Cyclone {currentAlert.cycloneName}</p>
                )}
              </div>
            )}

            <p className="mt-4 text-lg opacity-90">
              Outil de résilience pour sauver des vies dans les territoires ultramarins
            </p>

            {/* Territory Selector */}
            <div className="mt-6">
              <label className="block text-sm font-medium mb-2">Votre territoire :</label>
              <select
                value={territory}
                onChange={(e) => setTerritory(e.target.value as Territory)}
                className="px-4 py-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg text-white"
              >
                <option value="GP">Guadeloupe</option>
                <option value="MQ">Martinique</option>
                <option value="GF">Guyane</option>
                <option value="RE">La Réunion</option>
                <option value="YT">Mayotte</option>
                <option value="NC">Nouvelle-Calédonie</option>
                <option value="PF">Polynésie française</option>
              </select>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-white text-lg">Chargement des données...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Checklist Section */}
              <section className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Shield className="w-8 h-8 text-blue-400" />
                  <h2 className="text-2xl font-bold text-white">Ma Checklist de Préparation</h2>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-300">Score de préparation</span>
                    <span className="text-2xl font-bold text-blue-400">{beforeChecklist.score}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-4">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full transition-all duration-300"
                      style={{ width: `${beforeChecklist.score}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-3">
                  {beforeChecklist.items.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${
                        item.completed
                          ? 'bg-green-900/20 border-green-700/50'
                          : item.priority === 'critical'
                          ? 'bg-red-900/20 border-red-700/50'
                          : 'bg-slate-800/50 border-slate-700/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleChecklistToggle(item.id)}
                        className="mt-1 w-5 h-5 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <p className={`text-sm ${item.completed ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                          {item.task}
                        </p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
                            item.priority === 'critical'
                              ? 'bg-red-900/50 text-red-200'
                              : item.priority === 'high'
                              ? 'bg-orange-900/50 text-orange-200'
                              : 'bg-blue-900/50 text-blue-200'
                          }`}
                        >
                          {item.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Survival Kit Budget Section */}
              <section className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <TrendingDown className="w-8 h-8 text-green-400" />
                  <h2 className="text-2xl font-bold text-white">Kit de Survie : Où acheter au meilleur prix ?</h2>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Taille du foyer :
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={householdSize}
                    onChange={(e) => setHouseholdSize(parseInt(e.target.value))}
                    className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                  <span className="ml-2 text-gray-400">personne(s)</span>
                </div>

                {survivalKitData && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Articles essentiels :</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {survivalKitData.essential_items.slice(0, 9).map((item: any) => (
                        <div
                          key={item.id}
                          className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4"
                        >
                          <h4 className="font-semibold text-white mb-1">{item.name}</h4>
                          <p className="text-sm text-gray-400">
                            {item.quantityPerPerson * householdSize} {item.unit}
                          </p>
                          <span
                            className={`text-xs px-2 py-1 rounded-full inline-block mt-2 ${
                              item.priority === 'essential'
                                ? 'bg-red-900/50 text-red-200'
                                : 'bg-blue-900/50 text-blue-200'
                            }`}
                          >
                            {item.priority}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                      <p className="text-sm text-gray-300">
                        💡 <strong>Budget estimé pour {householdSize} personne(s) :</strong> 
                        <span className="text-xl font-bold text-blue-400 ml-2">~150-300€</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        Prix indicatifs. Comparez les enseignes pour optimiser votre budget.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* Shelters Map Section */}
              <section className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <MapPin className="w-8 h-8 text-purple-400" />
                  <h2 className="text-2xl font-bold text-white">Refuges près de chez moi</h2>
                </div>

                {shelters.length > 0 ? (
                  <div className="space-y-4">
                    {shelters.map((shelter) => (
                      <div
                        key={shelter.id}
                        className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-white">{shelter.name}</h3>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              shelter.status === 'open'
                                ? 'bg-green-900/50 text-green-200'
                                : 'bg-gray-700/50 text-gray-300'
                            }`}
                          >
                            {shelter.status === 'open' ? 'Ouvert' : 'Fermé'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mb-2">{shelter.address}</p>
                        <div className="flex gap-4 text-sm text-gray-300">
                          <span>
                            <Users className="w-4 h-4 inline mr-1" />
                            Capacité: {shelter.capacity}
                          </span>
                          <span>📞 {shelter.contact.phone}</span>
                        </div>
                        <div className="mt-2 flex gap-2">
                          {shelter.facilities.accessible && (
                            <span className="text-xs bg-blue-900/50 text-blue-200 px-2 py-1 rounded">♿ PMR</span>
                          )}
                          {shelter.facilities.medical && (
                            <span className="text-xs bg-red-900/50 text-red-200 px-2 py-1 rounded">⚕️ Médical</span>
                          )}
                          {shelter.facilities.generator && (
                            <span className="text-xs bg-yellow-900/50 text-yellow-200 px-2 py-1 rounded">⚡ Générateur</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">Aucun refuge disponible pour ce territoire.</p>
                )}
              </section>

              {/* Solidarity Section */}
              <section className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Heart className="w-8 h-8 text-pink-400" />
                  <h2 className="text-2xl font-bold text-white">Réseau Solidaire</h2>
                </div>

                <div className="text-center py-8">
                  <Heart className="w-16 h-16 text-pink-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Entraide Communautaire</h3>
                  <p className="text-gray-400 mb-4">
                    Partagez ressources, hébergement, transport et matériel avec votre communauté
                  </p>
                  <button className="px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors">
                    Proposer mon aide
                  </button>
                </div>
              </section>

              {/* Historical Cyclones */}
              <section className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Clock className="w-8 h-8 text-orange-400" />
                  <h2 className="text-2xl font-bold text-white">Historique des Cyclones</h2>
                </div>

                {survivalKitData && survivalKitData.historical_cyclones && (
                  <div className="space-y-4">
                    {survivalKitData.historical_cyclones
                      .filter((c: any) => c.territories.includes(territory))
                      .map((cyclone: any) => (
                        <div
                          key={cyclone.id}
                          className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-semibold text-white">
                              {cyclone.name} ({cyclone.year})
                            </h3>
                            <span className="text-sm px-2 py-1 bg-red-900/50 text-red-200 rounded">
                              Catégorie {cyclone.category}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-300">
                            <div>
                              <p className="text-gray-500">Décès</p>
                              <p className="font-semibold">{cyclone.impact.deaths}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Blessés</p>
                              <p className="font-semibold">{cyclone.impact.injured}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Maisons détruites</p>
                              <p className="font-semibold">{cyclone.impact.housesDestroyed}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Dégâts</p>
                              <p className="font-semibold">
                                {(cyclone.impact.damagesEuros / 1000000).toFixed(0)}M€
                              </p>
                            </div>
                          </div>
                          {cyclone.lessonsLearned && cyclone.lessonsLearned.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-700">
                              <p className="text-sm font-semibold text-gray-300 mb-2">Leçons apprises :</p>
                              <ul className="text-sm text-gray-400 space-y-1">
                                {cyclone.lessonsLearned.map((lesson: string, idx: number) => (
                                  <li key={idx}>• {lesson}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </section>

              {/* Important Notice */}
              <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-6 text-center">
                <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-white mb-2">
                  ⚠️ Ce comparateur peut sauver des vies
                </h3>
                <p className="text-gray-300">
                  Préparation accessible • Checklist complète • Refuges sécurisés • Alertes temps réel • Solidarité active
                </p>
                <p className="text-sm text-gray-400 mt-3">
                  Innovation unique : Premier outil citoyen de résilience cyclonique complet en France
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
