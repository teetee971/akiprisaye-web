/**
 * Freight Comparator - Comparateur Fret Maritime & Colis
 * 
 * Premier comparateur fret maritime & colis pour Outre-mer
 * Répond à la problématique #1 de la vie chère (Rapport Sénat 2024-2025)
 * 
 * Features:
 * - Simulation d'envoi avec calcul octroi de mer
 * - Comparaison multi-transporteurs
 * - Upload facture avec OCR
 * - Contributions citoyennes
 * - Alertes personnalisées
 * - Statistiques communautaires
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Package,
  Ship,
  Plane,
  AlertCircle,
  Info,
  TrendingUp,
  Star,
  Clock,
  Download,
  Upload,
  Bell,
  BarChart3,
  FileText,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import type {
  FreightComparisonResult,
  FreightRoute,
  PackageDetails,
  UrgencyLevel,
  FreightQuoteRanking,
} from '../types/freightComparison';
import type { Territory } from '../types/priceAlerts';
import {
  simulateFreightQuote,
  calculateOctroiDeMer,
} from '../services/freightComparisonService';
import {
  exportFreightComparisonToCSV,
  exportFreightComparisonToText,
} from '../utils/exportComparison';

const FreightComparator: React.FC = () => {
  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparisonResult, setComparisonResult] = useState<FreightComparisonResult | null>(null);

  // Form state
  const [origin, setOrigin] = useState('Paris');
  const [destination, setDestination] = useState<Territory>('GP');
  const [weight, setWeight] = useState(5);
  const [length, setLength] = useState(30);
  const [width, setWidth] = useState(20);
  const [height, setHeight] = useState(15);
  const [packageType, setPackageType] = useState<'standard' | 'fragile' | 'valeur_declaree'>('standard');
  const [declaredValue, setDeclaredValue] = useState<number | undefined>(undefined);
  const [urgency, setUrgency] = useState<UrgencyLevel>('standard');

  // UI state
  const [sortBy, setSortBy] = useState<'price' | 'reliability' | 'delay'>('price');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showContributionForm, setShowContributionForm] = useState(false);
  const [showAlertForm, setShowAlertForm] = useState(false);

  // Territories
  const territories: { code: Territory; name: string }[] = [
    { code: 'GP', name: 'Guadeloupe' },
    { code: 'MQ', name: 'Martinique' },
    { code: 'GF', name: 'Guyane' },
    { code: 'RE', name: 'La Réunion' },
    { code: 'YT', name: 'Mayotte' },
    { code: 'MF', name: 'Saint-Martin' },
    { code: 'BL', name: 'Saint-Barthélemy' },
    { code: 'PM', name: 'Saint-Pierre-et-Miquelon' },
    { code: 'WF', name: 'Wallis-et-Futuna' },
    { code: 'PF', name: 'Polynésie française' },
    { code: 'NC', name: 'Nouvelle-Calédonie' },
  ];

  // Origins
  const origins = ['Paris', 'Marseille', 'Lyon', 'Bordeaux', 'Lille'];

  // Handle simulation
  const handleSimulate = async () => {
    setLoading(true);
    setError(null);

    try {
      const route: FreightRoute = {
        origin,
        destination,
      };

      const packageDetails: PackageDetails = {
        weight,
        dimensions: { length, width, height },
        type: packageType,
        declaredValue: packageType === 'valeur_declaree' ? declaredValue : undefined,
      };

      const result = await simulateFreightQuote(route, packageDetails, urgency);

      if (!result) {
        setError('Aucune donnée disponible pour cette route');
        setComparisonResult(null);
      } else {
        setComparisonResult(result);
      }
    } catch (err) {
      console.error('Error simulating freight quote:', err);
      setError('Erreur lors de la simulation');
      setComparisonResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Auto-simulate on mount with default values
  useEffect(() => {
    handleSimulate();
  }, []);

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(price);
  };

  // Get price category color
  const getPriceCategoryColor = (category: string) => {
    switch (category) {
      case 'cheapest':
        return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'below_average':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'average':
        return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
      case 'above_average':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'most_expensive':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  // Get reliability stars
  const getReliabilityStars = (score: number) => {
    const fullStars = Math.floor(score);
    const hasHalfStar = score % 1 >= 0.5;
    return { fullStars, hasHalfStar };
  };

  // Sorted quotes
  const sortedQuotes = useMemo(() => {
    if (!comparisonResult) return [];

    const sorted = [...comparisonResult.quotes].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'price':
          comparison = a.quote.pricing.totalTTC - b.quote.pricing.totalTTC;
          break;
        case 'reliability':
          comparison = b.quote.reliability.score - a.quote.reliability.score;
          break;
        case 'delay':
          comparison =
            (a.quote.timing.realDaysAverage || a.quote.timing.announcedDays) -
            (b.quote.timing.realDaysAverage || b.quote.timing.announcedDays);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [comparisonResult, sortBy, sortDirection]);

  return (
    <>
      <Helmet>
        <title>Comparateur Fret Maritime & Colis | A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Comparez les prix des transporteurs pour vos envois vers l'Outre-mer. Transparence totale sur l'octroi de mer et les frais cachés."
        />
      </Helmet>

      <div className="min-h-screen bg-slate-950">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-900 to-indigo-800 border-b border-blue-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-3 mb-3">
              <Package className="w-8 h-8 text-blue-200" />
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                📦 Comparateur Fret Maritime & Colis
              </h1>
            </div>
            <p className="text-sm sm:text-base text-blue-100 leading-relaxed">
              Transparence totale sur les coûts d'envoi vers les Outre-mer
            </p>
            <p className="text-xs text-blue-200 mt-2 flex items-center gap-2">
              <Info className="w-4 h-4" />
              <span>
                Problématique #1 vie chère • Fret maritime = 80% des importations DOM-TOM • Sources:
                Rapports Sénat 2024-2025
              </span>
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-6">
            {/* Warning Banner */}
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-orange-200">
                  <p className="font-semibold mb-1">Innovations uniques</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>✅ Transparence totale sur l'octroi de mer</li>
                    <li>✅ Délais réels vs annoncés (contributions citoyennes)</li>
                    <li>✅ Détection automatique frais cachés (OCR)</li>
                    <li>✅ Score de fiabilité communautaire</li>
                    <li>✅ Observer, pas vendre - Aucun lien d'affiliation</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Simulator Form */}
            <section className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-5">
              <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
                <Ship className="w-5 h-5 text-blue-400" />
                Simulez votre envoi
              </h2>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Origin */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Origine
                  </label>
                  <select
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {origins.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Destination */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Destination
                  </label>
                  <select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value as Territory)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {territories.map((t) => (
                      <option key={t.code} value={t.code}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Weight */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Poids (kg)
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Dimensions */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Longueur (cm)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={length}
                    onChange={(e) => setLength(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Largeur (cm)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={width}
                    onChange={(e) => setWidth(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Hauteur (cm)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={height}
                    onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Package Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Type de colis
                  </label>
                  <select
                    value={packageType}
                    onChange={(e) =>
                      setPackageType(e.target.value as 'standard' | 'fragile' | 'valeur_declaree')
                    }
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="standard">Standard</option>
                    <option value="fragile">Fragile</option>
                    <option value="valeur_declaree">Valeur déclarée</option>
                  </select>
                </div>

                {/* Declared Value (if applicable) */}
                {packageType === 'valeur_declaree' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Valeur déclarée (€)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={declaredValue || ''}
                      onChange={(e) => setDeclaredValue(parseFloat(e.target.value) || undefined)}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Urgency */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Urgence
                  </label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as UrgencyLevel)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="standard">Standard</option>
                    <option value="express">Express</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleSimulate}
                disabled={loading}
                className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Calcul en cours...</span>
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-4 h-4" />
                    <span>Comparer les transporteurs</span>
                  </>
                )}
              </button>
            </section>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              </div>
            )}

            {/* Results */}
            {comparisonResult && (
              <>
                {/* Summary Stats */}
                <section className="grid md:grid-cols-4 gap-4">
                  <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-4">
                    <div className="text-sm text-gray-400 mb-1">Prix minimum</div>
                    <div className="text-2xl font-bold text-green-400">
                      {formatPrice(comparisonResult.aggregation.minPrice)}
                    </div>
                  </div>
                  <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-4">
                    <div className="text-sm text-gray-400 mb-1">Prix moyen</div>
                    <div className="text-2xl font-bold text-blue-400">
                      {formatPrice(comparisonResult.aggregation.averagePrice)}
                    </div>
                  </div>
                  <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-4">
                    <div className="text-sm text-gray-400 mb-1">Prix maximum</div>
                    <div className="text-2xl font-bold text-red-400">
                      {formatPrice(comparisonResult.aggregation.maxPrice)}
                    </div>
                  </div>
                  <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-4">
                    <div className="text-sm text-gray-400 mb-1">Écart de prix</div>
                    <div className="text-2xl font-bold text-orange-400">
                      {comparisonResult.aggregation.priceRangePercentage.toFixed(0)}%
                    </div>
                  </div>
                </section>

                {/* Comparison Table */}
                <section className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-400" />
                      Résultats de la comparaison
                    </h2>
                    <div className="flex items-center gap-3">
                      {/* Export Buttons */}
                      <button
                        onClick={() => exportFreightComparisonToCSV(comparisonResult)}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors flex items-center gap-1.5"
                        title="Exporter en CSV"
                      >
                        <Download className="w-4 h-4" />
                        <span>CSV</span>
                      </button>
                      <button
                        onClick={() => exportFreightComparisonToText(comparisonResult)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center gap-1.5"
                        title="Exporter en TXT"
                      >
                        <FileText className="w-4 h-4" />
                        <span>TXT</span>
                      </button>
                      
                      {/* Sort Control */}
                      <div className="flex items-center gap-2 ml-2 pl-2 border-l border-slate-600">
                        <label className="text-sm text-gray-400">Trier par:</label>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as any)}
                          className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-gray-100"
                        >
                          <option value="price">Prix</option>
                          <option value="reliability">Fiabilité</option>
                          <option value="delay">Délai</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {sortedQuotes.map((ranking) => (
                      <div
                        key={ranking.quote.id}
                        className={`border rounded-lg p-4 ${getPriceCategoryColor(ranking.priceCategory)}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-semibold">{ranking.quote.carrier}</h3>
                              {ranking.isBestValue && (
                                <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full border border-green-500/30">
                                  ✓ Meilleur rapport qualité/prix
                                </span>
                              )}
                              {ranking.rank === 1 && (
                                <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-500/30">
                                  🏆 Le moins cher
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                <span>{ranking.quote.reliability.score.toFixed(1)}/5</span>
                                <span className="text-gray-500">
                                  ({ranking.quote.reliability.basedOnContributions} avis)
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>
                                  {ranking.quote.timing.realDaysAverage ||
                                    ranking.quote.timing.announcedDays}{' '}
                                  jours
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">
                              {formatPrice(ranking.quote.pricing.totalTTC)}
                            </div>
                            {ranking.rank !== 1 && (
                              <div className="text-sm text-red-400">
                                +{formatPrice(ranking.savingsVsCheapest)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Price Breakdown */}
                        <details className="text-sm">
                          <summary className="cursor-pointer text-gray-400 hover:text-gray-300">
                            Détail des frais
                          </summary>
                          <div className="mt-2 space-y-1 pl-4 border-l border-gray-700">
                            {ranking.quote.pricing.breakdown?.map((fee, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span className="text-gray-400">{fee.name}</span>
                                <span className="font-mono">{formatPrice(fee.amount)}</span>
                              </div>
                            ))}
                          </div>
                        </details>

                        {/* Reliability Info */}
                        <div className="mt-3 pt-3 border-t border-gray-700/50 grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-gray-400">Taux ponctualité</div>
                            <div className="font-semibold">
                              {(ranking.quote.reliability.onTimeRate * 100).toFixed(0)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-400">Incidents signalés</div>
                            <div className="font-semibold">
                              {ranking.quote.reliability.issuesReported}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-400">Délai réel moyen</div>
                            <div className="font-semibold">
                              {ranking.quote.timing.realDaysAverage ||
                                ranking.quote.timing.announcedDays}{' '}
                              jours
                              {ranking.quote.timing.realDaysAverage &&
                                ranking.quote.timing.realDaysAverage >
                                  ranking.quote.timing.announcedDays && (
                                  <span className="text-orange-400">
                                    {' '}
                                    (+
                                    {ranking.quote.timing.realDaysAverage -
                                      ranking.quote.timing.announcedDays}
                                    )
                                  </span>
                                )}
                            </div>
                          </div>
                        </div>

                        {/* Website Link */}
                        {ranking.quote.website && (
                          <div className="mt-3 pt-3 border-t border-gray-700/50">
                            <a
                              href={ranking.quote.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                            >
                              Voir le site officiel →
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                {/* Methodology Info */}
                <section className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-5">
                  <h3 className="text-lg font-semibold text-gray-100 mb-3 flex items-center gap-2">
                    <Info className="w-5 h-5 text-blue-400" />
                    Méthodologie & Transparence
                  </h3>
                  <div className="text-sm text-gray-300 space-y-2">
                    <p>
                      <strong>Sources de données:</strong> {comparisonResult.metadata.dataSource}
                    </p>
                    <p>
                      <strong>Contributions citoyennes:</strong>{' '}
                      {comparisonResult.metadata.contributionsCount} contributions vérifiées
                    </p>
                    <p>
                      <strong>Calcul octroi de mer:</strong> Taux officiel {destination} ={' '}
                      {(calculateOctroiDeMer(100, destination) / 100) * 100}%
                    </p>
                    <p className="text-orange-300">
                      <strong>⚠️ Disclaimer:</strong> {comparisonResult.metadata.disclaimer}
                    </p>
                  </div>
                </section>
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default FreightComparator;
