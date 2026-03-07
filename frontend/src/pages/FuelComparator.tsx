// @ts-nocheck -- Multiple missing module imports; TODO: add missing comparateur components
 
import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, Download, FileText, MapPin, AlertCircle } from 'lucide-react';
import type {
  FuelPrice,
  FuelType,
  TerritoryCode,
  FuelComparisonResult,
  FuelComparisonProps
} from '../../types/global';
import {
  compareFuelPricesByTerritory,
  loadFuelData
} from '../../services/fuelComparisonService';
import PriceChart from '../../components/comparateur/LazyPriceChart';
import ComparisonSummary from '../../components/comparateur/ComparisonSummary';
import LoadingSkeleton from '../../components/comparateurs/LoadingSkeleton';
import SortControl from '../../components/comparateurs/SortControl';
import ShareButton from '../../components/comparateurs/ShareButton';
import {
  exportFuelComparisonToCSV,
  exportFuelComparisonToText
} from '../../utils/exportComparison';

const FuelComparator: React.FC<FuelComparisonProps> = () => {
  // --- State ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fuelPrices, setFuelPrices] = useState<FuelPrice[]>([]);
  const [comparisonResult, setComparisonResult] =
    useState<FuelComparisonResult | null>(null);

  const [selectedTerritory, setSelectedTerritory] =
    useState<TerritoryCode>('GP');
  const [selectedFuelType, setSelectedFuelType] =
    useState<FuelType>('SP95');

  const [sortBy, setSortBy] =
    useState<'price' | 'station' | 'city'>('price');
  const [sortDirection, setSortDirection] =
    useState<'asc' | 'desc'>('asc');

  const [filterCity, setFilterCity] = useState('');

  // --- Load data ---
  useEffect(() => {
    try {
      loadFuelData().then((data) => {
        setFuelPrices(data);
        setLoading(false);
      });
    } catch {
      setError('Erreur lors du chargement des données');
      setLoading(false);
    }
  }, []);

  // --- Filtering ---
  const filteredPrices = useMemo(() => {
    if (!filterCity) return fuelPrices;
    return fuelPrices.filter((p) =>
      p.station.city.toLowerCase().includes(filterCity.toLowerCase())
    );
  }, [filterCity, fuelPrices]);

  // --- Comparison ---
  useEffect(() => {
    if (!filteredPrices.length) return;

    compareFuelPricesByTerritory(
      selectedTerritory,
      selectedFuelType,
      filteredPrices,
      sortBy,
      setComparisonResult
    );
  }, [filteredPrices, selectedTerritory, selectedFuelType, sortBy]);

  // --- Helpers ---
  const formatPrice = (price: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(price);

  const formatDate = (date: Date) =>
    date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'cheapest':
        return 'text-green-600';
      case 'below_average':
        return 'text-blue-600';
      case 'above_average':
        return 'text-orange-600';
      case 'most_expensive':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  const getPriceCategoryLabel = (category: string) => {
    switch (category) {
      case 'cheapest':
        return 'Le moins cher';
      case 'below_average':
        return 'Sous la moyenne';
      case 'above_average':
        return 'Au-dessus de la moyenne';
      case 'most_expensive':
        return 'Le plus cher';
      default:
        return '—';
    }
  };

  // --- Chart data ---
  const chartData = useMemo(() => {
    if (!comparisonResult) return { labels: [], datasets: [] };

    return {
      labels: comparisonResult.rankedPrices.map(
        (p) => p.station.name
      ),
      datasets: [
        {
          label: 'Prix €/L',
          data: comparisonResult.rankedPrices.map(
            (p) => p.fuelPricePerLiter
          ),
          backgroundColor: 'rgba(59,130,246,0.6)',
        },
      ],
    };
  }, [comparisonResult]);

  // --- Sorting ---
  const sortedPrices = useMemo(() => {
    if (!comparisonResult) return [];

    const list = [...comparisonResult.rankedPrices];

    list.sort((a, b) => {
      if (sortBy === 'price') {
        return a.fuelPricePerLiter - b.fuelPricePerLiter;
      }
      if (sortBy === 'station') {
        return a.station.name.localeCompare(b.station.name);
      }
      return a.station.city.localeCompare(b.station.city);
    });

    return sortDirection === 'asc' ? list : list.reverse();
  }, [comparisonResult, sortBy, sortDirection]);

  // --- Render ---
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 pb-12">
        <div className="flex items-center gap-2 mb-6">
          <MapPin className="w-5 h-5 text-blue-400" />
          <h1 className="text-xl font-bold">
            Comparateur Carburants
          </h1>
        </div>

        {loading && <LoadingSkeleton />}

        {error && (
          <div className="text-center text-red-400 py-10">
            <AlertCircle className="mx-auto mb-2" />
            {error}
          </div>
        )}

        {comparisonResult && (
          <>
            <ComparisonSummary
              minPrice={comparisonResult.aggregation.minPrice}
              maxPrice={comparisonResult.aggregation.maxPrice}
              averagePrice={comparisonResult.aggregation.averagePrice}
              priceRange={comparisonResult.aggregation.priceRange}
              priceRangePercentage={
                comparisonResult.aggregation.priceRangePercentage
              }
              currency="EUR"
              unit="/L"
            />

            <div className="bg-white rounded-xl p-6 my-6">
              <PriceChart data={chartData} type="bar" />
            </div>

            <table className="w-full bg-white rounded-xl overflow-hidden">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="px-4 py-3">Station</th>
                  <th className="px-4 py-3">Ville</th>
                  <th className="px-4 py-3">Prix</th>
                  <th className="px-4 py-3">Diff</th>
                  <th className="px-4 py-3">Tendance</th>
                </tr>
              </thead>
              <tbody>
                {sortedPrices.map((item) => (
                  <tr key={item.station.id} className="border-b">
                    <td className="px-4 py-3">
                      {item.station.name}
                    </td>
                    <td className="px-4 py-3">
                      {item.station.city}
                    </td>
                    <td className="px-4 py-3">
                      {formatPrice(item.fuelPricePerLiter)}
                    </td>
                    <td
                      className={`px-4 py-3 ${getCategoryColor(
                        item.category
                      )}`}
                    >
                      {getPriceCategoryLabel(item.category)}
                    </td>
                    <td className="px-4 py-3">
                      {item.diffPercentage > 0
                        ? '⬇️'
                        : item.diffPercentage < 0
                        ? '📉'
                        : '⏸️'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-6 text-sm text-gray-400">
              Source :{' '}
              {comparisonResult.metadata?.dataSource ||
                'Observatoire'}
              <br />
              Dernière mise à jour :{' '}
              {formatDate(
                new Date(comparisonResult.comparisonDate)
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FuelComparator;