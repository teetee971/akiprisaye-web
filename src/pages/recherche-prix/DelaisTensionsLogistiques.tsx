/**
 * Module : Délais & Tensions Logistiques - Observations historiques
 * 
 * Présente des observations historiques des délais et tensions logistiques
 * ayant affecté l'acheminement des marchandises vers les DOM.
 * 
 * IMPORTANT :
 * - Aucune prévision
 * - Aucun prix
 * - Aucune responsabilité attribuée
 * - Aucune analyse économique
 * 
 * Objectif : INFORMER sur les événements passés
 */

import React, { useState } from 'react';
import { Clock, AlertCircle, Ship, Plane, Info, Calendar, FileText } from 'lucide-react';
import {
  getAllObservations,
  getObservationsByTerritory,
  getAvailableTerritories,
  type LogisticsDelayObservation
} from '../../services/logisticsDelaysService';

const DelaisTensionsLogistiques: React.FC = () => {
  const [selectedTerritory, setSelectedTerritory] = useState<string>('ALL');
  const territories = getAvailableTerritories();

  const observations = selectedTerritory === 'ALL' 
    ? getAllObservations()
    : getObservationsByTerritory(selectedTerritory);

  // Grouper par territoire pour l'affichage
  const observationsByTerritory = observations.reduce((acc, obs) => {
    if (!acc[obs.territory]) {
      acc[obs.territory] = [];
    }
    acc[obs.territory].push(obs);
    return acc;
  }, {} as Record<string, LogisticsDelayObservation[]>);

  const getDelayLevelColor = (level: string) => {
    switch (level) {
      case 'faible':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'modéré':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'élevé':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTransportIcon = (type: string) => {
    switch (type) {
      case 'maritime':
        return <Ship className="w-4 h-4" />;
      case 'aerien':
        return <Plane className="w-4 h-4" />;
      case 'mixte':
        return (
          <>
            <Ship className="w-4 h-4" />
            <Plane className="w-4 h-4" />
          </>
        );
      default:
        return <Ship className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-800 text-white px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-2">
            <Clock className="w-6 h-6 mr-2" />
            <h1 className="text-2xl font-bold">Délais & Tensions Logistiques</h1>
          </div>
          <p className="text-orange-100 text-sm">
            Observations historiques — Informations factuelles
          </p>
        </div>
      </div>

      {/* Avertissement institutionnel */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="bg-orange-50 border-l-4 border-orange-600 p-4 rounded-r-lg">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-orange-600 mr-3 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-orange-900">
              <p className="font-semibold mb-1">Module d'information historique</p>
              <p>
                Ce module présente des <strong>observations historiques</strong> des délais 
                et tensions logistiques ayant affecté l'acheminement des marchandises vers les DOM.
              </p>
              <p className="mt-2">
                <strong>Il ne constitue ni une prévision, ni une analyse économique, ni une attribution de responsabilité.</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section pédagogique */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            À quoi servent ces observations ?
          </h2>
          
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Objectif du module</h3>
              <p>
                Documenter de manière <strong>factuelle et neutre</strong> les événements passés 
                ayant affecté les délais d'acheminement des marchandises vers les territoires ultramarins.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2">Ce que c'est :</h4>
                <ul className="space-y-1 text-green-800 text-xs">
                  <li>✓ Observations factuelles passées</li>
                  <li>✓ Documentation d'événements avérés</li>
                  <li>✓ Sources publiques citées</li>
                  <li>✓ Contexte neutre et descriptif</li>
                </ul>
              </div>

              <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                <h4 className="font-semibold text-red-900 mb-2">Ce que ce n'est PAS :</h4>
                <ul className="space-y-1 text-red-800 text-xs">
                  <li>✗ Une prévision des délais futurs</li>
                  <li>✗ Une explication des prix</li>
                  <li>✗ Une attribution de responsabilité</li>
                  <li>✗ Une recommandation ou conseil</li>
                </ul>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mt-4">
              <h4 className="font-semibold text-gray-900 mb-2">Distinction importante</h4>
              <p className="text-xs text-gray-700">
                <strong>Observation ≠ Prévision</strong> — Ces données décrivent des événements passés 
                et ne permettent pas de prédire les situations futures.
              </p>
              <p className="text-xs text-gray-700 mt-2">
                <strong>Information ≠ Explication des prix</strong> — Les tensions logistiques sont 
                l'un des nombreux facteurs pouvant affecter l'approvisionnement, mais ce module ne 
                calcule pas leur impact économique.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtre par territoire */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <label htmlFor="territory-filter" className="block text-sm font-medium text-gray-700 mb-2">
            Filtrer par territoire
          </label>
          <select
            id="territory-filter"
            value={selectedTerritory}
            onChange={(e) => setSelectedTerritory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="ALL">Tous les territoires</option>
            {territories.map(t => (
              <option key={t.code} value={t.code}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chronologie des observations */}
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {Object.entries(observationsByTerritory).map(([territoryCode, territoryObs]) => (
          <div key={territoryCode} className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {territoryObs[0].territoryName}
            </h3>

            <div className="space-y-4">
              {territoryObs.map((obs, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  {/* En-tête de l'observation */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="font-semibold text-gray-900">{obs.period}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getTransportIcon(obs.transport_type)}
                    </div>
                  </div>

                  {/* Niveau de tension */}
                  <div className="mb-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getDelayLevelColor(obs.delay_level)}`}>
                      Tension : {obs.delay_level}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-700 mb-3">
                    {obs.description}
                  </p>

                  {/* Nature des tensions */}
                  <div className="mb-3">
                    <h4 className="text-xs font-semibold text-gray-900 mb-2">
                      Nature des tensions observées :
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {obs.nature_tension.map((tension, i) => (
                        <span key={i} className="inline-flex items-center px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded border border-orange-200">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {tension}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Impacts observés */}
                  <div className="mb-3">
                    <h4 className="text-xs font-semibold text-gray-900 mb-2">
                      Impacts observés :
                    </h4>
                    <ul className="space-y-1">
                      {obs.impact_type.map((impact, i) => (
                        <li key={i} className="text-xs text-gray-600 flex items-start">
                          <span className="text-orange-600 mr-2">•</span>
                          {impact}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Sources */}
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <div className="flex items-start">
                      <FileText className="w-3 h-3 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-xs font-semibold text-gray-700 mb-1">
                          Sources publiques :
                        </h4>
                        <ul className="space-y-0.5">
                          {obs.sources_publiques.map((source, i) => (
                            <li key={i} className="text-xs text-gray-500">
                              {source}
                            </li>
                          ))}
                        </ul>
                        <p className="text-xs text-gray-400 mt-2">
                          Publication : {new Date(obs.date_publication).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Section explicative finale */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Comprendre les observations logistiques
          </h2>
          
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Pourquoi documenter ces événements ?</h3>
              <p>
                Les territoires ultramarins, de par leur <strong>éloignement et leur insularité</strong>, 
                sont particulièrement exposés aux perturbations des chaînes logistiques mondiales. 
                Documenter ces événements passés permet de mieux comprendre les réalités structurelles 
                de l'approvisionnement des DOM.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Facteurs observés historiquement</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded p-3">
                  <h4 className="font-semibold text-gray-800 text-xs mb-2">Facteurs climatiques</h4>
                  <p className="text-xs text-gray-600">
                    Cyclones, saisons des pluies, conditions météorologiques défavorables
                  </p>
                </div>
                <div className="bg-gray-50 rounded p-3">
                  <h4 className="font-semibold text-gray-800 text-xs mb-2">Facteurs structurels</h4>
                  <p className="text-xs text-gray-600">
                    Capacités portuaires, infrastructures, éloignement géographique
                  </p>
                </div>
                <div className="bg-gray-50 rounded p-3">
                  <h4 className="font-semibold text-gray-800 text-xs mb-2">Facteurs internationaux</h4>
                  <p className="text-xs text-gray-600">
                    Crises sanitaires, tensions géopolitiques, congestion ports mondiaux
                  </p>
                </div>
                <div className="bg-gray-50 rounded p-3">
                  <h4 className="font-semibold text-gray-800 text-xs mb-2">Facteurs organisationnels</h4>
                  <p className="text-xs text-gray-600">
                    Réorganisations maritimes, modifications de rotations, grèves
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Limite de ces observations</h3>
              <p>
                Ces observations <strong>décrivent le passé</strong>. Elles ne permettent pas de :
              </p>
              <ul className="mt-2 space-y-1 ml-4">
                <li className="text-xs">• Prédire les événements futurs</li>
                <li className="text-xs">• Calculer l'impact sur les prix</li>
                <li className="text-xs">• Attribuer des responsabilités</li>
                <li className="text-xs">• Recommander des solutions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Mention légale */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-gray-100 rounded-lg p-4 text-center">
          <p className="text-xs text-gray-600">
            <strong>A KI PRI SA YÉ</strong> — Outil d'intérêt général
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Observations historiques • Aucune prévision • Aucune valeur contractuelle • Aucun tracking
          </p>
        </div>
      </div>
    </div>
  );
};

export default DelaisTensionsLogistiques;
