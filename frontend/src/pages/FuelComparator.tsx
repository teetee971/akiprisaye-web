import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, FileText, MapPin, AlertCircle } from 'lucide-react';
import type {
  FuelPricePoint,
  FuelType,
  FuelComparisonResult,
} from '../types/fuelComparison';
import type { Territory } from '../types/priceAlerts';
import {
  compareFuelPricesByTerritory,
  loadFuelData,
} from '../services/fuelComparisonService';
import PriceChart from '../components/comparateur/LazyPriceChart';
import ComparisonSummary from '../components/comparateur/ComparisonSummary';
import LoadingSkeleton from '../components/comparateur/LoadingSkeleton';
import SortControl from '../components/comparateur/SortControl';
import ShareButton from '../components/comparateur/ShareButton';
import { exportFuelComparisonToText } from '../utils/exportComparison';

const TERRITORIES: { code: Territory; name: string }[] = [
  { code: 'GP', name: 'Guadeloupe' },
  { code: 'MQ', name: 'Martinique' },
  { code: 'GF', name: 'Guyane' },
  { code: 'RE', name: 'La Réunion' },
  { code: 'YT', name: 'Mayotte' },
  { code: 'PM', name: 'Saint-Pierre-et-Miquelon' },
];

const FUEL_TYPES: { code: FuelType; label: string }[] = [
  { code: 'SP95', label: 'SP 95' },
  { code: 'SP98', label: 'SP 98' },
  { code: 'E10', label: 'E10' },
  { code: 'DIESEL', label: 'Diesel' },
  { code: 'GPL', label: 'GPL' },
];

const FuelComparator: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fuelPrices, setFuelPrices] = useState<FuelPricePoint[]>([]);
  const [comparisonResult, setComparisonResult] = useState<FuelComparisonResult | null>(null);
  const [selectedTerritory, setSelectedTerritory] = useState<Territory>('GP');
  const [selectedFuelType, setSelectedFuelType] = useState<FuelType>('SP95');
  const [sortBy, setSortBy] = useState<'price' | 'station' | 'city'>('price');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterCity, setFilterCity] = useState('');

  useEffect(() => {
    loadFuelData()
      .then(({ fuelPrices: data }) => {
        setFuelPrices(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Erreur lors du chargement des données carburant');
        setLoading(false);
      });
  }, []);

  const filteredPrices = useMemo(() => {
    if (!filterCity) return fuelPrices;
    return fuelPrices.filter((p) =>
      p.station.city.toLowerCase().includes(filterCity.toLowerCase()),
    );
  }, [filterCity, fuelPrices]);

  useEffect(() => {
    if (!filteredPrices.length) return;
    const result = compareFuelPricesByTerritory(selectedTerritory, selectedFuelType, filteredPrices);
    setComparisonResult(result);
  }, [filteredPrices, selectedTerritory, selectedFuelType]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(price);

  const formatDate = (date: Date) =>
    date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'cheapest':       return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'below_average':  return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'average':        return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
      case 'above_average':  return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'most_expensive': return 'text-red-400 bg-red-500/10 border-red-500/30';
      default:               return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'cheapest':       return 'Le moins cher';
      case 'below_average':  return 'Sous la moyenne';
      case 'average':        return 'Dans la moyenne';
      case 'above_average':  return 'Au-dessus de la moyenne';
      case 'most_expensive': return 'Le plus cher';
      default: return '—';
    }
  };

  const chartData = useMemo(() => {
    if (!comparisonResult) return { labels: [], datasets: [] };
    return {
      labels: comparisonResult.rankedPrices.map((p) => p.fuelPrice.station.name),
      datasets: [{ label: 'Prix €/L', data: comparisonResult.rankedPrices.map((p) => p.fuelPrice.pricePerLiter), backgroundColor: 'rgba(59,130,246,0.6)' }],
    };
  }, [comparisonResult]);

  const sortedPrices = useMemo(() => {
    if (!comparisonResult) return [];
    const list = [...comparisonResult.rankedPrices];
    list.sort((a, b) => {
      if (sortBy === 'price')   return a.fuelPrice.pricePerLiter - b.fuelPrice.pricePerLiter;
      if (sortBy === 'station') return a.fuelPrice.station.name.localeCompare(b.fuelPrice.station.name);
      return a.fuelPrice.station.city.localeCompare(b.fuelPrice.station.city);
    });
    return sortDirection === 'asc' ? list : list.reverse();
  }, [comparisonResult, sortBy, sortDirection]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 pb-12 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <MapPin className="w-6 h-6 text-yellow-400" />
          <div>
            <h1 className="text-2xl font-bold">Comparateur Carburants</h1>
            <p className="text-sm text-gray-400">Prix observés aux stations — données officielles (prix-carburants.gouv.fr)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Territoire</label>
            <select value={selectedTerritory} onChange={(e) => setSelectedTerritory(e.target.value as Territory)} className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2">
              {TERRITORIES.map((t) => <option key={t.code} value={t.code}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Type de carburant</label>
            <select value={selectedFuelType} onChange={(e) => setSelectedFuelType(e.target.value as FuelType)} className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2">
              {FUEL_TYPES.map((f) => <option key={f.code} value={f.code}>{f.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Filtrer par ville</label>
            <input type="text" value={filterCity} onChange={(e) => setFilterCity(e.target.value)} placeholder="Nom de la ville..." className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2" />
          </div>
        </div>

        {loading && <LoadingSkeleton />}
        {error && (
          <div className="flex items-center gap-2 text-red-400 py-10 justify-center">
            <AlertCircle className="w-5 h-5" /><span>{error}</span>
          </div>
        )}
        {!loading && !error && !comparisonResult && (
          <div className="text-center text-gray-400 py-10">Aucune donnée pour ce territoire / type de carburant.</div>
        )}

        {comparisonResult && (
          <>
            <ComparisonSummary
              bestPrice={comparisonResult.aggregation.minPrice}
              worstPrice={comparisonResult.aggregation.maxPrice}
              averagePrice={comparisonResult.aggregation.averagePrice}
              savingsPercentage={comparisonResult.aggregation.priceRangePercentage}
              bestProvider={comparisonResult.rankedPrices[0]?.fuelPrice.station.name ?? '—'}
              totalObservations={comparisonResult.aggregation.totalStations}
              currency="EUR"
            />
            <div className="flex flex-wrap items-center justify-between gap-3 my-4">
              <SortControl
                options={[{ value: 'price', label: 'Prix' }, { value: 'station', label: 'Station' }, { value: 'city', label: 'Ville' }]}
                currentSort={sortBy}
                currentDirection={sortDirection}
                onSortChange={(sort, dir) => { setSortBy(sort as 'price' | 'station' | 'city'); setSortDirection(dir); }}
              />
              <div className="flex gap-2">
                <button onClick={() => exportFuelComparisonToText(comparisonResult)} className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm"><FileText className="w-4 h-4" />Texte</button>
                <ShareButton title="Comparateur Carburants" description="Comparez les prix des carburants dans votre territoire" />
              </div>
            </div>
            <div className="bg-slate-900 rounded-xl p-4 my-4">
              <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-400" />Prix par station (€/L)
              </h2>
              <PriceChart data={chartData} type="bar" />
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-sm">
                <thead className="bg-slate-800 text-gray-300">
                  <tr>
                    <th className="px-4 py-3 text-left">Station</th>
                    <th className="px-4 py-3 text-left">Ville</th>
                    <th className="px-4 py-3 text-right">Prix / L</th>
                    <th className="px-4 py-3 text-center">Positionnement</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPrices.map((item) => (
                    <tr key={item.fuelPrice.station.id} className="border-t border-slate-800 hover:bg-slate-800/50">
                      <td className="px-4 py-3 text-white font-medium">{item.fuelPrice.station.name}</td>
                      <td className="px-4 py-3 text-gray-400">{item.fuelPrice.station.city}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatPrice(item.fuelPrice.pricePerLiter)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${getCategoryColor(item.priceCategory)}`}>
                          {getCategoryLabel(item.priceCategory)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              Source : {comparisonResult.metadata?.dataSource || 'Observatoire A KI PRI SA YÉ'}
              {' · '}Comparaison du {formatDate(new Date(comparisonResult.comparisonDate))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FuelComparator;
