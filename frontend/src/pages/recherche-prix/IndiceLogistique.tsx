 
 
/**
 * Module : Indice Logistique DOM (ILD)
 * 
 * Outil d'information présentant les contraintes structurelles
 * de l'acheminement des marchandises vers les territoires ultramarins.
 * 
 * IMPORTANT :
 * - Aucun calcul de prix
 * - Aucun score global
 * - Aucune recommandation
 * - Aucun classement
 * 
 * Objectif : INFORMER sur les spécificités logistiques DOM
 */

import React, { useState } from 'react';
import { MapPin, Ship, Plane, AlertTriangle, Info } from 'lucide-react';
import {
  getTerritoryProfile,
  getAllProfiles,
  getFactorDescription,
  type TerritoryLogisticsProfile
} from '../../services/logisticsIndexService';

const IndiceLogistique: React.FC = () => {
  const [selectedTerritory, setSelectedTerritory] = useState<string>('');
  const [profile, setProfile] = useState<TerritoryLogisticsProfile | null>(null);

  const handleTerritoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const territory = event.target.value;
    setSelectedTerritory(territory);
    
    if (territory) {
      const newProfile = getTerritoryProfile(territory);
      setProfile(newProfile);
    } else {
      setProfile(null);
    }
  };

  const territories = [
    { code: 'GP', name: 'Guadeloupe' },
    { code: 'MQ', name: 'Martinique' },
    { code: 'GF', name: 'Guyane' },
    { code: 'RE', name: 'La Réunion' },
    { code: 'YT', name: 'Mayotte' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 pb-12">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">Indice Logistique DOM</h1>
          <p className="text-blue-100 text-sm">
            Comprendre les contraintes structurelles d'acheminement
          </p>
        </div>
      </div>

      {/* Avertissement institutionnel */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="bg-blue-950/30 border-l-4 border-blue-500 p-4 rounded-r-lg">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-blue-400 mr-3 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-200">
              <p className="font-semibold mb-1">Outil d'information publique</p>
              <p>
                L'Indice Logistique DOM est un <strong>indicateur descriptif</strong> présentant 
                les contraintes structurelles de l'acheminement des marchandises vers les territoires ultramarins.
              </p>
              <p className="mt-2">
                <strong>Il ne constitue ni un prix, ni un classement, ni une recommandation.</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire de sélection */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-6">
          <label htmlFor="territory" className="block text-sm font-medium text-gray-300 mb-2">
            Sélectionnez un territoire
          </label>
          <select
            id="territory"
            value={selectedTerritory}
            onChange={handleTerritoryChange}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
          >
            <option value="">-- Choisir un territoire --</option>
            {territories.map(t => (
              <option key={t.code} value={t.code}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Affichage du profil */}
      {profile && (
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          {/* Carte d'identité logistique */}
          <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-6">
            <div className="flex items-center mb-4">
              <MapPin className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-bold text-gray-100">{profile.territoryName}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {/* Distance */}
              <div className="border border-slate-700 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-400 mb-1">
                  Distance à la métropole
                </div>
                <div className="text-lg font-semibold text-gray-100 capitalize">
                  {profile.distance_metropole}
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  {getFactorDescription('distance_metropole', profile.distance_metropole)?.explanation}
                </div>
              </div>

              {/* Délais */}
              <div className="border border-slate-700 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-400 mb-1">
                  Délais d'acheminement
                </div>
                <div className="text-lg font-semibold text-gray-100 capitalize">
                  {profile.delais_typiques}
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  {getFactorDescription('delais_typiques', profile.delais_typiques)?.explanation}
                </div>
              </div>

              {/* Ruptures de charge */}
              <div className="border border-slate-700 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-400 mb-1">
                  Points de rupture de charge
                </div>
                <div className="text-lg font-semibold text-gray-100">
                  {profile.ruptures_charge} points
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  Nombre moyen de transferts entre modes de transport
                </div>
              </div>

              {/* Capacité portuaire */}
              <div className="border border-slate-700 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-400 mb-1">
                  Capacité portuaire
                </div>
                <div className="text-lg font-semibold text-gray-100 capitalize">
                  {profile.capacite_portuaire}
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  {getFactorDescription('capacite_portuaire', profile.capacite_portuaire)?.explanation}
                </div>
              </div>
            </div>
          </div>

          {/* Dépendances transport */}
          <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-bold text-gray-100 mb-4">Modes de transport</h3>
            
            <div className="space-y-4">
              {/* Maritime */}
              <div className="flex items-start">
                <Ship className="w-5 h-5 text-blue-400 mr-3 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-100">Transport maritime</span>
                    <span className="text-sm font-semibold text-blue-400 capitalize">
                      {profile.dependance_maritime}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    {getFactorDescription('dependance_maritime', profile.dependance_maritime)?.explanation}
                  </p>
                </div>
              </div>

              {/* Aérien */}
              <div className="flex items-start">
                <Plane className="w-5 h-5 text-blue-400 mr-3 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-100">Transport aérien</span>
                    <span className="text-sm font-semibold text-blue-400 capitalize">
                      {profile.dependance_aerienne}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    {getFactorDescription('dependance_aerienne', profile.dependance_aerienne)?.explanation}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Risques et contraintes */}
          <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
              <h3 className="text-lg font-bold text-gray-100">Exposition aux risques</h3>
            </div>
            
            <ul className="space-y-2">
              {profile.exposition_risques.map((risque) => (
                <li key={risque} className="flex items-start">
                  <span className="text-orange-400 mr-2">•</span>
                  <span className="text-sm text-gray-300">{risque}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Sources */}
          <div className="bg-slate-800/50 rounded-lg p-6">
            <h3 className="text-sm font-bold text-gray-100 mb-3">Sources publiques</h3>
            <ul className="space-y-1">
              {profile.sources_publiques.map((source) => (
                <li key={source} className="text-sm text-gray-400">
                  • {source}
                </li>
              ))}
            </ul>
            <p className="text-xs text-gray-500 mt-3">
              Date de référence : {new Date(profile.date_reference).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long'
              })}
            </p>
          </div>
        </div>
      )}

      {/* Section pédagogique */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-6">
          <h2 className="text-lg font-bold text-gray-100 mb-4">
            Comprendre l'indice logistique DOM
          </h2>
          
          <div className="space-y-4 text-sm text-gray-300">
            <div>
              <h3 className="font-semibold text-gray-100 mb-2">Qu'est-ce que l'Indice Logistique DOM ?</h3>
              <p>
                L'ILD présente de manière <strong>qualitative et descriptive</strong> les contraintes 
                structurelles qui caractérisent l'acheminement des marchandises vers les départements 
                et territoires d'outre-mer.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-100 mb-2">Ce que l'indice N'EST PAS :</h3>
              <ul className="space-y-1 ml-4">
                <li>• Un calcul de prix ou de coûts</li>
                <li>• Un classement ou une notation des territoires</li>
                <li>• Une prédiction ou une recommandation</li>
                <li>• Un outil de comparaison économique</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-100 mb-2">Ce que l'indice PERMET :</h3>
              <ul className="space-y-1 ml-4">
                <li>• Comprendre les spécificités géographiques</li>
                <li>• Identifier les modes de transport dominants</li>
                <li>• Visualiser les contraintes structurelles</li>
                <li>• Appréhender les délais typiques</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-100 mb-2">Pourquoi ces informations ?</h3>
              <p>
                Les territoires ultramarins présentent des <strong>caractéristiques logistiques uniques</strong> : 
                éloignement, insularité, dépendance aux importations. Comprendre ces réalités structurelles 
                permet aux citoyens, institutions et acteurs économiques de mieux appréhender les 
                particularités de l'approvisionnement des DOM.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mention légale */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-slate-800/50 rounded-lg p-4 text-center">
          <p className="text-xs text-gray-400">
            <strong>A KI PRI SA YÉ</strong> — Outil d'intérêt général
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Données indicatives • Aucune valeur contractuelle • Aucun tracking • Aucune affiliation
          </p>
        </div>
      </div>
    </div>
  );
};

export default IndiceLogistique;
