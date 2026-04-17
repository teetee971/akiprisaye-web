import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Plane,
  AlertCircle,
  Info,
  Clock,
  BarChart3,
  Download,
  FileText,
  ExternalLink,
  Star,
  Award,
  TrendingDown,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Luggage,
  Tag,
} from 'lucide-react';
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
import {
  exportFlightComparisonToCSV,
  exportFlightComparisonToText,
} from '../utils/exportComparison';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';
import { buildBookingUrl } from '../utils/bookingLinks';
import BookingLinkBadge from '../components/comparateur/BookingLinkBadge';

/**
 * Fallback booking URLs per airline IATA code.
 * The JSON data's bookingUrl field takes priority; these are used as a fallback.
 */
const AIRLINE_BOOKING_URLS: Record<string, string> = {
  AF: 'https://www.airfrance.fr/search/offer',
  TX: 'https://www.aircaraibes.com/',
  SS: 'https://www.corsair.fr/vols/',
  TO: 'https://www.transavia.com/fr-FR/fly/',
  '3S': 'https://www.air-antilles.com/',
  FR: 'https://www.frenchbee.com/',
  UU: 'https://www.air-austral.com/',
};

const getAirlineBookingUrl = (
  airlineCode: string,
  originCode: string,
  destCode: string,
  bookingUrlOverride?: string
): string => {
  let base: string;
  if (bookingUrlOverride) {
    base = bookingUrlOverride;
  } else {
    const fallback = AIRLINE_BOOKING_URLS[airlineCode];
    if (!fallback) return '#';
    base =
      airlineCode === 'AF'
        ? `${fallback}?origin=${originCode}&destination=${destCode}&cabin=ECONOMY&adults=1`
        : fallback;
  }
  return buildBookingUrl(base, 'comparateur-vols');
};

/** Value score: 0–100. Accounts for price position, included services, fees. */
const computeValueScore = (
  price: number,
  fareConditions: FlightPricePoint['fareConditions'],
  additionalFees: FlightPricePoint['additionalFees'],
  minPrice: number,
  maxPrice: number
): number => {
  const priceRange = maxPrice - minPrice;
  const priceIndex = priceRange > 0 ? (price - minPrice) / priceRange : 0;
  let score = 100 - Math.round(priceIndex * 60);
  if (fareConditions.baggageIncluded) score += 15;
  if (fareConditions.changeable) score += 10;
  if (fareConditions.refundable) score += 10;
  if (fareConditions.seatSelection) score += 5;
  if (additionalFees && additionalFees.total > 50) score -= 10;
  return Math.max(0, Math.min(100, score));
};

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
  const [lastRefreshed] = useState<Date>(new Date());

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

    const labels = comparisonResult.airlines.map((r) => r.flightPrice.airline);
    const prices = comparisonResult.airlines.map((r) => r.flightPrice.price);
    const additionalFees = comparisonResult.airlines.map(
      (r) => r.flightPrice.additionalFees?.total || 0
    );

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

    const buckets = comparisonResult.purchaseTimingAnalysis.timingBuckets.filter(
      (b) => b.observationCount > 0
    );
    const labels = buckets.map((b) => b.label);
    const avgPrices = buckets.map((b) => b.averagePrice);
    const minPrices = buckets.map((b) => b.minPrice);
    const maxPrices = buckets.map((b) => b.maxPrice);

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

  // ── Profile-based recommendations ──────────────────────────────────────────
  const cheapestAirline = useMemo(() => {
    if (!comparisonResult || comparisonResult.airlines.length === 0) return null;
    return [...comparisonResult.airlines].sort(
      (a, b) => a.flightPrice.price - b.flightPrice.price
    )[0];
  }, [comparisonResult]);

  const bestWithBaggage = useMemo(() => {
    if (!comparisonResult) return null;
    const withBaggage = comparisonResult.airlines.filter(
      (r) => r.flightPrice.fareConditions.baggageIncluded
    );
    if (withBaggage.length === 0) return null;
    return withBaggage.reduce((min, r) => (r.flightPrice.price < min.flightPrice.price ? r : min));
  }, [comparisonResult]);

  const mostFlexible = useMemo(() => {
    if (!comparisonResult) return null;
    const flexible = comparisonResult.airlines.filter(
      (r) => r.flightPrice.fareConditions.changeable || r.flightPrice.fareConditions.refundable
    );
    if (flexible.length === 0) return null;
    return flexible.reduce((min, r) => (r.flightPrice.price < min.flightPrice.price ? r : min));
  }, [comparisonResult]);

  const bestOverall = useMemo(() => {
    if (!comparisonResult || comparisonResult.airlines.length === 0) return null;
    const minP = comparisonResult.aggregation.minPrice;
    const maxP = comparisonResult.aggregation.maxPrice;
    return comparisonResult.airlines.reduce((best, r) => {
      const rScore = computeValueScore(
        r.flightPrice.price,
        r.flightPrice.fareConditions,
        r.flightPrice.additionalFees,
        minP,
        maxP
      );
      const bestScore = computeValueScore(
        best.flightPrice.price,
        best.flightPrice.fareConditions,
        best.flightPrice.additionalFees,
        minP,
        maxP
      );
      return rScore > bestScore ? r : best;
    });
  }, [comparisonResult]);

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

  const heroSection = (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
      <HeroImage
        src={PAGE_HERO_IMAGES.comparateurVols}
        alt="Comparateur vols DOM-Métropole — avion en vol"
        gradient="from-sky-900 to-slate-900"
        height="h-40 sm:h-56"
      >
        <div className="flex items-center gap-3 mb-2">
          <Plane className="w-8 h-8 text-sky-300 drop-shadow" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow">
            ✈️ Comparateur de prix des vols
          </h1>
        </div>
        <p className="text-sky-100 text-sm sm:text-base drop-shadow">
          🏝 DOM ↔ Métropole ↔ Inter-îles — données observatoire citoyennes
        </p>
        <div className="flex flex-wrap items-center gap-3 mt-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-500/20 border border-green-500/40 rounded-full text-xs text-green-300 drop-shadow">
            <RefreshCw className="w-3 h-3" />
            Données du{' '}
            {lastRefreshed.toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
          <BookingLinkBadge />
        </div>
      </HeroImage>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Helmet>
          <title>Comparateur Vols DOM-Métropole — A KI PRI SA YÉ</title>
          <meta
            name="description"
            content="Comparez les prix des billets d'avion entre les DOM, la Métropole et les liaisons inter-îles."
          />
          <link
            rel="canonical"
            href="https://teetee971.github.io/akiprisaye-web/comparateur-vols"
          />
          <link
            rel="alternate"
            hrefLang="fr"
            href="https://teetee971.github.io/akiprisaye-web/comparateur-vols"
          />
          <link
            rel="alternate"
            hrefLang="x-default"
            href="https://teetee971.github.io/akiprisaye-web/comparateur-vols"
          />
        </Helmet>
        {heroSection}
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
      <Helmet>
        <title>Comparateur Vols DOM-Métropole — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Comparez les prix des billets d'avion entre les DOM, la Métropole et les liaisons inter-îles. Données observatoire citoyennes."
        />
      </Helmet>
      {heroSection}
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Filters */}
          <section className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-5">
            <h2 className="text-lg font-semibold text-gray-100 mb-4">Sélection du vol</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Origin */}
              <div>
                <label
                  htmlFor="vol-origine"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Origine
                </label>
                <select
                  id="vol-origine"
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
                <label
                  htmlFor="vol-destination"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Destination
                </label>
                <select
                  id="vol-destination"
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
                <label
                  htmlFor="vol-periode"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Période
                </label>
                <select
                  id="vol-periode"
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
                <label
                  htmlFor="vol-classe"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Classe
                </label>
                <select
                  id="vol-classe"
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
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Prix médian</p>
                    <p className="text-2xl font-bold text-purple-400">
                      {formatPrice(comparisonResult.aggregation.medianPrice)}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Écart-type</p>
                    <p className="text-2xl font-bold text-yellow-400">
                      {formatPrice(comparisonResult.aggregation.standardDeviation)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Volatilité des prix</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Compagnies</p>
                    <p className="text-2xl font-bold text-sky-400">
                      {comparisonResult.aggregation.airlineCount}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {comparisonResult.aggregation.totalObservations} observations
                    </p>
                  </div>
                </div>

                {/* Seasonal Variation */}
                {comparisonResult.aggregation.seasonalVariation && (
                  <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-blue-300 mb-2">
                      🗓 Variation saisonnière
                    </h3>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div>
                        <p className="text-xs text-gray-400">Haute saison</p>
                        <p className="text-lg font-semibold text-red-300">
                          {formatPrice(
                            comparisonResult.aggregation.seasonalVariation.highSeasonAverage
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Basse saison</p>
                        <p className="text-lg font-semibold text-green-300">
                          {formatPrice(
                            comparisonResult.aggregation.seasonalVariation.lowSeasonAverage
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Surcoût été</p>
                        <p className="text-lg font-semibold text-orange-300">
                          +
                          {comparisonResult.aggregation.seasonalVariation.seasonalDifferencePercentage.toFixed(
                            1
                          )}
                          %
                        </p>
                        <p className="text-xs text-gray-500">
                          +
                          {formatPrice(
                            comparisonResult.aggregation.seasonalVariation.seasonalDifference
                          )}
                        </p>
                      </div>
                    </div>
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

              {/* ── Tableau comparatif complet ────────────────────────────── */}
              <section className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-5">
                <h2 className="text-lg font-semibold text-gray-100 mb-1 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-sky-400" />
                  Tableau comparatif complet
                </h2>
                <p className="text-xs text-gray-400 mb-4">
                  Comparaison détaillée de toutes les compagnies — cliquez sur « Voir l'offre » pour
                  vérifier le prix actuel sur le site de la compagnie.
                </p>
                <div className="overflow-x-auto -mx-5 px-5">
                  <table className="w-full text-sm min-w-[760px]">
                    <thead>
                      <tr className="border-b border-slate-700 text-left">
                        <th className="py-3 px-3 text-gray-400 font-medium">#</th>
                        <th className="py-3 px-3 text-gray-400 font-medium">Compagnie</th>
                        <th className="py-3 px-3 text-gray-400 font-medium text-right">
                          Prix obs.
                        </th>
                        <th className="py-3 px-3 text-gray-400 font-medium text-center">
                          <span title="Bagages inclus">
                            <Luggage className="w-4 h-4 inline" />
                          </span>
                        </th>
                        <th className="py-3 px-3 text-gray-400 font-medium text-center">Modif.</th>
                        <th className="py-3 px-3 text-gray-400 font-medium text-center">Remb.</th>
                        <th className="py-3 px-3 text-gray-400 font-medium text-right">Durée</th>
                        <th className="py-3 px-3 text-gray-400 font-medium text-center">Escales</th>
                        <th className="py-3 px-3 text-gray-400 font-medium text-right">
                          Frais sup.
                        </th>
                        <th className="py-3 px-3 text-gray-400 font-medium text-right">Total</th>
                        <th className="py-3 px-3 text-gray-400 font-medium text-center">Score</th>
                        <th className="py-3 px-3 text-gray-400 font-medium text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedAirlines.map((ranking) => {
                        const totalWithFees =
                          ranking.flightPrice.price +
                          (ranking.flightPrice.additionalFees?.total || 0);
                        const bookingUrl = getAirlineBookingUrl(
                          ranking.flightPrice.airlineCode,
                          ranking.flightPrice.route.origin.code,
                          ranking.flightPrice.route.destination.code,
                          ranking.flightPrice.bookingUrl
                        );
                        const score = computeValueScore(
                          ranking.flightPrice.price,
                          ranking.flightPrice.fareConditions,
                          ranking.flightPrice.additionalFees,
                          comparisonResult.aggregation.minPrice,
                          comparisonResult.aggregation.maxPrice
                        );
                        const rankEmoji =
                          ranking.rank === 1
                            ? '🥇'
                            : ranking.rank === 2
                              ? '🥈'
                              : ranking.rank === 3
                                ? '🥉'
                                : `#${ranking.rank}`;
                        return (
                          <tr
                            key={ranking.flightPrice.id}
                            className={`border-b border-slate-800 transition-colors hover:bg-slate-800/30 ${
                              ranking.rank === 1 ? 'bg-green-500/5' : ''
                            }`}
                          >
                            <td className="py-3 px-3 font-bold text-gray-300">{rankEmoji}</td>
                            <td className="py-3 px-3">
                              <span
                                className={`font-semibold ${
                                  ranking.rank === 1
                                    ? 'text-green-300'
                                    : ranking.priceCategory === 'most_expensive'
                                      ? 'text-red-300'
                                      : 'text-gray-200'
                                }`}
                              >
                                {ranking.flightPrice.airline}
                              </span>
                              {!ranking.flightPrice.verified && (
                                <span className="ml-1 text-xs text-yellow-500/80">
                                  (non vérifié)
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <span
                                className={`font-bold text-base ${
                                  ranking.rank === 1
                                    ? 'text-green-400'
                                    : ranking.priceCategory === 'most_expensive'
                                      ? 'text-red-400'
                                      : 'text-gray-100'
                                }`}
                              >
                                {formatPrice(ranking.flightPrice.price)}
                              </span>
                              {ranking.absoluteDifferenceFromCheapest > 0 && (
                                <div className="text-xs text-orange-400 text-right">
                                  +{formatPrice(ranking.absoluteDifferenceFromCheapest)}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {ranking.flightPrice.fareConditions.baggageIncluded ? (
                                <CheckCircle2 className="w-4 h-4 text-green-400 mx-auto" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-400/70 mx-auto" />
                              )}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {ranking.flightPrice.fareConditions.changeable ? (
                                <CheckCircle2 className="w-4 h-4 text-green-400 mx-auto" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-400/70 mx-auto" />
                              )}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {ranking.flightPrice.fareConditions.refundable ? (
                                <CheckCircle2 className="w-4 h-4 text-green-400 mx-auto" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-400/70 mx-auto" />
                              )}
                            </td>
                            <td className="py-3 px-3 text-right text-gray-300">
                              {ranking.flightPrice.duration ?? '—'}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span
                                className={
                                  ranking.flightPrice.stops === 0
                                    ? 'text-green-400'
                                    : 'text-orange-400'
                                }
                              >
                                {ranking.flightPrice.stops === 0
                                  ? 'Direct'
                                  : `${ranking.flightPrice.stops} esc.`}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right text-orange-400 text-xs">
                              {ranking.flightPrice.additionalFees
                                ? `+${formatPrice(ranking.flightPrice.additionalFees.total)}`
                                : '—'}
                            </td>
                            <td className="py-3 px-3 text-right font-semibold text-gray-200">
                              {formatPrice(totalWithFees)}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <div
                                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                    score >= 80
                                      ? 'bg-green-500/20 text-green-300'
                                      : score >= 60
                                        ? 'bg-blue-500/20 text-blue-300'
                                        : score >= 40
                                          ? 'bg-yellow-500/20 text-yellow-300'
                                          : 'bg-red-500/20 text-red-300'
                                  }`}
                                >
                                  {score}/100
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <a
                                href={bookingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
                                aria-label={`Voir l'offre ${ranking.flightPrice.airline}`}
                              >
                                <ExternalLink className="w-3 h-3" />
                                Voir l'offre
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 flex-shrink-0" />
                    Prix observés à titre indicatif. Vérifiez le tarif exact en cliquant sur « Voir
                    l'offre ».
                  </p>
                  <BookingLinkBadge showTooltip={true} size="sm" />
                </div>
              </section>

              {/* ── Quelle compagnie choisir ? ────────────────────────────── */}
              <section className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-5">
                <h2 className="text-lg font-semibold text-gray-100 mb-1 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-400" />
                  Quelle compagnie choisir ?
                </h2>
                <p className="text-xs text-gray-400 mb-4">
                  Recommandations basées sur les observations — selon votre profil de voyage.
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {cheapestAirline && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                      <div className="text-xs font-semibold text-green-400 mb-2 flex items-center gap-1">
                        <TrendingDown className="w-3.5 h-3.5" /> Meilleur prix brut
                      </div>
                      <div className="text-base font-bold text-green-200 mb-1">
                        {cheapestAirline.flightPrice.airline}
                      </div>
                      <div className="text-2xl font-bold text-white mb-2">
                        {formatPrice(cheapestAirline.flightPrice.price)}
                      </div>
                      <p className="text-xs text-gray-400 mb-3">
                        {cheapestAirline.flightPrice.fareConditions.baggageIncluded
                          ? '✅ Bagages inclus'
                          : '⚠️ Bagages en option'}
                      </p>
                      <a
                        href={getAirlineBookingUrl(
                          cheapestAirline.flightPrice.airlineCode,
                          cheapestAirline.flightPrice.route.origin.code,
                          cheapestAirline.flightPrice.route.destination.code,
                          cheapestAirline.flightPrice.bookingUrl
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Voir l'offre
                      </a>
                    </div>
                  )}

                  {bestWithBaggage && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                      <div className="text-xs font-semibold text-blue-400 mb-2 flex items-center gap-1">
                        <Luggage className="w-3.5 h-3.5" /> Bagages inclus
                      </div>
                      <div className="text-base font-bold text-blue-200 mb-1">
                        {bestWithBaggage.flightPrice.airline}
                      </div>
                      <div className="text-2xl font-bold text-white mb-2">
                        {formatPrice(bestWithBaggage.flightPrice.price)}
                      </div>
                      <p className="text-xs text-gray-400 mb-3">
                        ✅ Bagage inclus
                        {bestWithBaggage.flightPrice.fareConditions.changeable
                          ? ' · ✅ Modifiable'
                          : ''}
                      </p>
                      <a
                        href={getAirlineBookingUrl(
                          bestWithBaggage.flightPrice.airlineCode,
                          bestWithBaggage.flightPrice.route.origin.code,
                          bestWithBaggage.flightPrice.route.destination.code,
                          bestWithBaggage.flightPrice.bookingUrl
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Voir l'offre
                      </a>
                    </div>
                  )}

                  {mostFlexible && (
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                      <div className="text-xs font-semibold text-purple-400 mb-2 flex items-center gap-1">
                        <RefreshCw className="w-3.5 h-3.5" /> Plus flexible
                      </div>
                      <div className="text-base font-bold text-purple-200 mb-1">
                        {mostFlexible.flightPrice.airline}
                      </div>
                      <div className="text-2xl font-bold text-white mb-2">
                        {formatPrice(mostFlexible.flightPrice.price)}
                      </div>
                      <p className="text-xs text-gray-400 mb-3">
                        {mostFlexible.flightPrice.fareConditions.changeable ? '✅ Modifiable' : ''}
                        {mostFlexible.flightPrice.fareConditions.refundable
                          ? ' · ✅ Remboursable'
                          : ''}
                        {mostFlexible.flightPrice.fareConditions.baggageIncluded
                          ? ' · ✅ Bagages'
                          : ''}
                      </p>
                      <a
                        href={getAirlineBookingUrl(
                          mostFlexible.flightPrice.airlineCode,
                          mostFlexible.flightPrice.route.origin.code,
                          mostFlexible.flightPrice.route.destination.code,
                          mostFlexible.flightPrice.bookingUrl
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Voir l'offre
                      </a>
                    </div>
                  )}

                  {bestOverall && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                      <div className="text-xs font-semibold text-yellow-400 mb-2 flex items-center gap-1">
                        <Star className="w-3.5 h-3.5" /> Meilleur rapport Q/P
                      </div>
                      <div className="text-base font-bold text-yellow-200 mb-1">
                        {bestOverall.flightPrice.airline}
                      </div>
                      <div className="text-2xl font-bold text-white mb-2">
                        {formatPrice(
                          bestOverall.flightPrice.price +
                            (bestOverall.flightPrice.additionalFees?.total || 0)
                        )}
                        <span className="text-xs text-gray-400 font-normal ml-1">tout compris</span>
                      </div>
                      <p className="text-xs text-gray-400 mb-3">
                        Score{' '}
                        {computeValueScore(
                          bestOverall.flightPrice.price,
                          bestOverall.flightPrice.fareConditions,
                          bestOverall.flightPrice.additionalFees,
                          comparisonResult.aggregation.minPrice,
                          comparisonResult.aggregation.maxPrice
                        )}
                        /100 — meilleur équilibre prix/services
                      </p>
                      <a
                        href={getAirlineBookingUrl(
                          bestOverall.flightPrice.airlineCode,
                          bestOverall.flightPrice.route.origin.code,
                          bestOverall.flightPrice.route.destination.code,
                          bestOverall.flightPrice.bookingUrl
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Voir l'offre
                      </a>
                    </div>
                  )}
                </div>
              </section>

              {/* Airlines Comparison */}
              <section className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <h2 className="text-lg font-semibold text-gray-100">
                    Fiches détaillées par compagnie ({comparisonResult.airlines.length})
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
                  {sortedAirlines.map((ranking) => {
                    const totalWithFees =
                      ranking.flightPrice.price + (ranking.flightPrice.additionalFees?.total || 0);
                    const bookingUrl = getAirlineBookingUrl(
                      ranking.flightPrice.airlineCode,
                      ranking.flightPrice.route.origin.code,
                      ranking.flightPrice.route.destination.code,
                      ranking.flightPrice.bookingUrl
                    );
                    const score = computeValueScore(
                      ranking.flightPrice.price,
                      ranking.flightPrice.fareConditions,
                      ranking.flightPrice.additionalFees,
                      comparisonResult.aggregation.minPrice,
                      comparisonResult.aggregation.maxPrice
                    );
                    const rankEmoji =
                      ranking.rank === 1
                        ? '🥇'
                        : ranking.rank === 2
                          ? '🥈'
                          : ranking.rank === 3
                            ? '🥉'
                            : `#${ranking.rank}`;
                    return (
                      <div
                        key={ranking.flightPrice.id}
                        className={`border rounded-xl p-4 ${getPriceCategoryColor(ranking.priceCategory)}`}
                        role="article"
                        aria-label={`Vol ${ranking.flightPrice.airline} à ${formatPrice(ranking.flightPrice.price)}`}
                      >
                        {/* Header row */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-base font-bold text-gray-200">{rankEmoji}</span>
                            <h3 className="text-lg font-bold">{ranking.flightPrice.airline}</h3>
                            <span className="text-xs px-2 py-1 rounded-full bg-slate-800/50">
                              {getPriceCategoryLabel(ranking.priceCategory)}
                            </span>
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                score >= 80
                                  ? 'bg-green-500/20 text-green-300'
                                  : score >= 60
                                    ? 'bg-blue-500/20 text-blue-300'
                                    : score >= 40
                                      ? 'bg-yellow-500/20 text-yellow-300'
                                      : 'bg-red-500/20 text-red-300'
                              }`}
                            >
                              Score {score}/100
                            </span>
                          </div>
                          {/* Booking CTA */}
                          <a
                            href={bookingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-md"
                            aria-label={`Voir l'offre ${ranking.flightPrice.airline}`}
                          >
                            <ExternalLink className="w-4 h-4" />
                            Voir l'offre
                          </a>
                        </div>

                        {/* Price grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-3">
                          <div>
                            <p className="text-gray-400 text-xs mb-0.5">Prix observé</p>
                            <p className="text-xl font-bold">
                              {formatPrice(ranking.flightPrice.price)}
                            </p>
                            {ranking.absoluteDifferenceFromCheapest > 0 && (
                              <p className="text-xs text-orange-400">
                                +{formatPrice(ranking.absoluteDifferenceFromCheapest)} vs moins cher
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs mb-0.5">Total avec frais</p>
                            <p className="text-lg font-bold text-gray-200">
                              {formatPrice(totalWithFees)}
                            </p>
                            {ranking.flightPrice.additionalFees && (
                              <p className="text-xs text-orange-400">
                                +{formatPrice(ranking.flightPrice.additionalFees.total)} frais
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs mb-0.5">Durée</p>
                            <p className="font-semibold">{ranking.flightPrice.duration ?? '—'}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs mb-0.5">Escales</p>
                            <p
                              className={`font-semibold ${ranking.flightPrice.stops === 0 ? 'text-green-400' : 'text-orange-400'}`}
                            >
                              {ranking.flightPrice.stops === 0
                                ? 'Direct'
                                : `${ranking.flightPrice.stops} escale(s)`}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs mb-0.5">Vs. moyenne</p>
                            <p
                              className={`font-semibold text-sm ${ranking.absoluteDifferenceFromAverage < 0 ? 'text-green-400' : 'text-orange-400'}`}
                            >
                              {ranking.absoluteDifferenceFromAverage > 0 ? '+' : ''}
                              {ranking.percentageDifferenceFromAverage.toFixed(1)}%
                              <span className="text-xs ml-1 text-gray-400">
                                ({ranking.absoluteDifferenceFromAverage > 0 ? '+' : ''}
                                {formatPrice(ranking.absoluteDifferenceFromAverage)})
                              </span>
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs mb-0.5">Confiance</p>
                            <p
                              className={`font-semibold text-xs ${ranking.flightPrice.confidence === 'high' ? 'text-green-400' : ranking.flightPrice.confidence === 'medium' ? 'text-yellow-400' : 'text-red-400'}`}
                            >
                              {ranking.flightPrice.confidence === 'high'
                                ? '✅ Élevée'
                                : ranking.flightPrice.confidence === 'medium'
                                  ? '⚠️ Moyenne'
                                  : '❌ Faible'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs mb-0.5">Observations</p>
                            <p className="font-semibold text-xs text-gray-300">
                              {ranking.flightPrice.volume} obs.
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs mb-0.5">Saison</p>
                            <p className="font-semibold text-xs text-gray-300">
                              {ranking.flightPrice.timing.season === 'high'
                                ? '🔴 Haute'
                                : ranking.flightPrice.timing.season === 'low'
                                  ? '🟢 Basse'
                                  : '🟡 Interméd.'}
                            </p>
                          </div>
                        </div>

                        {/* Fare Conditions */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span
                            className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${ranking.flightPrice.fareConditions.baggageIncluded ? 'bg-green-500/20 text-green-300' : 'bg-slate-800 text-gray-500'}`}
                          >
                            <Luggage className="w-3 h-3" />
                            {ranking.flightPrice.fareConditions.baggageIncluded
                              ? 'Bagages inclus'
                              : 'Bagages payants'}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${ranking.flightPrice.fareConditions.changeable ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-800 text-gray-500'}`}
                          >
                            <RefreshCw className="w-3 h-3" />
                            {ranking.flightPrice.fareConditions.changeable
                              ? 'Modifiable'
                              : 'Non modifiable'}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${ranking.flightPrice.fareConditions.refundable ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-800 text-gray-500'}`}
                          >
                            <ShieldCheck className="w-3 h-3" />
                            {ranking.flightPrice.fareConditions.refundable
                              ? 'Remboursable'
                              : 'Non remboursable'}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${ranking.flightPrice.fareConditions.seatSelection ? 'bg-sky-500/20 text-sky-300' : 'bg-slate-800 text-gray-500'}`}
                          >
                            <Tag className="w-3 h-3" />
                            {ranking.flightPrice.fareConditions.seatSelection
                              ? 'Siège choisi'
                              : 'Siège aléatoire'}
                          </span>
                        </div>

                        {/* Additional Fees detail */}
                        {ranking.flightPrice.additionalFees && (
                          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-2 mb-3 text-xs text-orange-300 flex flex-wrap gap-3">
                            <span>⚠️ Frais supplémentaires :</span>
                            {ranking.flightPrice.additionalFees.baggage != null && (
                              <span>
                                Bagage : {formatPrice(ranking.flightPrice.additionalFees.baggage)}
                              </span>
                            )}
                            {ranking.flightPrice.additionalFees.seat != null && (
                              <span>
                                Siège : {formatPrice(ranking.flightPrice.additionalFees.seat)}
                              </span>
                            )}
                            {ranking.flightPrice.additionalFees.booking != null &&
                              ranking.flightPrice.additionalFees.booking > 0 && (
                                <span>
                                  Réservation :{' '}
                                  {formatPrice(ranking.flightPrice.additionalFees.booking)}
                                </span>
                              )}
                            <span className="font-bold">
                              Total : {formatPrice(ranking.flightPrice.additionalFees.total)}
                            </span>
                          </div>
                        )}

                        {/* Timing Info */}
                        <div className="text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                          <span>
                            📅 Observé le {formatDate(ranking.flightPrice.timing.purchaseDate)}
                          </span>
                          <span>
                            ✈️ {ranking.flightPrice.timing.daysBeforeDeparture} j avant départ
                          </span>
                          {ranking.flightPrice.timing.isHoliday &&
                            ranking.flightPrice.timing.holidayName && (
                              <span>🗓 {ranking.flightPrice.timing.holidayName}</span>
                            )}
                          {!ranking.flightPrice.verified && (
                            <span className="text-yellow-600">⚠️ Non vérifié</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
                        {
                          comparisonResult.purchaseTimingAnalysis.optimalPurchaseWindow
                            .daysBeforeDeparture.min
                        }{' '}
                        à{' '}
                        {
                          comparisonResult.purchaseTimingAnalysis.optimalPurchaseWindow
                            .daysBeforeDeparture.max
                        }{' '}
                        jours avant le départ
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Prix moyen :{' '}
                        {formatPrice(
                          comparisonResult.purchaseTimingAnalysis.optimalPurchaseWindow.averagePrice
                        )}{' '}
                        — Économie potentielle :{' '}
                        {comparisonResult.purchaseTimingAnalysis.optimalPurchaseWindow.savingsPercentage.toFixed(
                          1
                        )}
                        %
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
                Aucune donnée disponible pour cette route. Veuillez sélectionner une autre
                combinaison.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default FlightComparator;
