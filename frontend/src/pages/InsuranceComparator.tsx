// @ts-nocheck -- Territory type not exported from insuranceComparison; TODO: export type
 
import React, { useState, useEffect, useMemo } from 'react';
import { Shield, AlertCircle, Info, BarChart3, Download, FileText, CheckCircle } from 'lucide-react';
import type {
  InsurancePricePoint,
  InsuranceComparisonResult,
  InsuranceType,
  CoverageLevel,
  Territory,
} from '../types/insuranceComparison';
import {
  compareInsuranceByType,
  loadInsuranceData,
  filterInsurances,
} from '../services/insuranceComparisonService';
import PriceChart from '../components/comparateur/LazyPriceChart';
import ComparisonSummary from '../components/comparateur/ComparisonSummary';
import LoadingSkeleton from '../components/comparateur/LoadingSkeleton';
import SortControl from '../components/comparateur/SortControl';
import ShareButton from '../components/comparateur/ShareButton';
import { exportInsuranceComparisonToCSV, exportInsuranceComparisonToText } from '../utils/exportComparison';

const InsuranceComparator: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insurances, setInsurances] = useState<InsurancePricePoint[]>([]);
  const [selectedTerritory, setSelectedTerritory] = useState<Territory>('GP');
  const [selectedType, setSelectedType] = useState<InsuranceType>('auto');
  const [selectedCoverageLevel, setSelectedCoverageLevel] = useState<CoverageLevel | 'all'>('all');
  const [comparisonResult, setComparisonResult] = useState<InsuranceComparisonResult | null>(null);
  const [sortBy, setSortBy] = useState<'price' | 'provider' | 'coverage'>('price');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    loadInsuranceDataAsync();
  }, []);

  useEffect(() => {
    if (insurances.length > 0 && selectedTerritory && selectedType) {
      performComparison();
    }
  }, [insurances, selectedTerritory, selectedType, selectedCoverageLevel]);

  const loadInsuranceDataAsync = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadInsuranceData();
      setInsurances(data.insurances || []);
    } catch (err) {
      console.error('Error loading insurance data:', err);
      setError('Erreur lors du chargement des données d\'assurance');
    } finally {
      setLoading(false);
    }
  };

  const performComparison = () => {
    let filteredInsurances = insurances;

    if (selectedCoverageLevel !== 'all') {
      filteredInsurances = filterInsurances(filteredInsurances, {
        coverageLevel: selectedCoverageLevel,
      });
    }

    const result = compareInsuranceByType(
      selectedType,
      selectedTerritory,
      filteredInsurances
    );
    setComparisonResult(result);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
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

  const getCoverageLevelLabel = (level: CoverageLevel) => {
    switch (level) {
      case 'basic':
        return 'Basic';
      case 'intermediate':
        return 'Intermédiaire';
      case 'comprehensive':
        return 'Complète';
      default:
        return level;
    }
  };

  const getInsuranceTypeLabel = (type: InsuranceType) => {
    switch (type) {
      case 'auto':
        return 'Automobile';
      case 'home':
        return 'Habitation';
      case 'health':
        return 'Santé';
      default:
        return type;
    }
  };

  // Prepare chart data
  const priceComparisonChartData = useMemo(() => {
    if (!comparisonResult) return null;

    const labels = comparisonResult.rankedOffers.map(r => r.insurance.providerName);
    const prices = comparisonResult.rankedOffers.map(r => r.insurance.annualPriceTTC);

    return {
      labels,
      datasets: [
        {
          label: 'Prix annuel (€)',
          data: prices,
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
        },
      ],
    };
  }, [comparisonResult]);

  // Sorted offers for display
  const sortedOffers = useMemo(() => {
    if (!comparisonResult) return [];
    
    const sorted = [...comparisonResult.rankedOffers].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'price':
          comparison = a.insurance.annualPriceTTC - b.insurance.annualPriceTTC;
          break;
        case 'provider':
          comparison = a.insurance.providerName.localeCompare(b.insurance.providerName);
          break;
        case 'coverage':
          comparison = a.insurance.coverageLevel.localeCompare(b.insurance.coverageLevel);
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }, [comparisonResult, sortBy, sortDirection]);

  const handleSortChange = (sort: string, direction: 'asc' | 'desc') => {
    setSortBy(sort as 'price' | 'provider' | 'coverage');
    setSortDirection(direction);
  };

  const territories: { value: Territory; label: string }[] = [
    { value: 'GP', label: 'Guadeloupe' },
    { value: 'MQ', label: 'Martinique' },
    { value: 'GF', label: 'Guyane' },
    { value: 'RE', label: 'La Réunion' },
    { value: 'YT', label: 'Mayotte' },
  ];

  const insuranceTypes: { value: InsuranceType; label: string }[] = [
    { value: 'auto', label: 'Automobile' },
    { value: 'home', label: 'Habitation' },
    { value: 'health', label: 'Santé' },
  ];

  const coverageLevels: { value: CoverageLevel | 'all'; label: string }[] = [
    { value: 'all', label: 'Tous niveaux' },
    { value: 'basic', label: 'Basic' },
    { value: 'intermediate', label: 'Intermédiaire' },
    { value: 'comprehensive', label: 'Complète' },
  ];

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-purple-500/20 rounded-xl">
            <Shield className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Comparateur Assurances</h1>
            <p className="text-gray-400 mt-1">Comparaison d'assurances dans les DOM-TOM</p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="text-blue-300 font-medium mb-1">Observer, pas vendre - Aucun conseil personnalisé</p>
            <p className="text-gray-300">
              Architecture prête pour collecte de données réelles. Aucune affiliation commerciale. 
              Comparaison informative uniquement.
            </p>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="text-orange-300 font-medium mb-1">Données en cours de collecte</p>
            <p className="text-gray-300">
              Les données affichées sont des exemples. Le système est prêt à recevoir des contributions 
              citoyennes et données officielles des assureurs.
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Territoire
              </label>
              <select
                value={selectedTerritory}
                onChange={(e) => setSelectedTerritory(e.target.value as Territory)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                Type d'assurance
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as InsuranceType)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {insuranceTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Niveau de couverture
              </label>
              <select
                value={selectedCoverageLevel}
                onChange={(e) => setSelectedCoverageLevel(e.target.value as CoverageLevel | 'all')}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {coverageLevels.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
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
              unit="/an"
            />

            {/* Chart */}
            {priceComparisonChartData && (
              <div className="bg-slate-900/50 rounded-xl p-6 mb-6 border border-slate-800">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  Comparaison visuelle des prix
                </h2>
                <PriceChart data={priceComparisonChartData} type="bar" />
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <SortControl
                  currentSort={sortBy}
                  currentDirection={sortDirection}
                  onSortChange={handleSortChange}
                  options={[
                    { value: 'price', label: 'Prix' },
                    { value: 'provider', label: 'Assureur' },
                    { value: 'coverage', label: 'Niveau' },
                  ]}
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => comparisonResult && exportInsuranceComparisonToCSV(comparisonResult)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export CSV</span>
                </button>
                <button
                  onClick={() => comparisonResult && exportInsuranceComparisonToText(comparisonResult)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Export TXT</span>
                </button>
                <ShareButton title="Comparateur Assurances - A KI PRI SA YÉ" />
              </div>
            </div>

            {/* Offers Table */}
            <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Rang</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Assureur</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Offre</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Niveau</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">Prix/an</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">Diff. vs min</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Catégorie</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {sortedOffers.map((ranking, index) => (
                      <tr
                        key={ranking.insurance.id}
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
                          <span className="font-medium">{ranking.insurance.providerName}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm">{ranking.insurance.offerName}</span>
                            {ranking.insurance.deductible && (
                              <span className="text-xs text-gray-400">Franchise: {formatPrice(ranking.insurance.deductible)}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          {getCoverageLevelLabel(ranking.insurance.coverageLevel)}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="font-semibold text-purple-400">
                            {formatPrice(ranking.insurance.annualPriceTTC)}
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

            {/* Coverage Details */}
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-semibold">Détails des garanties</h3>
              {sortedOffers.map((ranking) => (
                <div
                  key={ranking.insurance.id}
                  className="bg-slate-900/50 rounded-xl p-4 border border-slate-800"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold">
                        {ranking.insurance.providerName} - {ranking.insurance.offerName}
                      </h4>
                      <p className="text-sm text-gray-400">
                        {getInsuranceTypeLabel(ranking.insurance.insuranceType)} - {getCoverageLevelLabel(ranking.insurance.coverageLevel)}
                      </p>
                    </div>
                    <span className="text-purple-400 font-semibold">
                      {formatPrice(ranking.insurance.annualPriceTTC)}/an
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-300 mb-2">Garanties principales:</p>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {ranking.insurance.mainCoverages.map((coverage, idx) => (
                        <li key={idx} className="text-sm text-gray-400 flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                          {coverage}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {/* Metadata */}
            <div className="mt-6 text-sm text-gray-400">
              <p>
                <strong>Source:</strong> {comparisonResult.metadata.dataSource}
              </p>
              <p className="mt-2 text-xs">
                {comparisonResult.metadata.disclaimer}
              </p>
              <p className="mt-2 text-xs">
                Méthodologie v{comparisonResult.metadata.methodology}
              </p>
            </div>
          </>
        )}

        {/* No Results */}
        {!loading && !comparisonResult && (
          <div className="bg-slate-900/50 rounded-xl p-12 text-center border border-slate-800">
            <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              Aucune donnée disponible pour cette combinaison territoire/type/niveau
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Les données sont en cours de collecte - Architecture prête
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InsuranceComparator;
