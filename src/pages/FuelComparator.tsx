import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, Download, FileText, MapPin } from 'lucide-react';
import type {
  FuelPrice,
  FuelType,
  TerritoryCode,
  FuelComparisonResult,
  FuelComparisonProps
} from '../../types/global';
import {
  compareFuelPricesByTerritory,
  loadFuelData,
  filterFuelPrices
} from '../../services/fuelComparisonService';
import PriceChart from '../../components/comparateur/LazyPriceChart';
import ComparisonSummary from '../../components/comparateur/ComparisonSummary';
import LoadingSkeleton from '../../components/comparateurs/LoadingSkeleton';
import SortControl from '../../components/comparateurs/SortControl';
import ShareButton from '../../components/comparateurs/ShareButton';
import { exportFuelComparisonToCSV, exportFuelComparisonToText } from '../../utils/exportComparison';

const FuelComparator: React.FC<FuelComparisonProps> = (props) => {
  // --- État global (Hooks corrigés) ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fuelPrices, setFuelPrices] = useState<FuelPrice[]>([]);
  const [comparisonResult, setComparisonResult] = useState<FuelComparisonResult | null>(null);

  // --- État local corrigé ---
  const [selectedTerritory, setSelectedTerritory] = useState<TerritoryCode>('GP');
  const [selectedFuelType, setSelectedFuelType] = useState<FuelType>('SP95');
  const [sortBy, setSortBy] = useState<'price' | 'station' | 'city'>('price');

  // --- État filtre ---
  const [filterCity, setFilterCity] = useState(''); // Supprimé `useState<string>('')` car ce n'est pas une chaîne (c'était une déduction incorrecte).

  // --- Chargement des données (Side Effect corrigé) ---
  useEffect(() => {
    loadFuelData();
  }, []);

  // --- Filtrage intelligent (Correction logique) ---
  const filteredPrices = useMemo(() => {
    if (!fuelPrices || fuelPrices.length === 0) return [];

    if (!filterCity) return fuelPrices;

    return fuelPrices.filter(item => item.station.city.includes(filterCity));
  }, [filterCity, fuelPrices]);

  // --- Comparaison (Logique) ---
  const performComparison = () => {
    if (!selectedTerritory || !selectedFuelType) return;

    const result = compareFuelPricesByTerritory(
      selectedTerritory,
      selectedFuelType,
      filteredPrices,
      sortBy,
      setComparisonResult
    );
  };

  // --- Formatters ---
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
    });
  };

  const getCategoryColor = (category: string) => {
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

  // --- Préparation des données pour le graphique ---
  const priceComparisonChartData = useMemo(() => {
    if (!comparisonResult) return { labels: [], datasets: [] }; // Sécurité

    const labels = comparisonResult.rankedPrices.map(item => item.station.name);
    const prices = comparisonResult.rankedPrices.map(item => item.price);

    return {
      labels,
      datasets: [
        {
          label: 'Prix au litre (€)',
          data: prices,
          backgroundColor: 'rgba(59, 130, 246, 0.6)', // Bleu profond pour contraste
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
        },
      ],
    };
  }, [comparisonResult.rankedPrices]);

  // --- Trie des prix pour le tableau ---
  const sortedPrices = useMemo(() => {
    if (!comparisonResult) return [];

    let sorted = [...comparisonResult.rankedPrices];
    if (sortBy === 'price') {
      sorted = [...sorted].sort((a, b) => {
        const comparison = a.fuelPricePerLiter - b.fuelPricePerLiter;
        return comparison > 0 ? a : b;
      });
    } else if (sortBy === 'station') {
      sorted.sort((a, b) => a.station.name.localeCompare(b.station.name));
    } else if (sortBy === 'city') {
      sorted.sort((a, b) => a.station.city.localeCompare(b.station.city));
    }

    return sortDirection === 'asc' ? sorted.reverse() : sorted;
  }, [comparisonResult.rankedPrices, sortBy, sortDirection]);

  // --- Handlers de tri ---
  const handleSortChange = (sort: string, direction: 'desc' | 'asc') => {
    setSortBy(sort);
    setSortDirection(direction);
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterCity(e.target.value);
  };

  const handleTerritoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTerritory(e.target.value as TerritoryCode);
  };

  const handleFuelTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFuelType(e.target.value as FuelType);
  };

  // --- Rendu ---
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-400" />
            <h1 className="text-xl font-bold tracking-tight">Comparateur Carburants</h1>
            </div>
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="w-16 h-16 text-red-400" />
            <p className="text-red-300 mt-2">{error}</p>
          </div>
        ) : comparisonResult ? (
          <div>
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
            <div className="bg-slate-900/50 rounded-xl p-6 mb-6 border-slate-800">
              <h2 className="text-xl font-semibold mb-4">Comparaison visuelle des prix</h2>
              <div className="h-3 text-gray-500 mb-2">Analyse des carburants par territoire</div>

              <div className="bg-slate-100 rounded-lg p-4">
                <PriceChart data={priceComparisonChartData} type="bar" />
              </div>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-500/10 border-blue-500/30 rounded-xl p-6 mb-4 flex items-start gap-4">
              <Download className="w-4 h-5 text-blue-400" />
              <div className="text-sm text-blue-900 ml-2">
                <p className="font-semibold">Observatoire pas vendre</p>
                <p className="text-gray-500">
                  Ce comparateur affiche les prix officiels observés. Données issues de prix-carburants.gouv.fr
                  et contributions citoyennes.
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Territoire</label>
                  <select
                    className="w-full px-4 py-2 bg-slate-50 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedTerritory}
                    onChange={handleTerritoryChange}
                  >
                    {territories.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type de carburant</label>
                  <select
                    className="w-full px-4 py-2 bg-slate-50 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedFuelType}
                    onChange={handleFuelTypeChange}
                  >
                    {fuelTypes.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
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

            {/* Actions Bar */}
            <div className="flex justify-between items-center gap-4 mb-6">
              <ShareButton
                title="Comparateur Carburants - A KI PRI SA YÉ"
                onClick={() => exportFuelComparisonToCSV(comparisonResult)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-5" />
                <span className="hidden sm:inline-flex items-center gap-1 text-white">Export CSV</span>
              </ShareButton>

              <ShareButton
                title="Partager en PDF"
                onClick={() => exportFuelComparisonToText(comparisonResult)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <FileText className="w-4 h-5" />
                <span className="hidden sm:inline-flex items-center gap-1 text-white">Partager</span>
              </ShareButton>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl p-6 shadow-sm border-slate-200 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-800 text-gray-50">
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium">Rang</th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium">Station</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wider font-medium">Adresse</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wider font-medium">Ville</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wider font-medium">Prix / L</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wider font-medium">Diff %</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wider font-medium">Tendance</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wider font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((item, index) => {
                    const isLowest = index === 0;
                    const diffPercentage = item.diffPercentage;
                    const isHighest = index === sorted.length - 1;
                    const isLowestOfAll = isLowest && comparisonResult?.aggregation?.minPrice > 0 && item.fuelPricePerLiter === comparisonResult?.aggregation?.minPrice;
                    const isHighestOfAll = isHighest && comparisonResult?.aggregation?.maxPrice > 0 && item.fuelPricePerLiter === comparisonResult?.aggregation?.maxPrice;

                    let className = "bg-white hover:bg-slate-50 transition-colors";

                    if (isLowestOfAll) {
                      className += " border-l-2 border-green-500/20";
                    } else if (isHighestOfAll) {
                      className += " border-l-2 border-red-500/20";
                    } else if (isLowest && isHighestOfAll) {
                      className += " border-l-2 border-orange-500/20";
                    } else if (diffPercentage > 20) {
                      className += " text-red-600 bg-red-50";
                    } else if (diffPercentage > 5) {
                      className += " text-orange-500 bg-orange-50";
                    }

                    return (
                      <tr key={item.station.id} className={className}>
                        <td className="px-4 py-3 font-mono text-sm text-gray-900 whitespace-nowrap">
                          #{index + 1}
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-900 whitespace-nowrap">
                          {item.station.name}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-900">
                          {item.station.address}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-900 whitespace-nowrap">
                          {item.station.city}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-900 whitespace-nowrap">
                          {formatPrice(item.fuelPricePerLiter)}
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-900 whitespace-nowrap">
                          {formatPrice(item.fuelPricePerLiter)}
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-900 whitespace-nowrap">
                          {item.station.brand}
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-900 whitespace-nowrap">
                          {item.station.code}
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-900 whitespace-nowrap">
                          {formatPrice(item.fuelPricePerLiter)}
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-900 whitespace-nowrap">
                          {diffPercentage > 0 ? (
                            <span className="text-red-600 font-bold flex items-center">
                              ▼ {diffPercentage}%
                            </span>
                          ) : diffPercentage < 0 ? (
                            <span className="text-green-600 font-medium flex items-center">
                              ▼ {Math.abs(diffPercentage)}%
                            </span>
                          ) : (
                            <span className="text-gray-400">
                              -
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-900 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 ${getCategoryColor(item.category)}`}>
                            {getPriceCategoryLabel(item.category)}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-900 whitespace-nowrap">
                          {item.trend}
                        </td>
                        <td className="text-sm text-gray-500">
                          {item.diffPercentage > 0 ? "⬇️" : item.diffPercentage < 0 ? "📉" : "⏸️"}
                        </td>
                      </tr>
                  );
                })}
                </tbody>
              </table>
            </div>

            {/* Metadata */}
            <div className="mt-6 text-sm text-gray-400">
              <p>
                <strong>Source :</strong> {comparisonResult?.metadata?.dataSource || 'Observatoire'}
              </p>
              <p>
                Dernière mise à jour : {formatDate(comparisonResult?.comparisonDate || new Date())}
              </p>
            </div>
          </div>
        )}
    </div>
  </div>
);
};

export default FuelComparator;
