import React, { useState, useEffect, useMemo } from 'react';
import { Fuel, AlertCircle, Info, BarChart3, Download, FileText, MapPin } from 'lucide-react';
import type {
  FuelPricePoint,
  FuelComparisonResult,
  FuelType,
  Territory,
} from '../types/fuelComparison';
import {
  compareFuelPricesByTerritory,
  loadFuelData,
  filterFuelPrices,
} from '../services/fuelComparisonService';
import PriceChart from '../components/comparateur/PriceChart';
import ComparisonSummary from '../components/comparateur/ComparisonSummary';
import LoadingSkeleton from '../components/comparateur/LoadingSkeleton';
import SortControl from '../components/comparateur/SortControl';
import ShareButton from '../components/comparateur/ShareButton';
import { exportFuelComparisonToCSV, exportFuelComparisonToText } from '../utils/exportComparison';

const FuelComparator: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fuelPrices, setFuelPrices] = useState<FuelPricePoint[]>([]);
  const [selectedTerritory, setSelectedTerritory] = useState<Territory>('GP');
  const [selectedFuelType, setSelectedFuelType] = useState<FuelType>('SP95');
  const [comparisonResult, setComparisonResult] = useState<FuelComparisonResult | null>(null);
  const [sortBy, setSortBy] = useState<'price' | 'station' | 'city'>('price');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterCity, setFilterCity] = useState<string>('');

  useEffect(() => {
    loadFuelPriceData();
  }, []);

  useEffect(() => {
    if (fuelPrices.length > 0 && selectedTerritory && selectedFuelType) {
      performComparison();
    }
  }, [fuelPrices, selectedTerritory, selectedFuelType, filterCity]);

  const loadFuelPriceData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadFuelData();
      setFuelPrices(data.fuelPrices || []);
    } catch (err) {
      console.error('Error loading fuel data:', err);
      setError('Erreur lors du chargement des données de carburants');
    } finally {
      setLoading(false);
    }
  };

  const performComparison = () => {
    let filteredPrices = fuelPrices;

    if (filterCity.trim()) {
      filteredPrices = filterFuelPrices(filteredPrices, {
        city: filterCity.trim(),
      });
    }

    const result = compareFuelPricesByTerritory(
      selectedTerritory,
      selectedFuelType,
      filteredPrices
    );
    setComparisonResult(result);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  // Prepare chart data
  const priceComparisonChartData = useMemo(() => {
    if (!comparisonResult) return null;

    const labels = comparisonResult.rankedPrices.map(r => r.fuelPrice.station.name);
    const prices = comparisonResult.rankedPrices.map(r => r.fuelPrice.pricePerLiter);

    return {
      labels,
      datasets: [
        {
          label: 'Prix au litre (€)',
          data: prices,
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
        },
      ],
    };
  }, [comparisonResult]);

  // Sorted prices for display
  const sortedPrices = useMemo(() => {
    if (!comparisonResult) return [];
    
    const sorted = [...comparisonResult.rankedPrices].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'price':
          comparison = a.fuelPrice.pricePerLiter - b.fuelPrice.pricePerLiter;
          break;
        case 'station':
          comparison = a.fuelPrice.station.name.localeCompare(b.fuelPrice.station.name);
          break;
        case 'city':
          comparison = a.fuelPrice.station.city.localeCompare(b.fuelPrice.station.city);
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }, [comparisonResult, sortBy, sortDirection]);

  const handleSortChange = (sort: string, direction: 'asc' | 'desc') => {
    setSortBy(sort as 'price' | 'station' | 'city');
    setSortDirection(direction);
  };

  const territories: { value: Territory; label: string }[] = [
    { value: 'GP', label: 'Guadeloupe' },
    { value: 'MQ', label: 'Martinique' },
    { value: 'GY', label: 'Guyane' },
    { value: 'RE', label: 'La Réunion' },
    { value: 'YT', label: 'Mayotte' },
  ];

  const fuelTypes: { value: FuelType; label: string }[] = [
    { value: 'SP95', label: 'SP95' },
    { value: 'SP98', label: 'SP98' },
    { value: 'E10', label: 'E10' },
    { value: 'E85', label: 'E85' },
    { value: 'DIESEL', label: 'Gazole' },
    { value: 'GPL', label: 'GPL' },
  ];

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-blue-500/20 rounded-xl">
            <Fuel className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Comparateur Carburants</h1>
            <p className="text-gray-400 mt-1">Prix des carburants dans les DOM-TOM</p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="text-blue-300 font-medium mb-1">Observer, pas vendre</p>
            <p className="text-gray-300">
              Ce comparateur affiche les prix officiels observés. Données issues de prix-carburants.gouv.fr 
              et contributions citoyennes. Aucune affiliation commerciale.
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Selection Form */}
        <div className="bg-slate-900/50 rounded-xl p-6 mb-6 border border-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Territoire
              </label>
              <select
                value={selectedTerritory}
                onChange={(e) => setSelectedTerritory(e.target.value as Territory)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {territories.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Type de carburant
              </label>
              <select
                value={selectedFuelType}
                onChange={(e) => setSelectedFuelType(e.target.value as FuelType)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {fuelTypes.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Filtrer par ville (optionnel)
              </label>
              <input
                type="text"
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                placeholder="Ex: Pointe-à-Pitre"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Comparison Result */}
        {comparisonResult && (
          <>
            {/* Summary Cards */}
            <ComparisonSummary
              minPrice={comparisonResult.aggregation.minPrice}
              maxPrice={comparisonResult.aggregation.maxPrice}
              averagePrice={comparisonResult.aggregation.averagePrice}
              priceRange={comparisonResult.aggregation.priceRange}
              priceRangePercentage={comparisonResult.aggregation.priceRangePercentage}
              currency="EUR"
              unit="/L"
            />

            {/* Chart */}
            {priceComparisonChartData && (
              <div className="bg-slate-900/50 rounded-xl p-6 mb-6 border border-slate-800">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  Comparaison visuelle des prix
                </h2>
                <PriceChart data={priceComparisonChartData} type="bar" />
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <SortControl
                  sortBy={sortBy}
                  sortDirection={sortDirection}
                  onSortChange={handleSortChange}
                  sortOptions={[
                    { value: 'price', label: 'Prix' },
                    { value: 'station', label: 'Station' },
                    { value: 'city', label: 'Ville' },
                  ]}
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => comparisonResult && exportFuelComparisonToCSV(comparisonResult)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export CSV</span>
                </button>
                <button
                  onClick={() => comparisonResult && exportFuelComparisonToText(comparisonResult)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Export TXT</span>
                </button>
                <ShareButton title="Comparateur Carburants - A KI PRI SA YÉ" />
              </div>
            </div>

            {/* Stations Table */}
            <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Rang</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Station</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Ville</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">Prix/L</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">Diff. vs min</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Catégorie</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {sortedPrices.map((ranking, index) => (
                      <tr
                        key={ranking.fuelPrice.id}
                        className="hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="px-4 py-4 text-sm">
                          {ranking.rank === 1 && (
                            <span className="inline-flex items-center gap-1 text-yellow-400">
                              <span className="text-lg">🏆</span>
                              {ranking.rank}
                            </span>
                          )}
                          {ranking.rank !== 1 && ranking.rank}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            <span className="font-medium">{ranking.fuelPrice.station.name}</span>
                            {ranking.fuelPrice.station.brand && (
                              <span className="text-xs text-gray-400">{ranking.fuelPrice.station.brand}</span>
                            )}
                            {ranking.fuelPrice.isPriceCapPlafonne && (
                              <span className="inline-flex items-center gap-1 text-xs text-green-400 mt-1">
                                ⭐ Prix plafonné
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-300">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {ranking.fuelPrice.station.city}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="font-semibold text-blue-400">
                            {formatPrice(ranking.fuelPrice.pricePerLiter)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right text-sm">
                          {ranking.rank > 1 && (
                            <span className="text-orange-400">
                              +{formatPrice(ranking.absoluteDifferenceFromCheapest)}
                              <br />
                              <span className="text-xs">
                                (+{ranking.percentageDifferenceFromCheapest.toFixed(1)}%)
                              </span>
                            </span>
                          )}
                          {ranking.rank === 1 && (
                            <span className="text-green-400">−</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-block px-2 py-1 rounded-md text-xs font-medium border ${getPriceCategoryColor(
                              ranking.priceCategory
                            )}`}
                          >
                            {getPriceCategoryLabel(ranking.priceCategory)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Metadata */}
            <div className="mt-6 text-sm text-gray-400">
              <p>
                <strong>Source:</strong> {comparisonResult.metadata.dataSource}
              </p>
              <p>
                <strong>Dernière mise à jour:</strong> {formatDate(comparisonResult.comparisonDate)}
              </p>
              <p className="mt-2 text-xs">
                Méthodologie v{comparisonResult.metadata.methodology} - Les prix peuvent varier en cours de journée.
              </p>
            </div>
          </>
        )}

        {/* No Results */}
        {!loading && !comparisonResult && (
          <div className="bg-slate-900/50 rounded-xl p-12 text-center border border-slate-800">
            <Fuel className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              Aucune donnée disponible pour cette combinaison territoire/carburant
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Essayez une autre sélection ou revenez plus tard
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FuelComparator;
