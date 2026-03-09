import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { BarChart3, FileText, MapPin, AlertCircle, Droplet, ExternalLink, Navigation, Award, TrendingDown } from 'lucide-react';
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
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';
import BookingLinkBadge from '../components/comparateur/BookingLinkBadge';

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

  const getStationMapsUrl = (stationName: string, city: string, lat?: number, lng?: number): string => {
    if (lat && lng) return `https://www.google.com/maps?q=${lat},${lng}`;
    return `https://www.google.com/maps/search/${encodeURIComponent(stationName + ' ' + city)}`;
  };

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
      <Helmet>
        <title>Comparateur Carburants DOM-TOM — A KI PRI SA YÉ</title>
        <meta name="description" content="Prix des carburants observés aux stations DOM-TOM : SP95, SP98, Diesel, GPL. Données officielles prix-carburants.gouv.fr." />
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 pb-12 pt-6">
        {/* Hero Banner */}
        <div className="mb-6">
          <HeroImage
            src={PAGE_HERO_IMAGES.comparateurCarburants}
            alt="Comparateur carburants DOM-TOM — station service"
            gradient="from-yellow-900 to-slate-900"
            height="h-36 sm:h-48"
          >
            <div className="flex items-center gap-3 mb-2">
              <Droplet className="w-7 h-7 text-yellow-300 drop-shadow" />
              <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow">⛽ Comparateur Carburants</h1>
            </div>
            <p className="text-yellow-100 text-sm drop-shadow">Prix observés aux stations — données officielles prix-carburants.gouv.fr</p>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-500/20 border border-green-500/40 rounded-full text-xs text-green-300 mt-2">
              🔄 Données du {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </HeroImage>
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
            {/* Cheapest station summary */}
            {comparisonResult.rankedPrices.length > 0 && (() => {
              const cheapest = comparisonResult.rankedPrices[0];
              const lat = cheapest.fuelPrice.station.location?.lat;
              const lng = cheapest.fuelPrice.station.location?.lng;
              const mapsUrl = getStationMapsUrl(cheapest.fuelPrice.station.name, cheapest.fuelPrice.station.city, lat, lng);
              return (
                <div className="my-4 bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingDown className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-semibold text-green-300">Station la moins chère</span>
                    </div>
                    <p className="text-white font-bold text-lg">{cheapest.fuelPrice.station.name}</p>
                    <p className="text-xs text-gray-400">{cheapest.fuelPrice.station.city} · {cheapest.fuelPrice.station.brand}</p>
                    {cheapest.fuelPrice.station.address && (
                      <p className="text-xs text-gray-500 mt-0.5">{cheapest.fuelPrice.station.address}</p>
                    )}
                  </div>
                  <div className="flex flex-col sm:items-end gap-2">
                    <p className="text-3xl font-bold text-green-400">{formatPrice(cheapest.fuelPrice.pricePerLiter)}<span className="text-sm font-normal text-gray-400">/L</span></p>
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      <Navigation className="w-3 h-3" /> Itinéraire Google Maps
                    </a>
                  </div>
                </div>
              );
            })()}
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
                    <th className="px-4 py-3 text-center">Maps</th>
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
                      <td className="px-4 py-3 text-center">
                        <a
                          href={getStationMapsUrl(
                            item.fuelPrice.station.name,
                            item.fuelPrice.station.city,
                            item.fuelPrice.station.location?.lat,
                            item.fuelPrice.station.location?.lng
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 bg-sky-600/80 hover:bg-sky-500 text-white text-xs rounded-lg transition-colors"
                          title="Voir sur Google Maps"
                        >
                          <Navigation className="w-3 h-3" />
                        </a>
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
            <div className="mt-2"><BookingLinkBadge /></div>
          </>
        )}
      </div>
    </div>
  );
};

export default FuelComparator;
