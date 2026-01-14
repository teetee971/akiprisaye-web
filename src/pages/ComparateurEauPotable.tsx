/**
 * Comparateur Eau Potable
 * Observatoire de l'accès à l'eau potable dans les territoires ultramarins
 * 
 * Réponse à l'urgence hydrique (Mayotte, Guadeloupe, etc.)
 */

import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import WaterAvailabilityMap from '../components/water/WaterAvailabilityMap';
import WaterStatusReportForm from '../components/water/WaterStatusReportForm';
import WaterCutHistory from '../components/water/WaterCutHistory';
import WaterPricingComparison from '../components/water/WaterPricingComparison';
import ConsumptionCalculator from '../components/water/ConsumptionCalculator';
import type { Territory } from '../types/waterComparison';

export default function ComparateurEauPotable() {
  const [selectedTerritory, setSelectedTerritory] = useState<Territory>('YT');
  const [selectedCommune, setSelectedCommune] = useState('Mamoudzou');
  const [showReportForm, setShowReportForm] = useState(false);
  const [activeSection, setActiveSection] = useState<
    'map' | 'history' | 'pricing' | 'calculator'
  >('map');

  const territories: Array<{ code: Territory; name: string; flag: string }> = [
    { code: 'YT', name: 'Mayotte', flag: '🇾🇹' },
    { code: 'GP', name: 'Guadeloupe', flag: '🇬🇵' },
    { code: 'MQ', name: 'Martinique', flag: '🇲🇶' },
    { code: 'GF', name: 'Guyane', flag: '🇬🇫' },
    { code: 'RE', name: 'La Réunion', flag: '🇷🇪' },
  ];

  return (
    <>
      <Helmet>
        <title>💧 Comparateur Eau Potable - A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Observatoire citoyen de l'accès à l'eau potable dans les territoires ultramarins. Coupures, prix, qualité, signalements collaboratifs."
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        {/* Hero Section */}
        <header className="bg-gradient-to-r from-blue-900 via-cyan-800 to-blue-900 py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                💧 Observatoire Eau Potable Ultramarins
              </h1>
              <p className="text-xl text-cyan-100 mb-6">
                Transparence totale sur l'accès à l'eau dans les DOM-TOM
              </p>

              {/* Global stats */}
              <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-3xl font-bold text-red-300 mb-1">12,450</div>
                  <div className="text-sm text-white">Foyers sans eau</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-3xl font-bold text-orange-300 mb-1">23</div>
                  <div className="text-sm text-white">Coupures en cours</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-3xl font-bold text-yellow-300 mb-1">156</div>
                  <div className="text-sm text-white">Fuites signalées</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Territory Selector */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-3 justify-center">
              {territories.map((t) => (
                <button
                  key={t.code}
                  onClick={() => setSelectedTerritory(t.code)}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    selectedTerritory === t.code
                      ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/50'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {t.flag} {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => setActiveSection('map')}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  activeSection === 'map'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                🗺️ Carte temps réel
              </button>
              <button
                onClick={() => setActiveSection('history')}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  activeSection === 'history'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                📊 Historique coupures
              </button>
              <button
                onClick={() => setActiveSection('pricing')}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  activeSection === 'pricing'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                💰 Prix de l'eau
              </button>
              <button
                onClick={() => setActiveSection('calculator')}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  activeSection === 'calculator'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                🧮 Calculateur
              </button>
            </div>
          </div>

          {/* Content Sections */}
          <div className="max-w-7xl mx-auto">
            {activeSection === 'map' && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    Carte disponibilité temps réel
                  </h2>
                  <button
                    onClick={() => setShowReportForm(!showReportForm)}
                    className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
                  >
                    {showReportForm ? 'Fermer' : '📍 Signaler état eau'}
                  </button>
                </div>

                {showReportForm && (
                  <div className="mb-8 bg-slate-900 rounded-lg p-6">
                    <WaterStatusReportForm
                      onSubmitSuccess={() => setShowReportForm(false)}
                      onCancel={() => setShowReportForm(false)}
                    />
                  </div>
                )}

                <WaterAvailabilityMap territory={selectedTerritory} />
              </section>
            )}

            {activeSection === 'history' && (
              <section>
                <h2 className="text-2xl font-bold text-white mb-6">
                  Historique des coupures
                </h2>

                <div className="mb-6 bg-slate-900 rounded-lg p-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Commune
                  </label>
                  <input
                    type="text"
                    value={selectedCommune}
                    onChange={(e) => setSelectedCommune(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Ex: Mamoudzou, Pointe-à-Pitre..."
                  />
                </div>

                <WaterCutHistory commune={selectedCommune} />
              </section>
            )}

            {activeSection === 'pricing' && (
              <section>
                <h2 className="text-2xl font-bold text-white mb-6">
                  Comparaison prix de l'eau
                </h2>

                <WaterPricingComparison territory={selectedTerritory} />
              </section>
            )}

            {activeSection === 'calculator' && (
              <section>
                <h2 className="text-2xl font-bold text-white mb-6">
                  Calculateur consommation & économies
                </h2>

                <ConsumptionCalculator />
              </section>
            )}
          </div>

          {/* Context Section */}
          <div className="mt-12 max-w-4xl mx-auto">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                🎯 Contexte & Problématique
              </h3>
              <div className="space-y-3 text-slate-300">
                <p>
                  <strong className="text-white">Mayotte :</strong> Coupures quotidiennes,
                  pénurie chronique d'eau potable
                </p>
                <p>
                  <strong className="text-white">Guadeloupe :</strong> 63% de pertes dans
                  le réseau (fuites)
                </p>
                <p>
                  <strong className="text-white">Prix élevés :</strong> Jusqu'à 2x plus cher
                  qu'en métropole
                </p>
                <p>
                  <strong className="text-white">Qualité variable :</strong> Contaminations
                  ponctuelles, restrictions
                </p>
                <p>
                  <strong className="text-white">Manque de transparence :</strong> Coupures
                  non annoncées, informations dispersées
                </p>
              </div>

              <div className="mt-4 text-sm text-slate-400">
                Sources: Rapports Sénat 2024-2025, ARS DOM-TOM, médias locaux
              </div>
            </div>
          </div>

          {/* Methodology & Transparency */}
          <div className="mt-8 max-w-4xl mx-auto">
            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">
                📋 Méthodologie & Transparence
              </h3>
              <ul className="space-y-2 text-slate-300 text-sm">
                <li>✅ Données citoyennes vérifiées + sources officielles</li>
                <li>✅ Signalements géolocalisés en temps réel</li>
                <li>✅ Historique complet des coupures</li>
                <li>✅ Prix issus des offices de l'eau et régies publiques</li>
                <li>✅ Aucune affiliation commerciale</li>
                <li>✅ Code open source et auditable</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
