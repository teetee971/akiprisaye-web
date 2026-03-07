/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from 'react';
import { Plane, AlertCircle, Info, Clock, BarChart3, Download, FileText } from 'lucide-react';
import type {
  FlightPricePoint,
  FlightComparisonResult,
  FlightRoute,
  Airport,
} from '../types/flightComparison';
import {
  compareFlightPricesByRoute,
  filterFlightPrices,
} from '../services/flightComparisonService';
import PriceChart from '../components/comparateur/LazyPriceChart';
import ComparisonSummary from '../components/comparateur/ComparisonSummary';
import LoadingSkeleton from '../components/comparateur/LoadingSkeleton';
import SortControl from '../components/comparateur/SortControl';
import ShareButton from '../components/comparateur/ShareButton';
import { exportFlightComparisonToCSV, exportFlightComparisonToText } from '../utils/exportComparison';

const FlightComparator: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flightPrices, setFlightPrices] = useState<FlightPricePoint[]>([]);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [selectedOrigin, setSelectedOrigin] = useState<string>('PTP');
  const [selectedDestination, setSelectedDestination] = useState<string>('ORY');
  const [comparisonResult, setComparisonResult] = useState<FlightComparisonResult | null>(null);
  const [filterSeason, setFilterSeason] = useState<'all' | 'high' | 'low' | 'shoulder'>('all');
  const [filterPriceType, setFilterPriceType] = useState<'all' | 'economy'>('economy');
  const [sortBy, setSortBy] = useState<'price' | 'duration' | 'airline'>('price');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    loadFlightData();
  }, []);

  useEffect(() => {
    if (flightPrices.length > 0 && selectedOrigin && selectedDestination) {
      performComparison();
    }
  }, [flightPrices, selectedOrigin, selectedDestination, filterSeason, filterPriceType]);

  const loadFlightData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}data/flight-prices.json`);
      if (!response.ok) {
        throw new Error('Impossible de charger les données de vols');
      }
      const data = await response.json();
      setFlightPrices(data.flightPrices || []);
      setAirports(data.airports || []);
    } catch (err) {
      console.error('Error loading flight data:', err);
      setError('Erreur lors du chargement des données de vols');
    } finally {
      setLoading(false);
    }
  };

  const performComparison = () => {
    const originAirport = airports.find((a) => a.code === selectedOrigin);
    const destinationAirport = airports.find((a) => a.code === selectedDestination);

    if (!originAirport || !destinationAirport) {
      setComparisonResult(null);
      return;
    }

    const route: FlightRoute = {
      origin: originAirport,
      destination: destinationAirport,
      routeType:
        originAirport.region === 'DOM' && destinationAirport.region === 'Métropole'
          ? 'dom_metropole'
          : originAirport.region === 'DOM' && destinationAirport.region === 'DOM'
          ? 'inter_dom'
          : 'regional',
    };

    // Apply filters
    let filteredPrices = flightPrices;
    if (filterSeason !== 'all') {
      filteredPrices = filterFlightPrices(filteredPrices, { season: filterSeason });
    }
    if (filterPriceType !== 'all') {
      filteredPrices = filterFlightPrices(filteredPrices, { priceType: filterPriceType });
    }

    const result = compareFlightPricesByRoute(route, filteredPrices);
    setComparisonResult(result);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

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

  const getPriceCategoryLabel = (category: string) => {
    switch (category) {
      case 'cheapest':
        return 'Le moins cher';
      case 'below_average':
        return 'En dessous de la moyenne';
      case 'average':
        return 'Prix moyen';
      case 'above_average':
        return 'Au dessus de la moyenne';
      case 'most_expensive':
        return 'Le plus cher';
      default:
        return category;
    }
  };

  // Prepare chart data for price comparison
  const priceComparisonChartData = useMemo(() => {
    if (!comparisonResult) return null;

    const labels = comparisonResult.airlines.map(r => r.flightPrice.airline);
    const prices = comparisonResult.airlines.map(r => r.flightPrice.price);
    const additionalFees = comparisonResult.airlines.map(r => r.flightPrice.additionalFees?.total || 0);

    return {
      labels,
      datasets: [
        {
          label: 'Prix de base',
          data: prices,
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
        },
        {
          label: 'Frais supplémentaires',
          data: additionalFees,
          backgroundColor: 'rgba(249, 115, 22, 0.6)',
          borderColor: 'rgba(249, 115, 22, 1)',
          borderWidth: 1,
        },
      ],
    };
  }, [comparisonResult]);

  // Prepare chart data for timing analysis
  const timingAnalysisChartData = useMemo(() => {
    if (!comparisonResult?.purchaseTimingAnalysis) return null;

    const buckets = comparisonResult.purchaseTimingAnalysis.timingBuckets.filter(b => b.observationCount > 0);
    const labels = buckets.map(b => b.label);
    const avgPrices = buckets.map(b => b.averagePrice);
    const minPrices = buckets.map(b => b.minPrice);
    const maxPrices = buckets.map(b => b.maxPrice);

    return {
      labels,
      datasets: [
        {
          label: 'Prix moyen',
          data: avgPrices,
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
        },
        {
          label: 'Prix minimum',
          data: minPrices,
          backgroundColor: 'rgba(34, 197, 94, 0.6)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 2,
        },
        {
          label: 'Prix maximum',
          data: maxPrices,
          backgroundColor: 'rgba(239, 68, 68, 0.6)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 2,
        },
      ],
    };
  }, [comparisonResult]);

  // Sorted airlines for display
  const sortedAirlines = useMemo(() => {
    if (!comparisonResult) return [];
    
    const sorted = [...comparisonResult.airlines].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'price':
          comparison = a.flightPrice.price - b.flightPrice.price;
          break;
        case 'duration':
          // Parse duration string (e.g., "8h30" -> minutes)
          const aDuration = parseDuration(a.flightPrice.duration ?? '');
          const bDuration = parseDuration(b.flightPrice.duration ?? '');
          comparison = aDuration - bDuration;
          break;
        case 'airline':
          comparison = a.flightPrice.airline.localeCompare(b.flightPrice.airline);
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }, [comparisonResult, sortBy, sortDirection]);

  const parseDuration = (duration: string): number => {
    const match = duration.match(/(\d+)h(\d+)?/);
    if (!match) return 0;
    const hours = parseInt(match[1], 10);
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    return hours * 60 + minutes;
  };

  const handleSortChange = (sort: string, direction: 'asc' | 'desc') => {
    setSortBy(sort as 'price' | 'duration' | 'airline');
    setSortDirection(direction);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <header className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-3 mb-3">
              <Plane className="w-8 h-8 text-blue-400" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">
                Comparateur de prix des vols
              </h1>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-6">
            <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-5">
              <LoadingSkeleton type="stats" />
            </div>
            <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-5">
              <LoadingSkeleton type="card" count={3} />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-300 text-center">{error}</p>
        </div>
      </div>
    );
  }

  const domAirports = airports.filter((a) => a.region === 'DOM');
  const metropoleAirports = airports.filter((a) => a.region === 'Métropole');

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-3">
            <Plane className="w-8 h-8 text-blue-400" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">
              Comparateur de prix des vols
            </h1>
          </div>
          <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
            🥇 PRIORITÉ 1 — DOM ↔ Métropole ↔ Régional
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Observer, pas vendre : Transparence sur les écarts, pas d'affiliation opaque
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Filters */}
          <section className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-5">
            <h2 className="text-lg font-semibold text-gray-100 mb-4">Sélection du vol</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Origin */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Origine
                </label>
                <select
                  value={selectedOrigin}
                  onChange={(e) => setSelectedOrigin(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <optgroup label="DOM">
                    {domAirports.map((airport) => (
                      <option key={airport.code} value={airport.code}>
                        {airport.code} - {airport.city}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Métropole">
                    {metropoleAirports.map((airport) => (
                      <option key={airport.code} value={airport.code}>
                        {airport.code} - {airport.city}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Destination */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Destination
                </label>
                <select
                  value={selectedDestination}
                  onChange={(e) => setSelectedDestination(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <optgroup label="DOM">
                    {domAirports.map((airport) => (
                      <option key={airport.code} value={airport.code}>
                        {airport.code} - {airport.city}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Métropole">
                    {metropoleAirports.map((airport) => (
                      <option key={airport.code} value={airport.code}>
                        {airport.code} - {airport.city}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Season Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Période
                </label>
                <select
                  value={filterSeason}
                  onChange={(e) => setFilterSeason(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Toutes les périodes</option>
                  <option value="high">Haute saison</option>
                  <option value="low">Basse saison</option>
                  <option value="shoulder">Saison intermédiaire</option>
                </select>
              </div>

              {/* Price Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Classe
                </label>
                <select
                  value={filterPriceType}
                  onChange={(e) => setFilterPriceType(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Toutes les classes</option>
                  <option value="economy">Économique</option>
                </select>
              </div>
            </div>
          </section>

          {/* Comparison Results */}
          {comparisonResult ? (
            <>
              {/* Quick Summary */}
              <ComparisonSummary
                bestPrice={comparisonResult.aggregation.minPrice}
                worstPrice={comparisonResult.aggregation.maxPrice}
                averagePrice={comparisonResult.aggregation.averagePrice}
                savingsPercentage={comparisonResult.aggregation.priceRangePercentage}
                bestProvider={comparisonResult.airlines[0].flightPrice.airline}
                totalObservations={comparisonResult.aggregation.totalObservations}
                bestTiming={
                  comparisonResult.purchaseTimingAnalysis?.optimalPurchaseWindow
                    ? {
                        label: 'Fenêtre optimale',
                        daysRange: `${comparisonResult.purchaseTimingAnalysis.optimalPurchaseWindow.daysBeforeDeparture.min}-${comparisonResult.purchaseTimingAnalysis.optimalPurchaseWindow.daysBeforeDeparture.max} jours avant`,
                      }
                    : undefined
                }
              />

              {/* Aggregation Stats */}
              <section className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-5">
                <h2 className="text-lg font-semibold text-gray-100 mb-4">Statistiques</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Prix moyen</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {formatPrice(comparisonResult.aggregation.averagePrice)}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Prix min</p>
                    <p className="text-2xl font-bold text-green-400">
                      {formatPrice(comparisonResult.aggregation.minPrice)}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Prix max</p>
                    <p className="text-2xl font-bold text-red-400">
                      {formatPrice(comparisonResult.aggregation.maxPrice)}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Écart de prix</p>
                    <p className="text-2xl font-bold text-orange-400">
                      {comparisonResult.aggregation.priceRangePercentage.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Seasonal Variation */}
                {comparisonResult.aggregation.seasonalVariation && (
                  <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-blue-300 mb-2">
                      Variation saisonnière
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-400">Haute saison</p>
                        <p className="text-lg font-semibold text-gray-200">
                          {formatPrice(comparisonResult.aggregation.seasonalVariation.highSeasonAverage)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Basse saison</p>
                        <p className="text-lg font-semibold text-gray-200">
                          {formatPrice(comparisonResult.aggregation.seasonalVariation.lowSeasonAverage)}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Différence :{' '}
                      <span className="font-semibold text-orange-300">
                        +{comparisonResult.aggregation.seasonalVariation.seasonalDifferencePercentage.toFixed(1)}%
                      </span>{' '}
                      en haute saison
                    </p>
                  </div>
                )}
              </section>

              {/* Export & Share Options */}
              <section className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-5">
                <h2 className="text-lg font-semibold text-gray-100 mb-4">
                  📥 Exporter et partager
                </h2>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => exportFlightComparisonToCSV(comparisonResult)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    aria-label="Exporter en CSV"
                  >
                    <Download className="w-4 h-4" />
                    Exporter CSV
                  </button>
                  <button
                    onClick={() => exportFlightComparisonToText(comparisonResult)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    aria-label="Exporter en texte"
                  >
                    <FileText className="w-4 h-4" />
                    Exporter Texte
                  </button>
                  <ShareButton
                    title={`Comparateur vols ${comparisonResult.airlines[0]?.flightPrice.route.origin.city} → ${comparisonResult.airlines[0]?.flightPrice.route.destination.city}`}
                    description={`Économisez jusqu'à ${comparisonResult.aggregation.priceRangePercentage.toFixed(1)}% sur votre billet d'avion!`}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  Téléchargez ou partagez les résultats de la comparaison.
                </p>
              </section>

              {/* Airlines Comparison */}
              <section className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <h2 className="text-lg font-semibold text-gray-100">
                    Comparaison par compagnie ({comparisonResult.airlines.length})
                  </h2>
                  <SortControl
                    options={[
                      { value: 'price', label: 'Prix' },
                      { value: 'duration', label: 'Durée' },
                      { value: 'airline', label: 'Compagnie' },
                    ]}
                    currentSort={sortBy}
                    currentDirection={sortDirection}
                    onSortChange={handleSortChange}
                  />
                </div>
                <div className="space-y-3">
                  {sortedAirlines.map((ranking) => (
                    <div
                      key={ranking.flightPrice.id}
                      className={`border rounded-lg p-4 ${getPriceCategoryColor(ranking.priceCategory)}`}
                      role="article"
                      aria-label={`Vol ${ranking.flightPrice.airline} à ${formatPrice(ranking.flightPrice.price)}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-semibold text-gray-300">
                              #{ranking.rank}
                            </span>
                            <h3 className="text-lg font-bold">{ranking.flightPrice.airline}</h3>
                            <span className="text-xs px-2 py-1 rounded-full bg-slate-800/50">
                              {getPriceCategoryLabel(ranking.priceCategory)}
                            </span>
                          </div>

                          <div className="grid sm:grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-gray-400">Prix</p>
                              <p className="text-xl font-bold">
                                {formatPrice(ranking.flightPrice.price)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400">Différence vs moins cher</p>
                              <p className="font-semibold">
                                {ranking.percentageDifferenceFromCheapest > 0 && '+'}
                                {ranking.percentageDifferenceFromCheapest.toFixed(1)}%
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400">Durée</p>
                              <p className="font-semibold">{ranking.flightPrice.duration}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">Escales</p>
                              <p className="font-semibold">
                                {ranking.flightPrice.stops === 0 ? 'Direct' : `${ranking.flightPrice.stops} escale(s)`}
                              </p>
                            </div>
                          </div>

                          {/* Fare Conditions */}
                          <div className="mt-3 flex flex-wrap gap-2">
                            {ranking.flightPrice.fareConditions.baggageIncluded && (
                              <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-300">
                                Bagages inclus
                              </span>
                            )}
                            {ranking.flightPrice.fareConditions.refundable && (
                              <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300">
                                Remboursable
                              </span>
                            )}
                            {ranking.flightPrice.fareConditions.changeable && (
                              <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-300">
                                Modifiable
                              </span>
                            )}
                          </div>

                          {/* Additional Fees */}
                          {ranking.flightPrice.additionalFees && (
                            <div className="mt-3 bg-orange-500/10 border border-orange-500/30 rounded p-2">
                              <p className="text-xs text-orange-300">
                                ⚠️ Frais supplémentaires : {formatPrice(ranking.flightPrice.additionalFees.total)}
                              </p>
                            </div>
                          )}

                          {/* Timing Info */}
                          <div className="mt-3 text-xs text-gray-400">
                            <p>
                              Observation : {formatDate(ranking.flightPrice.timing.purchaseDate)} —{' '}
                              {ranking.flightPrice.timing.daysBeforeDeparture} jours avant départ
                            </p>
                            <p>Saison : {ranking.flightPrice.timing.season === 'high' ? 'Haute' : ranking.flightPrice.timing.season === 'low' ? 'Basse' : 'Intermédiaire'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Price Comparison Chart */}
              {priceComparisonChartData && (
                <section className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-5">
                  <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Comparaison visuelle des prix
                  </h2>
                  <PriceChart
                    data={priceComparisonChartData}
                    type="bar"
                    title="Prix par compagnie (avec frais supplémentaires)"
                    height={350}
                  />
                </section>
              )}

              {/* Purchase Timing Analysis */}
              {comparisonResult.purchaseTimingAnalysis && (
                <section className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-5">
                  <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Analyse du moment d'achat
                  </h2>
                  <div className="space-y-3">
                    {comparisonResult.purchaseTimingAnalysis.timingBuckets
                      .filter((b) => b.observationCount > 0)
                      .map((bucket) => (
                        <div key={bucket.label} className="bg-slate-800/50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-gray-300">
                              {bucket.label}
                            </span>
                            <span className="text-xs text-gray-400">
                              {bucket.observationCount} observation(s)
                            </span>
                          </div>
                          <div className="grid sm:grid-cols-3 gap-2 text-sm">
                            <div>
                              <p className="text-xs text-gray-400">Prix moyen</p>
                              <p className="font-semibold text-gray-200">
                                {formatPrice(bucket.averagePrice)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">Prix min</p>
                              <p className="font-semibold text-green-400">
                                {formatPrice(bucket.minPrice)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">Prix max</p>
                              <p className="font-semibold text-red-400">
                                {formatPrice(bucket.maxPrice)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>

                  {comparisonResult.purchaseTimingAnalysis.optimalPurchaseWindow && (
                    <div className="mt-4 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-green-300 mb-2">
                        💡 Fenêtre d'achat optimale observée
                      </h3>
                      <p className="text-sm text-gray-300">
                        {comparisonResult.purchaseTimingAnalysis.optimalPurchaseWindow.daysBeforeDeparture.min} à{' '}
                        {comparisonResult.purchaseTimingAnalysis.optimalPurchaseWindow.daysBeforeDeparture.max} jours
                        avant le départ
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Prix moyen :{' '}
                        {formatPrice(comparisonResult.purchaseTimingAnalysis.optimalPurchaseWindow.averagePrice)} —
                        Économie potentielle :{' '}
                        {comparisonResult.purchaseTimingAnalysis.optimalPurchaseWindow.savingsPercentage.toFixed(1)}%
                      </p>
                    </div>
                  )}

                  {/* Timing Chart */}
                  {timingAnalysisChartData && (
                    <div className="mt-4">
                      <PriceChart
                        data={timingAnalysisChartData}
                        type="bar"
                        title="Évolution des prix selon le moment d'achat"
                        height={300}
                      />
                    </div>
                  )}
                </section>
              )}

              {/* Disclaimer */}
              <section className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-blue-300 mb-1">
                      Méthodologie & Transparence
                    </h3>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      {comparisonResult.metadata.disclaimer}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Basé sur {comparisonResult.aggregation.totalObservations} observations —{' '}
                      Dernière mise à jour : {formatDate(comparisonResult.aggregation.lastUpdate)}
                    </p>
                  </div>
                </div>
              </section>
            </>
          ) : (
            <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-8 text-center">
              <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">
                Aucune donnée disponible pour cette route. Veuillez sélectionner une autre combinaison.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default FlightComparator;
